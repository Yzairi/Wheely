import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private apiUrl = 'http://localhost:8000/api';
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  cars = signal<any>([]);

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
      city: [''],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
    },
    { validators: this.dateRangeValidator() }
  );

  searchAvailableCar() {
    return this.http
      .get(
        `${this.apiUrl}/rentals/cars?start_date=${this.form.value.start_date}&end_date=${this.form.value.end_date}&is_available=true`
      )
      .subscribe((data) => this.cars.set(data));
  }
}
