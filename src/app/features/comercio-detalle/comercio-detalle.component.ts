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
import { ComercioDetalleDto } from '../../shared/models/comercio';
import { InteraccionDto, TIPOS_INTERACCION } from '../../shared/models/interaccion';
import { CatalogoService } from '../../shared/services/catalogo.service';
import { NotificacionService } from '../../shared/services/notificacion.service';
import { formatearCuit } from '../../shared/util/cuit.util';
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
  private catalogos = inject(CatalogoService);
  private notificacion = inject(NotificacionService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  auth = inject(AuthService);

  comercio = signal<ComercioDetalleDto | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  estados = signal<EstadoCatalogoDto[]>([]);
  rubros = signal<RubroDto[]>([]);

  editando = signal(false);
  registrandoInteraccion = signal(false);
  menuAbierto = signal<number | null>(null);

  private id = signal(0);

  cuit = computed(() => {
    const comercio = this.comercio();
    return comercio ? formatearCuit(comercio.cuit) : '';
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
    this.catalogos.estados$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: estados => this.estados.set(estados), error: () => {} });

    this.catalogos.rubros$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: rubros => this.rubros.set(rubros), error: () => {} });
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
