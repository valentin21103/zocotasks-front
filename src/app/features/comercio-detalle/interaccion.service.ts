import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearInteraccionDto, InteraccionDto } from '../../shared/models/interaccion';

/**
 * Interacciones de un comercio.
 *
 * No usan `If-Match`: se agregan y se borran, no se editan, así que no hay dos
 * usuarios pisándose sobre la misma fila.
 */
@Injectable({ providedIn: 'root' })
export class InteraccionService {

  private http = inject(HttpClient);

  private url(comercioId: number): string {
    return `${environment.apiUrl}/api/comercios/${comercioId}/interacciones`;
  }

  /** Llegan ordenadas de más reciente a más vieja. */
  Listar(comercioId: number): Observable<InteraccionDto[]> {
    return this.http.get<InteraccionDto[]>(this.url(comercioId));
  }

  Crear(comercioId: number, dto: CrearInteraccionDto): Observable<InteraccionDto> {
    return this.http.post<InteraccionDto>(this.url(comercioId), dto);
  }

  Eliminar(comercioId: number, interaccionId: number): Observable<void> {
    return this.http.delete<void>(`${this.url(comercioId)}/${interaccionId}`);
  }
}
