'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { mensajeError, nombreArchivoSeguro, TIPOS_IMAGEN_PERMITIDOS, validarArchivoImagen } from '@emprende/core';
import { createClient } from '@/lib/supabase/client';

interface ImageUploaderProps {
  bucket: 'productos' | 'logos' | 'comprobantes';
  name: string;
  multiple?: boolean;
  maxFiles?: number;
  /** Fotos que ya tiene lo que se está editando. */
  initialUrls?: string[];
  /**
   * Si es `true` (por defecto), quitar una foto también borra el archivo. Al editar una publicación se pone en
   * `false`: los archivos que ya no se usan se borran al guardar, para no dejar una foto rota si se cancela.
   */
  borrarAlQuitar?: boolean;
}

/**
 * Sube archivos a Supabase Storage bajo la carpeta <usuario_id>/... (exigida
 * por las políticas RLS de storage.objects, ver supabase/migrations/0003).
 * Escribe las URLs resultantes (o las rutas, en el bucket privado de
 * comprobantes) en un input oculto `name` como lista JSON, para que un Server
 * Action las lea desde el FormData. Solo imágenes de hasta 5 MB.
 */
export function ImageUploader({
  bucket,
  name,
  multiple = false,
  maxFiles = 1,
  initialUrls = [],
  borrarAlQuitar = true,
}: ImageUploaderProps) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarArchivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const elegidos = Array.from(files).slice(0, maxFiles - urls.length);
    for (const file of elegidos) {
      const motivo = validarArchivoImagen(file);
      if (motivo) {
        setError(motivo);
        return;
      }
    }

    setSubiendo(true);
    const nuevasUrls: string[] = [];
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

      for (const file of elegidos) {
        const ruta = `${user.id}/${Date.now()}-${nombreArchivoSeguro(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(ruta, file);
        if (uploadError) throw uploadError;

        if (bucket === 'comprobantes') {
          nuevasUrls.push(ruta);
        } else {
          const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
          nuevasUrls.push(data.publicUrl);
        }
      }
    } catch (err) {
      setError(mensajeError(err, 'No se pudo subir la imagen. Inténtalo de nuevo.'));
    } finally {
      // lo que sí se alcanzó a subir se conserva aunque otro archivo falle
      if (nuevasUrls.length > 0) setUrls((prev) => [...prev, ...nuevasUrls]);
      setSubiendo(false);
    }
  }

  async function quitar(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
    // Mejor esfuerzo: borra el archivo de los buckets públicos para no dejar fotos sueltas.
    // (En comprobantes no hay política de borrado: queda para el administrador.)
    if (bucket === 'comprobantes' || !borrarAlQuitar) return;
    const marca = `/storage/v1/object/public/${bucket}/`;
    const ruta = url.includes(marca) ? decodeURIComponent(url.split(marca)[1] ?? '') : '';
    if (ruta) await createClient().storage.from(bucket).remove([ruta]);
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border">
            {/* Vista previa simple; para comprobantes (bucket privado) solo mostramos un placeholder */}
            {bucket === 'comprobantes' ? (
              <div className="flex h-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                Listo ✓
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => quitar(url)}
              aria-label="Quitar imagen"
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {urls.length < maxFiles && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-primary-500 hover:text-primary-600">
            {subiendo ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <span className="text-[10px]">Subir</span>
            <input
              type="file"
              accept={TIPOS_IMAGEN_PERMITIDOS.join(',')}
              multiple={multiple}
              className="hidden"
              onChange={(event) => {
                void manejarArchivos(event.target.files);
                event.target.value = '';
              }}
              disabled={subiendo}
            />
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
