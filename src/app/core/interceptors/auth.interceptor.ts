import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Obtener token del localStorage
  const token = localStorage.getItem('token');
  
  // Si hay token y no es una request de login, agregar header
  if (token && !req.url.includes('/auth/login')) {
    // No modificar Content-Type si es FormData (el navegador lo maneja)
    const isFormData = req.body instanceof FormData;
    
    if (isFormData) {
      // Para FormData, solo agregar Authorization
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      // Para JSON, agregar ambos headers
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar errores de autenticación
      if (error.status === 401) {
        // Token inválido o expirado
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Sin permisos
        console.error('Acceso denegado:', error.error?.message || 'No tienes permisos para realizar esta acción');
      }
      
      return throwError(() => error);
    })
  );
};

