import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss'
})
export class StatCard {
  @Input() label!: string;
  @Input() value!: string | number;
  @Input() icon?: string;
  @Input() iconColor: 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'red' = 'blue';
  /** Si true, la tarjeta es clickeable y muestra cursor pointer */
  @Input() clickable = false;
  @Output() cardClick = new EventEmitter<void>();
}
