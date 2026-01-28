import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-action-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './action-card.html',
  styleUrl: './action-card.scss'
})
export class ActionCard {
  @Input() title!: string;
  @Input() description!: string;
  @Input() icon!: string;
  @Input() iconColor: 'blue' | 'green' | 'indigo' | 'purple' | 'orange' = 'blue';
  @Input() route?: string;
  @Input() linkText?: string;
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    this.clicked.emit();
  }
}
