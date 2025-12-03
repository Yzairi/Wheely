from rest_framework import serializers

from .models import Car, Rental
from accounts.serializers import UserSerializer


class CarSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Car
        fields = "__all__"
        read_only_fields = ("id", "owner", "created_at")


class RentalSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    car = CarSerializer(read_only=True)

    class Meta:
        model = Rental
        fields = "__all__"
        read_only_fields = ("id", "client", "car", "created_at")
