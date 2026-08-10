import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { mensajeDeError } from '../../../shared/util/problem-details.util';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  enviando = signal(false);
  error = signal<string | null>(null);

  formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ingresar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    this.auth.Login(this.formulario.getRawValue()).subscribe({
      next: () => this.router.navigate(['/comercios']),
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(this.mensajeParaElUsuario(error));
      }
    });
  }

  private mensajeParaElUsuario(error: HttpErrorResponse): string {
    // El 401 acá no es sesión vencida: son credenciales que no coinciden. El
    // cuerpo no es ProblemDetails (`{ mensaje }`, no `{ detail }`), así que el
    // texto se arma acá en vez de leerlo de la respuesta.
    if (error.status === 401) {
      return 'Email o contraseña incorrectos.';
    }

    // El login tiene rate limiting: pocos intentos por minuto por IP.
    if (error.status === 429) {
      return 'Demasiados intentos. Esperá un minuto y volvé a probar.';
    }

    return mensajeDeError(error);
  }
}
