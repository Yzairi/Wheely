import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Auth {
  private apiUrl = 'http://localhost:8000/api/auth';

  constructor(private http: HttpClient) {}

  register(data: { email: string; password: string }) {
    return this.http.post(`${this.apiUrl}/register/`, data);
  }

  login(data: { email: string; password: string }) {
    return this.http.post(`${this.apiUrl}/login/`, data).pipe(
      tap((res: any) => {
        this.saveTokens(res.access, res.refresh);
      })
    );
  }

  refresh(refresh: string) {
    return this.http.post(`${this.apiUrl}/refresh/`, { refresh });
  }

  saveTokens(access: string, refresh: string) {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
  }

  logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }

  get accessToken(): string | null {
    return localStorage.getItem('access');
  }

  get refreshToken(): string | null {
    return localStorage.getItem('refresh');
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }
}
