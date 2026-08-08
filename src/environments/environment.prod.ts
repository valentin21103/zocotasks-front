/**
 * Configuración de producción.
 * El build la reemplaza por la de desarrollo vía `fileReplacements` en angular.json.
 * La URL real del backend desplegado se completa antes de publicar.
 */
export const environment = {
  produccion: true,
  apiUrl: 'https://zocotasks-api.onrender.com'
};
