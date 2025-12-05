import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Auth } from '../../services/auth';

@Injectable({
  providedIn: 'root',
})
export class CarService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private readonly apiUrl = 'http://127.0.0.1:8000/api/rentals/cars/';
  readonly cars = signal<any[]>([]);

  fetchMyCars() {
    return this.http.get<any[]>(`${this.apiUrl}mine/`).pipe(
      tap((cars) => this.cars.set(cars))
    );
  }
}
