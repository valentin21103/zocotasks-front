import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

/**
 * Único punto donde la aplicación le habla al usuario.
 *
 * Existe para que la librería de diálogos quede detrás de una interfaz propia:
 * si mañana se reemplaza SweetAlert2, se toca este archivo y ningún otro.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {

  exito(mensaje: string): void {
    Swal.fire({
      icon: 'success',
      title: mensaje,
      toast: true,
      position: 'top-end',
      timer: 2500,
      showConfirmButton: false
    });
  }

  error(mensaje: string, titulo = 'Error'): void {
    Swal.fire({ icon: 'error', title: titulo, text: mensaje });
  }

  advertencia(mensaje: string, titulo = 'Atención'): void {
    Swal.fire({ icon: 'warning', title: titulo, text: mensaje });
  }

  /** Confirmación destructiva. Resuelve en `true` solo si el usuario acepta. */
  async confirmar(titulo: string, texto: string, textoBoton = 'Eliminar'): Promise<boolean> {
    const resultado = await Swal.fire({
      icon: 'warning',
      title: titulo,
      text: texto,
      showCancelButton: true,
      confirmButtonText: textoBoton,
      cancelButtonText: 'Cancelar',
      focusCancel: true
    });

    return resultado.isConfirmed;
  }

  /**
   * Caso del 409 por concurrencia: no alcanza con avisar, hay que ofrecer una
   * salida. Resuelve en `true` si el usuario quiere recargar el registro.
   */
  async conflictoDeConcurrencia(mensaje: string): Promise<boolean> {
    const resultado = await Swal.fire({
      icon: 'warning',
      title: 'El registro cambió mientras lo editabas',
      text: mensaje,
      showCancelButton: true,
      confirmButtonText: 'Recargar y ver los datos actuales',
      cancelButtonText: 'Seguir editando'
    });

    return resultado.isConfirmed;
  }
}
