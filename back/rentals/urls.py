from rest_framework.routers import DefaultRouter

from .views import CarViewSet, RentalViewSet

router = DefaultRouter()
router.register(r"cars", CarViewSet, basename="car")
router.register(r"rentals", RentalViewSet, basename="rental")

urlpatterns = router.urls
