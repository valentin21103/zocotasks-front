import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoCatalogoDto, RubroDto } from '../models/catalogo';

/**
 * Estados y rubros.
 *
 * Se piden una sola vez y se comparten con `shareReplay(1)`: son listas que no
 * cambian durante una sesión, así que pedirlas en cada pantalla sería tráfico
 * puro. Y nunca se hardcodean: los rubros tienen ABM del lado del backend, así
 * que agregar uno no debería requerir tocar el frontend.
 *
 * Los tipos de interacción no están acá a propósito: son un enum del dominio,
 * no un catálogo editable. Viven en `TIPOS_INTERACCION`, junto con el icono y
 * el color con los que se muestran.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoService {

  private apiUrl = `${environment.apiUrl}/api/catalogos`;
  private http = inject(HttpClient);

  readonly estados$: Observable<EstadoCatalogoDto[]> = this.http
    .get<EstadoCatalogoDto[]>(`${this.apiUrl}/estados`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly rubros$: Observable<RubroDto[]> = this.http
    .get<RubroDto[]>(`${this.apiUrl}/rubros`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));
}
