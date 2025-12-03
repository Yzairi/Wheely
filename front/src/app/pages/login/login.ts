import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  error = '';

  submit() {
    if (!this.form.valid) return;

    this.auth.login(this.form.value as { email: string; password: string }).subscribe({
      next: () => this.router.navigate(['/account']),
      error: () => (this.error = 'Identifiants incorrects'),
    });
  }

  loginWithGoogle(): void {
    this.error = 'Connexion Google en préparation 🚧';
  }
}
