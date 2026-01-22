import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  error = '';
  googleError = '';

  ngOnInit(): void {
    const access = this.route.snapshot.queryParamMap.get('access');
    const refresh = this.route.snapshot.queryParamMap.get('refresh');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (access && refresh) {
      this.auth.saveTokens(access, refresh);
      this.router.navigate(['/account'], { replaceUrl: true });
      return;
    }

    if (error) {
      this.googleError = 'Connexion Google échouée.';
    }
  }

  submit() {
    if (!this.form.valid) return;

    this.auth.login(this.form.value as { email: string; password: string }).subscribe({
      next: () => this.router.navigate(['/account']),
      error: () => (this.error = 'Identifiants incorrects'),
    });
  }

  loginWithGoogle(): void {
    window.location.href = this.auth.googleRedirectUrl();
  }
}
