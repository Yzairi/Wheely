import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchCriteria, SearchService } from '../../services/search-service';

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
      city: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
    },
    { validators: this.dateRangeValidator() }
  );

  ngOnInit() {
    // Essayer d'abord depuis les query params (si on vient de results)
    this.route.queryParams.subscribe((params) => {
      if (params['city'] || params['start_date'] || params['end_date']) {
        this.form.patchValue({
          city: params['city'] || '',
          start_date: params['start_date'] || '',
          end_date: params['end_date'] || '',
        });
      } else {
        // Sinon, utiliser le service
        const previous = this.searchService.criteria();
        if (previous) {
          this.form.patchValue(previous);
        }
      }
    });
  }

  submit() {
    if (this.form.invalid) return;
    const criteria = this.form.value as SearchCriteria;
    this.searchService.setCriteria(criteria);

    // Navigation avec query params
    this.router.navigate(['/results'], {
      queryParams: {
        city: criteria.city,
        start_date: criteria.start_date,
        end_date: criteria.end_date,
      },
    });
  }
}
