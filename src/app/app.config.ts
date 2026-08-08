import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Locale argentino para que los pipes de fecha y número usen el formato local.
registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // withComponentInputBinding: los parámetros de ruta y los query params
    // llegan a los componentes como @Input, sin suscribirse a ActivatedRoute.
    provideRouter(routes, withComponentInputBinding()),

    // El orden importa: authInterceptor pone el token y atrapa el 401 primero;
    // errorInterceptor traduce lo que quede.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    { provide: LOCALE_ID, useValue: 'es-AR' }
  ]
};
