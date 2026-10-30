# apps/mobile — MarketJBG (Expo / React Native)

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
- ✅ Publicación de productos o servicios con fotos desde el celular (`expo-image-picker`)
- ✅ Pantalla de suscripción / reporte de pago Yape, con historial de pagos
- ✅ Editar, ocultar/mostrar y eliminar publicaciones, y editar el perfil comercial
- ✅ Eliminar cuenta pidiendo la contraseña (la comprueba el servidor de la web)
- ✅ Estadísticas del negocio (visitas, hora pico, publicaciones más vistas) y «Compartir reporte»;
  la app cuenta las visitas a las publicaciones y los clics en WhatsApp
- 🚧 Panel de administración (hoy los pagos se validan solo en la web) y página pública de un
  emprendimiento
- 🚧 Notificaciones push (validación de pago, nuevo mensaje)
- 🚧 Todavía no se ha probado en un teléfono ni en un emulador: solo se comprueba que empaqueta

> Empaquetado: `apps/mobile/metro.config.js` usa la configuración por defecto de Expo. No
> desactives `resolver.disableHierarchicalLookup` ni fijes `nodeModulesPaths`: con el
> `node_modules` aislado de pnpm la app deja de empaquetar. Comprobación rápida (no genera
> instaladores): `pnpm --filter mobile exec expo export --platform android`.
