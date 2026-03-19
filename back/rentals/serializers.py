from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Car, Rental
from accounts.serializers import UserSerializer


class CarSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    lat = serializers.FloatField(write_only=True, required=False, allow_null=True)
    lng = serializers.FloatField(write_only=True, required=False, allow_null=True)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Car
        exclude = ("location",)
        read_only_fields = ("id", "owner", "created_at")

    def get_latitude(self, obj):
        if obj.location:
            return float(obj.location.y)
        return None

    def get_longitude(self, obj):
        if obj.location:
            return float(obj.location.x)
        return None

    def create(self, validated_data):
        lat = validated_data.pop("lat", None)
        lng = validated_data.pop("lng", None)
        if (lat is None) ^ (lng is None):
            raise serializers.ValidationError(
                "lat et lng doivent être envoyés ensemble."
            )
        if lat is not None and lng is not None:
            validated_data["location"] = Point(lng, lat)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop("lat", None)
        lng = validated_data.pop("lng", None)
        if (lat is None) ^ (lng is None):
            raise serializers.ValidationError(
                "lat et lng doivent être envoyés ensemble."
            )
        if lat is not None and lng is not None:
            validated_data["location"] = Point(lng, lat)
        return super().update(instance, validated_data)


class RentalSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    car_id = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(), source="car", write_only=True
    )

    class Meta:
        model = Rental
        fields = "__all__"
        read_only_fields = ("id", "client", "created_at")
