import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Modal sobre el elemento nativo `<dialog>`.
 *
 * Sin librería de diálogos: `showModal()` ya trae gratis el foco atrapado, el
 * cierre con Escape y el fondo inerte, que es todo lo que aporta una librería
 * acá. SweetAlert2 se sigue usando para avisos y confirmaciones, pero un
 * formulario con validación reactiva necesita ser un componente de Angular.
 *
 * El padre lo monta y desmonta con `@if`: cerrarlo emite `cerrar` y quien
 * decide es el padre.
 */
@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  template: `
    <dialog #dialogo class="modal" (close)="cerrar.emit()" (click)="alClickEnElFondo($event)">
      <div class="caja">
        <header>
          <h2>{{ titulo() }}</h2>
          <button type="button" class="cerrar" aria-label="Cerrar" (click)="cerrarDialogo()">
            <app-icon nombre="cerrar" [tamano]="20" />
          </button>
        </header>

        <div class="cuerpo">
          <ng-content />
        </div>
      </div>
    </dialog>
  `,
  styleUrl: './modal.component.css'
})
export class ModalComponent implements AfterViewInit {
  titulo = input.required<string>();
  cerrar = output<void>();

  private dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  ngAfterViewInit(): void {
    this.dialogo().nativeElement.showModal();
  }

  cerrarDialogo(): void {
    this.dialogo().nativeElement.close();
  }

  /** Click fuera de la caja: el target es el propio `<dialog>`, no su contenido. */
  alClickEnElFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) {
      this.cerrarDialogo();
    }
  }
}
