import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { OrderDetail } from '../../../models/provider.model';
import { OrderService } from '../../../services/order.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AppCard } from '../../layout/app-card/app-card';

@Component({
  selector: 'app-order-detail-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, ToastModule, AppCard],
  providers: [MessageService],
  templateUrl: './order-detail-dialog.html',
  styleUrl: './order-detail-dialog.scss'
})
export class OrderDetailDialog {
  _visible = signal(false);
  _orderId = signal<number | null>(null);
  order = signal<OrderDetail | null>(null);
  loading = signal<boolean>(false);

  @Input()
  set visible(value: boolean) {
    this._visible.set(value);
    if (value && this._orderId()) {
      this.loadOrderDetail();
    }
  }
  get visible(): boolean {
    return this._visible();
  }

  @Input()
  set orderId(value: number | null) {
    this._orderId.set(value);
    if (value && this._visible()) {
      this.loadOrderDetail();
    }
  }
  get orderId(): number | null {
    return this._orderId();
  }

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onClose = new EventEmitter<void>();

  orderTitle = computed(() => {
    const order = this.order();
    return order ? `Orden #${order.id}` : 'Detalle de Orden';
  });

  constructor(
    private orderService: OrderService,
    private messageService: MessageService
  ) {}

  private loadOrderDetail() {
    const orderId = this._orderId();
    if (!orderId) {
      return;
    }

    this.loading.set(true);
    this.orderService.getById(orderId).subscribe({
      next: (orderDetail) => {
        this.order.set(orderDetail);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error al cargar el detalle de la orden'
        });
        this.loading.set(false);
        this.onDialogClose();
      }
    });
  }

  onDialogClose() {
    this._visible.set(false);
    this.order.set(null);
    this.visibleChange.emit(false);
    this.onClose.emit();
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendiente',
      'PARTIALLY_PAID': 'Parcialmente Pagado',
      'PAID': 'Pagado',
      'OVERDUE': 'Vencido'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'PARTIALLY_PAID': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'PAID': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'OVERDUE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }

  onPrint() {
    window.print();
  }

  onShare() {
    // Implementar funcionalidad de compartir si es necesario
    this.messageService.add({
      severity: 'info',
      summary: 'Compartir',
      detail: 'Funcionalidad de compartir en desarrollo'
    });
  }
}

