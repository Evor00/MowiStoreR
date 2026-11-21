import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import UUIDTimeStampedModel


class Order(UUIDTimeStampedModel):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Pendiente de pago"
        PAID = "paid", "Pagado"
        PROCESSING = "processing", "En preparación"
        SHIPPED = "shipped", "Enviado"
        DELIVERED = "delivered", "Entregado"
        CANCELLED = "cancelled", "Cancelado"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pendiente"
        SUCCEEDED = "succeeded", "Aprobado"
        FAILED = "failed", "Fallido"
        REFUNDED = "refunded", "Reembolsado"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="orders", on_delete=models.PROTECT)
    reference = models.CharField(max_length=20, unique=True, editable=False)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING_PAYMENT)
    payment_status = models.CharField(max_length=16, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_provider_id = models.CharField(max_length=255, blank=True)
    recipient_name = models.CharField(max_length=160)
    recipient_phone = models.CharField(max_length=30)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_notes = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0"))])
    total = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("user", "status")), models.Index(fields=("reference",))]

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"MW-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.reference


class OrderItem(UUIDTimeStampedModel):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product_id = models.UUIDField()
    product_name = models.CharField(max_length=180)
    sku = models.CharField(max_length=64)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        ordering = ("created_at",)
