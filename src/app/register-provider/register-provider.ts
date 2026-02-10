import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppHeader } from '../shared/components/layout/app-header/app-header';
import { PageContainer } from '../shared/components/layout/page-container/page-container';
import { AppCard } from '../shared/components/layout/app-card/app-card';
import { ApiMessageDialog, ApiMessageData } from '../shared/components/ui/api-message-dialog/api-message-dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { SupplierService } from '../shared/services/supplier.service';
import { Provider } from '../shared/models/provider.model';
import { AuthContext } from '../contexts/auth.context';

@Component({
  selector: 'app-register-provider',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppHeader,
    PageContainer,
    AppCard,
    ApiMessageDialog,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    ButtonModule,
    ToastModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './register-provider.html',
  styleUrl: './register-provider.scss'
})
export class RegisterProvider implements OnInit {
  providerForm: FormGroup;
  fechaVencimiento = signal<Date | null>(null);
  loading = signal<boolean>(false);
  showMessageDialog = signal(false);
  messageData = signal<ApiMessageData | null>(null);
  isEditMode = signal<boolean>(false);
  pageTitle = signal<string>('Registro de Proveedores');
  pageSubtitle = signal<string>('Ingrese la información del nuevo proveedor y sus deudas pendientes');
  providerId = signal<number | null>(null);

  /** Máscara de teléfono venezolano: (+58) 0XXX XXX-XXXX */
  readonly PHONE_MASK_PREFIX = '(+58) ';
  readonly PHONE_EMPTY = '(+58) ';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private supplierService: SupplierService,
    private messageService: MessageService,
    private location: Location,
    private authContext: AuthContext
  ) {
    this.providerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      rif: ['', []],
      phone: [this.PHONE_EMPTY, [this.phoneValidator.bind(this)]],
      email: ['', [Validators.email]],
      deudaInicial: ['', [Validators.min(0.01)]],
      fechaDeuda: ['', []],
      diasCredito: [30, [Validators.min(0)]]
    });

    // Calcular fecha de vencimiento cuando cambien fecha deuda o días de crédito
    this.providerForm.get('fechaDeuda')?.valueChanges.subscribe(() => this.calculateDueDate());
    this.providerForm.get('diasCredito')?.valueChanges.subscribe(() => this.calculateDueDate());
  }

  /**
   * Aplica la máscara (+58) 0XXX XXX-XXXX. Solo dígitos tras el prefijo (máx. 11).
   */
  


  /** Valor con máscara para mostrar; si solo está el prefijo se considera vacío. */
  private getPhoneForPayload(phoneValue: string | null | undefined): string | null {
    const raw = (phoneValue ?? '').replace(/\D/g, '').replace(/^58/, '');
    if (raw.length === 0) return null;
    const digits = raw[0] === '0' ? raw.slice(1) : raw;
    if (digits.length < 10) return null;
    return '+58' + digits.slice(0, 10);
  }

  ngOnInit() {
    // Detectar si viene en modo edición
    this.route.queryParams.subscribe(params => {
      const editId = params['editId'];
      if (editId) {
        const id = Number(editId);
        if (!isNaN(id)) {
          // Los cajeros no pueden editar distribuidores
          if (this.authContext.hasRole('CAJERO')) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Sin permisos',
              detail: 'No tiene permisos para editar distribuidores.'
            });
            this.router.navigate(['/providers/locate']);
            return;
          }
          this.isEditMode.set(true);
          this.providerId.set(id);
          this.pageTitle.set('Editar Proveedor');
          this.pageSubtitle.set('Modifique la información del proveedor');
          this.loadProviderForEdit(id);
        }
      }
    });
  }

  private loadProviderForEdit(id: number) {
    this.loading.set(true);
    this.supplierService.getById(id).subscribe({
      next: (provider: Provider) => {
        this.loading.set(false);
        this.populateFormWithProvider(provider);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error loading provider for edit:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el proveedor para editar'
        });
        // Redirigir a la lista si hay error
        this.router.navigate(['/providers/locate']);
      }
    });
  }

  private populateFormWithProvider(provider: Provider) {
    this.providerForm.patchValue({
      nombre: provider.companyName,
      rif: provider.taxId || '',
      phone : provider.phone || '',
      email: provider.email || ''
    });
  }


  /** Validador de teléfono: opcional; la máscara se encarga del formato. */
  phoneValidator(_control: AbstractControl): ValidationErrors | null {
    return null;
  }

  get isLoading() {
    return this.loading();
  }

  calculateDueDate() {
    const fechaDeuda = this.providerForm.get('fechaDeuda')?.value;
    const diasCredito = this.providerForm.get('diasCredito')?.value || 0;

    if (fechaDeuda && diasCredito) {
      const fecha = new Date(fechaDeuda);
      fecha.setDate(fecha.getDate() + diasCredito);
      this.fechaVencimiento.set(fecha);
    } else {
      this.fechaVencimiento.set(null);
    }
  }

  onSubmit() {
    if (this.providerForm.valid) {
      this.loading.set(true);
      const formValue = this.providerForm.value;
      
      const isEdit = this.isEditMode();
      const providerId = this.providerId();
      
      const payload: any = {};

      // En modo edición, solo enviar los campos que se pueden editar según el endpoint
      if (isEdit) {
        // companyName es opcional pero siempre lo incluimos si tiene valor
        if (formValue.nombre) {
          payload.companyName = formValue.nombre;
        }
        
        // taxId es opcional - incluir si tiene valor, o null si se borró
        payload.taxId = formValue.rif && formValue.rif.trim() !== '' ? formValue.rif : null;
        
        // phone es opcional - incluir si tiene más que solo +58, o null si se borró
        payload.phone = this.getPhoneForPayload(formValue.phone);
        payload.email = formValue.email && formValue.email.trim() !== '' ? formValue.email.trim() : null;
      } else {
        // En modo creación, usar la lógica original
        payload.companyName = formValue.nombre;

        if (formValue.rif) {
          payload.taxId = formValue.rif;
        }

        payload.phone = this.getPhoneForPayload(formValue.phone);
        if (formValue.email && formValue.email.trim() !== '') {
          payload.email = formValue.email.trim();
        }

        // Si se proporciona deuda inicial, incluirla (solo en modo creación)
        if (formValue.deudaInicial && formValue.fechaDeuda) {
          payload.initialDebtAmount = formValue.deudaInicial;
          payload.debtDate = formValue.fechaDeuda.toISOString().split('T')[0];
          payload.creditDays = formValue.diasCredito || 30;
        }
      }

      const operation = isEdit && providerId
        ? this.supplierService.update(providerId, payload)
        : this.supplierService.create(payload);

      operation.subscribe({
        next: () => {
          this.loading.set(false);
          
          if (isEdit) {
            // En modo edición, mostrar mensaje y redirigir
            this.messageData.set({
              success: true,
              message: 'Proveedor actualizado correctamente'
            });
            this.showMessageDialog.set(true);
          } else {
            // En modo creación, resetear el formulario completamente
            this.providerForm.reset({
              nombre: '',
              rif: '',
              phone: this.PHONE_EMPTY,
              email: '',
              deudaInicial: '',
              fechaDeuda: '',
              diasCredito: 30
            });
            
            // Resetear validaciones y estado del formulario
            Object.keys(this.providerForm.controls).forEach(key => {
              const control = this.providerForm.get(key);
              control?.setErrors(null);
              control?.markAsUntouched();
              control?.markAsPristine();
            });
            
            // Resetear fecha de vencimiento
            this.fechaVencimiento.set(null);
            
            // Marcar el formulario como no enviado
            this.providerForm.markAsPristine();
            this.providerForm.markAsUntouched();
            
            // Mostrar modal de éxito
            this.messageData.set({
              success: true,
              message: 'Proveedor registrado correctamente'
            });
            this.showMessageDialog.set(true);
          }
        },
        error: (error) => {
          this.loading.set(false);
          console.error(`Error al ${isEdit ? 'actualizar' : 'registrar'} proveedor:`, error);
          
          // Extraer información del error de la API
          let message = error.message || `Error al ${isEdit ? 'actualizar' : 'registrar'} el proveedor`;
          let errors: any[] = [];
          
          if (error.response) {
            // Si hay una respuesta estructurada de la API
            message = error.response.message || message;
            if (error.response.errors && Array.isArray(error.response.errors)) {
              errors = error.response.errors;
            }
          } else if (error.error) {
            // Si el error viene en error.error
            if (error.error.message) {
              message = error.error.message;
            }
            if (error.error.errors && Array.isArray(error.error.errors)) {
              errors = error.error.errors;
            }
          }
          
          // Mostrar modal de error
          this.messageData.set({
            success: false,
            message: message,
            errors: errors.length > 0 ? errors : undefined
          });
          this.showMessageDialog.set(true);
        }
      });
    }
  }

  onCancel() {
    this.location.back();
  }

  onMessageDialogClose() {
    const wasSuccess = this.messageData()?.success;
    const isEdit = this.isEditMode();
    
    this.showMessageDialog.set(false);
    this.messageData.set(null);
    
    // Si está en modo edición y el mensaje fue exitoso, redirigir a locate-provider
    if (isEdit && wasSuccess) {
      this.router.navigate(['/providers/locate']);
    }
  }
}
