import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Verificación de CUIT por módulo 11.
 *
 * Los primeros diez dígitos se multiplican por una serie fija de pesos; el resto
 * de dividir la suma por 11 determina el dígito verificador, que tiene que
 * coincidir con el último.
 *
 * El backend valida exactamente lo mismo. Esto es usabilidad —avisar sin
 * esperar el viaje al servidor—, no seguridad: la validación que manda es la
 * del servidor, y sus errores se muestran igual.
 */
export function cuitEsValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '');
  if (digitos.length !== 11) return false;

  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acumulado, peso, i) => acumulado + peso * Number(digitos[i]), 0);

  let verificador = 11 - (suma % 11);
  if (verificador === 11) verificador = 0;
  if (verificador === 10) verificador = 9;

  return verificador === Number(digitos[10]);
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
