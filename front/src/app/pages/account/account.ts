import { Component, inject } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-account',
  imports: [RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  private auth = inject(Auth);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
