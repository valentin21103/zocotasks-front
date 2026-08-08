import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalisisOportunidadDto } from '../../shared/models/analisis';

/**
 * "Analizar oportunidad".
 *
 * Dos cosas que condicionan la interfaz:
 *  - Tarda entre 2 y 5 segundos: hace falta un estado de carga visible.
 *  - Puede volver con `esDegradado: true` y status 200. Eso significa que el
 *    proveedor de IA falló, no que la request haya fallado: se muestra como
 *    aviso, nunca como error.
 *
 * El resultado no se persiste: cada llamada vuelve a consultar al modelo.
 */
@Injectable({ providedIn: 'root' })
export class AnalisisService {

  private http = inject(HttpClient);

  Analizar(comercioId: number): Observable<AnalisisOportunidadDto> {
    return this.http.post<AnalisisOportunidadDto>(
      `${environment.apiUrl}/api/comercios/${comercioId}/analisis`,
      {}
    );
  }
}
