import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RubroAbmDto } from '../../models/catalogo';
import { CatalogoService } from '../../services/catalogo.service';
import { NotificacionService } from '../../services/notificacion.service';
import { RubroService } from '../../services/rubro.service';
import { mensajeDeError } from '../../util/problem-details.util';
import { IconComponent } from '../icon/icon.component';
import { ModalComponent } from '../modal/modal.component';

/**
 * Administración de rubros: ver todos, crear, renombrar y dar de baja.
 *
 * Es el único catálogo con ABM. Los estados y los tipos de interacción son
 * enums del dominio y para agregar uno hay que tocar código; los rubros no,
 * y por eso se administran desde la aplicación.
 *
 * Se abre desde el formulario de comercio, que es donde aparece la necesidad:
 * si al cargar un comercio falta el rubro, se crea sin perder lo escrito.
 */
@Component({
  selector: 'app-rubros-abm',
  imports: [FormsModule, IconComponent, ModalComponent],
  templateUrl: './rubros-abm.component.html',
  styleUrl: './rubros-abm.component.css'
})
export class RubrosAbmComponent implements OnInit {

  cerrar = output<void>();

  private servicio = inject(RubroService);
  private catalogos = inject(CatalogoService);
  private notificacion = inject(NotificacionService);

  rubros = signal<RubroAbmDto[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);

  nuevoNombre = '';

  /** Id del rubro que se está renombrando, y el texto en edición. */
  editandoId = signal<number | null>(null);
  nombreEditado = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);

    this.servicio.Listar().subscribe({
      next: rubros => {
        this.rubros.set(rubros);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(error));
      }
    });
  }

  crear(): void {
    const nombre = this.nuevoNombre.trim();
    if (!nombre || this.guardando()) return;

    this.guardando.set(true);
    this.error.set(null);

    this.servicio.Crear({ nombre, activo: true }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.nuevoNombre = '';
        this.notificacion.exito('Rubro creado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        this.mostrarError(error);
      }
    });
  }

  empezarAEditar(rubro: RubroAbmDto): void {
    this.editandoId.set(rubro.id);
    this.nombreEditado = rubro.nombre;
    this.error.set(null);
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.nombreEditado = '';
  }

  guardarNombre(rubro: RubroAbmDto): void {
    const nombre = this.nombreEditado.trim();
    if (!nombre || this.guardando()) return;

    if (nombre === rubro.nombre) {
      this.cancelarEdicion();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.servicio.Actualizar(rubro.id, { nombre, activo: rubro.activo }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelarEdicion();
        this.notificacion.exito('Rubro actualizado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        this.mostrarError(error);
      }
    });
  }

  reactivar(rubro: RubroAbmDto): void {
    this.servicio.Actualizar(rubro.id, { nombre: rubro.nombre, activo: true }).subscribe({
      next: () => {
        this.notificacion.exito('Rubro reactivado');
        this.refrescar();
      }
    });
  }

  /**
   * La baja cambia de significado según el uso, así que la confirmación
   * también: si nadie lo usa se borra, y si hay comercios se desactiva. Decirlo
   * antes evita la sorpresa de "lo borré y sigue apareciendo".
   */
  async eliminar(rubro: RubroAbmDto): Promise<void> {
    const enUso = rubro.cantidadComercios > 0;

    const texto = enUso
      ? `"${rubro.nombre}" lo usan ${rubro.cantidadComercios} comercio(s), así que no se borra: ` +
        'queda desactivado y deja de ofrecerse para comercios nuevos. Los que ya lo tienen no cambian.'
      : `"${rubro.nombre}" no lo usa ningún comercio, así que se borra definitivamente.`;

    const confirmado = await this.notificacion.confirmar(
      enUso ? '¿Desactivar el rubro?' : '¿Eliminar el rubro?',
      texto,
      enUso ? 'Desactivar' : 'Eliminar'
    );

    if (!confirmado) return;

    this.servicio.Eliminar(rubro.id).subscribe({
      next: resultado => {
        this.notificacion.exito(resultado.eliminado ? 'Rubro eliminado' : 'Rubro desactivado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => this.mostrarError(error)
    });
  }

  /** Refresca la pantalla y además el combo del formulario que está detrás. */
  private refrescar(): void {
    this.cargar();
    this.catalogos.cargarRubros(true);
  }

  private mostrarError(error: HttpErrorResponse): void {
    // El 422 y el resto ya los avisa el interceptor; el 400 lo mostramos acá
    // porque este formulario es de un solo campo y no tiene dónde pintarlo.
    if (error.status === 400) {
      this.error.set('El nombre es obligatorio y no puede superar los 100 caracteres.');
    }
  }
}
