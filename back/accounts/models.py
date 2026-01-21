from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.TextField(blank=True, null=True)
    google_sub = models.CharField(max_length=255, blank=True, null=True, unique=True)
    avatar_url = models.URLField(blank=True)
    email_verified = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = uuid.uuid4().hex[:20]
        super().save(*args, **kwargs)
