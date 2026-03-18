/* eslint-disable @typescript-eslint/no-explicit-any -- API Google Maps chargée dynamiquement */
import { HttpClient } from '@angular/common/http';

type GMaps = { Map: new (el: HTMLElement, opts: object) => any; Marker: new (opts: object) => any };
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader-service';

@Component({
  selector: 'app-rental',
  standalone: true,
  imports: [],
  templateUrl: './rental.html',
  styleUrl: './rental.css',
})
export class Rental implements OnInit, OnDestroy {
  private apiUrl = 'http://localhost:8000/api';
  private backendUrl = 'http://localhost:8000';
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  private mapsLoader = inject(GoogleMapsLoaderService);
  private mapCarId: number | null = null;
  
  car = signal<any>(null);
  startDate: string = '';
  endDate: string = '';
  loading = signal<boolean>(true);

  goBack() {
    const q = this.route.snapshot.queryParams;
    this.router.navigate(['/results'], {
      queryParams: {
        address: q['address'] ?? '',
        lat: q['lat'] ?? '',
        lng: q['lng'] ?? '',
        radius_km: q['radius_km'] ?? '10',
        start_date: this.startDate,
        end_date: this.endDate,
      },
    });
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

  calculateTotalPrice(dailyPrice: number | string): number {
    if (!dailyPrice) return 0;
    const price = typeof dailyPrice === 'string' ? parseFloat(dailyPrice) : dailyPrice;
    return price * this.getNumberOfDays();
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

  /** Position pour la carte (API latitude/longitude ou GeoJSON éventuel). */
  getCarLatLng(car: Record<string, unknown> | null): { lat: number; lng: number } | null {
    if (!car) return null;
    const lat = car['latitude'];
    const lng = car['longitude'];
    if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
    if (typeof lat === 'string' && typeof lng === 'string') {
      const la = parseFloat(lat);
      const ln = parseFloat(lng);
      if (!Number.isNaN(la) && !Number.isNaN(ln)) return { lat: la, lng: ln };
    }
    const loc = car['location'] as { type?: string; coordinates?: number[] } | undefined;
    if (loc?.type === 'Point' && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
      return { lat: loc.coordinates[1], lng: loc.coordinates[0] };
    }
    return null;
  }

  hasCarLocation(car: Record<string, unknown> | null): boolean {
    return this.getCarLatLng(car) !== null;
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

  reserve() {
    // Vérifier si l'utilisateur est connecté
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Vérifier que les données nécessaires sont présentes
    if (!this.car() || !this.startDate || !this.endDate) {
      console.error('Données manquantes pour la réservation');
      return;
    }

    // Créer la réservation
    // Convertir les dates au format ISO 8601 pour le backend
    const startDateISO = new Date(this.startDate).toISOString();
    const endDateISO = new Date(this.endDate).toISOString();

    const rentalData = {
      car_id: this.car().id,
      start_date: startDateISO,
      end_date: endDateISO,
    };

    this.http.post(`${this.apiUrl}/rentals/rentals/`, rentalData).subscribe({
      next: (response: any) => {
        // Rediriger vers la page de confirmation avec les données
        this.router.navigate(['/confirmation'], {
          queryParams: {
            id: response.id,
            car_id: this.car().id,
            start_date: this.startDate,
            end_date: this.endDate,
          },
        });
      },
      error: (error) => {
        console.error('Erreur lors de la réservation:', error);
        alert('Une erreur est survenue lors de la réservation. Veuillez réessayer.');
      },
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const carId = params['id'];
      this.startDate = params['start_date'] || '';
      this.endDate = params['end_date'] || '';

      if (!carId) {
        this.router.navigate(['/results']);
        return;
      }

      this.mapCarId = null;

      this.http.get(`${this.apiUrl}/rentals/cars/${carId}/`).subscribe({
        next: (data) => {
          this.car.set(data);
          this.loading.set(false);
          const pos = this.getCarLatLng(data as Record<string, unknown>);
          if (pos) {
            setTimeout(() => this.initRentalMap(data as { id: number; brand?: string; model?: string }, pos, 0), 0);
          } else {
            this.mapCarId = null;
          }
        },
        error: () => {
          this.router.navigate(['/results']);
        },
      });
    });
  }

  private initRentalMap(
    car: { id: number; brand?: string; model?: string },
    pos: { lat: number; lng: number },
    attempt = 0,
  ): void {
    const el = document.getElementById('rental-map');
    if (!el) {
      if (attempt < 30) {
        setTimeout(() => this.initRentalMap(car, pos, attempt + 1), 50);
      }
      return;
    }
    if (this.mapCarId === car.id) return;

    this.mapsLoader.load().then(() => {
      const g = (window as unknown as { google?: { maps: GMaps } }).google;
      if (!g?.maps) return;
      el.innerHTML = '';
      const title = [car.brand, car.model].filter(Boolean).join(' ') || 'Véhicule';
      const map = new g.maps.Map(el, {
        center: pos,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
      new g.maps.Marker({
        position: pos,
        map,
        title,
      });
      this.mapCarId = car.id;
    });
  }

  ngOnDestroy(): void {
    this.mapCarId = null;
  }
}
