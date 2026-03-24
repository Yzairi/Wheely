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
  rating?: { value: number };
  comment?: { text: string };
}

interface FeedbackState {
  rating?: number;
  comment?: string;
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
  private backendUrl = 'http://localhost:8000';
  private http = inject(HttpClient);
  private router = inject(Router);

  rentals = signal<Rental[]>([]);
  loading = signal<boolean>(true);

  feedbackState = signal<Record<number, FeedbackState>>({});
  feedbackOpen = signal<Record<number, boolean>>({});
  submitting = signal<Record<number, boolean>>({});

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

  getCarPhoto(car: Rental['car']): string {
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

  setFeedbackRating(rentalId: number, value: number) {
    const state = this.feedbackState();
    this.feedbackState.set({
      ...state,
      [rentalId]: {
        ...state[rentalId],
        rating: value,
      },
    });
  }

  setFeedbackComment(rentalId: number, value: string) {
    const state = this.feedbackState();
    this.feedbackState.set({
      ...state,
      [rentalId]: {
        ...state[rentalId],
        comment: value,
      },
    });
  }

  toggleFeedbackForm(rentalId: number) {
    const open = this.feedbackOpen();
    this.feedbackOpen.set({
      ...open,
      [rentalId]: !open[rentalId],
    });
  }

  sendFeedback(rentalId: number) {
    const state = this.feedbackState()[rentalId] || {};
    const payload: any = {};
    if (state.rating != null) {
      payload.rating = state.rating;
    }
    if (state.comment != null) {
      payload.comment = state.comment;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    this.submitting.set({ ...this.submitting(), [rentalId]: true });

    this.http
      .post(`${this.apiUrl}/rentals/rentals/${rentalId}/feedback/`, payload)
      .subscribe({
        next: () => {
          this.fetchRentals();
          this.submitting.set({ ...this.submitting(), [rentalId]: false });
          this.feedbackOpen.set({ ...this.feedbackOpen(), [rentalId]: false });
        },
        error: () => {
          this.submitting.set({ ...this.submitting(), [rentalId]: false });
        },
      });
  }

  ngOnInit(): void {
    this.fetchRentals();
  }

  private fetchRentals() {
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

