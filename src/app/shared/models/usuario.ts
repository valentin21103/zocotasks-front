/**
 * Dos roles, sin más granularidad:
 *  - Admin      → puede todo, incluido eliminar y dar de alta catálogos.
 *  - Moderador  → todo lo demás: ver, crear, editar, cambiar estado, interactuar.
 *
 * Quien autoriza de verdad es el backend con [Authorize(Roles = "Admin")].
 * Acá el rol solo sirve para no ofrecerle al usuario algo que va a terminar en 403.
 */
export type Rol = 'Admin' | 'Moderador';

export interface LoginDto {
  email: string;
  password: string;
}

export interface UsuarioDto {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: Rol;
}

export interface LoginResponse {
  token: string;
  expiraEn: string;
  usuario: UsuarioDto;
}

/** Lo que el front guarda de la sesión, leído de los claims del JWT. */
export interface Sesion {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: Rol;
}
