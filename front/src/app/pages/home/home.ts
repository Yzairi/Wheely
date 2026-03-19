/* eslint-disable @typescript-eslint/no-explicit-any -- API Google Places */
import {
  Component,
  Injector,
  OnInit,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SearchCriteria, SearchService } from '../../services/search-service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader-service';

declare const google: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);
  private gmapsLoader = inject(GoogleMapsLoaderService);
  private injector = inject(Injector);

  protected readonly selectedLocation = signal<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  protected readonly addressError = signal(false);
  private lastResolvedAddress = '';
  /** Valeur affichée dans l’input (synchro avec les query params). */
  private addressInputValue = '';
  private autocompleteAttached = false;

  dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const start = control.get('start_date')?.value;
      const end = control.get('end_date')?.value;
      if (!start || !end) return null;
      const startDate = new Date(start);
      const endDate = new Date(end);
      return endDate > startDate ? null : { dateRangeInvalid: true };
    };
  }

  form = this.fb.group(
    {
      radius_km: [
        10,
        [Validators.required, Validators.min(1), Validators.max(200)],
      ],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
    },
    { validators: this.dateRangeValidator() },
  );

  ngOnInit(): void {
    void this.ensureAutocomplete();
    this.route.queryParams.subscribe((params) => {
      this.applyParams(params);
    });
  }

  private applyParams(params: Params): void {
    const lat = parseFloat(params['lat'] ?? '');
    const lng = parseFloat(params['lng'] ?? '');
    const hasGeo =
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      params['start_date'] &&
      params['end_date'];

    if (hasGeo) {
      const address = params['address'] ? decodeURIComponent(params['address']) : '';
      this.addressInputValue = address;
      this.lastResolvedAddress = address.trim();
      this.selectedLocation.set({ lat, lng, address });
      const rk = parseInt(params['radius_km'] ?? '10', 10);
      this.form.patchValue({
        radius_km: Number.isNaN(rk) || rk < 1 ? 10 : Math.min(rk, 200),
        start_date: params['start_date'] || '',
        end_date: params['end_date'] || '',
      });
    } else {
      const previous = this.searchService.criteria();
      if (previous) {
        this.addressInputValue = previous.address;
        this.lastResolvedAddress = (previous.address || '').trim();
        this.selectedLocation.set({
          lat: previous.lat,
          lng: previous.lng,
          address: previous.address,
        });
        this.form.patchValue({
          radius_km: previous.radius_km,
          start_date: previous.start_date,
          end_date: previous.end_date,
        });
      }
    }

    const input = document.getElementById('home-search-address') as HTMLInputElement | null;
    if (input) {
      input.value = this.addressInputValue;
    }
  }

  private async ensureAutocomplete(): Promise<void> {
    await this.gmapsLoader.load();
    afterNextRender(
      () => {
        if (this.autocompleteAttached) return;
        const input = document.getElementById('home-search-address') as HTMLInputElement | null;
        if (!input) return;
        this.autocompleteAttached = true;
        input.value = this.addressInputValue;

        input.addEventListener('input', () => {
          if (this.lastResolvedAddress && input.value.trim() !== this.lastResolvedAddress.trim()) {
            this.selectedLocation.set(null);
          }
        });

        const autocomplete = new google.maps.places.Autocomplete(input, {
          fields: ['geometry', 'formatted_address'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address ?? input.value;
          this.lastResolvedAddress = address.trim();
          this.addressInputValue = address;
          this.selectedLocation.set({ lat, lng, address });
          this.addressError.set(false);
        });
      },
      { injector: this.injector },
    );
  }

  submit(): void {
    this.addressError.set(false);
    if (this.form.invalid) return;
    const loc = this.selectedLocation();
    if (!loc) {
      this.addressError.set(true);
      return;
    }

    const { start_date, end_date, radius_km } = this.form.getRawValue();
    const criteria: SearchCriteria = {
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      radius_km: Number(radius_km),
      start_date: start_date!,
      end_date: end_date!,
    };
    this.searchService.setCriteria(criteria);

    this.router.navigate(['/results'], {
      queryParams: {
        address: encodeURIComponent(criteria.address),
        lat: criteria.lat,
        lng: criteria.lng,
        radius_km: criteria.radius_km,
        start_date: criteria.start_date,
        end_date: criteria.end_date,
      },
    });
  }
}
