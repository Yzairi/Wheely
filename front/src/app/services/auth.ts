import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Auth {
  private apiUrl = 'http://localhost:8000/api/auth';
  private http = inject(HttpClient);

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

  googleLogin(idToken: string) {
    return this.http.post(`${this.apiUrl}/google/`, { id_token: idToken }).pipe(
      tap((res: any) => {
        this.saveTokens(res.access, res.refresh);
      })
    );
  }

  googleRedirectUrl(): string {
    return `${this.apiUrl}/google/login/`;
  }

  refresh() {
    const refresh = localStorage.getItem('refresh');

    return this.http.post<{ access: string }>(`${this.apiUrl}/refresh/`, { refresh }).pipe(
      tap((tokens) => {
        localStorage.setItem('access', tokens.access);
      })
    );
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

  decodeAccessToken(): { user_id?: number; [key: string]: any } | null {
    const token = this.accessToken;
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  getProfile() {
    return this.http.get<{
      id: number;
      username: string;
      email: string;
      phone_number: string | null;
      first_name: string;
      last_name: string;
      avatar_url: string;
      email_verified: boolean;
    }>(`${this.apiUrl}/profile/`);
  }
}
