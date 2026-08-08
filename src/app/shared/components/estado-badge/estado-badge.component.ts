import { Component, computed, input } from '@angular/core';
import { EstadoComercio } from '../../models/comercio';

/**
 * Píldora de estado.
 *
 * Recibe el código (`Documentacion`) para elegir el color y el nombre para
 * mostrar (`Documentación`) para el texto, que es el que trae la tilde.
 */
@Component({
  selector: 'app-estado-badge',
  imports: [],
  template: `<span [class]="clase()">{{ texto() }}</span>`,
  styleUrl: './estado-badge.component.css'
})
export class EstadoBadgeComponent {
  estado = input.required<EstadoComercio>();
  nombre = input<string | undefined>(undefined);

  clase = computed(() => `badge badge-${this.estado().toLowerCase()}`);
  texto = computed(() => this.nombre() ?? this.estado());
}
