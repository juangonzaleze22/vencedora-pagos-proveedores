import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, ButtonModule],
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.scss'
})
export class DateRangePicker implements OnChanges {
  @Input() value: DateRange = { start: null, end: null };
  @Input() selectedPeriod: 'today' | 'week' | 'month' | 'all' = 'all';
  @Output() valueChange = new EventEmitter<DateRange>();
  @Output() quickSelect = new EventEmitter<string>();

  dateRange: Date[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && this.value.start && this.value.end) {
      this.dateRange = [this.value.start, this.value.end];
    }
  }

  onDateSelect(date: Date | Date[]) {
    if (Array.isArray(date) && date.length === 2) {
      this.value = { start: date[0], end: date[1] };
      this.valueChange.emit(this.value);
    } else if (date instanceof Date) {
      // Single date selected, update the range accordingly
      if (!this.value.start) {
        this.value = { start: date, end: null };
      } else if (!this.value.end) {
        this.value = { start: this.value.start, end: date };
        this.valueChange.emit(this.value);
      }
    }
  }

  onQuickSelect(period: 'today' | 'week' | 'month' | 'all') {
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (period) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        end = new Date(today);
        break;
      case 'month':
        // Primer día del mes actual
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        // Último día del mes actual (día 0 del mes siguiente = último día del mes)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'all':
        start = null;
        end = null;
        break;
    }

    this.value = { start, end };
    this.valueChange.emit(this.value);
    this.quickSelect.emit(period);
  }
}
