import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string;
  email_verified: boolean;
}

@Component({
  selector: 'app-my-info',
  standalone: true,
  imports: [],
  templateUrl: './my-info.html',
  styleUrl: './my-info.css',
})
export class MyInfo implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  profile = signal<UserProfile | null>(null);
  loading = signal<boolean>(true);

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

  ngOnInit(): void {
    this.auth.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.loading.set(false);
      },
    });
  }
}
