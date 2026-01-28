import { Component, Input, Output, EventEmitter, OnDestroy, HostListener, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Provider } from '../../../models/provider.model';

@Component({
  selector: 'app-supplier-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    TagModule
  ],
  templateUrl: './supplier-autocomplete.html',
  styleUrl: './supplier-autocomplete.scss'
})
export class SupplierAutocomplete implements OnDestroy, OnChanges {
  @Input() placeholder: string = 'Buscar distribuidor...';
  @Input() suggestions: Provider[] = [];
  @Input() loading: boolean = false;
  @Output() search = new EventEmitter<string>();
  @Output() select = new EventEmitter<Provider>();
  @Output() focus = new EventEmitter<void>();

  searchQuery: string = '';
  showDropdown: boolean = false;
  selectedIndex: number = -1;
  private searchTimeout: any = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    // Mostrar dropdown cuando lleguen sugerencias o cuando esté cargando
    if (changes['suggestions'] || changes['loading']) {
      if (this.loading) {
        this.showDropdown = true; // Mostrar loading
      } else if (this.suggestions.length > 0) {
        // Mostrar resultados si hay sugerencias (incluso sin query, para mostrar todos)
        this.showDropdown = true;
      } else if (this.suggestions.length === 0 && this.searchQuery.length >= 1 && !this.loading) {
        this.showDropdown = true; // Mostrar "No se encontraron"
      } else if (this.suggestions.length === 0 && this.searchQuery.length === 0) {
        this.showDropdown = false; // Ocultar si no hay query ni sugerencias
      }
      // Forzar detección de cambios para actualizar la vista
      this.cdr.detectChanges();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.supplier-autocomplete-container')) {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  onInputChange(value: string) {
    this.searchQuery = value;
    
    // Limpiar timeout anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Si está vacío, ocultar dropdown
    if (!value || value.trim().length < 1) {
      this.showDropdown = false;
      this.cdr.detectChanges();
      return;
    }

    // Debounce de 200ms para respuesta más rápida
    this.searchTimeout = setTimeout(() => {
      this.search.emit(value);
      this.selectedIndex = -1;
    }, 200);
  }

  onInputFocus() {
    // Emitir evento de focus para que el componente padre pueda cargar todos los proveedores
    this.focus.emit();
    
    // Si hay sugerencias, mostrar el dropdown
    if (this.suggestions.length > 0) {
      this.showDropdown = true;
      this.cdr.detectChanges();
    }
  }

  onInputBlur() {
    // Delay para permitir click en las opciones
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }, 200);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.showDropdown || this.suggestions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
          this.selectSupplier(this.suggestions[this.selectedIndex]);
        }
        break;
      case 'Escape':
        this.showDropdown = false;
        this.selectedIndex = -1;
        break;
    }
  }

  selectSupplier(supplier: Provider) {
    this.searchQuery = supplier.companyName || '';
    this.showDropdown = false;
    this.selectedIndex = -1;
    this.select.emit(supplier);
  }

  onSearchClick() {
    if (this.searchQuery && this.searchQuery.trim().length >= 1) {
      this.search.emit(this.searchQuery.trim());
      this.showDropdown = false;
      this.selectedIndex = -1;
    }
  }
}

