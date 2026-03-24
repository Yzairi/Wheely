from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Car, Rental, Rating, Comment
from .serializers import CarSerializer, RentalSerializer, RentalFeedbackSerializer
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
        detail=True,
        methods=["post"],
        url_path="feedback",
        permission_classes=[permissions.IsAuthenticated],
    )
    def feedback(self, request, pk=None):
        """Ajouter ou mettre à jour une note/commentaire pour une réservation."""
        rental = self.get_object()
        serializer = RentalFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rating_value = serializer.validated_data.get("rating")
        comment_text = serializer.validated_data.get("comment")

        if rating_value is not None:
            Rating.objects.update_or_create(
                rental=rental,
                defaults={"value": rating_value},
            )

        if comment_text is not None:
            Comment.objects.update_or_create(
                rental=rental,
                defaults={"text": comment_text},
            )

        return Response({"detail": "Feedback enregistré."})

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
