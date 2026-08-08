import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

/**
 * Adjunta el JWT y reacciona a la expiración de la sesión.
 *
 * El token se manda **solo si la request va a nuestro backend**: mandarlo a un
 * dominio de terceros sería filtrar una credencial.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const esBackendPropio = req.url.startsWith(environment.apiUrl);

  const request = token && esBackendPropio
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // El token venció o el backend lo rechazó: no hay nada que el usuario
      // pueda hacer desde la pantalla actual, así que se cierra la sesión.
      //
      // Se pide que hubiera token: un 401 sin token es el login rechazando
      // credenciales, y ahí no hay sesión que cerrar ni a dónde redirigir.
      if (error.status === 401 && token) {
        auth.logout();
      }

      return throwError(() => error);
    })
  );
};
