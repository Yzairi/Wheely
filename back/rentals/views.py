from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

from .models import Car, Rental
from .serializers import CarSerializer, RentalSerializer
from .filters import CarFilter


class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend]
    filterset_class = CarFilter

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action != "list":
            return queryset
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        if lat is None or lng is None or lat == "" or lng == "":
            return queryset
        try:
            lat_f = float(lat)
            lng_f = float(lng)
            radius_km = float(self.request.query_params.get("radius_km") or 10)
            if radius_km <= 0 or radius_km > 500:
                radius_km = 10.0
        except (TypeError, ValueError):
            return queryset.none()
        ref = Point(lng_f, lat_f, srid=4326)
        return queryset.filter(location__isnull=False).filter(
            location__distance_lte=(ref, D(km=radius_km))
        )

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def mine(self, request):
        queryset = self.get_queryset().filter(owner=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class RentalViewSet(viewsets.ModelViewSet):
    serializer_class = RentalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtrer pour ne retourner que les locations du client connecté
        return Rental.objects.filter(client=self.request.user)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(
        detail=False,
        methods=["get"],
        url_path="by-car/(?P<car_id>[^/.]+)",
    )
    def by_car(self, request, car_id=None):
        """Rentals pour une voiture donnée (réservé au propriétaire de la voiture)."""
        car = Car.objects.filter(id=car_id, owner=request.user).first()
        if not car:
            return Response({"detail": "Voiture introuvable."}, status=404)
        rentals = Rental.objects.filter(car=car).select_related("client", "car").order_by("-start_date")
        serializer = self.get_serializer(rentals, many=True)
        return Response({
            "car": {"id": car.id, "brand": car.brand, "model": car.model},
            "rentals": serializer.data,
        })
