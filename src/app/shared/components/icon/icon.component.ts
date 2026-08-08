import { Component, input } from '@angular/core';

export type NombreIcono =
  | 'buscar' | 'ojo' | 'lapiz' | 'tacho' | 'mas' | 'cerrar'
  | 'anterior' | 'siguiente' | 'volver' | 'orden'
  | 'llamada' | 'whatsapp' | 'reunion' | 'email' | 'nota' | 'puntos'
  | 'chispa';

/**
 * Iconos como SVG inline.
 *
 * Sin librería de iconos: son quince trazos y una dependencia externa para esto
 * agregaría peso al bundle y un punto de falla para nada. `currentColor` hace
 * que cada icono tome el color del texto donde está.
 */
@Component({
  selector: 'app-icon',
  imports: [],
  template: `
    @switch (nombre()) {
      @case ('buscar') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
        </svg>
      }
      @case ('ojo') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      }
      @case ('lapiz') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m14.5 5.5 4 4" />
        </svg>
      }
      @case ('tacho') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 7h16" /><path d="M10 4h4" />
          <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      }
      @case ('mas') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      }
      @case ('cerrar') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      }
      @case ('anterior') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m14 6-6 6 6 6" />
        </svg>
      }
      @case ('siguiente') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m10 6 6 6-6 6" />
        </svg>
      }
      @case ('volver') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 12H4" /><path d="m10 6-6 6 6 6" />
        </svg>
      }
      @case ('orden') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14" /><path d="m7 10 5-5 5 5" />
        </svg>
      }
      @case ('llamada') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.2 2 2 0 0 1 6.5 3Z" />
        </svg>
      }
      @case ('whatsapp') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3.5 20.5 5 16a8 8 0 1 1 3 3l-4.5 1.5Z" />
          <path d="M9 9.5c.5 2.5 3 5 5.5 5.5" />
        </svg>
      }
      @case ('reunion') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" />
          <path d="M16 5.5a3 3 0 0 1 0 5.5" /><path d="M17.5 20a5.5 5.5 0 0 0-2-4.3" />
        </svg>
      }
      @case ('email') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" />
        </svg>
      }
      @case ('nota') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3h9l4 4v14H6z" /><path d="M9 9h6M9 13h6M9 17h4" />
        </svg>
      }
      @case ('puntos') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
        </svg>
      }
      @case ('chispa') {
        <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <path d="M12 8.5 13.4 11l2.6 1-2.6 1-1.4 2.5L10.6 13 8 12l2.6-1L12 8.5Z" />
        </svg>
      }
    }
  `,
  styles: `:host { display: inline-flex; line-height: 0; }`
})
export class IconComponent {
  nombre = input.required<NombreIcono>();
  tamano = input(18);
}
