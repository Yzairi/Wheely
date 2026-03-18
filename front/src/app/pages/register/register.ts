import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  message = '';
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
      this.googleError = 'Inscription Google échouée.';
    }
  }

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
    window.location.href = this.auth.googleRedirectUrl();
  }
}
