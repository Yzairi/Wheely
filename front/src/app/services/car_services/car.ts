import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CarService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/api/rentals/cars/';

  readonly cars = signal<any[]>([]);

  fetchMyCars() {
    return this.http.get<any[]>(`${this.apiUrl}mine/`).pipe(
      tap((cars) => this.cars.set(cars))
    );
  }

  createCar(payload: unknown) {
    return this.http.post(this.apiUrl, payload);
  }

  getCar(id: number) {
    return this.http.get<any>(`${this.apiUrl}${id}/`);
  }

  updateCar(id: number, payload: unknown) {
    return this.http.patch(`${this.apiUrl}${id}/`, payload);
  }

  deleteCar(id: number) {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }

  setAvailability(id: number, isAvailable: boolean) {
    return this.updateCar(id, { is_available: isAvailable });
  }
}
