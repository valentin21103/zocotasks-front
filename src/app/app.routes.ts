import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LayoutComponent } from './core/layout/layout.component';
import { LoginComponent } from './core/auth/login/login.component';

export const routes: Routes = [
  // El login queda fuera del layout: sin sidebar y sin guard.
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'comercios', pathMatch: 'full' },
      {
        path: 'comercios',
        loadComponent: () =>
          import('./features/comercios/comercios.component').then(m => m.ComerciosComponent)
      },
      {
        path: 'comercios/:id',
        loadComponent: () =>
          import('./features/comercio-detalle/comercio-detalle.component')
            .then(m => m.ComercioDetalleComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
