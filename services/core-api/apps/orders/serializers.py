from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("id", "product_id", "product_name", "sku", "unit_price", "quantity")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ("id", "reference", "status", "payment_status", "recipient_name", "recipient_phone", "shipping_address", "shipping_city", "shipping_notes", "subtotal", "shipping_cost", "total", "items", "created_at", "updated_at")
        read_only_fields = fields


class CheckoutSerializer(serializers.Serializer):
    recipient_name = serializers.CharField(max_length=160)
    recipient_phone = serializers.CharField(max_length=30)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_notes = serializers.CharField(required=False, allow_blank=True)


class InternalPaymentUpdateSerializer(serializers.Serializer):
    provider_id = serializers.CharField(max_length=255)
    payment_status = serializers.ChoiceField(choices=Order.PaymentStatus.choices)
    order_status = serializers.ChoiceField(choices=Order.Status.choices)


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
