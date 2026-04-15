import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Auth } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private auth = inject(Auth);

  protected readonly title = signal('front');

  protected isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }
}
