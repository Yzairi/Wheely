import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private auth = inject(Auth);

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout();
  }
}
