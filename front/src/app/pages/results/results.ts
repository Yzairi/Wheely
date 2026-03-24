import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../services/search-service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results implements OnInit {
  private apiUrl = 'http://localhost:8000/api';
  private backendUrl = 'http://localhost:8000';
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);
  cars = signal<any>([]);
  startDate: string = '';
  endDate: string = '';
  addressLabel: string = '';
  radiusKm = 10;
  searchLat = 0;
  searchLng = 0;

  goBack() {
    this.router.navigate(['/']);
  }

  getNumberOfDays(): number {
    if (!this.startDate || !this.endDate) {
      return 0;
    }
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }

  calculateTotalPrice(dailyPrice: number): number {
    return dailyPrice * this.getNumberOfDays();
  }

  getStars(rating: number | null | undefined): string {
    if (!rating) {
      return '☆☆☆☆☆';
    }
    const rounded = Math.round(rating);
    const filled = '★'.repeat(rounded);
    const empty = '☆'.repeat(5 - rounded);
    return `${filled}${empty}`;
  }

  getCarPhoto(car: any): string {
    const photo = car?.photo_url;
    if (!photo) {
      return '/car-placeholder.jpg';
    }
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    if (photo.startsWith('/')) {
      return `${this.backendUrl}${photo}`;
    }
    return `${this.backendUrl}/${photo}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getFormattedStartDate(): string {
    return this.formatDate(this.startDate);
  }

  getFormattedEndDate(): string {
    return this.formatDate(this.endDate);
  }

  private searchParams(lat: number, lng: number, radius: number, start: string, end: string) {
    return new HttpParams()
      .set('lat', String(lat))
      .set('lng', String(lng))
      .set('radius_km', String(radius))
      .set('start_date', start)
      .set('end_date', end)
      .set('is_available', 'true');
  }

  searchAvailableCars(
    lat: number,
    lng: number,
    radiusKm: number,
    start: string,
    end: string,
  ) {
    const params = this.searchParams(lat, lng, radiusKm, start, end);
    this.http.get(`${this.apiUrl}/rentals/cars/`, { params }).subscribe((data) => this.cars.set(data as any[]));
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const lat = parseFloat(params['lat'] ?? '');
      const lng = parseFloat(params['lng'] ?? '');
      const start_date = params['start_date'];
      const end_date = params['end_date'];
      const radius = parseInt(params['radius_km'] ?? '10', 10);
      const address = params['address'] ? decodeURIComponent(params['address']) : '';

      if (
        !Number.isNaN(lat) &&
        !Number.isNaN(lng) &&
        start_date &&
        end_date
      ) {
        this.addressLabel = address;
        this.searchLat = lat;
        this.searchLng = lng;
        this.radiusKm = Number.isNaN(radius) || radius < 1 ? 10 : Math.min(radius, 200);
        this.startDate = start_date;
        this.endDate = end_date;
        this.searchService.setCriteria({
          address,
          lat,
          lng,
          radius_km: this.radiusKm,
          start_date,
          end_date,
        });
        this.searchAvailableCars(lat, lng, this.radiusKm, start_date, end_date);
        return;
      }

      const criteria = this.searchService.criteria();
      if (!criteria) {
        this.router.navigate(['/']);
        return;
      }
      this.addressLabel = criteria.address;
      this.searchLat = criteria.lat;
      this.searchLng = criteria.lng;
      this.radiusKm = criteria.radius_km;
      this.startDate = criteria.start_date;
      this.endDate = criteria.end_date;
      this.searchAvailableCars(
        criteria.lat,
        criteria.lng,
        criteria.radius_km,
        criteria.start_date,
        criteria.end_date,
      );
    });
  }

  searchQueryParams() {
    return {
      address: encodeURIComponent(this.addressLabel),
      lat: this.searchLat,
      lng: this.searchLng,
      radius_km: this.radiusKm,
      start_date: this.startDate,
      end_date: this.endDate,
    };
  }

  goToSearch() {
    this.router.navigate(['/'], { queryParams: this.searchQueryParams() });
  }

  goToRental(carId: number) {
    this.router.navigate(['/rental'], {
      queryParams: {
        id: carId,
        ...this.searchQueryParams(),
      },
    });
  }
}
