import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  message = '';

  submit() {
    if (!this.form.valid) return;

    this.auth.register(this.form.value as { email: string; password: string }).subscribe({
      next: () => {
        this.message = 'Compte créé ✔️';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.message = 'Erreur : ' + err.error;
      },
    });
  }

  signupWithGoogle(): void {
    this.message = 'Inscription Google en préparation 🚧';
  }
}
