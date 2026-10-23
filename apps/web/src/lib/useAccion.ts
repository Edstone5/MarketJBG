'use client';

import { startTransition, useActionState, useState, type FormEvent } from 'react';
import type { EstadoFormulario } from '@/lib/actions/auth';

/**
 * Como `useActionState`, pero sin que React vacíe el formulario después de
 * enviarlo. Con `<form action={…}>` React 19 reinicia todos los campos al
 * terminar la acción, aunque haya fallado: quien se equivocaba de contraseña
 * (o dejaba un campo mal) tenía que volver a escribirlo todo.
 *
 * Devuelve `propsFormulario`, que se esparce en el `<form>`:
 *  - `action`: envío estándar por POST. Es el que se usa si la persona envía el
 *    formulario antes de que cargue el JavaScript; nunca pone datos en la URL.
 *  - `onSubmit`: ya cargado el JavaScript, envía los datos nosotros mismos y los
 *    campos se conservan.
 *
 * Tras un envío correcto con `mensaje`, `version` aumenta: úsalo como `key` del
 * formulario para limpiarlo (incluidos los componentes que guardan su propio estado).
 */
export function useAccion(
  accion: (anterior: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>,
  estadoInicial: EstadoFormulario,
) {
  const [estado, despachar, pendiente] = useActionState(accion, estadoInicial);
  const [version, setVersion] = useState(0);
  const [estadoVisto, setEstadoVisto] = useState(estado);

  // Ajuste de estado durante el render (patrón de React para estado derivado, sin efectos).
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.mensaje) setVersion((v) => v + 1);
  }

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => despachar(datos));
  }

  const propsFormulario = { action: despachar, onSubmit: alEnviar };
  return [estado, propsFormulario, pendiente, version] as const;
}
