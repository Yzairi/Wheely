import { Routes } from '@angular/router';
import { HomePageComponent } from '../pages/home-page/home-page.component';
import { AnnouncementPage } from '../pages/announcement-page/announcement-page';
import { LoginPage } from '../pages/login-page/login-page';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: 'Accueil',
  },
  {
    path: 'annonce',
    component: AnnouncementPage,
    title: 'Annonces',
  },
  {
    path: 'login',
    component: LoginPage,
    title: 'Connexion',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
