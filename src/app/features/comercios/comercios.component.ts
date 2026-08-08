import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ComercioFormComponent } from '../../shared/components/comercio-form/comercio-form.component';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EstadoCatalogoDto, RubroDto } from '../../shared/models/catalogo';
import {
  ComercioDetalleDto,
  ComercioFiltro,
  ComercioListItemDto,
  EstadoComercio,
  OrdenComercio
} from '../../shared/models/comercio';
import { PagedResult, TAMANO_PAGINA_DEFECTO } from '../../shared/models/paginacion';
import { CatalogoService } from '../../shared/services/catalogo.service';
import { NotificacionService } from '../../shared/services/notificacion.service';
import { ComercioService } from './comercio.service';

/** Columnas por las que se puede ordenar. `fecha` es el orden por defecto del backend. */
type ColumnaOrden = OrdenComercio | 'fecha';

/**
 * Listado de comercios.
 *
 * Búsqueda, filtros, orden y paginación se resuelven **en el servidor** y viven
 * en los query params de la URL. El componente no guarda una copia del filtro:
 * lee la ruta y consulta. Así refrescar no pierde el contexto, el botón "atrás"
 * funciona y un listado filtrado se puede compartir por link.
 */
@Component({
  selector: 'app-comercios',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    IconComponent,
    EstadoBadgeComponent,
    ComercioFormComponent
  ],
  templateUrl: './comercios.component.html',
  styleUrl: './comercios.component.css'
})
export class ComerciosComponent implements OnInit {

  private servicio = inject(ComercioService);
  private catalogos = inject(CatalogoService);
  private notificacion = inject(NotificacionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  auth = inject(AuthService);

  cargando = signal(true);
  error = signal<string | null>(null);
  resultado = signal<PagedResult<ComercioListItemDto> | null>(null);

  estados = signal<EstadoCatalogoDto[]>([]);
  rubros = signal<RubroDto[]>([]);

  filtro = signal<ComercioFiltro>({});

  /** Abierto en alta cuando el detalle es `null`; en edición cuando trae uno. */
  formularioAbierto = signal(false);
  comercioEnEdicion = signal<ComercioDetalleDto | null>(null);

  busqueda = new FormControl('', { nonNullable: true });

  columnaOrden = computed<ColumnaOrden>(() => this.filtro().ordenarPor ?? 'fecha');
  descendente = computed(() => this.filtro().descendente ?? true);

  hayFiltros = computed(() => {
    const filtro = this.filtro();
    return Boolean(filtro.busqueda || filtro.estado || filtro.rubroId || filtro.ordenarPor);
  });

  desde = computed(() => {
    const resultado = this.resultado();
    if (!resultado?.total) return 0;
    return (resultado.pagina - 1) * resultado.tamanoPagina + 1;
  });

  hasta = computed(() => {
    const resultado = this.resultado();
    if (!resultado?.total) return 0;
    return Math.min(resultado.pagina * resultado.tamanoPagina, resultado.total);
  });

  /** Ventana de hasta cinco páginas alrededor de la actual. */
  paginas = computed(() => {
    const resultado = this.resultado();
    if (!resultado || resultado.totalPaginas <= 1) return [];

    const ventana = 5;
    let inicio = Math.max(1, resultado.pagina - Math.floor(ventana / 2));
    const fin = Math.min(resultado.totalPaginas, inicio + ventana - 1);
    inicio = Math.max(1, fin - ventana + 1);

    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  ngOnInit(): void {
    this.catalogos.estados$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: estados => this.estados.set(estados), error: () => {} });

    this.catalogos.rubros$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: rubros => this.rubros.set(rubros), error: () => {} });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const filtro = this.leerFiltro(params);
        this.filtro.set(filtro);

        // El input se sincroniza sin volver a disparar la navegación, para no
        // entrar en un ciclo entre la URL y el control.
        if (this.busqueda.value !== (filtro.busqueda ?? '')) {
          this.busqueda.setValue(filtro.busqueda ?? '', { emitEvent: false });
        }

        this.cargar();
      });

    // Sin debounce se dispararía una consulta por tecla.
    this.busqueda.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(valor => this.navegar({ busqueda: valor.trim() || null, pagina: null }));
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.servicio.Listar(this.filtro()).subscribe({
      next: resultado => {
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          error.status === 0
            ? 'No se pudo contactar al servidor. Verificá que la API esté levantada.'
            : 'No se pudieron cargar los comercios.'
        );
      }
    });
  }

  filtrarPorEstado(valor: string): void {
    this.navegar({ estado: valor || null, pagina: null });
  }

  filtrarPorRubro(valor: string): void {
    this.navegar({ rubroId: valor || null, pagina: null });
  }

  ordenarPor(columna: ColumnaOrden): void {
    const esLaMisma = this.columnaOrden() === columna;

    // Al cambiar de columna: las de texto arrancan ascendentes y la fecha
    // descendente, que es lo que uno espera de "lo más nuevo primero".
    const descendente = esLaMisma ? !this.descendente() : columna === 'fecha';

    this.navegar({
      ordenarPor: columna === 'fecha' ? null : columna,
      descendente: String(descendente),
      pagina: null
    });
  }

  irAPagina(pagina: number): void {
    this.navegar({ pagina: pagina === 1 ? null : String(pagina) });
  }

  limpiar(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  nuevo(): void {
    this.comercioEnEdicion.set(null);
    this.formularioAbierto.set(true);
  }

  /**
   * El listado no trae las notas ni las transiciones posibles, así que editar
   * empieza por leer el detalle. Ese GET además deja el ETag guardado en el
   * servicio, que es lo que después habilita el guardado.
   */
  editar(comercio: ComercioListItemDto): void {
    this.servicio.ObtenerPorId(comercio.id).subscribe({
      next: detalle => {
        this.comercioEnEdicion.set(detalle);
        this.formularioAbierto.set(true);
      }
    });
  }

  async eliminar(comercio: ComercioListItemDto): Promise<void> {
    const confirmado = await this.notificacion.confirmar(
      '¿Eliminar el comercio?',
      `"${comercio.nombreComercial}" deja de aparecer en el listado. Sus interacciones se conservan.`
    );

    if (!confirmado) return;

    this.servicio.Eliminar(comercio.id).subscribe({
      next: () => {
        this.notificacion.exito('Comercio eliminado');
        this.cargar();
      }
    });
  }

  alGuardar(): void {
    this.cerrarFormulario();
    this.cargar();
  }

  cerrarFormulario(): void {
    this.formularioAbierto.set(false);
    this.comercioEnEdicion.set(null);
  }

  private leerFiltro(params: ParamMap): ComercioFiltro {
    const filtro: ComercioFiltro = { tamanoPagina: TAMANO_PAGINA_DEFECTO, pagina: 1 };

    const busqueda = params.get('busqueda');
    if (busqueda) filtro.busqueda = busqueda;

    const estado = params.get('estado');
    if (estado) filtro.estado = estado as EstadoComercio;

    const rubroId = params.get('rubroId');
    if (rubroId) filtro.rubroId = Number(rubroId);

    const ordenarPor = params.get('ordenarPor');
    if (ordenarPor) filtro.ordenarPor = ordenarPor as OrdenComercio;

    const descendente = params.get('descendente');
    if (descendente !== null) filtro.descendente = descendente === 'true';

    const pagina = params.get('pagina');
    if (pagina) filtro.pagina = Math.max(1, Number(pagina) || 1);

    return filtro;
  }

  /** `null` en un parámetro lo saca de la URL en vez de dejarlo vacío. */
  private navegar(cambios: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cambios,
      queryParamsHandling: 'merge'
    });
  }
}
