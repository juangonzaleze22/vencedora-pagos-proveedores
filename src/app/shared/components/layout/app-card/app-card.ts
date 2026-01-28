import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-app-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './app-card.html',
  styleUrl: './app-card.scss'
})
export class AppCard {
  @Input() header?: string;
  @Input() subheader?: string;
  @Input() styleClass?: string;
}
