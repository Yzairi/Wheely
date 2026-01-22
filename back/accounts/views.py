import json
import secrets
from django.core import signing
from urllib.parse import urlencode
import requests

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.urls import reverse
try:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token
except ImportError:
    google_requests = None
    id_token = None
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer


def _get_or_create_google_user(idinfo):
    email = idinfo.get("email")
    sub = idinfo.get("sub")
    if not email or not sub:
        raise ValueError("Google token is missing required claims.")

    User = get_user_model()
    user = User.objects.filter(email=email).first()
    if user:
        if user.google_sub and user.google_sub != sub:
            raise ValueError("Google account does not match this email.")
    else:
        user = User(email=email)
        user.set_unusable_password()

    user.google_sub = sub
    user.email_verified = bool(idinfo.get("email_verified"))
    picture = idinfo.get("picture")
    if picture:
        user.avatar_url = picture
    user.save()
    return user


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    queryset = get_user_model().objects.all()


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": request.user.email})


class GoogleAuthView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if id_token is None or google_requests is None:
            return Response(
                {"detail": "google-auth is not installed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {"detail": "GOOGLE_CLIENT_ID is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        token = request.data.get("id_token")
        if not token:
            return Response(
                {"detail": "id_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response(
                {"detail": "Invalid Google token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not idinfo.get("email_verified"):
            return Response(
                {"detail": "Google email is not verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = _get_or_create_google_user(idinfo)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=status.HTTP_200_OK,
        )


class GoogleRedirectLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return Response(
                {"detail": "Google OAuth is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        redirect_uri = settings.GOOGLE_REDIRECT_URI or request.build_absolute_uri(
            reverse("google-callback")
        )
        state = signing.dumps(
            {"nonce": secrets.token_urlsafe(16)},
            salt="google-oauth-state",
        )

        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
        return HttpResponseRedirect(auth_url)


class GoogleRedirectCallbackView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if id_token is None or google_requests is None:
            return Response(
                {"detail": "google-auth is not installed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return Response(
                {"detail": "Google OAuth is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        error = request.GET.get("error")
        if error:
            return self._redirect_with_error()

        code = request.GET.get("code")
        state = request.GET.get("state")
        if not code or not state:
            return Response(
                {"detail": "Missing code or state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            signing.loads(state, salt="google-oauth-state", max_age=300)
        except signing.BadSignature:
            return Response(
                {"detail": "Invalid OAuth state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        redirect_uri = (
            settings.GOOGLE_REDIRECT_URI
            or request.build_absolute_uri(reverse("google-callback"))
        )

        token_payload = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        try:
            response = requests.post(
                "https://oauth2.googleapis.com/token",
                data=token_payload,
                timeout=10,
            )
        except requests.RequestException as exc:
            return Response(
                {"detail": "Failed to exchange code with Google.", "error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token_response = response.json()
        except ValueError:
            token_response = {}

        if response.status_code >= 400 or token_response.get("error"):
            return Response(
                {
                    "detail": "Failed to exchange code with Google.",
                    "google_error": token_response.get("error", ""),
                    "google_error_description": token_response.get("error_description", ""),
                    "status_code": response.status_code,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        google_id_token = token_response.get("id_token")
        if not google_id_token:
            return Response(
                {"detail": "Google response missing id_token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                google_id_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response(
                {"detail": "Invalid Google token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not idinfo.get("email_verified"):
            return Response(
                {"detail": "Google email is not verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = _get_or_create_google_user(idinfo)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)
        params = urlencode({"access": access, "refresh": refresh_token})
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?{params}")

    def _redirect_with_error(self):
        params = urlencode({"error": "google"})
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?{params}")
