import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EstadoCatalogoDto, RubroDto } from '../models/catalogo';

/**
 * Estados y rubros para los combos.
 *
 * Se piden una sola vez y quedan en signals que las pantallas leen directo. Son
 * listas que no cambian durante una sesión, así que pedirlas en cada pantalla
 * sería tráfico puro.
 *
 * `cargarRubros(true)` fuerza el refresco: hace falta después del ABM, porque
 * ahí sí la lista cambia mientras la aplicación corre.
 *
 * Los tipos de interacción no están acá a propósito: son un enum del dominio,
 * no un catálogo editable. Viven en `TIPOS_INTERACCION`, junto con el icono y
 * el color con los que se muestran.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoService {

  private apiUrl = `${environment.apiUrl}/api/catalogos`;
  private http = inject(HttpClient);

  readonly estados = signal<EstadoCatalogoDto[]>([]);
  readonly rubros = signal<RubroDto[]>([]);

  private estadosPedidos = false;
  private rubrosPedidos = false;

  cargarEstados(): void {
    if (this.estadosPedidos) return;
    this.estadosPedidos = true;

    this.http.get<EstadoCatalogoDto[]>(`${this.apiUrl}/estados`).subscribe({
      next: estados => this.estados.set(estados),
      // Si falló, se permite reintentar en la próxima pantalla en vez de
      // quedarse con la lista vacía para siempre.
      error: () => (this.estadosPedidos = false)
    });
  }

  cargarRubros(forzar = false): void {
    if (this.rubrosPedidos && !forzar) return;
    this.rubrosPedidos = true;

    this.http.get<RubroDto[]>(`${this.apiUrl}/rubros`).subscribe({
      next: rubros => this.rubros.set(rubros),
      error: () => (this.rubrosPedidos = false)
    });
  }
}
