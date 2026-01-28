import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

export interface ApiError {
  path?: string;
  msg: string;
}

export interface ApiMessageData {
  success: boolean;
  message: string;
  errors?: ApiError[];
}

@Component({
  selector: 'app-api-message-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, MessageModule],
  templateUrl: './api-message-dialog.html',
  styleUrl: './api-message-dialog.scss'
})
export class ApiMessageDialog {
  _visible = signal(false);
  _messageData = signal<ApiMessageData | null>(null);

  @Input()
  set visible(value: boolean) {
    this._visible.set(value);
  }
  get visible(): boolean {
    return this._visible();
  }

  @Input()
  set messageData(value: ApiMessageData | null) {
    this._messageData.set(value);
  }
  get messageData(): ApiMessageData | null {
    return this._messageData();
  }

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onClose = new EventEmitter<void>();

  isSuccess = computed(() => this._messageData()?.success ?? false);
  title = computed(() => this.isSuccess() ? 'Éxito' : 'Error');
  icon = computed(() => this.isSuccess() ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle');
  severity = computed<'success' | 'error' | 'warn' | 'info'>(() => this.isSuccess() ? 'success' : 'error');

  onDialogClose() {
    this._visible.set(false);
    this.visibleChange.emit(false);
    this.onClose.emit();
  }

  onConfirm() {
    this.onDialogClose();
  }
}

