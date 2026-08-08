import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginDto, LoginResponse, Rol, Sesion } from '../../shared/models/usuario';

const CLAVE_TOKEN = 'zoco.token';
const CLAVE_SESION = 'zoco.sesion';

/** .NET emite los claims con nombre corto o con la URI larga según cómo se configure el JWT. */
const CLAIM_ROL = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const CLAIM_NOMBRE = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const CLAIM_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/api/auth`;

  private http = inject(HttpClient);
  private router = inject(Router);

  /** Sesión actual. Es un signal para que los templates la lean sin suscribirse. */
  sesion = signal<Sesion | null>(this.cargarSesion());

  esAdmin = computed(() => this.sesion()?.rol === 'Admin');

  Login(credenciales: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(respuesta => this.establecerSesion(respuesta))
    );
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_SESION);
    this.sesion.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  /**
   * Hay token y todavía no venció.
   *
   * Se verifica la expiración pero **no la firma**: verificarla del lado del
   * cliente no aportaría nada, porque quien decide si el token vale es el
   * backend en cada request. Esto solo evita mandar un token que ya sabemos
   * vencido y mostrar una pantalla que va a rebotar con 401.
   */
  estaAutenticado(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const claims = this.decodificarJwt(token);
      return Date.now() / 1000 < Number(claims['exp']);
    } catch {
      return false;
    }
  }

  /**
   * Guarda el token y arma la sesión.
   *
   * Los datos se leen de los claims del JWT y no del cuerpo de la respuesta:
   * así la sesión reconstruida al recargar la página sale de la misma fuente
   * que la del login, y no pueden desincronizarse.
   */
  private establecerSesion(respuesta: LoginResponse): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);

    const claims = this.decodificarJwt(respuesta.token);

    const sesion: Sesion = {
      id: Number(claims['nameid'] ?? claims['sub'] ?? claims[CLAIM_ID]),
      email: String(claims['email'] ?? claims[CLAIM_EMAIL] ?? respuesta.usuario.email),
      nombreCompleto: String(
        claims['unique_name'] ?? claims[CLAIM_NOMBRE] ?? respuesta.usuario.nombreCompleto
      ),
      rol: (claims['role'] ?? claims[CLAIM_ROL] ?? respuesta.usuario.rol) as Rol
    };

    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesion.set(sesion);
  }

  /**
   * Atajo de desarrollo: arma una sesión con un token fabricado en el cliente,
   * para poder trabajar en las pantallas mientras el backend todavía no expone
   * `/api/auth/login`.
   *
   * No es un agujero de seguridad: **cualquiera puede hacer esto a mano desde la
   * consola del navegador**, precisamente porque el frontend no verifica firmas
   * ni decide permisos. Lo único que habilita es la navegación; en cuanto el
   * backend tenga [Authorize], este token no va a pasar ningún endpoint.
   *
   * Queda inhabilitado en el build de producción.
   */
  entrarComoDev(rol: Rol): void {
    if (environment.produccion) return;

    const payload = {
      nameid: rol === 'Admin' ? 1 : 2,
      unique_name: rol === 'Admin' ? 'Admin de prueba' : 'Moderador de prueba',
      email: rol === 'Admin' ? 'admin@zoco.test' : 'moderador@zoco.test',
      role: rol,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
    };

    const base64url = (objeto: object) =>
      btoa(JSON.stringify(objeto)).replace(/\+/g, '-').replace(/\//g, '_');

    const token = [
      base64url({ alg: 'HS256', typ: 'JWT' }),
      base64url(payload),
      'firma-de-desarrollo'
    ].join('.');

    this.establecerSesion({
      token,
      expiraEn: new Date(payload.exp * 1000).toISOString(),
      usuario: {
        id: payload.nameid,
        email: payload.email,
        nombreCompleto: payload.unique_name,
        rol
      }
    });
  }

  private cargarSesion(): Sesion | null {
    const guardada = localStorage.getItem(CLAVE_SESION);
    if (!guardada) return null;

    try {
      return JSON.parse(guardada) as Sesion;
    } catch {
      return null;
    }
  }

  private decodificarJwt(token: string): Record<string, string | number> {
    const payload = token.split('.')[1];
    const normalizado = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalizado));
  }
}
