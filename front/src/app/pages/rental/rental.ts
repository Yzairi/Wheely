import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-rental',
  standalone: true,
  imports: [],
  templateUrl: './rental.html',
  styleUrl: './rental.css',
})
export class Rental implements OnInit {
  private apiUrl = 'http://localhost:8000/api';
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  
  car = signal<any>(null);
  startDate: string = '';
  endDate: string = '';
  loading = signal<boolean>(true);

  goBack() {
    this.router.navigate(['/results'], {
      queryParams: {
        city: this.route.snapshot.queryParams['city'],
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

      this.http.get(`${this.apiUrl}/rentals/cars/${carId}/`).subscribe({
        next: (data) => {
          this.car.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.router.navigate(['/results']);
        },
      });
    });
  }
}
