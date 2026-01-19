from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
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
