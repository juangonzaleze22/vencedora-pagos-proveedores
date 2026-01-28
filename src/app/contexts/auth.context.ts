import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { User } from '../shared/models/user.model';

/**
 * Contexto de Autenticación (Wrapper ligero sobre AuthService)
 * 
 * Mantiene compatibilidad con componentes existentes mientras
 * delega la lógica real a AuthService.
 */
@Injectable({ providedIn: 'root' })
export class AuthContext {
  // Exponer signals del servicio (usando getters para evitar inicialización temprana)
  get user() {
    return this.authService.currentUser;
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated;
  }

  // Computed para compatibilidad
  get currentUser() {
    return computed(() => this.authService.currentUser());
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicia sesión (delega a AuthService)
   */
  async login(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authService.login(email, password).subscribe({
        next: () => resolve(),
        error: (error) => reject(error)
      });
    });
  }

  /**
   * Cierra sesión (delega a AuthService)
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}
