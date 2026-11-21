from django.urls import path

from .views import CheckoutView, InternalPaymentUpdateView, OrderDetailView, OrderListView

urlpatterns = [
    path("orders/", OrderListView.as_view(), name="order-list"),
    path("orders/<str:reference>/", OrderDetailView.as_view(), name="order-detail"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("internal/orders/<str:reference>/payment/", InternalPaymentUpdateView.as_view(), name="internal-payment-update"),
]
