from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Product
from .models import Order

User = get_user_model()


class CheckoutApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="ana@example.com", password="a-secure-password")
        category = Category.objects.create(name="Accesorios")
        self.product = Product.objects.create(category=category, name="Cable USB-C", sku="USB-C-1", price="25.50", stock=3)
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        self.client.force_authenticate(self.user)

    def test_checkout_creates_order_reserves_stock_and_clears_cart(self):
        response = self.client.post("/api/v1/checkout/", {"recipient_name": "Ana Pérez", "recipient_phone": "999999999", "shipping_address": "Av. Siempre Viva 123", "shipping_city": "Lima"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 1)
        self.assertFalse(self.user.cart.items.exists())

    def test_checkout_rejects_empty_cart(self):
        self.user.cart.items.all().delete()
        response = self.client.post("/api/v1/checkout/", {"recipient_name": "Ana Pérez", "recipient_phone": "999999999", "shipping_address": "Av. Siempre Viva 123", "shipping_city": "Lima"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(INTERNAL_SERVICE_TOKEN="integration-token")
    def test_payment_webhook_update_requires_service_token(self):
        order = Order.objects.create(user=self.user, recipient_name="Ana", recipient_phone="999999999", shipping_address="Av. Siempre Viva 123", shipping_city="Lima", subtotal="25.50", total="25.50")
        response = self.client.patch(f"/api/v1/internal/orders/{order.reference}/payment/", {"provider_id": "pi_test", "payment_status": "succeeded", "order_status": "paid"}, format="json", HTTP_X_SERVICE_TOKEN="integration-token")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PaymentStatus.SUCCEEDED)

    def test_only_staff_can_update_order_status(self):
        order = Order.objects.create(user=self.user, recipient_name="Ana", recipient_phone="999999999", shipping_address="Av. Siempre Viva 123", shipping_city="Lima", subtotal="25.50", total="25.50")
        response = self.client.patch(f"/api/v1/orders/{order.reference}/", {"status": "processing"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        staff = User.objects.create_user(email="staff@example.com", password="a-secure-password", is_staff=True, role=User.Role.STAFF)
        self.client.force_authenticate(staff)
        response = self.client.patch(f"/api/v1/orders/{order.reference}/", {"status": "processing"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PROCESSING)
