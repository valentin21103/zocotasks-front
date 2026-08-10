import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AnalisisOportunidadDto } from '../../shared/models/analisis';
import { mensajeDeError } from '../../shared/util/problem-details.util';
import { AnalisisService } from './analisis.service';

/**
 * "Analizar oportunidad".
 *
 * El análisis se dispara con un botón y no al entrar a la solapa: cada
 * ejecución consume cuota del proveedor y tarda unos segundos. Una vez
 * generado queda en memoria mientras no se salga de la ficha, así moverse
 * entre solapas no cuesta una llamada cada vez.
 *
 * No se persiste del lado del backend, así que cada análisis refleja la
 * situación del comercio en ese momento. Por eso se muestra la fecha de
 * generación: dos análisis del mismo comercio pueden diferir.
 */
@Component({
  selector: 'app-analisis-panel',
  imports: [DatePipe, IconComponent],
  templateUrl: './analisis-panel.component.html',
  styleUrl: './analisis-panel.component.css'
})
export class AnalisisPanelComponent {

  comercioId = input.required<number>();

  private servicio = inject(AnalisisService);

  analizando = signal(false);
  analisis = signal<AnalisisOportunidadDto | null>(null);
  error = signal<string | null>(null);

  /** Color del nivel de interés. `Indeterminado` es gris: no es un nivel bajo, es "no sé". */
  claseNivel = computed(() => `nivel nivel-${(this.analisis()?.nivelInteres ?? '').toLowerCase()}`);

  analizar(): void {
    if (this.analizando()) return;

    this.analizando.set(true);
    this.error.set(null);

    this.servicio.Analizar(this.comercioId()).subscribe({
      next: analisis => {
        this.analizando.set(false);
        this.analisis.set(analisis);
      },
      error: (error: HttpErrorResponse) => {
        this.analizando.set(false);

        // Que el proveedor de IA falle no llega acá: el backend devuelve 200
        // con esDegradado. Esto es un error de verdad — la API caída, el
        // comercio borrado — y se muestra como tal.
        this.error.set(mensajeDeError(error));
      }
    });
  }
}
