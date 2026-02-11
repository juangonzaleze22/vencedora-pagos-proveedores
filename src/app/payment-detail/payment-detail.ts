import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Payment } from '../shared/models/payment.model';
import { PaymentService } from '../shared/services/payment.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AppHeader } from '../shared/components/layout/app-header/app-header';
import { PageContainer } from '../shared/components/layout/page-container/page-container';
import { AppCard } from '../shared/components/layout/app-card/app-card';
import { LazyImage } from '../shared/components/ui/lazy-image/lazy-image';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    AppHeader,
    PageContainer,
    AppCard,
    LazyImage
  ],
  providers: [MessageService],
  templateUrl: './payment-detail.html',
  styleUrl: './payment-detail.scss'
})
export class PaymentDetail implements OnInit {
  payment = signal<Payment | null>(null);
  loading = signal<boolean>(false);
  paymentId: number | null = null;

  paymentTitle = computed(() => {
    const payment = this.payment();
    return payment ? `Pago #${payment.id}` : 'Detalle de Pago';
  });

  paymentStatus = computed(() => {
    const payment = this.payment();
    if (!payment) return 'unknown';
    if (payment.deleted) return 'deleted';
    if (payment.verified) return 'verified';
    return 'pending';
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private paymentService: PaymentService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.paymentId = +id;
        this.loadPaymentDetail();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'ID de pago no válido'
        });
        this.goBack();
      }
    });
  }

  private loadPaymentDetail() {
    if (!this.paymentId) {
      return;
    }

    this.loading.set(true);
    this.paymentService.getById(this.paymentId).subscribe({
      next: (paymentDetail) => {
        this.payment.set(paymentDetail);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error al cargar el detalle del pago'
        });
        this.loading.set(false);
        setTimeout(() => {
          this.goBack();
        }, 2000);
      }
    });
  }

  goBack() {
    // Opción B: reconstruir el reporte desde los query params
    const qp = this.route.snapshot.queryParams || {};
    if (qp['providerId'] || qp['start'] || qp['end'] || qp['debtId']) {
      this.router.navigate(['/reports/detailed'], { queryParams: qp });
      return;
    }

    // Fallback: historial del navegador
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/reports/detailed']);
  }

  getPaymentMethodLabel(method: string): string {
    return method;
  }

  getPaymentMethodIcon(method: string): string {
    const iconMap: Record<string, string> = {
      'Zelle': 'pi pi-wallet',
      'Transferencia': 'pi pi-credit-card',
      'Efectivo': 'pi pi-money-bill'
    };
    return iconMap[method] || 'pi pi-circle';
  }

  getDebtStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendiente',
      'PARTIALLY_PAID': 'Parcialmente Pagado',
      'PAID': 'Pagado',
      'OVERDUE': 'Vencido'
    };
    return statusMap[status] || status;
  }

  getDebtStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'PARTIALLY_PAID': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'PAID': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'OVERDUE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  onPrint() {
    window.print();
  }

  onShare() {
    const payment = this.payment();
    if (!payment) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se puede compartir un pago que no existe'
      });
      return;
    }

    // Validar que el pago no esté eliminado
    if (payment.deleted) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Pago eliminado',
        detail: 'No se puede compartir un pago que ha sido eliminado',
        life: 3000
      });
      return;
    }

    // Llamar al servicio para compartir el pago
    this.paymentService.share(payment.id).subscribe({
      next: (response) => {
        // Abrir WhatsApp con la URL generada
        if (response.whatsappUrl) {
          window.open(response.whatsappUrl, '_blank');
        }

        // Actualizar el pago local con los nuevos valores
        this.payment.set(response.payment);

        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Pago compartido',
          detail: 'El comprobante se ha compartido exitosamente por WhatsApp',
          life: 3000
        });
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Error al compartir el pago';
        this.messageService.add({
          severity: 'error',
          summary: 'Error al compartir',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  onDownloadReceipt() {
    const payment = this.payment();
    if (payment?.receiptFile) {
      const link = document.createElement('a');
      link.href = payment.receiptFile;
      link.download = `comprobante_PAG-${payment.id}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  formatDateSpanish(date: Date): string {
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  formatDateTimeSpanish(date: Date): string {
    const dateStr = date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${dateStr}, ${timeStr}`;
  }
}

