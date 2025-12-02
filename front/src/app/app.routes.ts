import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Announcement } from './pages/announcement/announcement';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Accueil',
  },
  {
    path: 'annonce',
    component: Announcement,
    title: 'Annonces',
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: Login,
    title: 'Connexion',
  },
  {
    path: 'register',
    component: Register,
    title: 'Inscription',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
