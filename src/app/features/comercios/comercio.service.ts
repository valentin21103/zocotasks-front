import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarComercioDto,
  ComercioDetalleDto,
  ComercioFiltro,
  ComercioListItemDto,
  CrearComercioDto,
  EstadoComercio
} from '../../shared/models/comercio';
import { PagedResult } from '../../shared/models/paginacion';

/**
 * Acceso a `/api/comercios`.
 *
 * **Este servicio es el único lugar del frontend que conoce el ETag.** Guarda el
 * que devuelve cada GET y lo reenvía como `If-Match` en toda escritura, así
 * ningún componente tiene que acordarse de hacerlo: el 428 pasa a ser imposible
 * por construcción en lugar de algo que hay que recordar.
 *
 * Esto funciona solo porque el backend expone el header vía CORS con
 * `WithExposedHeaders("ETag")`; sin eso el navegador no dejaría leerlo.
 */
@Injectable({ providedIn: 'root' })
export class ComercioService {

  private apiUrl = `${environment.apiUrl}/api/comercios`;
  private http = inject(HttpClient);

  /** ETag vigente por comercio. */
  private etags = new Map<number, string>();

  Listar(filtro: ComercioFiltro): Observable<PagedResult<ComercioListItemDto>> {
    return this.http.get<PagedResult<ComercioListItemDto>>(this.apiUrl, {
      params: this.aParams(filtro)
    });
  }

  ObtenerPorId(id: number): Observable<ComercioDetalleDto> {
    return this.http
      .get<ComercioDetalleDto>(`${this.apiUrl}/${id}`, { observe: 'response' })
      .pipe(map(respuesta => this.guardarEtag(id, respuesta)));
  }

  Crear(dto: CrearComercioDto): Observable<ComercioDetalleDto> {
    return this.http
      .post<ComercioDetalleDto>(this.apiUrl, dto, { observe: 'response' })
      .pipe(map(respuesta => this.guardarEtag(respuesta.body!.id, respuesta)));
  }

  Actualizar(id: number, dto: ActualizarComercioDto): Observable<ComercioDetalleDto> {
    const ifMatch = this.etags.get(id);
    if (!ifMatch) return this.sinEtag(id);

    return this.http
      .put<ComercioDetalleDto>(`${this.apiUrl}/${id}`, dto, {
        observe: 'response',
        headers: { 'If-Match': ifMatch }
      })
      .pipe(map(respuesta => this.guardarEtag(id, respuesta)));
  }

  /**
   * El estado tiene endpoint propio, separado de la edición: si se pudiera
   * mandar en el PUT, se podría saltear la máquina de estados del backend.
   */
  CambiarEstado(id: number, nuevoEstado: EstadoComercio): Observable<ComercioDetalleDto> {
    const ifMatch = this.etags.get(id);
    if (!ifMatch) return this.sinEtag(id);

    return this.http
      .patch<ComercioDetalleDto>(
        `${this.apiUrl}/${id}/estado`,
        { nuevoEstado },
        { observe: 'response', headers: { 'If-Match': ifMatch } }
      )
      .pipe(map(respuesta => this.guardarEtag(id, respuesta)));
  }

  /** Baja lógica: el comercio desaparece de las consultas y sus interacciones se conservan. */
  Eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        this.etags.delete(id);
      })
    );
  }

  private guardarEtag(id: number, respuesta: HttpResponse<ComercioDetalleDto>): ComercioDetalleDto {
    const etag = respuesta.headers.get('ETag');
    if (etag) this.etags.set(id, etag);

    return respuesta.body!;
  }

  /**
   * Escribir sin ETag daría un 428. Se corta acá con un mensaje que dice cuál es
   * la causa real, en vez de dejar que el backend devuelva un error que no
   * explica que faltó pasar por el detalle.
   */
  private sinEtag(id: number): Observable<never> {
    return throwError(
      () => new Error(`No hay ETag para el comercio ${id}: hay que leer el detalle antes de escribir.`)
    );
  }

  /** Omite los parámetros vacíos para no ensuciar la URL con `estado=&rubroId=`. */
  private aParams(filtro: ComercioFiltro): HttpParams {
    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(filtro)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }

    return params;
  }
}
