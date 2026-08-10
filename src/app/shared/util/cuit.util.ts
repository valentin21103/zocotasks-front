import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validación del CUIT: once dígitos, nada más.
 *
 * Antes acá vivía la verificación del dígito verificador por módulo 11. Se sacó
 * cuando el backend dejó de exigirla.
 *
 * El motivo de sacarla es el que importa: **el frontend nunca puede ser más
 * estricto que el servidor**. Si el backend acepta un CUIT y el formulario lo
 * rechaza, el usuario se queda con un dato válido que el sistema no le deja
 * cargar, y sin ninguna forma de entender por qué. Una validación de cliente
 * puede ser más permisiva —el servidor rechaza después—, nunca al revés.
 */
export function cuitEsValido(valor: string): boolean {
  return soloDigitos(valor).length === 11;
}

/** Deja pasar el vacío: de la obligatoriedad se ocupa `Validators.required`. */
export function validadorCuit(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '').trim();
  if (!valor) return null;

  return cuitEsValido(valor) ? null : { cuit: true };
}

/** El backend acepta con o sin guiones, pero guarda solo dígitos. */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** Los once dígitos que devuelve el backend, con el formato con el que se lee. */
export function formatearCuit(valor: string): string {
  const digitos = soloDigitos(valor);
  if (digitos.length !== 11) return valor;

  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
}
