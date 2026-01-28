import { Component, signal, ViewChild, OnInit, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppHeader } from '../shared/components/layout/app-header/app-header';
import { PageContainer } from '../shared/components/layout/page-container/page-container';
import { AppCard } from '../shared/components/layout/app-card/app-card';
import { ProviderSelect } from '../shared/components/data/provider-select/provider-select';
import { FileUploadComponent } from '../shared/components/ui/file-upload/file-upload';
import { ApiMessageDialog, ApiMessageData } from '../shared/components/ui/api-message-dialog/api-message-dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { PaymentService } from '../shared/services/payment.service';
import { SupplierService } from '../shared/services/supplier.service';
import { Provider } from '../shared/models/provider.model';

@Component({
  selector: 'app-register-payment',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppHeader,
    PageContainer,
    AppCard,
    ProviderSelect,
    FileUploadComponent,
    ApiMessageDialog,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    SelectButtonModule,
    ButtonModule,
    ToastModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './register-payment.html',
  styleUrl: './register-payment.scss'
})
export class RegisterPayment implements OnInit {
  paymentForm: FormGroup;
  selectedFiles: File[] = [];
  providers = signal<Provider[]>([]);
  debts = signal<any[]>([]);
  loading = signal<boolean>(false);
  showMessageDialog = signal(false);
  messageData = signal<ApiMessageData | null>(null);
  isEditMode = signal<boolean>(false);
  paymentId = signal<number | null>(null);
  pageTitle = signal<string>('Registro de Pago');
  pageSubtitle = signal<string>('Ingrese los detalles del nuevo pago recibido');
  existingReceiptUrl = signal<string | undefined>(undefined);

  paymentMethods = [
    { label: 'Zelle', value: 'Zelle' },
    { label: 'Transferencia', value: 'Transferencia' },
    { label: 'Efectivo', value: 'Efectivo' }
  ];

  // Signal para rastrear el estado del switch pagoEnBolivares
  pagoEnBolivaresSignal = signal<boolean>(false);

  // Computed signal para filtrar métodos de pago según el switch bs/usd
  filteredPaymentMethods = computed(() => {
    const pagoEnBolivares = this.pagoEnBolivaresSignal();
    if (pagoEnBolivares) {
      // Si está en bolívares, excluir Zelle
      return this.paymentMethods.filter(method => method.value !== 'Zelle');
    }
    return this.paymentMethods;
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private supplierService: SupplierService,
    private messageService: MessageService,
    private location: Location
  ) {
    this.paymentForm = this.fb.group({
      emisor: ['', [Validators.required]],
      correoEmisor: ['', [Validators.required, Validators.email]],
      numeroConfirmacion: ['', [Validators.required]],
      monto: ['', [Validators.required, Validators.min(0.01), this.amountNotExceedingDebtValidator.bind(this)]],
      fechaEnvio: [new Date(), [Validators.required]],
      proveedorId: ['', [Validators.required]],
      debtId: ['', [Validators.required]],
      metodoPago: ['Zelle', [Validators.required]],
      pagoEnBolivares: [false],
      tasaDolar: ['', []],
      montoBolivares: ['', []]
    });

    // Actualizar validación del monto cuando cambie la deuda
    this.paymentForm.get('debtId')?.valueChanges.subscribe(() => {
      this.paymentForm.get('monto')?.updateValueAndValidity();
    });

    // Lógica reactiva para el método de pago (ocultar/validar número de confirmación)
    this.setupPaymentMethodReactiveLogic();

    // Lógica reactiva para el switch bs/usd
    this.setupBolivaresReactiveLogic();

    this.loadProviders();
  }

  ngOnInit() {
    // Detectar si viene en modo edición
    this.route.queryParams.subscribe(params => {
      const editId = params['editId'];
      if (editId) {
        const paymentId = Number(editId);
        if (!isNaN(paymentId)) {
          this.isEditMode.set(true);
          this.paymentId.set(paymentId);
          this.pageTitle.set('Editar Pago');
          this.pageSubtitle.set('Modifique los detalles del pago');
          this.loadPaymentForEdit(paymentId);
        }
      }
    });
  }

  private loadPaymentForEdit(paymentId: number) {
    this.loading.set(true);
    this.paymentService.getById(paymentId).subscribe({
      next: (payment) => {
        this.loading.set(false);
        
        // Cargar proveedores primero si aún no están cargados
        if (this.providers().length === 0) {
          this.loadProviders(() => {
            this.populateFormWithPayment(payment);
          });
        } else {
          this.populateFormWithPayment(payment);
        }
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error loading payment for edit:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el pago para editar'
        });
        // Redirigir al dashboard si hay error
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      }
    });
  }

  private populateFormWithPayment(payment: any) {
    // Guardar la URL de la imagen existente si existe
    if (payment.receiptFile) {
      this.existingReceiptUrl.set(payment.receiptFile);
    }
    
    // Cargar deudas del proveedor primero
    this.loadDebts(payment.supplierId, () => {
      // Mapear datos del pago al formulario (mapear desde nombres del backend)
      const pagoEnBolivares = payment.isBolivares || false;
      this.paymentForm.patchValue({
        emisor: payment.senderName || '',
        correoEmisor: payment.senderEmail || '',
        numeroConfirmacion: payment.confirmationNumber || '',
        monto: payment.amount || '',
        fechaEnvio: payment.paymentDate ? new Date(payment.paymentDate) : null,
        proveedorId: payment.supplierId || '',
        debtId: payment.debtId || '',
        metodoPago: payment.paymentMethod || 'Zelle',
        pagoEnBolivares: pagoEnBolivares,
        tasaDolar: payment.exchangeRate || '',
        montoBolivares: payment.amountInBolivares || ''
      });

      // Actualizar el signal
      this.pagoEnBolivaresSignal.set(pagoEnBolivares);

      // Actualizar validación del monto
      this.paymentForm.get('monto')?.updateValueAndValidity();
    });
  }

  /**
   * Validador personalizado: el monto no debe exceder el monto restante de la deuda
   */
  private amountNotExceedingDebtValidator(control: AbstractControl): ValidationErrors | null {
    const amount = control.value;
    const debtId = this.paymentForm?.get('debtId')?.value;

    if (!amount || !debtId) {
      return null; // No validar si no hay monto o deuda seleccionada
    }

    const selectedDebt = this.debts().find(d => d.id === debtId);
    if (!selectedDebt) {
      return null; // No validar si la deuda no se encuentra
    }

    const remainingAmount = selectedDebt.remainingAmount || 0;
    const amountValue = Number(amount);

    if (amountValue > remainingAmount) {
      return {
        amountExceedsDebt: {
          maxAmount: remainingAmount,
          enteredAmount: amountValue
        }
      };
    }

    return null;
  }

  private loadProviders(callback?: () => void) {
    this.supplierService.list().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.providers.set(response.data);
          if (callback) {
            callback();
          }
        }
      },
      error: (error) => {
        console.error('Error loading providers:', error);
        if (callback) {
          callback();
        }
      }
    });
  }

  onProviderChange(provider: Provider | null) {
    if (provider) {
      // Limpiar la deuda seleccionada al cambiar de proveedor
      this.paymentForm.patchValue({ 
        proveedorId: provider.id,
        debtId: null // Limpiar la deuda seleccionada
      });
      // Limpiar la lista de deudas antes de cargar las nuevas
      this.debts.set([]);
      // Cargar las deudas del nuevo proveedor
      this.loadDebts(provider.id);
      // Limpiar también el monto ya que depende de la deuda seleccionada
      this.paymentForm.patchValue({ monto: '' });
      // Actualizar validación del monto
      this.paymentForm.get('monto')?.updateValueAndValidity();
    } else {
      // Si se limpia el proveedor, también limpiar deuda y monto
      this.paymentForm.patchValue({ 
        proveedorId: null,
        debtId: null,
        monto: ''
      });
      this.debts.set([]);
      this.paymentForm.get('monto')?.updateValueAndValidity();
    }
  }

  private loadDebts(supplierId: number, callback?: () => void) {
    this.supplierService.getDebts(supplierId, { status: 'PENDING' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.debts.set(response.data);
          // Si hay solo una deuda y no estamos en modo edición, seleccionarla automáticamente
          if (response.data.length === 1 && !this.isEditMode()) {
            this.paymentForm.patchValue({ debtId: response.data[0].id });
          }
          // Actualizar validación del monto cuando se cargan las deudas
          this.paymentForm.get('monto')?.updateValueAndValidity();
          if (callback) {
            callback();
          }
        }
      },
      error: (error) => {
        console.error('Error loading debts:', error);
        if (callback) {
          callback();
        }
      }
    });
  }

  @ViewChild('fileUpload') fileUploadComponent?: FileUploadComponent;

  onFileSelect(files: File[]) {
    console.log('onFileSelect called with files:', files);
    if (files && files.length > 0) {
      this.selectedFiles = files;
      console.log('File stored:', this.selectedFiles[0]?.name, 'Size:', this.selectedFiles[0]?.size);
    } else {
      this.selectedFiles = [];
      console.log('No files received, clearing selectedFiles');
    }
  }


  onSubmit() {
    if (this.paymentForm.valid) {
      this.loading.set(true);
      const formValue = this.paymentForm.value;
      
      // Asegurar que fechaEnvio sea un objeto Date
      let paymentDate: Date;
      if (formValue.fechaEnvio instanceof Date) {
        paymentDate = formValue.fechaEnvio;
      } else if (formValue.fechaEnvio) {
        paymentDate = new Date(formValue.fechaEnvio);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'La fecha de envío es requerida'
        });
        this.loading.set(false);
        return;
      }
      
      // Validar que los valores requeridos estén presentes
      if (!formValue.debtId || !formValue.proveedorId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar un proveedor y una deuda'
        });
        this.loading.set(false);
        return;
      }
      
      // Determinar qué enviar:
      // - Si hay archivo seleccionado: enviar el File en receipt
      // - Si había imagen existente y fue eliminada: enviar removeReceipt: true
      // - Si había imagen existente y NO fue eliminada: no enviar nada (mantener existente)
      let receiptFile: File | undefined = undefined;
      let removeReceipt: boolean | undefined = undefined;
      
      if (this.selectedFiles.length > 0 && this.selectedFiles[0] instanceof File) {
        // Nuevo archivo seleccionado
        receiptFile = this.selectedFiles[0];
        console.log('Submitting payment with new receipt file:', {
          name: receiptFile.name,
          size: receiptFile.size,
          type: receiptFile.type
        });
      } else if (this.existingReceiptUrl() && this.fileUploadComponent?.imageExplicitlyRemoved?.()) {
        // Imagen existente fue eliminada explícitamente
        removeReceipt = true;
        console.log('Submitting payment with removeReceipt flag to delete existing image');
      } else if (this.existingReceiptUrl()) {
        // Hay imagen existente y no se tocó
        console.log('Not sending receipt or removeReceipt (keeping existing image)');
      } else {
        // No hay imagen existente ni archivo seleccionado
        console.log('No receipt to send');
      }
      
      const paymentData: any = {
        debtId: Number(formValue.debtId),
        supplierId: Number(formValue.proveedorId),
        amount: Number(formValue.monto),
        paymentMethod: formValue.metodoPago,
        senderName: formValue.emisor,
        senderEmail: formValue.correoEmisor,
        confirmationNumber: formValue.numeroConfirmacion,
        paymentDate: paymentDate,
        receipt: receiptFile,
        removeReceipt: removeReceipt,
        // Campos de bolívares - siempre enviar isBolivares
        isBolivares: Boolean(formValue.pagoEnBolivares)
      };

      // Agregar campos de bolívares si el switch está activo
      if (formValue.pagoEnBolivares) {
        if (formValue.tasaDolar) {
          paymentData.exchangeRate = Number(formValue.tasaDolar);
        }
        if (formValue.montoBolivares) {
          paymentData.amountInBolivares = Number(formValue.montoBolivares);
        }
      }

      const paymentObservable = this.isEditMode() && this.paymentId()
        ? this.paymentService.update(this.paymentId()!, paymentData)
        : this.paymentService.create(paymentData);

      paymentObservable.subscribe({
        next: (payment) => {
          this.loading.set(false);
          
          // Mostrar modal de éxito
          this.messageData.set({
            success: true,
            message: this.isEditMode() ? 'Pago actualizado correctamente' : 'Pago registrado correctamente'
          });
          this.showMessageDialog.set(true);

          // Si estamos en modo edición, no limpiar el formulario
          if (!this.isEditMode()) {
            // Limpiar el formulario solo en modo creación
            this.paymentForm.reset({
              metodoPago: 'Zelle',
              numeroConfirmacion: '',
              pagoEnBolivares: false,
              tasaDolar: '',
              montoBolivares: ''
            });
            // Sincronizar el signal
            this.pagoEnBolivaresSignal.set(false);
            this.selectedFiles = [];
            this.existingReceiptUrl.set(undefined);
            // Limpiar el componente de file upload
            if (this.fileUploadComponent) {
              this.fileUploadComponent.clear();
            }
            // Resetear validaciones
            Object.keys(this.paymentForm.controls).forEach(key => {
              this.paymentForm.get(key)?.setErrors(null);
              this.paymentForm.get(key)?.markAsUntouched();
            });
            // Limpiar deudas seleccionadas
            this.debts.set([]);
          }
        },
        error: (error) => {
          this.loading.set(false);
          console.error(`Error al ${this.isEditMode() ? 'actualizar' : 'registrar'} pago:`, error);
          
          // Extraer información del error de la API
          let message = error.message || `Error al ${this.isEditMode() ? 'actualizar' : 'registrar'} el pago`;
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
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.paymentForm.controls).forEach(key => {
        this.paymentForm.get(key)?.markAsTouched();
      });
    }
  }

  get isLoading() {
    return this.loading();
  }

  onCancel() {
    this.location.back();
  }

  onMessageDialogClose() {
    this.showMessageDialog.set(false);
    this.messageData.set(null);
  }

  getSelectedDebtRemainingAmount(): number {
    const debtId = this.paymentForm.get('debtId')?.value;
    if (!debtId) return 0;
    const debt = this.debts().find(d => d.id === debtId);
    return debt?.remainingAmount || 0;
  }

  /**
   * Maneja el cambio de moneda y previene la deselección
   */
  onCurrencyChange(event: any) {
    const newValue = event.value;
    // Si se intenta deseleccionar (valor null o undefined), mantener el valor anterior
    if (newValue === null || newValue === undefined) {
      const currentValue = this.paymentForm.get('pagoEnBolivares')?.value;
      // Si no hay valor actual, establecer USD por defecto
      if (currentValue === null || currentValue === undefined) {
        this.paymentForm.patchValue({ pagoEnBolivares: false }, { emitEvent: false });
      } else {
        // Mantener el valor actual
        this.paymentForm.patchValue({ pagoEnBolivares: currentValue }, { emitEvent: false });
      }
    }
  }

  /**
   * Configura la lógica reactiva para el método de pago
   * Cuando es "Efectivo", se remueve la validación requerida del número de confirmación
   */
  private setupPaymentMethodReactiveLogic() {
    this.paymentForm.get('metodoPago')?.valueChanges.subscribe((metodoPago: string) => {
      const numeroConfirmacionControl = this.paymentForm.get('numeroConfirmacion');
      
      if (metodoPago === 'Efectivo') {
        // Si es efectivo, remover validación requerida y limpiar el campo
        numeroConfirmacionControl?.clearValidators();
        numeroConfirmacionControl?.setValue('');
        numeroConfirmacionControl?.updateValueAndValidity();
      } else {
        // Si no es efectivo, agregar validación requerida
        numeroConfirmacionControl?.setValidators([Validators.required]);
        numeroConfirmacionControl?.updateValueAndValidity();
      }
    });
  }

  /**
   * Configura la lógica reactiva para el switch bs/usd
   */
  private setupBolivaresReactiveLogic() {
    // Suscripción a cambios del switch pagoEnBolivares
    this.paymentForm.get('pagoEnBolivares')?.valueChanges.subscribe((pagoEnBolivares: boolean) => {
      // Actualizar el signal
      this.pagoEnBolivaresSignal.set(pagoEnBolivares);

      if (pagoEnBolivares) {
        // Si se activa el switch y el método de pago es Zelle, limpiarlo
        const metodoPago = this.paymentForm.get('metodoPago')?.value;
        if (metodoPago === 'Zelle') {
          this.paymentForm.patchValue({ metodoPago: '' });
        }

        // Actualizar validaciones: tasaDolar y montoBolivares requeridos, monto no requerido
        this.paymentForm.get('tasaDolar')?.setValidators([Validators.required, Validators.min(0.01)]);
        this.paymentForm.get('montoBolivares')?.setValidators([Validators.required, Validators.min(0.01)]);
        this.paymentForm.get('monto')?.clearValidators();
        this.paymentForm.get('monto')?.updateValueAndValidity();
      } else {
        // Si se desactiva el switch, restaurar validaciones normales
        this.paymentForm.get('tasaDolar')?.clearValidators();
        this.paymentForm.get('montoBolivares')?.clearValidators();
        this.paymentForm.get('monto')?.setValidators([
          Validators.required,
          Validators.min(0.01),
          this.amountNotExceedingDebtValidator.bind(this)
        ]);
        
        // Limpiar campos de bolívares
        this.paymentForm.patchValue({
          tasaDolar: '',
          montoBolivares: ''
        });
      }

      // Actualizar validaciones
      this.paymentForm.get('tasaDolar')?.updateValueAndValidity();
      this.paymentForm.get('montoBolivares')?.updateValueAndValidity();
      this.paymentForm.get('monto')?.updateValueAndValidity();
    });

    // Suscripción a cambios de tasaDolar y montoBolivares para calcular monto automáticamente
    this.paymentForm.get('tasaDolar')?.valueChanges.subscribe(() => {
      this.calculateMontoFromBolivares();
    });

    this.paymentForm.get('montoBolivares')?.valueChanges.subscribe(() => {
      this.calculateMontoFromBolivares();
    });
  }

  /**
   * Calcula el monto en USD a partir de montoBolivares y tasaDolar
   */
  private calculateMontoFromBolivares() {
    const pagoEnBolivares = this.paymentForm.get('pagoEnBolivares')?.value;
    if (!pagoEnBolivares) {
      return;
    }

    const tasaDolar = this.paymentForm.get('tasaDolar')?.value;
    const montoBolivares = this.paymentForm.get('montoBolivares')?.value;

    if (tasaDolar && montoBolivares && tasaDolar > 0 && montoBolivares > 0) {
      const montoCalculado = montoBolivares / tasaDolar;
      // Actualizar el monto sin disparar eventos para evitar loops
      this.paymentForm.patchValue({ monto: montoCalculado }, { emitEvent: false });
      // Actualizar validación del monto
      this.paymentForm.get('monto')?.updateValueAndValidity();
    } else {
      // Si faltan valores, limpiar el monto
      this.paymentForm.patchValue({ monto: '' }, { emitEvent: false });
    }
  }
}
