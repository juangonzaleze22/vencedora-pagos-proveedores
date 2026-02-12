import { Injectable } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';
import { ApiService } from './api.service';

export interface UserListItem {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private apiService: ApiService) {}

  /**
   * Lista todos los usuarios (opcionalmente filtrados por rol)
   */
  listUsers(role?: string): Observable<UserListItem[]> {
    const params: Record<string, any> = {};
    if (role) params['role'] = role;

    return this.apiService.get<UserListItem[]>('/users', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Lista los cajeros (usuarios con rol CAJERO)
   */
  listCashiers(): Observable<UserListItem[]> {
    return this.listUsers('CAJERO');
  }
}
