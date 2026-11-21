from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from .models import Cart, CartItem
from .serializers import CartItemSerializer, CartSerializer


def get_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_cart(request.user)
        return Response(CartSerializer(cart).data)


class CartItemListView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = Product.objects.filter(id=serializer.validated_data["product_id"], is_active=True).first()
        if not product:
            raise ValidationError({"product_id": "Producto no disponible."})
        quantity = serializer.validated_data["quantity"]
        if quantity > product.stock:
            raise ValidationError({"quantity": "La cantidad supera el stock disponible."})
        cart = get_cart(request.user)
        item, created = CartItem.objects.select_for_update().get_or_create(cart=cart, product=product, defaults={"quantity": quantity})
        if not created:
            new_quantity = item.quantity + quantity
            if new_quantity > product.stock:
                raise ValidationError({"quantity": "La cantidad acumulada supera el stock disponible."})
            item.quantity = new_quantity
            item.save(update_fields=["quantity", "updated_at"])
        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CartItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, item_id):
        item = CartItem.objects.select_related("product").filter(id=item_id, cart__user=request.user).first()
        if not item:
            raise NotFound("Artículo no encontrado en tu carrito.")
        return item

    def patch(self, request, item_id):
        item = self.get_object(request, item_id)
        quantity = request.data.get("quantity")
        if not isinstance(quantity, int) or quantity < 1:
            raise ValidationError({"quantity": "Debe ser un entero mayor que cero."})
        if quantity > item.product.stock:
            raise ValidationError({"quantity": "La cantidad supera el stock disponible."})
        item.quantity = quantity
        item.save(update_fields=["quantity", "updated_at"])
        return Response(CartItemSerializer(item).data)

    def delete(self, request, item_id):
        item = self.get_object(request, item_id)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
