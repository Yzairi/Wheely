import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CarService } from '../../services/car_services/car';

@Component({
  selector: 'app-car-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './car-form.html',
  styleUrls: ['./car-form.css'],
})
export class CarFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly carService = inject(CarService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly currentStep = signal(0);
  protected readonly submitting = signal(false);
  protected readonly editingCar = signal<any | null>(null);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly photoName = signal<string | null>(null);

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

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const editId = params.get('edit');
      if (editId) {
        this.carService.getCar(+editId).subscribe((car) => {
          this.editingCar.set(car);
          this.populateForms(car);
        });
      } else {
        this.editingCar.set(null);
        this.resetForms();
        this.currentStep.set(0);
      }
    });
  }

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
      is_available: this.editingCar()?.is_available ?? true,
      photo_url: this.photoPreview() ?? this.detailsForm.value.photo_url,
    };

    this.submitting.set(true);
    const request$ = this.editingCar()
      ? this.carService.updateCar(this.editingCar()!.id, payload)
      : this.carService.createCar(payload);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/car']);
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }
  private populateForms(car: any): void {
    this.infoForm.patchValue({
      brand: car.brand ?? '',
      model: car.model ?? '',
      year: car.year ?? new Date().getFullYear(),
      mileage: car.mileage ?? 0,
    });

    this.specForm.patchValue({
      fuel_type: car.fuel_type ?? '',
      gearbox: car.gearbox ?? '',
      doors: car.doors ?? 5,
      seats: car.seats ?? 5,
      daily_price: car.daily_price ?? 0,
    });

    this.detailsForm.patchValue({
      photo_url: car.photo_url ?? '',
      description: car.description ?? '',
      equipments: Array.isArray(car.equipments)
        ? car.equipments.join(', ')
        : car.equipments ?? 'GPS, Airbags',
      city: car.geolocalization?.city ?? '',
    });
    this.photoPreview.set(car.photo_url ?? null);
    this.photoName.set(car.photo_url ? 'Image existante' : null);
  }

  private resetForms(): void {
    this.infoForm.reset({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0,
    });
    this.specForm.reset({
      fuel_type: '',
      gearbox: '',
      doors: 5,
      seats: 5,
      daily_price: 0,
    });
    this.detailsForm.reset({
      photo_url: '',
      description: '',
      equipments: 'GPS, Airbags',
      city: '',
    });
    this.photoPreview.set(null);
    this.photoName.set(null);
  }

  protected handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.readFile(file);
    }
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  protected handleDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.readFile(file);
    }
  }

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.photoPreview.set(result);
      this.photoName.set(file.name);
      this.detailsForm.patchValue({ photo_url: result });
    };
    reader.readAsDataURL(file);
  }
}
