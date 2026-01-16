import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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

  calculateTotalPrice(dailyPrice: number): number {
    if (!dailyPrice) return 0;
    return dailyPrice * this.getNumberOfDays();
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
    // À implémenter plus tard
    console.log('Réservation à implémenter');
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
