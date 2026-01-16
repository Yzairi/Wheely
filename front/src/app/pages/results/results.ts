import { HttpClient } from '@angular/common/http';
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
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);
  cars = signal<any>([]);
  startDate: string = '';
  endDate: string = '';
  city: string = '';

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
    return diffDays || 1; // Au moins 1 jour
  }

  calculateTotalPrice(dailyPrice: number): number {
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

  searchAvailableCars(city: any, start: any, end: any) {
    return this.http
      .get(
        `${this.apiUrl}/rentals/cars?city=${city}&start_date=${start}&end_date=${end}&is_available=true`
      )
      .subscribe((data) => this.cars.set(data));
  }

  ngOnInit(): void {
    // Essayer d'abord de récupérer depuis les query params
    this.route.queryParams.subscribe((params) => {
      const city = params['city'];
      const start_date = params['start_date'];
      const end_date = params['end_date'];

      if (city && start_date && end_date) {
        // Si on a les paramètres dans l'URL, les utiliser
        this.city = city;
        this.startDate = start_date;
        this.endDate = end_date;

        // Sauvegarder aussi dans le service pour compatibilité
        this.searchService.setCriteria({ city, start_date, end_date });

        this.searchAvailableCars(city, start_date, end_date);
      } else {
        // Sinon, essayer depuis le service (fallback)
        const criteria = this.searchService.criteria();
        if (!criteria) {
          this.router.navigate(['/']);
          return;
        }
        const { city, start_date, end_date } = criteria;
        this.city = city;
        this.startDate = start_date;
        this.endDate = end_date;
        this.searchAvailableCars(city, start_date, end_date);
      }
    });
  }

  goToSearch() {
    // Conserver les query params lors de la navigation vers la page de recherche
    this.router.navigate(['/'], {
      queryParams: {
        city: this.city,
        start_date: this.startDate,
        end_date: this.endDate,
      },
    });
  }
}
