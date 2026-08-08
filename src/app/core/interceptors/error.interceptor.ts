import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificacionService } from '../../shared/services/notificacion.service';
import { codigoDeError, mensajeDeError } from '../../shared/util/problem-details.util';

/**
 * Traduce los ProblemDetails del backend a mensajes.
 *
 * Regla: acá se muestra **solo lo que el usuario no puede resolver dentro del
 * formulario**. El error siempre se vuelve a lanzar, para que la pantalla pueda
 * reaccionar además de que se avise.
 *
 * Los 409 se discriminan por el campo `codigo`, nunca por el status: dos errores
 * distintos comparten el 409.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificacion = inject(NotificacionService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const codigo = codigoDeError(error);

      switch (error.status) {
        // Lo maneja el formulario pintando cada mensaje en su campo.
        case 400:
          break;

        // Lo maneja authInterceptor cerrando la sesión.
        case 401:
          break;

        case 403:
          notificacion.advertencia(
            'Tu rol no tiene permiso para esta acción.',
            'Sin permiso'
          );
          break;

        // La pantalla decide si vuelve al listado o muestra un vacío.
        case 404:
          break;

        // Conflicto de concurrencia: la pantalla ofrece recargar, con contexto
        // que el interceptor no tiene. Transición inválida: mensaje directo.
        case 409:
          if (codigo === 'estado_transicion_invalida') {
            notificacion.advertencia(mensajeDeError(error), 'Transición no permitida');
          }
          break;

        // Regla de negocio: CUIT repetido, rubro dado de baja. El texto del
        // backend ya es explicativo, se muestra tal cual.
        case 422:
          notificacion.error(mensajeDeError(error), 'No se pudo guardar');
          break;

        // Falta el header If-Match. Es un bug del frontend, no algo que el
        // usuario pueda resolver: se registra en consola y no se le muestra.
        case 428:
          console.error('[bug] Falta el header If-Match en', req.method, req.url);
          break;

        default:
          notificacion.error(mensajeDeError(error));
      }

      return throwError(() => error);
    })
  );
};
