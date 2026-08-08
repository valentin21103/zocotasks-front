import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { CodigoError, ProblemDetails } from '../models/problem-details';

/** Extrae el cuerpo ProblemDetails de un error de HttpClient. */
export function problemDetails(error: HttpErrorResponse): ProblemDetails | null {
  const cuerpo = error.error;
  return cuerpo && typeof cuerpo === 'object' ? (cuerpo as ProblemDetails) : null;
}

export function codigoDeError(error: HttpErrorResponse): CodigoError | null {
  return problemDetails(error)?.codigo ?? null;
}

/**
 * Texto para mostrarle al usuario. Prioriza `detail` (el mensaje explicativo del
 * backend) sobre `title` (el encabezado corto), y cae a un genérico si el error
 * no vino del backend — por ejemplo, si la API está caída.
 */
export function mensajeDeError(error: HttpErrorResponse): string {
  const problema = problemDetails(error);

  if (error.status === 0) {
    return 'No se pudo contactar al servidor. Verificá que la API esté levantada.';
  }

  return problema?.detail || problema?.title || 'Ocurrió un error inesperado.';
}

/**
 * Vuelca los errores de validación del backend (400) en los controles del
 * formulario, para que cada mensaje aparezca debajo de su campo.
 *
 * Las claves llegan en PascalCase (`NombreComercial`) y los controles están en
 * camelCase (`nombreComercial`).
 *
 * Devuelve los mensajes que no pudieron asignarse a ningún control, para que la
 * pantalla los muestre en un aviso general en lugar de tragárselos.
 */
export function aplicarErroresAlFormulario(
  formulario: FormGroup,
  errores: Record<string, string[]> | undefined
): string[] {
  const sinDestino: string[] = [];
  if (!errores) return sinDestino;

  for (const [clave, mensajes] of Object.entries(errores)) {
    const control = formulario.get(aCamelCase(clave));

    if (control) {
      control.setErrors({ ...(control.errors ?? {}), servidor: mensajes[0] });
      control.markAsTouched();
    } else {
      sinDestino.push(...mensajes);
    }
  }

  return sinDestino;
}

function aCamelCase(clave: string): string {
  return clave.charAt(0).toLowerCase() + clave.slice(1);
}
