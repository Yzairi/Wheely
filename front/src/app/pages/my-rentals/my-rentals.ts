import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

interface Rental {
  id: number;
  car: {
    id: number;
    brand: string;
    model: string;
    photo_url: string;
    daily_price: string;
  };
  start_date: string;
  end_date: string;
}

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [],
  templateUrl: './my-rentals.html',
  styleUrl: './my-rentals.css',
})
export class MyRentals implements OnInit {
  private apiUrl = 'http://localhost:8000/api';
  private http = inject(HttpClient);
  private router = inject(Router);

  rentals = signal<Rental[]>([]);
  loading = signal<boolean>(true);

  get activeRentals(): Rental[] {
    const now = new Date();
    return this.rentals().filter((rental) => {
      const endDate = new Date(rental.end_date);
      return endDate >= now;
    });
  }

  get pastRentals(): Rental[] {
    const now = new Date();
    return this.rentals().filter((rental) => {
      const endDate = new Date(rental.end_date);
      return endDate < now;
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  calculateTotalPrice(rental: Rental): number {
    if (!rental.start_date || !rental.end_date) {
      return 0;
    }
    const start = new Date(rental.start_date);
    const end = new Date(rental.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const dailyPrice = parseFloat(rental.car.daily_price);
    return dailyPrice * diffDays;
  }

  goBack() {
    this.router.navigate(['/account']);
  }

  ngOnInit(): void {
    this.http.get<Rental[]>(`${this.apiUrl}/rentals/rentals/`).subscribe({
      next: (data) => {
        this.rentals.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des locations:', error);
        this.loading.set(false);
      },
    });
  }
}
