from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_id", "product_name", "sku", "unit_price", "quantity")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "user", "status", "payment_status", "total", "created_at")
    list_filter = ("status", "payment_status")
    search_fields = ("reference", "user__email")
    readonly_fields = ("reference", "subtotal", "total", "created_at", "updated_at")
    inlines = (OrderItemInline,)
