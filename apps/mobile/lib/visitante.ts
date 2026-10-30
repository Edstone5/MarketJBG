/**
 * Código aleatorio de esta apertura de la app: sirve para que una misma persona no cuente dos
 * veces seguidas como visita (RF09). No es una cuenta ni un dato del teléfono, y se renueva cada
 * vez que la app se abre desde cero.
 */
const ID_DE_ESTA_SESION =
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);

export function obtenerVisitante(): string {
  return ID_DE_ESTA_SESION;
}
