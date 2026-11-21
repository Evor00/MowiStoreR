from decimal import Decimal
from secrets import compare_digest

from django.conf import settings
from django.db import transaction
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart
from apps.catalog.models import Product
from .models import Order, OrderItem
from .serializers import CheckoutSerializer, InternalPaymentUpdateSerializer, OrderSerializer, OrderStatusUpdateSerializer


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Order.objects.prefetch_related("items")
        return queryset if self.request.user.is_staff else queryset.filter(user=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "reference"

    def get_queryset(self):
        queryset = Order.objects.prefetch_related("items")
        return queryset if self.request.user.is_staff else queryset.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        if not request.user.is_staff:
            raise PermissionDenied("Solo el personal autorizado puede cambiar el estado de un pedido.")
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order.status = serializer.validated_data["status"]
        order.save(update_fields=["status", "updated_at"])
        return Response(OrderSerializer(order).data)


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = Cart.objects.select_for_update().prefetch_related("items__product").filter(user=request.user).first()
        if not cart or not cart.items.exists():
            raise ValidationError({"cart": "Tu carrito está vacío."})

        item_ids = [item.product_id for item in cart.items.all()]
        products = {product.id: product for product in Product.objects.select_for_update().filter(id__in=item_ids, is_active=True)}
        subtotal = Decimal("0.00")
        for item in cart.items.all():
            product = products.get(item.product_id)
            if not product or product.stock < item.quantity:
                raise ValidationError({"cart": f"Stock insuficiente para {item.product.name}."})
            subtotal += product.price * item.quantity

        order = Order.objects.create(user=request.user, subtotal=subtotal, total=subtotal, **serializer.validated_data)
        order_items = []
        for item in cart.items.all():
            product = products[item.product_id]
            product.stock -= item.quantity
            product.save(update_fields=["stock", "updated_at"])
            order_items.append(OrderItem(order=order, product_id=product.id, product_name=product.name, sku=product.sku, unit_price=product.price, quantity=item.quantity))
        OrderItem.objects.bulk_create(order_items)
        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class InternalPaymentUpdateView(APIView):
    """Private service-to-service endpoint used only by the Stripe webhook handler."""
    authentication_classes = []
    permission_classes = []

    def patch(self, request, reference):
        token = request.headers.get("X-Service-Token", "")
        if not settings.INTERNAL_SERVICE_TOKEN or not compare_digest(token, settings.INTERNAL_SERVICE_TOKEN):
            return Response({"detail": "Credencial de servicio inválida."}, status=status.HTTP_403_FORBIDDEN)
        serializer = InternalPaymentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = Order.objects.filter(reference=reference).first()
        if not order:
            return Response({"detail": "Pedido no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        order.payment_provider_id = serializer.validated_data["provider_id"]
        order.payment_status = serializer.validated_data["payment_status"]
        order.status = serializer.validated_data["order_status"]
        order.save(update_fields=["payment_provider_id", "payment_status", "status", "updated_at"])
        return Response(OrderSerializer(order).data)
