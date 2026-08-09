import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InteraccionService } from '../../../features/comercio-detalle/interaccion.service';
import { CrearInteraccionDto, TIPOS_INTERACCION, TipoInteraccion } from '../../models/interaccion';
import { NotificacionService } from '../../services/notificacion.service';
import {
  aplicarErroresAlFormulario,
  mensajeDeError,
  problemDetails
} from '../../util/problem-details.util';
import { ModalComponent } from '../modal/modal.component';

/**
 * Alta de interacciones.
 *
 * Las interacciones no llevan `If-Match`: se agregan y se borran, no se editan,
 * así que no hay dos usuarios pisándose sobre la misma fila.
 */
@Component({
  selector: 'app-interaccion-form',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './interaccion-form.component.html',
  styleUrl: './interaccion-form.component.css'
})
export class InteraccionFormComponent {

  comercioId = input.required<number>();

  guardado = output<void>();
  cerrar = output<void>();

  private fb = inject(FormBuilder);
  private servicio = inject(InteraccionService);
  private notificacion = inject(NotificacionService);

  tipos = TIPOS_INTERACCION;
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  /** `datetime-local` necesita el formato `YYYY-MM-DDTHH:mm` en hora local. */
  maximo = this.aDatetimeLocal(new Date());

  formulario = this.fb.nonNullable.group({
    tipo: ['Llamada' as TipoInteraccion, [Validators.required]],
    fecha: [this.aDatetimeLocal(new Date())],
    detalle: ['', [Validators.required, Validators.maxLength(2000)]]
  });

  get controles() {
    return this.formulario.controls;
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();

    // El backend rechaza fechas futuras. Avisamos antes de gastar el viaje.
    if (valor.fecha && new Date(valor.fecha).getTime() > Date.now()) {
      this.errorGeneral.set('La fecha no puede ser futura.');
      return;
    }

    const dto: CrearInteraccionDto = {
      tipo: valor.tipo,
      detalle: valor.detalle.trim(),
      ...(valor.fecha ? { fecha: new Date(valor.fecha).toISOString() } : {})
    };

    this.guardando.set(true);
    this.errorGeneral.set(null);

    this.servicio.Crear(this.comercioId(), dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificacion.exito('Interacción registrada');
        this.guardado.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);

        if (error.status === 400) {
          const sinDestino = aplicarErroresAlFormulario(
            this.formulario,
            problemDetails(error)?.errors
          );
          this.errorGeneral.set(
            sinDestino.length ? sinDestino.join(' ') : 'Revisá los campos marcados.'
          );
          return;
        }

        if (error.status !== 422) {
          this.errorGeneral.set(mensajeDeError(error));
        }
      }
    });
  }

  private aDatetimeLocal(fecha: Date): string {
    const desfase = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
  }
}
