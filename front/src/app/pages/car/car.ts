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
  private readonly carService = inject(CarService);
  protected readonly cars = this.carService.cars;
  protected readonly carPendingDeletion = signal<any | null>(null);

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
}
