from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "is_active")


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source="category", queryset=Category.objects.all(), write_only=True)

    class Meta:
        model = Product
        fields = ("id", "category", "category_id", "name", "slug", "sku", "description", "price", "stock", "image_url", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "slug", "created_at", "updated_at")
