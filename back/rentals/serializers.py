from rest_framework import serializers

from .models import Car, Rental, Rating, Comment
from django.contrib.gis.geos import Point
from accounts.serializers import UserSerializer


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['text', 'created_at']


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['value', 'created_at']


class CarSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()

    # WRITE (input)
    lat = serializers.FloatField(write_only=True, required=False, allow_null=True)
    lng = serializers.FloatField(write_only=True, required=False, allow_null=True)

    # READ (output)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Car
        fields = [
            "id", "owner", "brand", "model", "year", "fuel_type", "gearbox",
            "doors", "seats", "equipments", "mileage", "photo_url", "is_available",
            "daily_price", "description", "created_at", "city",
            "lat", "lng", "latitude", "longitude",
            "average_rating", "comments"
        ]
        read_only_fields = ("id", "owner", "created_at")

    # =========================
    # RATING / COMMENTS LOGIC
    # =========================
    def get_average_rating(self, obj):
        return obj.average_rating

    def get_comments(self, obj):
        return CommentSerializer(
            Comment.objects.filter(rental__car=obj).select_related('rental'),
            many=True
        ).data

    # =========================
    # LOCATION (READ)
    # =========================
    def get_latitude(self, obj):
        if obj.location:
            return float(obj.location.y)
        return None

    def get_longitude(self, obj):
        if obj.location:
            return float(obj.location.x)
        return None

    # =========================
    # LOCATION (WRITE)
    # =========================
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


class RentalFeedbackSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    comment = serializers.CharField(required=False, allow_blank=True)


class RentalSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    car_id = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(), source="car", write_only=True
    )
    rating = RatingSerializer(read_only=True)
    comment = CommentSerializer(read_only=True)

    class Meta:
        model = Rental
        fields = "__all__"
        read_only_fields = ("id", "client", "created_at")