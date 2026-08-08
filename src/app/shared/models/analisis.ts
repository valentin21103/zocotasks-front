/**
 * `Indeterminado` no es un nivel más: es lo que devuelve el backend cuando el
 * proveedor de IA falló. Si el modelo no respondió, el sistema no inventa un
 * nivel de interés.
 */
export type NivelInteres = 'Indeterminado' | 'Bajo' | 'Medio' | 'Alto';

export interface AnalisisOportunidadDto {
  nivelInteres: NivelInteres;
  resumen: string;
  proximoPaso: string;
  preguntasSugeridas: string[];
  datosFaltantes: string[];
  /** true = el proveedor falló. Se muestra como aviso, nunca como error: llega con 200. */
  esDegradado: boolean;
  modeloUtilizado: string;
  fechaGeneracion: string;
}
