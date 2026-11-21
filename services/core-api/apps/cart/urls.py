from django.urls import path

from .views import CartDetailView, CartItemDetailView, CartItemListView

urlpatterns = [
    path("cart/", CartDetailView.as_view(), name="cart"),
    path("cart/items/", CartItemListView.as_view(), name="cart-item-list"),
    path("cart/items/<uuid:item_id>/", CartItemDetailView.as_view(), name="cart-item-detail"),
]
