import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarService } from '../../services/car_services/car';
import { signal } from '@angular/core';

@Component({
  selector: 'app-car',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './car.html',
  styleUrls: ['./car.css'],
})
export class Car implements OnInit {
  private readonly backendUrl = 'http://localhost:8000';
  private readonly carService = inject(CarService);
  protected readonly cars = this.carService.cars;
  protected readonly carPendingDeletion = signal<any | null>(null);
  protected readonly feedbackOpen = signal<Record<number, boolean>>({});

  protected getStars(rating: number | null | undefined): string {
    if (!rating) {
      return '☆☆☆☆☆';
    }
    const rounded = Math.round(rating);
    const filled = '★'.repeat(rounded);
    const empty = '☆'.repeat(5 - rounded);
    return `${filled}${empty}`;
  }

  protected formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  protected formatCommentDate(dateString: string): string {
    return this.formatDate(dateString);
  }

  protected toggleFeedback(carId: number): void {
    const open = this.feedbackOpen();
    this.feedbackOpen.set({
      ...open,
      [carId]: !open[carId],
    });
  }

  ngOnInit(): void {
    this.refresh();
  }

  protected toggleAvailability(car: any): void {
    this.carService
      .setAvailability(car.id, !car.is_available)
      .subscribe(() => this.refresh());
  }

  protected askDeletion(car: any): void {
    this.carPendingDeletion.set(car);
  }

  protected cancelDeletion(): void {
    this.carPendingDeletion.set(null);
  }

  protected confirmDeletion(): void {
    const car = this.carPendingDeletion();
    if (!car) return;

    this.carService.deleteCar(car.id).subscribe(() => {
      this.carPendingDeletion.set(null);
      this.refresh();
    });
  }

  private refresh(): void {
    this.carService.fetchMyCars().subscribe();
  }

  protected getCarPhoto(car: any): string {
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
}
