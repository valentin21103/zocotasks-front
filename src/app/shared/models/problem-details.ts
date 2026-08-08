/**
 * Formato de error del backend: ProblemDetails (RFC 7807).
 *
 * El campo `codigo` es la extensión propia del proyecto y es **la única forma
 * correcta de discriminar**: dos errores distintos comparten el status 409.
 */
export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  codigo?: CodigoError;
  /** Solo en el 400. Las claves vienen en PascalCase: `NombreComercial`. */
  errors?: Record<string, string[]>;
  /** Solo en el 409 por transición inválida. */
  estadoActual?: string;
  estadoSolicitado?: string;
}

export type CodigoError =
  | 'entidad_no_encontrada'
  | 'estado_transicion_invalida'
  | 'conflicto_de_concurrencia'
  | 'regla_de_negocio'
  | 'precondicion_requerida'
  | 'error_interno';
