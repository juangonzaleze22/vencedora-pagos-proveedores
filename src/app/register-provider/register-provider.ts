import { Component, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
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
export class RegisterProvider {
  providerForm: FormGroup;
  fechaVencimiento = signal<Date | null>(null);
  loading = signal<boolean>(false);
  showMessageDialog = signal(false);
  messageData = signal<ApiMessageData | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supplierService: SupplierService,
    private messageService: MessageService,
    private location: Location
  ) {
    this.providerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      rif: ['', []],
      phone: ['', [this.phoneValidator]],
      deudaInicial: ['', [Validators.min(0.01)]],
      fechaDeuda: ['', []],
      diasCredito: [30, [Validators.min(0)]]
    });

    // Calcular fecha de vencimiento cuando cambien fecha deuda o días de crédito
    this.providerForm.get('fechaDeuda')?.valueChanges.subscribe(() => this.calculateDueDate());
    this.providerForm.get('diasCredito')?.valueChanges.subscribe(() => this.calculateDueDate());
  }

  /**
   * Validador personalizado para teléfono que requiere código de país internacional
   * Valida que el teléfono incluya código de país (cualquier código internacional)
   */
  phoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    // Si el campo está vacío, es válido (campo opcional)
    if (!value || value.trim() === '') {
      return null;
    }

    // Remover espacios, guiones y paréntesis para validación
    const cleanPhone = value.replace(/\s+/g, '').replace(/[-()]/g, '');
    
    // Validar que tenga código de país internacional (+ seguido de 1-4 dígitos)
    // y luego al menos 6 dígitos más para el número local
    // Acepta formatos como: +584121234567, +58 412-1234567, +3222423144, +1 5551234567
    // Debe tener: + (código de país de 1-4 dígitos) + número local (mínimo 6 dígitos)
    // Longitud total mínima: 8 dígitos después del +, máxima recomendada: 15 dígitos
    const phonePattern = /^\+\d{1,4}\d{6,12}$/;
    
    if (!phonePattern.test(cleanPhone)) {
      return { 
        invalidPhone: true,
        message: 'El teléfono debe incluir código de país internacional (ej: +58, +32, +1) seguido del número local'
      };
    }

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
      
      const payload: any = {
        companyName: formValue.nombre
      };

      if (formValue.rif) {
        payload.taxId = formValue.rif;
      }

      if (formValue.phone) {
        payload.phone = formValue.phone;
      }

      // Si se proporciona deuda inicial, incluirla
      if (formValue.deudaInicial && formValue.fechaDeuda) {
        payload.initialDebtAmount = formValue.deudaInicial;
        payload.debtDate = formValue.fechaDeuda.toISOString().split('T')[0];
        payload.creditDays = formValue.diasCredito || 30;
      }

      this.supplierService.create(payload).subscribe({
        next: () => {
          this.loading.set(false);
          
          // Resetear el formulario completamente
          this.providerForm.reset({
            nombre: '',
            rif: '',
            phone: '',
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
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error al registrar proveedor:', error);
          
          // Extraer información del error de la API
          let message = error.message || 'Error al registrar el proveedor';
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
    this.showMessageDialog.set(false);
    this.messageData.set(null);
  }
}
