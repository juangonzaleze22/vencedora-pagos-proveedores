import { Component, Input } from '@angular/core';
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
}
