import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const messageService = inject(MessageService);
  
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
        messageService.add({
          severity: 'warn',
          summary: 'Sesión expirada',
          detail: 'Su token ha expirado. Por favor, inicie sesión nuevamente.'
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Sin permisos (el usuario ya fue redirigido o verá el mensaje en la UI)
      }

      return throwError(() => error);
    })
  );
};

