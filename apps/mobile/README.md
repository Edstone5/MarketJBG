# apps/mobile — Emprende UNJBG (Expo / React Native)

App móvil del catálogo (Android + iOS). Ver la documentación completa del monorepo en el
[README de la raíz](../../README.md).

```bash
pnpm install          # desde la raíz del repo
cp .env.example .env
pnpm dev:mobile
```

> `EXPO_PUBLIC_WEB_URL` debe apuntar a la web desplegada (Vercel) para que "Eliminar mi
> cuenta" funcione desde un dispositivo físico — `localhost:3000` solo funciona en el
> simulador/emulador que corre en la misma máquina que el servidor de Next.js.

## Estado del scaffold

- ✅ Navegación por tabs (Inicio, Buscar, Vender, Perfil) con expo-router
- ✅ Catálogo con búsqueda y filtro por categoría, conectado a Supabase
- ✅ Detalle de producto con contacto directo por WhatsApp
- ✅ Autenticación (login / registro) con correo institucional
- ✅ Creación de emprendimiento
- ✅ Eliminar cuenta (pestaña Perfil) y enlaces a Política de Privacidad / Términos
- 🚧 Publicación de productos con fotos desde el celular (existe en la web; falta portar
  el flujo de subida de imágenes con `expo-image-picker`)
- 🚧 Pantalla de suscripción / reporte de pago Yape (existe en la web)
- 🚧 Notificaciones push (aprobación de pago, nuevo mensaje)
