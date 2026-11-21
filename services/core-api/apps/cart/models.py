from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.catalog.models import Product
from apps.common.models import UUIDTimeStampedModel


class Cart(UUIDTimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="cart", on_delete=models.CASCADE)

    def __str__(self):
        return f"Carrito de {self.user.email}"


class CartItem(UUIDTimeStampedModel):
    cart = models.ForeignKey(Cart, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name="cart_items", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        constraints = [models.UniqueConstraint(fields=("cart", "product"), name="unique_product_per_cart")]

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
