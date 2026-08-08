import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Rutas exclusivas de Admin.
 *
 * Es una comodidad de navegación, **no un control de seguridad**: cualquiera
 * puede saltearlo desde las herramientas del navegador. La autorización real la
 * hace el backend con [Authorize(Roles = "Admin")].
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.esAdmin()) {
    return true;
  }

  return router.createUrlTree(['/comercios']);
};
