import { Component, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppHeader } from '../shared/components/layout/app-header/app-header';
import { PageContainer } from '../shared/components/layout/page-container/page-container';
import { AppCard } from '../shared/components/layout/app-card/app-card';
import { SupplierAutocomplete } from '../shared/components/ui/supplier-autocomplete/supplier-autocomplete';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SupplierService } from '../shared/services/supplier.service';
import { Provider } from '../shared/models/provider.model';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppHeader,
    PageContainer,
    AppCard,
    SupplierAutocomplete,
    ButtonModule,
    TagModule,
    ToastModule,
    DatePipe
  ],
  providers: [MessageService],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierList implements OnInit {
  selectedSupplier = signal<Provider | null>(null);
  supplierSuggestions: Provider[] = [];
  searchLoading: boolean = false;
  searchQuery: string = '';

  constructor(
    private supplierService: SupplierService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit() {
    // Componente inicializado
  }

  onSearch(query: string) {
    const trimmedQuery = query?.trim() || '';
    
    if (trimmedQuery.length < 1) {
      this.supplierSuggestions = [];
      this.searchLoading = false;
      this.cdr.markForCheck();
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

  onSupplierSelect(supplier: Provider) {
    if (!supplier || !supplier.id) {
      return;
    }

    this.searchQuery = supplier.companyName || '';
    
    // Obtener información completa del distribuidor
    this.supplierService.getById(supplier.id).subscribe({
      next: (fullSupplier) => {
        this.selectedSupplier.set(fullSupplier);
        this.cdr.detectChanges();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Distribuidor Encontrado',
          detail: 'Información cargada exitosamente'
        });
      },
      error: (error) => {
        console.error('Error al obtener detalles del distribuidor:', error);
        // Usar el supplier básico si falla la petición completa
        this.selectedSupplier.set(supplier);
        this.cdr.detectChanges();
        
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar todos los detalles del distribuidor'
        });
      }
    });
  }

  getStatusSeverity(status: 'PENDING' | 'COMPLETED'): 'success' | 'warn' {
    return status === 'PENDING' ? 'warn' : 'success';
  }

  getStatusLabel(status: 'PENDING' | 'COMPLETED'): string {
    return status === 'PENDING' ? 'Pendiente' : 'Completado';
  }

  onCancel() {
    this.location.back();
  }

  onViewDetails() {
    const supplier = this.selectedSupplier();
    if (supplier) {
      this.router.navigate(['/reports/detailed'], {
        queryParams: { providerId: supplier.id }
      });
    }
  }
}

