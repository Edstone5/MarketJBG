const CLAVE = 'mjbg-visitante';

/**
 * Código aleatorio que se guarda en este navegador para que una misma persona no cuente
 * dos veces seguidas como visita (RF09). No es una cuenta ni una IP: si el navegador no
 * deja guardarlo (modo privado), devuelve null y la visita simplemente se cuenta sin él.
 */
export function obtenerVisitante(): string | null {
  try {
    let id = window.localStorage.getItem(CLAVE);
    if (!id || id.length < 8 || id.length > 64) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(CLAVE, id);
    }
    return id;
  } catch {
    return null;
  }
}
