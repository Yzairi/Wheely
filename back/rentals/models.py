from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Car(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cars",
    )
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField()
    fuel_type = models.CharField(max_length=50)
    gearbox = models.CharField(max_length=50)
    doors = models.PositiveSmallIntegerField()
    seats = models.PositiveSmallIntegerField()
    equipments = models.JSONField(default=list, blank=True)
    mileage = models.PositiveIntegerField()
    photo_url = models.ImageField(upload_to="cars/", blank=True, null=True)
    is_available = models.BooleanField(default=True)
    daily_price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    city = models.TextField(blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    @property
    def average_rating(self):
        from django.db.models import Avg
        ratings = self.car_rentals.filter(rating__isnull=False).aggregate(avg=Avg('rating__value'))
        return ratings['avg'] if ratings['avg'] else None


class Rental(models.Model):
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_rentals",
    )
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name="car_rentals",
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)


class Rating(models.Model):
    rental = models.OneToOneField(
        Rental,
        on_delete=models.CASCADE,
        related_name="rating",
    )
    value = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    created_at = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    rental = models.OneToOneField(
        Rental,
        on_delete=models.CASCADE,
        related_name="comment",
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
