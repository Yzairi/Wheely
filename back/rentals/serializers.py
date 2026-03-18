from rest_framework import serializers

from .models import Car, Rental, Rating, Comment
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

    class Meta:
        model = Car
        fields = [
            "id", "owner", "brand", "model", "year", "fuel_type", "gearbox",
            "doors", "seats", "equipments", "mileage", "photo_url", "is_available",
            "daily_price", "description", "created_at", "city", "lat", "lon",
            "average_rating", "comments"
        ]
        read_only_fields = ("id", "owner", "created_at")

    def get_average_rating(self, obj):
        return obj.average_rating

    def get_comments(self, obj):
        return CommentSerializer(
            Comment.objects.filter(rental__car=obj).select_related('rental'),
            many=True
        ).data


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
