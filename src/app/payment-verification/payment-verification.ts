import { Component, signal, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppHeader } from '../shared/components/layout/app-header/app-header';
import { PageContainer } from '../shared/components/layout/page-container/page-container';
import { AppCard } from '../shared/components/layout/app-card/app-card';
import { PaymentStatusBadge } from '../shared/components/data/payment-status-badge/payment-status-badge';
import { PaymentAutocomplete } from '../shared/components/ui/payment-autocomplete/payment-autocomplete';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PaymentService } from '../shared/services/payment.service';
import { Payment, PaymentVerification as PaymentVerificationResult } from '../shared/models/payment.model';

@Component({
  selector: 'app-payment-verification',
  imports: [
    CommonModule,
    FormsModule,
    AppHeader,
    PageContainer,
    AppCard,
    PaymentStatusBadge,
    PaymentAutocomplete,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './payment-verification.html',
  styleUrl: './payment-verification.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentVerification implements OnDestroy {
  confirmationNumber = signal<string>('');
  verificationResult = signal<PaymentVerificationResult | null>(null);
  searched = signal<boolean>(false);
  loading = signal<boolean>(false);
  
  searchQuery: string = '';
  paymentSuggestions: Payment[] = [];
  searchLoading: boolean = false;

  constructor(
    private paymentService: PaymentService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location
  ) {}

  ngOnDestroy() {
    // El componente PaymentAutocomplete maneja su propio timeout
  }

  get isLoading() {
    return this.loading();
  }

  get result() {
    return this.verificationResult();
  }

  get payment() {
    return this.result?.pago;
  }

  trackByPaymentId(index: number, payment: Payment): number {
    return payment.id;
  }

  onSearch(query: string) {
    const trimmedQuery = query?.trim() || '';
    
    if (trimmedQuery.length < 1) {
      this.paymentSuggestions = [];
      this.searchLoading = false;
      this.cdr.markForCheck();
      return;
    }

    // Si tiene menos de 3 caracteres, el backend retornará vacío
    // No mostrar loading para evitar confusión
    if (trimmedQuery.length < 3) {
      this.paymentSuggestions = [];
      this.searchLoading = false;
      this.cdr.markForCheck();
      return;
    }

    // Mostrar loading solo si tiene 3+ caracteres
    this.searchLoading = true;
    this.cdr.markForCheck();

    this.paymentService.searchByConfirmation(trimmedQuery, 10).subscribe({
      next: (payments: Payment[]) => {
        this.paymentSuggestions = payments ? [...payments] : [];
        this.searchLoading = false;
        this.cdr.detectChanges(); // Actualización inmediata
      },
      error: (error) => {
        console.error('Error en búsqueda de pagos:', error);
        this.paymentSuggestions = [];
        this.searchLoading = false;
        this.cdr.detectChanges(); // Actualización inmediata
      }
    });
  }

  onPaymentSelect(payment: Payment) {
    
    if (!payment || !payment.id) {
      return;
    }

    this.searchQuery = payment.confirmationNumber || '';
    this.confirmationNumber.set(payment.confirmationNumber || '');
    this.searched.set(true);
    
    // El endpoint de búsqueda ya devuelve toda la información necesaria
    // Usar el pago directamente sin hacer getById para evitar delay
    this.verificationResult.set({
      encontrado: true,
      pago: payment,
      mensaje: 'Pago encontrado exitosamente'
    });
    this.loading.set(false);
    this.cdr.detectChanges();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Pago Encontrado',
      detail: 'Pago verificado exitosamente'
    });
  }

  onPrint() {
    window.print();
  }

  onReportProblem() {
    this.messageService.add({
      severity: 'info',
      summary: 'Reportar Problema',
      detail: 'Funcionalidad en desarrollo'
    });
  }

  onCancel() {
    this.location.back();
  }
}
