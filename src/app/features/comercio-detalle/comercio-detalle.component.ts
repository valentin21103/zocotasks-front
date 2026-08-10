import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, Input, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ComercioFormComponent } from '../../shared/components/comercio-form/comercio-form.component';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';
import { IconComponent, NombreIcono } from '../../shared/components/icon/icon.component';
import { InteraccionFormComponent } from '../../shared/components/interaccion-form/interaccion-form.component';
import { EstadoCatalogoDto, RubroDto } from '../../shared/models/catalogo';
import { ComercioDetalleDto, EstadoComercio } from '../../shared/models/comercio';
import { InteraccionDto, TIPOS_INTERACCION } from '../../shared/models/interaccion';
import { CatalogoService } from '../../shared/services/catalogo.service';
import { NotificacionService } from '../../shared/services/notificacion.service';
import { formatearCuit } from '../../shared/util/cuit.util';
import { codigoDeError, mensajeDeError } from '../../shared/util/problem-details.util';
import { ComercioService } from '../comercios/comercio.service';
import { InteraccionService } from './interaccion.service';

/**
 * Ficha del comercio.
 *
 * Es el centro de la aplicación: acá se ve todo, se edita, se elimina y se
 * registran las interacciones. El listado solo lleva hasta acá.
 *
 * El GET del detalle además deja el ETag guardado dentro de `ComercioService`,
 * que es lo que habilita después editar y cambiar de estado.
 */
@Component({
  selector: 'app-comercio-detalle',
  imports: [
    DatePipe,
    RouterLink,
    IconComponent,
    EstadoBadgeComponent,
    ComercioFormComponent,
    InteraccionFormComponent
  ],
  templateUrl: './comercio-detalle.component.html',
  styleUrl: './comercio-detalle.component.css'
})
export class ComercioDetalleComponent {

  private servicio = inject(ComercioService);
  private interacciones = inject(InteraccionService);
  private notificacion = inject(NotificacionService);
  private router = inject(Router);

  auth = inject(AuthService);
  catalogos = inject(CatalogoService);

  comercio = signal<ComercioDetalleDto | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  editando = signal(false);
  registrandoInteraccion = signal(false);
  cambiandoEstado = signal(false);
  menuAbierto = signal<number | null>(null);

  private id = signal(0);

  cuit = computed(() => {
    const comercio = this.comercio();
    return comercio ? formatearCuit(comercio.cuit) : '';
  });

  /**
   * El embudo completo, marcando dónde está el comercio y a dónde puede ir.
   *
   * Qué transiciones se habilitan **no lo decide el frontend**: viene en
   * `transicionesPosibles`, calculado por el backend según el estado actual. Hoy
   * el movimiento es libre y se habilitan todas menos la actual; si mañana la
   * regla se vuelve a restringir, acá se deshabilitan solas.
   */
  pasos = computed(() => {
    const comercio = this.comercio();
    if (!comercio) return [];

    return this.catalogos.estados().map(estado => ({
      codigo: estado.codigo as EstadoComercio,
      nombre: estado.nombre,
      actual: estado.codigo === comercio.estado,
      disponible: comercio.transicionesPosibles.includes(estado.codigo as EstadoComercio)
    }));
  });

  /**
   * El parámetro `:id` de la ruta llega como input gracias a
   * `withComponentInputBinding()`. Es un setter para que navegar de un comercio
   * a otro sin salir de la pantalla vuelva a cargar los datos.
   */
  @Input({ alias: 'id' }) set idDeRuta(valor: string) {
    this.id.set(Number(valor));
    this.cargar();
  }

  constructor() {
    this.catalogos.cargarEstados();
    this.catalogos.cargarRubros();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.servicio.ObtenerPorId(this.id()).subscribe({
      next: comercio => {
        this.comercio.set(comercio);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          error.status === 404
            ? 'Este comercio no existe o fue dado de baja.'
            : 'No se pudo cargar el comercio.'
        );
      }
    });
  }

  iconoDe(interaccion: InteraccionDto): NombreIcono {
    const tipo = TIPOS_INTERACCION.find(t => t.codigo === interaccion.tipo);
    return (tipo?.icono ?? 'nota') as NombreIcono;
  }

  claseDe(interaccion: InteraccionDto): string {
    return `avatar avatar-${interaccion.tipo.toLowerCase()}`;
  }

  alEditar(): void {
    this.editando.set(false);
    this.cargar();
  }

  alRegistrarInteraccion(): void {
    this.registrandoInteraccion.set(false);
    this.cargar();
  }

  alternarMenu(id: number): void {
    this.menuAbierto.update(abierto => (abierto === id ? null : id));
  }

  /**
   * Mover el comercio en el embudo.
   *
   * Va por `PATCH /estado` con el `If-Match` que el servicio ya tiene guardado
   * del GET del detalle. Si otro usuario movió el comercio mientras esta
   * pantalla estaba abierta, el backend responde 409 y se ofrece recargar.
   */
  async cambiarEstado(nuevoEstado: EstadoComercio, nombre: string): Promise<void> {
    const comercio = this.comercio();
    if (!comercio || this.cambiandoEstado()) return;

    const confirmado = await this.notificacion.confirmar(
      `¿Mover a ${nombre}?`,
      `"${comercio.nombreComercial}" pasa de ${comercio.estadoNombre} a ${nombre}.`,
      `Sí, mover a ${nombre}`
    );

    if (!confirmado) return;

    this.cambiandoEstado.set(true);

    this.servicio.CambiarEstado(comercio.id, nuevoEstado).subscribe({
      next: actualizado => {
        this.cambiandoEstado.set(false);
        this.comercio.set(actualizado);
        this.notificacion.exito(`Estado actualizado a ${nombre}`);
      },
      error: async (error: HttpErrorResponse) => {
        this.cambiandoEstado.set(false);

        if (codigoDeError(error) === 'conflicto_de_concurrencia') {
          const recargar = await this.notificacion.conflictoDeConcurrencia(mensajeDeError(error));
          if (recargar) this.cargar();
        }
      }
    });
  }

  async eliminar(): Promise<void> {
    const comercio = this.comercio();
    if (!comercio) return;

    const confirmado = await this.notificacion.confirmar(
      '¿Eliminar el comercio?',
      `"${comercio.nombreComercial}" deja de aparecer en el listado. Sus interacciones se conservan.`
    );

    if (!confirmado) return;

    this.servicio.Eliminar(comercio.id).subscribe({
      next: () => {
        this.notificacion.exito('Comercio eliminado');
        this.router.navigate(['/comercios']);
      }
    });
  }

  async eliminarInteraccion(interaccion: InteraccionDto): Promise<void> {
    this.menuAbierto.set(null);

    const confirmado = await this.notificacion.confirmar(
      '¿Eliminar la interacción?',
      'Se borra del historial del comercio y no se puede recuperar.'
    );

    if (!confirmado) return;

    this.interacciones.Eliminar(this.id(), interaccion.id).subscribe({
      next: () => {
        this.notificacion.exito('Interacción eliminada');
        this.cargar();
      }
    });
  }
}
