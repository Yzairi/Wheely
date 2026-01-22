from django.urls import path
from .views import (
    RegisterView,
    ProfileView,
    GoogleAuthView,
    GoogleRedirectLoginView,
    GoogleRedirectCallbackView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", TokenObtainPairView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("profile/", ProfileView.as_view()),
    path("google/", GoogleAuthView.as_view()),
    path("google/login/", GoogleRedirectLoginView.as_view(), name="google-login"),
    path("google/callback/", GoogleRedirectCallbackView.as_view(), name="google-callback"),
]
