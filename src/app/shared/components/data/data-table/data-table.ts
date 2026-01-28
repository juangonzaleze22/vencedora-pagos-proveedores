import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, TableModule, PaginatorModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss'
})
export class DataTable {
  @Input() data: any[] = [];
  @Input() columns: any[] = [];
  @Input() paginator: boolean = true;
  @Input() rows: number = 10;
  @Input() loading: boolean = false;
  @Input() headerTemplate?: TemplateRef<any>;
  @Input() bodyTemplate?: TemplateRef<any>;
}
