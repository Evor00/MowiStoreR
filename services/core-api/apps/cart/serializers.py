from rest_framework import serializers

from apps.catalog.serializers import ProductSerializer
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "product", "product_id", "quantity", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "items", "total", "updated_at")

    def get_total(self, cart):
        return sum(item.product.price * item.quantity for item in cart.items.select_related("product").all())
