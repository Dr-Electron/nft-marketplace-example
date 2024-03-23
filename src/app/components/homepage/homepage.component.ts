import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EventLogService } from 'src/app/services/event.service';
import { ProductsComponent } from '../products/products.component';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, ProductsComponent],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
})
export class HomepageComponent {
  constructor(public log: EventLogService) {}
}
