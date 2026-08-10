import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuardarRubroDto, ResultadoBajaRubroDto, RubroAbmDto } from '../models/catalogo';

/**
 * ABM de rubros.
 *
 * Va contra `/api/rubros`, que es distinto de `/api/catalogos/rubros`: aquel es
 * solo lectura y devuelve únicamente los activos para llenar el combo; este
 * administra, y por eso trae también los dados de baja.
 */
@Injectable({ providedIn: 'root' })
export class RubroService {

  private apiUrl = `${environment.apiUrl}/api/rubros`;
  private http = inject(HttpClient);

  Listar(): Observable<RubroAbmDto[]> {
    return this.http.get<RubroAbmDto[]>(this.apiUrl);
  }

  Crear(dto: GuardarRubroDto): Observable<RubroAbmDto> {
    return this.http.post<RubroAbmDto>(this.apiUrl, dto);
  }

  Actualizar(id: number, dto: GuardarRubroDto): Observable<RubroAbmDto> {
    return this.http.put<RubroAbmDto>(`${this.apiUrl}/${id}`, dto);
  }

  /** Borra si no lo usa nadie; si tiene comercios, lo desactiva. */
  Eliminar(id: number): Observable<ResultadoBajaRubroDto> {
    return this.http.delete<ResultadoBajaRubroDto>(`${this.apiUrl}/${id}`);
  }
}
