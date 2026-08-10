/**
 * Dos roles, sin más granularidad:
 *  - Admin     → puede todo, incluido eliminar y administrar rubros.
 *  - Vendedor  → todo lo demás: ver, crear, editar, cambiar estado, interactuar.
 *
 * Quien autoriza de verdad es el backend con [Authorize(Roles = "Admin")].
 * Acá el rol solo sirve para no ofrecerle al usuario algo que va a terminar en 403.
 */
export type Rol = 'Admin' | 'Vendedor';

export interface LoginDto {
  email: string;
  password: string;
}

/** Un usuario puede tener varios roles en el backend; hoy el seed da uno solo. */
export interface LoginResponse {
  token: string;
  expiraEn: string;
  email: string;
  nombreCompleto: string;
  roles: Rol[];
}

/** Lo que el front guarda de la sesión, leído de los claims del JWT. */
export interface Sesion {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: Rol;
}
