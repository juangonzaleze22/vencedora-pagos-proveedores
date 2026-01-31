import { Injectable, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';

/**
 * Servicio compartido para desactivar el filtro de p-select en móvil.
 * En viewport ≤768px el filtro se desactiva para evitar que el overlay se cierre al hacer scroll.
 */
@Injectable({ providedIn: 'root' })
export class SelectFilterService {
  /** true en desktop, false en móvil (≤768px). */
  readonly filterEnabled = signal(true);

  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe((state) => this.filterEnabled.set(!state.matches));
  }
}
