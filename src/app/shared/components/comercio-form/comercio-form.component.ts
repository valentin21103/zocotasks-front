import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of, switchMap } from 'rxjs';
import { ComercioService } from '../../../features/comercios/comercio.service';
import { EstadoCatalogoDto, RubroDto } from '../../models/catalogo';
import {
  ComercioDetalleDto,
  CrearComercioDto,
  EstadoComercio
} from '../../models/comercio';
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
 * Alta y edición de comercios.
 *
 * En edición incluye el estado, aunque el backend no lo acepte en el PUT: se
 * guarda con dos llamadas, primero los datos y después la transición por su
 * endpoint propio. Es deliberado del lado del servidor —si el estado viajara en
 * el PUT se podría saltear la máquina de estados—, pero para el usuario editar
 * un comercio es una sola acción y así se comporta.
 *
 * El combo de estado se arma con `transicionesPosibles`, que ya vienen
 * calculadas: es imposible elegir una transición inválida.
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
  estados = input.required<EstadoCatalogoDto[]>();

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

  /** El estado actual más las transiciones permitidas desde él. */
  estadosDisponibles = computed(() => {
    const actual = this.detalle();
    if (!actual) return [];

    return [actual.estado, ...actual.transicionesPosibles].map(codigo => ({
      codigo,
      nombre: this.estados().find(e => e.codigo === codigo)?.nombre ?? codigo
    }));
  });

  formulario = this.fb.nonNullable.group({
    nombreComercial: ['', [Validators.required, Validators.maxLength(150)]],
    cuit: ['', [Validators.required, validadorCuit]],
    nombreContacto: ['', [Validators.required, Validators.maxLength(120)]],
    telefono: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    rubroId: [0, [Validators.required, Validators.min(1)]],
    estado: [''],
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
      ? this.actualizar(detalle)
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

  /**
   * Primero los datos y después el estado, si cambió.
   *
   * El orden importa: el PUT devuelve un ETag nuevo que el servicio guarda, y el
   * PATCH necesita ese valor. Al revés, el segundo pedido iría con el token
   * viejo y el backend respondería 409.
   */
  private actualizar(detalle: ComercioDetalleDto): Observable<ComercioDetalleDto> {
    const nuevoEstado = this.formulario.controls.estado.value as EstadoComercio;
    const cambioElEstado = nuevoEstado !== detalle.estado;

    return this.servicio.Actualizar(detalle.id, this.aDto()).pipe(
      switchMap(actualizado =>
        cambioElEstado
          ? this.servicio.CambiarEstado(detalle.id, nuevoEstado)
          : of(actualizado)
      )
    );
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
      estado: comercio.estado,
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

    // Otro usuario grabó primero. Se le ofrece traer los datos actuales; el
    // 409 por transición inválida ya lo avisa el interceptor.
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
