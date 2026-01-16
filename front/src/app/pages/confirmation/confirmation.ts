import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css',
})
export class Confirmation implements OnInit {
  private apiUrl = 'http://localhost:8000/api';
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  car = signal<any>(null);
  rentalData = signal<any>(null);
  loading = signal<boolean>(true);
  startDate: string = '';
  endDate: string = '';

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

  calculateTotalPrice(): number {
    if (!this.car() || !this.car().daily_price) return 0;
    const dailyPrice = typeof this.car().daily_price === 'string' 
      ? parseFloat(this.car().daily_price) 
      : this.car().daily_price;
    return dailyPrice * this.getNumberOfDays();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const carId = params['car_id'];
      this.startDate = params['start_date'] || '';
      this.endDate = params['end_date'] || '';

      if (!carId) {
        this.router.navigate(['/']);
        return;
      }

      // Charger les données de la voiture
      this.http.get(`${this.apiUrl}/rentals/cars/${carId}/`).subscribe({
        next: (data) => {
          this.car.set(data);
          this.rentalData.set({
            start_date: this.startDate,
            end_date: this.endDate,
          });
          this.loading.set(false);
        },
        error: () => {
          this.router.navigate(['/']);
        },
      });
    });
  }
}
