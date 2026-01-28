import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-container.html',
  styleUrl: './page-container.scss'
})
export class PageContainer {
  @Input() maxWidth: string = 'max-w-full';
  @Input() padding: boolean = true;
}
