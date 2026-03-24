import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, UserProfile } from '../../services/auth';

@Component({
  selector: 'app-my-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-info.html',
  styleUrl: './my-info.css',
})
export class MyInfo implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  profile = signal<UserProfile | null>(null);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  form = this.fb.group({
    username: ['', Validators.required],
    first_name: [''],
    last_name: [''],
    email: ['', [Validators.required, Validators.email]],
    phone_number: [''],
  });

  get fullName(): string {
    const p = this.profile();
    if (!p) return '';
    if (p.first_name && p.last_name) {
      return `${p.first_name} ${p.last_name}`;
    }
    return p.username || p.email.split('@')[0];
  }

  goBack() {
    this.router.navigate(['/account']);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const value = this.form.getRawValue();
    const payload = {
      username: value.username ?? '',
      first_name: value.first_name ?? '',
      last_name: value.last_name ?? '',
      email: value.email ?? '',
      phone_number: value.phone_number?.trim() || null,
    };

    this.auth.updateProfile(payload).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.patchForm(data);
        this.successMessage.set('Informations mises à jour.');
        this.saving.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.formatError(error));
        this.saving.set(false);
      },
    });
  }

  ngOnInit(): void {
    this.auth.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.patchForm(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.errorMessage.set('Impossible de charger le profil.');
        this.loading.set(false);
      },
    });
  }

  private patchForm(data: UserProfile): void {
    this.form.patchValue({
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_number: data.phone_number ?? '',
    });
  }

  private formatError(error: {
    error?: Record<string, string[] | string>;
  }): string {
    const data = error.error;
    if (!data || typeof data !== 'object') {
      return 'La mise à jour a échoué.';
    }

    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length > 0) {
        return value[0];
      }
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return 'La mise à jour a échoué.';
  }
}
