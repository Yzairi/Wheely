import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, afterNextRender, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CarService } from '../../services/car_services/car';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader-service';

declare var google: any;

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
  private readonly gmapsLoader = inject(GoogleMapsLoaderService);
  private readonly injector = inject(Injector);

  protected readonly currentStep = signal(0);
  protected readonly submitting = signal(false);
  protected readonly editingCar = signal<any | null>(null);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly photoName = signal<string | null>(null);
  protected readonly photoFile = signal<File | null>(null);
  /** Position après choix dans l’autocomplete (ou voiture déjà géolocalisée à l’édition). */
  protected readonly selectedGeolocation = signal<{ lat: number; lng: number } | null>(null);
  /** Adresse associée au dernier point géolocalisé (saisie modifiée → géoloc invalidée). */
  private readonly committedAddressForGeoloc = signal<string | null>(null);
  protected readonly addressSubmitError = signal<string | null>(null);

  protected readonly maxCarYear = new Date().getFullYear() + 1;

  /** Champs alignés sur le modèle API (obligatoires côté serveur). */
  protected readonly infoForm = this.fb.group({
    brand: ['', [Validators.required, Validators.maxLength(100)]],
    model: ['', [Validators.required, Validators.maxLength(100)]],
    year: [
      new Date().getFullYear(),
      [
        Validators.required,
        Validators.min(1900),
        Validators.max(this.maxCarYear),
      ],
    ],
    mileage: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly specForm = this.fb.group({
    fuel_type: ['', Validators.required],
    gearbox: ['', Validators.required],
    doors: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
    seats: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
    daily_price: [0, [Validators.required, Validators.min(0.01)]],
  });

  protected readonly detailsForm = this.fb.group({
    description: [''],
    equipments: ['GPS, Airbags'],
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

  /** L’input #address n’existe qu’à l’étape 2 : on attache l’autocomplete après le rendu. */
  private async setupAddressAutocomplete(): Promise<void> {
    await this.gmapsLoader.load();
    afterNextRender(
      () => {
        if (this.currentStep() !== 2) return;
        const input = document.getElementById('address') as HTMLInputElement | null;
        if (!input) return;

        const car = this.editingCar();
        if (car?.address && !input.value) {
          input.value = car.address;
        }

        const autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          this.selectedGeolocation.set({ lat, lng });
          const label =
            (place.formatted_address as string | undefined)?.trim() || input.value.trim();
          this.committedAddressForGeoloc.set(label);
          this.addressSubmitError.set(null);
        });
      },
      { injector: this.injector },
    );
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
    if (step === 1) {
      void this.setupAddressAutocomplete();
    }
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
    if (target === 2) {
      void this.setupAddressAutocomplete();
    }
  }

  protected onAddressInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = el.value.trim();
    const committed = this.committedAddressForGeoloc();
    if (committed !== null && v !== committed) {
      this.selectedGeolocation.set(null);
    }
  }

  protected submit(): void {
    this.infoForm.markAllAsTouched();
    this.specForm.markAllAsTouched();
    this.detailsForm.markAllAsTouched();
    if (this.infoForm.invalid || this.specForm.invalid || this.detailsForm.invalid) {
      if (this.infoForm.invalid) {
        this.currentStep.set(0);
      } else if (this.specForm.invalid) {
        this.currentStep.set(1);
      }
      return;
    }

    const addressInput = document.getElementById('address') as HTMLInputElement | null;
    const address = addressInput?.value?.trim() ?? '';
    this.addressSubmitError.set(null);
    if (!address) {
      this.addressSubmitError.set("L'adresse est obligatoire.");
      return;
    }
    const geo = this.selectedGeolocation();
    if (!geo) {
      this.addressSubmitError.set(
        'Sélectionnez une adresse dans les suggestions Google pour enregistrer la position.',
      );
      return;
    }

    const payload = {
      ...this.infoForm.value,
      ...this.specForm.value,
      ...this.detailsForm.value,
      equipments:
        this.detailsForm.value.equipments
          ?.split(',')
          .map((item) => item.trim())
          .filter((item) => !!item) ?? [],
      is_available: this.editingCar()?.is_available ?? true,
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
        return;
      }
      formData.append(key, String(value));
    });

    if (this.photoFile()) {
      formData.append('photo_url', this.photoFile() as File);
    }

    formData.append('lat', String(geo.lat));
    formData.append('lng', String(geo.lng));
    formData.append('address', address);

    this.submitting.set(true);
    const request$ = this.editingCar()
      ? this.carService.updateCar(this.editingCar()!.id, formData)
      : this.carService.createCar(formData);

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
      description: car.description ?? '',
      equipments: Array.isArray(car.equipments)
        ? car.equipments.join(', ')
        : (car.equipments ?? 'GPS, Airbags'),
    });
    this.photoPreview.set(car.photo_url ?? null);
    this.photoName.set(car.photo_url ? 'Image existante' : null);
    this.photoFile.set(null);
    const lat = car.latitude;
    const lng = car.longitude;
    if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      this.selectedGeolocation.set({ lat, lng });
      this.committedAddressForGeoloc.set((car.address ?? '').trim());
    } else {
      this.selectedGeolocation.set(null);
      this.committedAddressForGeoloc.set(null);
    }
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
      description: '',
      equipments: 'GPS, Airbags',
    });
    this.photoPreview.set(null);
    this.photoName.set(null);
    this.photoFile.set(null);
    this.selectedGeolocation.set(null);
    this.committedAddressForGeoloc.set(null);
    this.addressSubmitError.set(null);
    const el = document.getElementById('address') as HTMLInputElement | null;
    if (el) el.value = '';
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
      this.photoFile.set(file);
    };
    reader.readAsDataURL(file);
  }
}
