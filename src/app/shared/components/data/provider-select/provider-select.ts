import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Provider } from '../../../models/provider.model';

@Component({
  selector: 'app-provider-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProviderSelect),
      multi: true
    }
  ],
  templateUrl: './provider-select.html',
  styleUrl: './provider-select.scss'
})
export class ProviderSelect implements ControlValueAccessor {
  @Input() providers: Provider[] = [];
  @Input() placeholder: string = 'Seleccione un proveedor';
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<Provider | null>();

  selectedProvider: Provider | null = null;
  
  // ControlValueAccessor implementation
  private onChange = (value: number | null) => {};
  private onTouched = () => {};

  onSelectionChange(provider: Provider | null) {
    this.selectedProvider = provider;
    const value = provider ? provider.id : null;
    this.onChange(value);
    this.selectionChange.emit(provider);
  }

  // ControlValueAccessor methods
  writeValue(value: number | null): void {
    if (value && this.providers) {
      this.selectedProvider = this.providers.find(p => p.id === value) || null;
    } else {
      this.selectedProvider = null;
    }
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
