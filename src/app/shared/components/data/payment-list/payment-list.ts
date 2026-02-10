import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { LazyImage } from '../../ui/lazy-image/lazy-image';
import { Payment } from '../../../models/payment.model';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    MenuModule,
    TooltipModule,
    LazyImage
  ],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss'
})
export class PaymentList {
  @Input() payments: Payment[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No hay pagos registrados para esta deuda';
  /** true = solo botón Ver detalle; false = menú de acciones (requiere menuItemsProvider) */
  @Input() viewOnly = false;
  /** Para viewOnly=false: función que devuelve los ítems del menú por pago */
  @Input() menuItemsProvider?: (payment: Payment) => MenuItem[];

  @Output() viewDetail = new EventEmitter<Payment>();

  getDeletedPaymentTooltip(payment: Payment): string {
    const parts: string[] = ['Eliminado'];
    if (payment.deletedAt) {
      parts.push(new Date(payment.deletedAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
    if (payment.deleteReason) {
      parts.push(payment.deleteReason);
    }
    return parts.join(' · ');
  }
}
