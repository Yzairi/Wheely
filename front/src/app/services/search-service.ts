import { Injectable, signal } from '@angular/core';

export interface SearchCriteria {
  city: string;
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
