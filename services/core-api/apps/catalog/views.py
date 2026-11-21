from rest_framework import filters, viewsets

from .models import Category, Product
from .permissions import IsStaffOrReadOnly
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = Category.objects.all()
        return queryset if self.request.user.is_staff else queryset.filter(is_active=True)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ("name", "description", "sku")
    ordering_fields = ("price", "created_at", "name")

    def get_queryset(self):
        queryset = Product.objects.select_related("category")
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset if self.request.user.is_staff else queryset.filter(is_active=True, category__is_active=True)
