from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # champs custom
    phone_number = models.TextField(blank=True, null=True)
