import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarService } from '../../services/car_services/car';

@Component({
  selector: 'app-car-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './car-form.html',
  styleUrls: ['./car-form.css'],
})
export class CarFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly carService = inject(CarService);
  private readonly router = inject(Router);

  protected readonly currentStep = signal(0);
  protected readonly submitting = signal(false);

  protected readonly infoForm = this.fb.group({
    brand: [''],
    model: [''],
    year: [new Date().getFullYear()],
    mileage: [0],
  });

  protected readonly specForm = this.fb.group({
    fuel_type: [''],
    gearbox: [''],
    doors: [5],
    seats: [5],
    daily_price: [0],
  });

  protected readonly detailsForm = this.fb.group({
    photo_url: [''],
    description: [''],
    equipments: ['GPS, Airbags'],
    city: [''],
  });

  protected goNext(): void {
    const step = this.currentStep();
    if (step === 0 && this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }
    if (step === 1 && this.specForm.invalid) {
      this.specForm.markAllAsTouched();
      return;
    }
    this.currentStep.update((value) => Math.min(value + 1, 2));
  }

  protected goPrevious(): void {
    this.currentStep.update((value) => Math.max(value - 1, 0));
  }

  protected goToStep(step: number): void {
    const target = Math.max(0, Math.min(step, 2));
    if (target === 1 && this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }
    if (target === 2 && (this.infoForm.invalid || this.specForm.invalid)) {
      this.infoForm.markAllAsTouched();
      this.specForm.markAllAsTouched();
      return;
    }
    this.currentStep.set(target);
  }

  protected submit(): void {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.infoForm.value,
      ...this.specForm.value,
      ...this.detailsForm.value,
      geolocalization: this.detailsForm.value.city
        ? { city: this.detailsForm.value.city }
        : {},
      equipments:
        this.detailsForm.value.equipments
          ?.split(',')
          .map((item) => item.trim())
          .filter((item) => !!item) ?? [],
      is_available: true,
    };

    this.submitting.set(true);
    this.carService.createCar(payload).subscribe({
      next: () => {
        this.router.navigate(['/car']);
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }
}
