import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface CarRef {
  id: number;
  brand: string;
  model: string;
}

interface Rental {
  id: number;
  car: {
    id: number;
    brand: string;
    model: string;
    daily_price: string;
  };
  client: Client;
  start_date: string;
  end_date: string;
}

interface ByCarResponse {
  car: CarRef;
  rentals: Rental[];
}

@Component({
  selector: 'app-car-rentals',
  standalone: true,
  imports: [],
  templateUrl: './car-rentals.html',
  styleUrl: './car-rentals.css',
})
export class CarRentals implements OnInit {
  private apiUrl = 'http://localhost:8000/api/rentals/rentals';
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  car = signal<CarRef | null>(null);
  rentals = signal<Rental[]>([]);
  loading = signal(true);
  notFound = signal(false);

  get activeRentals(): Rental[] {
    const now = new Date();
    return this.rentals().filter((r) => new Date(r.end_date) >= now);
  }

  get pastRentals(): Rental[] {
    const now = new Date();
    return this.rentals().filter((r) => new Date(r.end_date) < now);
  }

  get carTitle(): string {
    const c = this.car();
    return c ? `${c.brand} ${c.model}` : '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  clientName(r: Rental): string {
    const c = r.client;
    const name = [c?.first_name, c?.last_name].filter(Boolean).join(' ');
    return name || c?.email || 'Locataire';
  }

  totalPrice(r: Rental): number {
    if (!r.start_date || !r.end_date) return 0;
    const start = new Date(r.start_date);
    const end = new Date(r.end_date);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    return parseFloat(r.car.daily_price) * diffDays;
  }

  goBack(): void {
    this.router.navigate(['/car']);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.http.get<ByCarResponse>(`${this.apiUrl}/by-car/${id}/`).subscribe({
      next: (data) => {
        this.car.set(data.car);
        this.rentals.set(data.rentals);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 404) this.notFound.set(true);
      },
    });
  }
}
