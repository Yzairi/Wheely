import django_filters
from .models import Car


class CarFilter(django_filters.FilterSet):
    start_date = django_filters.DateFilter(method="filter_available")
    end_date = django_filters.DateFilter(method="filter_available")

    class Meta:
        model = Car
        exclude = ["equipments", "geolocalization"]

    def filter_available(self, queryset, name, value):
        start = self.data.get("start_date")
        end = self.data.get("end_date")

        if start and end:
            return queryset.exclude(
                car_rentals__start_date__lt=end,
                car_rentals__end_date__gt=start,
            )
        return queryset
