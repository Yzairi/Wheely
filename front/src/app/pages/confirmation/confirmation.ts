import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css',
})
export class Confirmation implements OnInit {
  private apiUrl = 'http://localhost:8000/api';
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  car = signal<any>(null);
  rentalId: number | null = null;
  rentalData = signal<any>(null);
  loading = signal<boolean>(true);
  startDate: string = '';
  endDate: string = '';

  // Feedback form state
  rating: number | null = null;
  comment: string = '';
  submitting = signal<boolean>(false);
  feedbackSaved = signal<boolean>(false);
  feedbackError = signal<string | null>(null);

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

  submitFeedback() {
    if (!this.rentalId) return;

    const ratingValue = this.rating;
    const commentText = this.comment.trim();

    if (ratingValue === null && !commentText) {
      this.feedbackError.set('Veuillez saisir une note ou un commentaire.');
      return;
    }

    this.submitting.set(true);
    this.feedbackError.set(null);

    const payload: any = {};
    if (ratingValue !== null) payload.rating = ratingValue;
    if (commentText) payload.comment = commentText;

    this.http
      .post(`${this.apiUrl}/rentals/rentals/${this.rentalId}/feedback/`, payload)
      .subscribe({
        next: () => {
          this.feedbackSaved.set(true);
          this.submitting.set(false);
        },
        error: (err) => {
          console.error('Erreur en envoyant le feedback', err);
          this.feedbackError.set('Impossible d\'enregistrer votre avis.');
          this.submitting.set(false);
        },
      });
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
      this.rentalId = params['id'] ? Number(params['id']) : null;

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
