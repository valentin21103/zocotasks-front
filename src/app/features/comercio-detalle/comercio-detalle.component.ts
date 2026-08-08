import { Component, Input } from '@angular/core';

/**
 * Ficha del comercio: datos, timeline de interacciones y "Analizar oportunidad".
 * Se implementa en un bloque posterior.
 */
@Component({
  selector: 'app-comercio-detalle',
  imports: [],
  templateUrl: './comercio-detalle.component.html',
  styleUrl: './comercio-detalle.component.css'
})
export class ComercioDetalleComponent {
  /** Llega del parámetro de ruta gracias a `withComponentInputBinding()`. */
  @Input() id!: string;
}
