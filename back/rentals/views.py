from rest_framework import permissions, viewsets
from django_filters.rest_framework import DjangoFilterBackend

from .models import Car, Rental
from .serializers import CarSerializer, RentalSerializer
from .filters import CarFilter


class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = CarFilter

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class RentalViewSet(viewsets.ModelViewSet):
    queryset = Rental.objects.all()
    serializer_class = RentalSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
