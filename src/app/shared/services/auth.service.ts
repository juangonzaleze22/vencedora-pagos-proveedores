import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { User, LoginResponse } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.checkStoredSession();
  }

  /**
   * Inicia sesión en la aplicación
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', { email, password }).pipe(
      map(response => {
        if (response.success && response.data) {
          const { token, user } = response.data;
          
          // Guardar token y usuario
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Actualizar estado
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
          
          return response.data;
        }
        throw new Error(response.message || 'Error al iniciar sesión');
      })
    );
  }

  /**
   * Obtiene el usuario actual desde el servidor
   */
  getCurrentUser(): Observable<User> {
    return this.apiService.get<User>('/auth/me').pipe(
      map(response => {
        if (response.success && response.data) {
          const user = response.data;
          localStorage.setItem('user', JSON.stringify(user));
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
          return user;
        }
        throw new Error(response.message || 'Error al obtener usuario');
      })
    );
  }

  /**
   * Cierra sesión del usuario
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si hay una sesión guardada
   */
  private checkStoredSession(): void {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        
        // Verificar token válido con el servidor
        this.getCurrentUser().subscribe({
          error: () => {
            // Si el token es inválido, limpiar sesión
            this.logout();
          }
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this._currentUser();
    return user?.role.nombre === role;
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

