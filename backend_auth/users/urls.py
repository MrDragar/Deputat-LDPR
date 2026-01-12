from django.urls import path
from .views import UserListAPIView, UserDetailAPIView

urlpatterns = [
    path('/', UserListAPIView.as_view(), name='user-list'),
    path('/<int:user_id>/', UserDetailAPIView.as_view(), name='user-detail'),
    path('/-<int:user_id>/', UserDetailAPIView.as_view(), name='user-detail-neg'),

]
