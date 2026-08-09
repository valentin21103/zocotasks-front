import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ComercioService } from '../../../features/comercios/comercio.service';
import { RubroDto } from '../../models/catalogo';
import { ComercioDetalleDto, CrearComercioDto } from '../../models/comercio';
import { NotificacionService } from '../../services/notificacion.service';
import { soloDigitos, validadorCuit } from '../../util/cuit.util';
import {
  aplicarErroresAlFormulario,
  codigoDeError,
  mensajeDeError,
  problemDetails
} from '../../util/problem-details.util';
import { ModalComponent } from '../modal/modal.component';

/**
 * Alta y edición de los datos del comercio.
 *
 * El estado no está acá: tiene su propio apartado en la ficha. Son dos acciones
 * distintas —corregir un teléfono no es lo mismo que mover una oportunidad en
 * el embudo— y el backend también las separa en dos endpoints.
 */
@Component({
  selector: 'app-comercio-form',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './comercio-form.component.html',
  styleUrl: './comercio-form.component.css'
})
export class ComercioFormComponent implements OnInit {

  /** `null` es alta; con detalle es edición. */
  comercio = input<ComercioDetalleDto | null>(null);
  rubros = input.required<RubroDto[]>();

  guardado = output<void>();
  cerrar = output<void>();

  private fb = inject(FormBuilder);
  private servicio = inject(ComercioService);
  private notificacion = inject(NotificacionService);

  guardando = signal(false);
  errorGeneral = signal<string | null>(null);
  detalle = signal<ComercioDetalleDto | null>(null);

  esEdicion = computed(() => this.detalle() !== null);
  titulo = computed(() => (this.esEdicion() ? 'Editar comercio' : 'Nuevo comercio'));

  formulario = this.fb.nonNullable.group({
    nombreComercial: ['', [Validators.required, Validators.maxLength(150)]],
    cuit: ['', [Validators.required, validadorCuit]],
    nombreContacto: ['', [Validators.required, Validators.maxLength(120)]],
    telefono: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    rubroId: [0, [Validators.required, Validators.min(1)]],
    notas: ['', [Validators.maxLength(4000)]]
  });

  get controles() {
    return this.formulario.controls;
  }

  ngOnInit(): void {
    const comercio = this.comercio();
    if (comercio) this.cargar(comercio);
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const detalle = this.detalle();

    const peticion: Observable<ComercioDetalleDto> = detalle
      ? this.servicio.Actualizar(detalle.id, this.aDto())
      : this.servicio.Crear(this.aDto());

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificacion.exito(detalle ? 'Comercio actualizado' : 'Comercio creado');
        this.guardado.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        this.manejarError(error);
      }
    });
  }

  private aDto(): CrearComercioDto {
    const valor = this.formulario.getRawValue();

    return {
      nombreComercial: valor.nombreComercial.trim(),
      cuit: soloDigitos(valor.cuit),
      nombreContacto: valor.nombreContacto.trim(),
      telefono: valor.telefono.trim() || null,
      email: valor.email.trim() || null,
      rubroId: Number(valor.rubroId),
      notas: valor.notas.trim() || null
    };
  }

  private cargar(comercio: ComercioDetalleDto): void {
    this.detalle.set(comercio);

    this.formulario.patchValue({
      nombreComercial: comercio.nombreComercial,
      cuit: comercio.cuit,
      nombreContacto: comercio.nombreContacto,
      telefono: comercio.telefono ?? '',
      email: comercio.email ?? '',
      rubroId: comercio.rubroId,
      notas: comercio.notas ?? ''
    });
  }

  private manejarError(error: HttpErrorResponse): void {
    // 400: cada mensaje va a su campo. Lo que no matchee ningún control se
    // muestra arriba en vez de perderse.
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

    // Otro usuario grabó primero: se le ofrece traer los datos actuales.
    if (error.status === 409 && codigoDeError(error) === 'conflicto_de_concurrencia') {
      this.resolverConflicto(mensajeDeError(error));
      return;
    }

    // 422 y el resto los muestra el interceptor: acá no se duplica el aviso.
    if (error.status !== 422) {
      this.errorGeneral.set(mensajeDeError(error));
    }
  }

  private async resolverConflicto(mensaje: string): Promise<void> {
    const recargar = await this.notificacion.conflictoDeConcurrencia(mensaje);
    if (!recargar) return;

    const id = this.detalle()!.id;

    // Volver a leer el detalle refresca además el ETag dentro del servicio,
    // así el siguiente intento de guardar parte de la versión correcta.
    this.servicio.ObtenerPorId(id).subscribe({
      next: actualizado => {
        this.cargar(actualizado);
        this.errorGeneral.set('Se cargaron los datos actuales. Revisá los cambios y guardá de nuevo.');
      }
    });
  }
}
