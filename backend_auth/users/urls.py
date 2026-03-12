from django.urls import path, re_path
from .views import UserListAPIView, UserDetailAPIView, UserUpdateAvailabilityAPIView

urlpatterns = [
    path('/', UserListAPIView.as_view(), name='user-list'),
    re_path(r'^/(?P<user_id>-?\d+)/$', UserDetailAPIView.as_view(), name='user-detail'),
    re_path(r'^/(?P<user_id>-?\d+)/update-availability$', UserUpdateAvailabilityAPIView.as_view(), name='user-detail'),

]
