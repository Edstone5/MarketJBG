'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploaderProps {
  bucket: 'productos' | 'logos' | 'comprobantes';
  name: string;
  multiple?: boolean;
  maxFiles?: number;
}

/**
 * Sube archivos a Supabase Storage bajo la carpeta <usuario_id>/... (exigida
 * por las políticas RLS de storage.objects, ver supabase/migrations/0003).
 * Escribe las URLs resultantes en un input oculto `name` separadas por coma,
 * para que un Server Action las lea desde el FormData.
 */
export function ImageUploader({ bucket, name, multiple = false, maxFiles = 1 }: ImageUploaderProps) {
  const [urls, setUrls] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarArchivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setSubiendo(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para subir archivos.');

      const nuevasUrls: string[] = [];
      for (const file of Array.from(files).slice(0, maxFiles - urls.length)) {
        const ruta = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(ruta, file);
        if (uploadError) throw uploadError;

        if (bucket === 'comprobantes') {
          nuevasUrls.push(ruta);
        } else {
          const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
          nuevasUrls.push(data.publicUrl);
        }
      }
      setUrls((prev) => [...prev, ...nuevasUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={urls.join(',')} />

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
              onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
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
              accept="image/*"
              multiple={multiple}
              className="hidden"
              onChange={(event) => manejarArchivos(event.target.files)}
              disabled={subiendo}
            />
          </label>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
