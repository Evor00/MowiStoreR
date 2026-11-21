from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Product

User = get_user_model()


class CatalogApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Tecnología")
        self.product = Product.objects.create(category=self.category, name="Audífonos", sku="AUD-001", price="129.90", stock=10)

    def test_public_catalog_only_exposes_active_products(self):
        Product.objects.create(category=self.category, name="Oculto", sku="HID-001", price="1.00", stock=1, is_active=False)
        response = self.client.get("/api/v1/products/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_staff_can_create_product(self):
        staff = User.objects.create_user(email="staff@example.com", password="a-secure-password", is_staff=True, role=User.Role.STAFF)
        self.client.force_authenticate(staff)
        response = self.client.post("/api/v1/products/", {"name": "Mouse", "sku": "MOU-001", "price": "79.90", "stock": 5, "category_id": str(self.category.id)}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
