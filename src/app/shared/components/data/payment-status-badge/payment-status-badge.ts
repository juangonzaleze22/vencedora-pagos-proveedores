import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

export type PaymentStatus = 'verified' | 'pending' | 'not-found' | 'error';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface StatusConfig {
  label: string;
  severity: TagSeverity;
  icon: string;
}

@Component({
  selector: 'app-payment-status-badge',
  standalone: true,
  imports: [CommonModule, TagModule],
  templateUrl: './payment-status-badge.html',
  styleUrl: './payment-status-badge.scss'
})
export class PaymentStatusBadge {
  @Input() status: PaymentStatus = 'pending';

  get statusConfig(): StatusConfig {
    switch (this.status) {
      case 'verified':
        return {
          label: 'Pago Verificado',
          severity: 'success' as TagSeverity,
          icon: 'pi pi-check-circle'
        };
      case 'pending':
        return {
          label: 'Pendiente',
          severity: 'warn' as TagSeverity,
          icon: 'pi pi-clock'
        };
      case 'not-found':
        return {
          label: 'No Encontrado',
          severity: 'danger' as TagSeverity,
          icon: 'pi pi-times-circle'
        };
      case 'error':
        return {
          label: 'Error',
          severity: 'danger' as TagSeverity,
          icon: 'pi pi-exclamation-triangle'
        };
      default:
        return {
          label: 'Desconocido',
          severity: 'secondary' as TagSeverity,
          icon: 'pi pi-question'
        };
    }
  }
}
