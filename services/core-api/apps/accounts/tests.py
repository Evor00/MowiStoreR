from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationApiTests(APITestCase):
    def test_registers_user_and_returns_profile(self):
        response = self.client.post("/api/v1/auth/register/", {"email": "ana@example.com", "password": "a-secure-password", "first_name": "Ana"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="ana@example.com").exists())

    def test_user_can_obtain_jwt(self):
        User.objects.create_user(email="ana@example.com", password="a-secure-password")
        response = self.client.post("/api/v1/auth/token/", {"email": "ana@example.com", "password": "a-secure-password"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
