import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  
  if (token) {
    // Si hay token, verificar que el usuario esté cargado
    if (authService.isAuthenticated()) {
      return true;
    }
    
    // Si hay token pero no usuario, intentar obtenerlo
    // (esto puede pasar si la app se recarga)
    authService.getCurrentUser().subscribe({
      next: () => true,
      error: () => {
        router.navigate(['/login']);
        return false;
      }
    });
    
    return true; // Permitir mientras se verifica
  }
  
  // No hay token, redirigir a login
  return router.createUrlTree(['/login']);
};
