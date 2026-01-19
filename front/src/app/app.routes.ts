import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Announcement } from './pages/announcement/announcement';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Account } from './pages/account/account';
import { authGuard } from './guards/auth-guard';
import { Car } from './pages/car/car';
import { CarFormComponent } from './components/car-form/car-form';

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
    path: 'account',
    component: Account,
    title: 'Mon compte',
    canActivate: [authGuard],
  },
  {
    path: 'car',
    component: Car,
    title: 'Voitures',
    canActivate: [authGuard],
  },
  {
    path: 'car/add',
    component: CarFormComponent,
    title: 'Ajouter une voiture',
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
