import { Component, signal, ChangeDetectionStrategy, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppHeader } from '../shared/components/layout/app-header/app-header';
import { PageContainer } from '../shared/components/layout/page-container/page-container';
import { AppCard } from '../shared/components/layout/app-card/app-card';
import { SupplierAutocomplete } from '../shared/components/ui/supplier-autocomplete/supplier-autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { SupplierService } from '../shared/services/supplier.service';
import { OrderService } from '../shared/services/order.service';
import { ReportService } from '../shared/services/report.service';
import { Provider, Debt } from '../shared/models/provider.model';
import { Location } from '@angular/common';
import { ConfirmDialog } from '../shared/components/ui/confirm-dialog/confirm-dialog';
import { AuthContext } from '../contexts/auth.context';

@Component({
  selector: 'app-locate-provider',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    AppHeader,
    PageContainer,
    AppCard,
    SupplierAutocomplete,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    ButtonModule,
    MenuModule,
    TooltipModule,
    ToastModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    DatePipe,
    ConfirmDialog
  ],
  providers: [MessageService],
  templateUrl: './locate-provider.html',
  styleUrl: './locate-provider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocateProvider {
  searchQuery: string = '';
  supplierSuggestions: Provider[] = [];
  searchLoading: boolean = false;
  selectedProvider = signal<Provider | null>(null);
  debts = signal<Debt[]>([]);
  
  totalDebt = computed(() => {
    const debts = this.debts();
    if (debts.length === 0 && this.selectedProvider()) {
      return this.selectedProvider()?.totalDebt || 0;
    }
    return debts.reduce((sum, debt) => sum + (debt.remainingAmount || 0), 0);
  });

  orderForm: FormGroup;
  loading = signal<boolean>(false);
  editingOrderId = signal<number | null>(null);
  fechaVencimiento = signal<Date | null>(null);
  showConfirmDeleteProvider = signal<boolean>(false);
  providerToDelete = signal<Provider | null>(null);
  showConfirmDeleteDebt = signal<boolean>(false);
  debtToDelete = signal<Debt | null>(null);

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private orderService: OrderService,
    private reportService: ReportService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private authContext: AuthContext
  ) {
    this.orderForm = this.fb.group({
      monto: ['', [Validators.required, Validators.min(0.01)]],
      fechaDespacho: ['', [Validators.required]],
      diasCredito: [30, [Validators.required, Validators.min(0)]]
    });

    this.orderForm.get('fechaDespacho')?.valueChanges.subscribe(() => this.calculateDueDate());
    this.orderForm.get('diasCredito')?.valueChanges.subscribe(() => this.calculateDueDate());
  }

  private calculateDueDate(): void {
    const fechaDespacho = this.orderForm.get('fechaDespacho')?.value;
    const diasCredito = this.orderForm.get('diasCredito')?.value ?? 0;
    if (fechaDespacho && diasCredito !== '' && diasCredito !== null) {
      const fecha = new Date(fechaDespacho);
      fecha.setDate(fecha.getDate() + Number(diasCredito));
      this.fechaVencimiento.set(fecha);
    } else {
      this.fechaVencimiento.set(null);
    }
  }

  get provider() {
    return this.selectedProvider();
  }

  get isLoading() {
    return this.loading();
  }

  /** Los cajeros no pueden editar/eliminar distribuidor ni deudas */
  get canEditProviderAndDebts(): boolean {
    return !this.authContext.hasRole('CAJERO');
  }

  onSearch(query: string) {
    const trimmedQuery = query?.trim() || '';
    
    if (trimmedQuery.length < 1) {
      // Si no hay query, cargar todos los proveedores
      this.loadAllSuppliers();
      return;
    }

    // Mostrar loading
    this.searchLoading = true;
    this.cdr.markForCheck();

    this.supplierService.search(trimmedQuery, 1, 10).subscribe({
      next: (response) => {
        this.supplierSuggestions = response.data || [];
        this.searchLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error en búsqueda de distribuidores:', error);
        this.supplierSuggestions = [];
        this.searchLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFocus() {
    // Cuando se hace focus en el input, cargar todos los proveedores si no hay query
    if (!this.searchQuery || this.searchQuery.trim().length === 0) {
      this.loadAllSuppliers();
    }
  }

  loadAllSuppliers() {
    // Cargar todos los proveedores (con un límite razonable)
    this.searchLoading = true;
    this.cdr.markForCheck();

    this.supplierService.list({ page: 1, limit: 50 }).subscribe({
      next: (response) => {
        this.supplierSuggestions = response.data || [];
        this.searchLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
        this.supplierSuggestions = [];
        this.searchLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSupplierSelect(supplier: Provider) {
    if (!supplier || !supplier.id) {
      return;
    }

    this.searchQuery = supplier.companyName || '';
    this.loading.set(true);
    this.cdr.markForCheck();
    
    // Obtener información completa del distribuidor con todas sus deudas
    this.reportService.getSupplierDetailed(supplier.id).subscribe({
      next: (report) => {
        this.selectedProvider.set(report.supplier);
        this.debts.set(report.debts || []);
        
        this.loading.set(false);
        this.cdr.detectChanges();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Distribuidor Encontrado',
          detail: `Se encontró: ${report.supplier.companyName}`
        });
      },
      error: (error) => {
        console.error('Error al obtener detalles del distribuidor:', error);
        // Usar el supplier básico si falla la petición completa
        this.selectedProvider.set(supplier);
        this.debts.set([]);
        this.loading.set(false);
        this.cdr.detectChanges();
        
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar todos los detalles del distribuidor'
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'PARTIALLY_PAID': 'Parcialmente Pagado',
      'PAID': 'Pagado',
      'OVERDUE': 'Vencido'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger'> = {
      'PENDING': 'warn',
      'PARTIALLY_PAID': 'info',
      'PAID': 'success',
      'OVERDUE': 'danger'
    };
    return severities[status] || 'secondary';
  }

  getActivePaymentsCount(debt: Debt): number {
    if (!debt.payments) {
      return 0;
    }
    return debt.payments.filter(p => !p.deleted).length;
  }

  getDueDateStatus(debt: Debt): 'safe' | 'warning' | 'danger' {
    if (!debt.dueDate) {
      return 'safe';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(debt.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Rojo: vencida o menos de 7 días
    if (diffDays < 7) {
      return 'danger';
    }
    
    // Amarillo: entre 7 y 30 días
    if (diffDays <= 30) {
      return 'warning';
    }
    
    // Verde: más de 30 días
    return 'safe';
  }

  getDueDateColorClass(debt: Debt): string {
    const status = this.getDueDateStatus(debt);
    switch (status) {
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'safe':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  getDueDateIconClass(debt: Debt): string {
    const status = this.getDueDateStatus(debt);
    switch (status) {
      case 'danger':
        return 'pi-exclamation-circle text-red-500';
      case 'warning':
        return 'pi-exclamation-triangle text-yellow-500';
      case 'safe':
        return 'pi-check-circle text-green-500';
      default:
        return 'pi-calendar text-gray-400';
    }
  }

  getDaysUntilDue(debt: Debt): number {
    if (!debt.dueDate) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(debt.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  onEditDebt(debt: Debt): void {
    if (!this.canEditProviderAndDebts) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'No tiene permisos para editar deudas.'
      });
      return;
    }
    if (!debt.orderId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Esta deuda no tiene una orden asociada'
      });
      return;
    }
    this.orderService.getById(debt.orderId).subscribe({
      next: (order) => {
        this.orderForm.patchValue({
          fechaDespacho: order.dispatchDate,
          diasCredito: order.creditDays,
          monto: order.amount
        });
        this.editingOrderId.set(order.id);
        this.calculateDueDate();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar pedido para editar:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el pedido para editar'
        });
      }
    });
  }

  onViewOrderDetail(debt: Debt) {
    if (debt.orderId) {
      // Navegar al reporte detallado con el orderId
      this.router.navigate(['/reports/detailed'], { 
        queryParams: { 
          providerId: this.provider?.id,
          orderId: debt.orderId 
        } 
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Esta deuda no tiene una orden asociada'
      });
    }
  }

  onExportReport() {
    if (!this.provider) {
      return;
    }

    this.loading.set(true);
    this.reportService.exportReport(this.provider.id).subscribe({
      next: (data) => {
        // Crear un blob y descargar el archivo
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${this.provider?.companyName}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Reporte exportado correctamente'
        });
      },
      error: (error) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error al exportar el reporte'
        });
      }
    });
  }

  onAddOrder() {
    const orderId = this.editingOrderId();
    if (orderId !== null && !this.canEditProviderAndDebts) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'No tiene permisos para editar deudas.'
      });
      return;
    }
    const currentProvider = this.provider;
    if (!this.orderForm.valid || !currentProvider) {
      Object.keys(this.orderForm.controls).forEach(key => {
        this.orderForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    const formValue = this.orderForm.value;
    const dispatchDate = formValue.fechaDespacho instanceof Date
      ? formValue.fechaDespacho
      : new Date(formValue.fechaDespacho);

    const onSuccess = () => {
      this.loading.set(false);
      this.editingOrderId.set(null);
      this.fechaVencimiento.set(null);
      this.orderForm.reset({ diasCredito: 30 });
      this.reportService.getSupplierDetailed(currentProvider.id).subscribe({
        next: (report) => {
          this.selectedProvider.set(report.supplier);
          this.debts.set(report.debts || []);
          this.cdr.detectChanges();
        }
      });
    };

    if (orderId !== null) {
      this.orderService.update(orderId, {
        dispatchDate,
        creditDays: formValue.diasCredito,
        amount: formValue.monto
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pedido actualizado correctamente'
          });
          onSuccess();
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error al actualizar pedido:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al actualizar el pedido'
          });
        }
      });
    } else {
      this.orderService.create({
        supplierId: currentProvider.id,
        amount: formValue.monto,
        dispatchDate,
        creditDays: formValue.diasCredito
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pedido agregado correctamente'
          });
          onSuccess();
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error al agregar pedido:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al agregar el pedido'
          });
        }
      });
    }
  }

  onCancel() {
    this.editingOrderId.set(null);
    this.fechaVencimiento.set(null);
    this.orderForm.reset({ diasCredito: 30 });
  }

  onBackToDashboard() {
    this.location.back();
  }

  getProviderMenuItems(): MenuItem[] {
    return [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.onEditProvider()
      },
      {
        separator: true
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'text-red-600',
        command: () => this.onDeleteProvider()
      }
    ];
  }

  getDebtMenuItems(debt: Debt): MenuItem[] {
    const items: MenuItem[] = [];
    if (debt.orderId) {
      items.push({
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.onEditDebt(debt)
      });
    }
    items.push(
      { separator: true },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'text-red-600',
        command: () => this.onDeleteDebt(debt)
      }
    );
    return items;
  }

  onEditProvider() {
    if (!this.canEditProviderAndDebts) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'No tiene permisos para editar distribuidores.'
      });
      return;
    }
    const currentProvider = this.provider;
    if (currentProvider?.id) {
      this.router.navigate(['/providers/register'], {
        queryParams: { editId: currentProvider.id }
      });
    }
  }

  onDeleteProvider(): void {
    if (!this.canEditProviderAndDebts) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'No tiene permisos para eliminar distribuidores.'
      });
      return;
    }
    const currentProvider = this.provider;
    if (currentProvider) {
      this.providerToDelete.set(currentProvider);
      this.showConfirmDeleteProvider.set(true);
    }
  }

  onConfirmDeleteProvider(): void {
    const provider = this.providerToDelete();
    this.providerToDelete.set(null);
    this.showConfirmDeleteProvider.set(false);
    if (!provider?.id) {
      return;
    }
    this.loading.set(true);
    this.supplierService.delete(provider.id).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Distribuidor eliminado correctamente.'
        });
        this.selectedProvider.set(null);
        this.debts.set([]);
        this.editingOrderId.set(null);
        this.fechaVencimiento.set(null);
        this.orderForm.reset({ diasCredito: 30 });
        // Refrescar sugerencias del autocomplete para que no aparezcan proveedores eliminados
        this.onSearch(this.searchQuery);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error al eliminar el distribuidor.'
        });
      }
    });
  }

  onCancelDeleteProvider(): void {
    this.providerToDelete.set(null);
    this.showConfirmDeleteProvider.set(false);
  }

  onDeleteDebt(debt: Debt): void {
    if (!this.canEditProviderAndDebts) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'No tiene permisos para eliminar deudas.'
      });
      return;
    }
    this.debtToDelete.set(debt);
    this.showConfirmDeleteDebt.set(true);
  }

  onConfirmDeleteDebt(): void {
    const debt = this.debtToDelete();
    this.debtToDelete.set(null);
    this.showConfirmDeleteDebt.set(false);
    // De momento solo cerramos el modal; la eliminación por API se implementará después
    if (debt) {
      this.messageService.add({
        severity: 'info',
        summary: 'Eliminar deuda',
        detail: 'La eliminación de deudas estará disponible próximamente.'
      });
    }
  }

  onCancelDeleteDebt(): void {
    this.debtToDelete.set(null);
    this.showConfirmDeleteDebt.set(false);
  }
}
