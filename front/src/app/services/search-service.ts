import { Injectable, signal } from '@angular/core';

export interface SearchCriteria {
  /** Libellé affiché (adresse choisie dans l’autocomplete) */
  address: string;
  lat: number;
  lng: number;
  /** Rayon de recherche en km */
  radius_km: number;
  start_date: string;
  end_date: string;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  criteria = signal<SearchCriteria | null>(null);

  setCriteria(value: SearchCriteria) {
    this.criteria.set(value);
  }

  clear() {
    this.criteria.set(null);
  }
}
