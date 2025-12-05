import { Component, OnInit, inject } from '@angular/core';
import { CarService } from '../../services/car_services/car';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-car',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './car.html',
  styleUrls: ['./car.css'],
})
export class Car implements OnInit {
  private carService = inject(CarService);
  protected readonly cars = this.carService.cars;

  ngOnInit(): void {
    this.carService.fetchMyCars().subscribe();
  }
}
