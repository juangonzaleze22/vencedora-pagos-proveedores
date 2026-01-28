import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';

export type ConfirmDialogSeverity = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogConfig {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: ConfirmDialogSeverity;
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, TextareaModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss'
})
export class ConfirmDialog {
  _visible = signal(false);
  _title = signal<string | undefined>(undefined);
  _message = signal<string>('¿Está seguro de realizar esta acción?');
  _confirmLabel = signal<string>('Confirmar');
  _cancelLabel = signal<string>('Cancelar');
  _severity = signal<ConfirmDialogSeverity>('warning');
  _icon = signal<string | undefined>(undefined);
  _showReasonInput = signal<boolean>(false);
  _reason = signal<string>('');

  @Input()
  set visible(value: boolean) {
    this._visible.set(value);
  }
  get visible(): boolean {
    return this._visible();
  }

  @Input()
  set config(value: ConfirmDialogConfig) {
    if (value.title !== undefined) this._title.set(value.title);
    if (value.message) this._message.set(value.message);
    if (value.confirmLabel) this._confirmLabel.set(value.confirmLabel);
    if (value.cancelLabel) this._cancelLabel.set(value.cancelLabel);
    if (value.severity) this._severity.set(value.severity);
    if (value.icon) this._icon.set(value.icon);
  }

  // Propiedades individuales para facilitar el uso
  @Input()
  set title(value: string | undefined) {
    this._title.set(value);
  }
  get title(): string | undefined {
    return this._title();
  }

  @Input()
  set message(value: string) {
    if (value) this._message.set(value);
  }
  get message(): string {
    return this._message();
  }

  @Input()
  set confirmLabel(value: string) {
    if (value) this._confirmLabel.set(value);
  }
  get confirmLabel(): string {
    return this._confirmLabel();
  }

  @Input()
  set cancelLabel(value: string) {
    if (value) this._cancelLabel.set(value);
  }
  get cancelLabel(): string {
    return this._cancelLabel();
  }

  @Input()
  set severity(value: ConfirmDialogSeverity) {
    if (value) this._severity.set(value);
  }
  get severity(): ConfirmDialogSeverity {
    return this._severity();
  }

  @Input()
  set icon(value: string | undefined) {
    this._icon.set(value);
  }
  get icon(): string | undefined {
    return this._icon();
  }

  @Input()
  set showReasonInput(value: boolean) {
    this._showReasonInput.set(value);
  }
  get showReasonInput(): boolean {
    return this._showReasonInput();
  }

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onConfirm = new EventEmitter<string | undefined>();
  @Output() onCancel = new EventEmitter<void>();

  // Computed para obtener valores finales
  finalTitle = computed(() => {
    return this._title() || 'Confirmar Acción';
  });

  finalMessage = computed(() => {
    return this._message();
  });

  finalConfirmLabel = computed(() => {
    return this._confirmLabel();
  });

  finalCancelLabel = computed(() => {
    return this._cancelLabel();
  });

  finalSeverity = computed(() => {
    return this._severity();
  });

  finalIcon = computed(() => {
    return this._icon() || this.getDefaultIcon();
  });

  private getDefaultIcon(): string {
    const severity = this._severity();
    const iconMap: Record<ConfirmDialogSeverity, string> = {
      danger: 'pi pi-exclamation-triangle',
      warning: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle',
      success: 'pi pi-check-circle'
    };
    return iconMap[severity] || 'pi pi-exclamation-triangle';
  }

  getIconClass = computed(() => {
    const severity = this.finalSeverity();
    const classMap: Record<ConfirmDialogSeverity, string> = {
      danger: 'text-red-600 dark:text-red-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      info: 'text-blue-600 dark:text-blue-400',
      success: 'text-green-600 dark:text-green-400'
    };
    return classMap[severity] || 'text-yellow-600 dark:text-yellow-400';
  });

  getIconBgClass = computed(() => {
    const severity = this.finalSeverity();
    const classMap: Record<ConfirmDialogSeverity, string> = {
      danger: 'bg-red-100 dark:bg-red-900/30',
      warning: 'bg-yellow-100 dark:bg-yellow-900/30',
      info: 'bg-blue-100 dark:bg-blue-900/30',
      success: 'bg-green-100 dark:bg-green-900/30'
    };
    return classMap[severity] || 'bg-yellow-100 dark:bg-yellow-900/30';
  });

  getConfirmButtonSeverity = computed(() => {
    const severity = this.finalSeverity();
    // Mapear a valores válidos de PrimeNG Button severity
    // PrimeNG acepta: 'secondary', 'success', 'info', 'danger', 'help', 'contrast'
    // Mapeamos 'warning' a 'info' ya que PrimeNG no tiene 'warning'
    const severityMap: Record<ConfirmDialogSeverity, 'danger' | 'info' | 'success'> = {
      danger: 'danger',
      warning: 'info', // Mapear warning a info
      info: 'info',
      success: 'success'
    };
    return severityMap[severity] || 'info';
  });

  onDialogClose() {
    this._visible.set(false);
    this._reason.set(''); // Limpiar motivo al cerrar
    this.visibleChange.emit(false);
    this.onCancel.emit();
  }

  handleConfirm() {
    const reason = this._showReasonInput() ? this._reason() : undefined;
    this._visible.set(false);
    this.visibleChange.emit(false);
    this.onConfirm.emit(reason);
    // Limpiar motivo después de confirmar
    this._reason.set('');
  }

  handleCancel() {
    this.onDialogClose();
  }

  onReasonChange(value: string) {
    this._reason.set(value);
  }
}

