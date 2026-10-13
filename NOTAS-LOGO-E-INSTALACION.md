# Notas: logo completo de Notica y botón de instalar (12 oct 2026)

## Qué se hizo
1. Logo completo (prueba): navbar y footer usan la imagen icons/logo-nav.png (emblema + palabra "Notica") en lugar de ícono + texto. Responsive con CSS (clamp, max-width: 62vw).
2. Vista previa al compartir: icons/og-notica.png (1200x630, logo completo). index.html: og:image, og:image:width/height y twitter:card=summary_large_image.
3. Íconos de instalación (android-chrome-192x192.png, android-chrome-512x512.png, apple-touch-icon.png): ahora son el logo completo centrado en cuadro blanco (cuadrados, por eso se ve pequeño).
4. Botón "Instalar app" (funcionalidad nueva, NO depende del logo): instalar.js (botón flotante; Android usa el diálogo nativo beforeinstallprompt, iPhone muestra pasos de Compartir > Añadir a pantalla de inicio; se oculta si ya está instalada) y sw.js (service worker mínimo, sin caché, requerido por Android). Cargado con <script src="./instalar.js" defer> en el head de index.html.
5. manifest.json: se agregaron id, description, lang, scope y purpose en los íconos. Original en ~/Escritorio/proyectos/pageLalo_respaldo_secciones/manifest.emblema.json.

## Punto de restauración
Tag de git logo-v1-emblema (commit 3f05838): logo anterior (solo emblema, cruz + play, con el texto Notica escrito en HTML).

## Revertir SOLO el logo (conservando el botón de instalar)
Ejecutar desde la carpeta del proyecto, un comando a la vez:

    git checkout logo-v1-emblema -- icons/android-chrome-192x192.png icons/android-chrome-512x512.png icons/apple-touch-icon.png

    sed -i 's|<img src="./icons/logo-nav.png" alt="Notica" class="logo-img logo-img-full">|<img src="./icons/android-chrome-192x192.png" alt="Logo de Notica" class="logo-img"><span class="logo-texto">Noti<span>ca</span></span>|' index.html

    sed -i 's|<div class="footer-logo"><img src="./icons/logo-nav.png" alt="Notica" class="footer-logo-img"></div>|<div class="footer-logo">Noti<span>ca</span></div>|' index.html

    sed -i -e 's|icons/og-notica.png">|icons/android-chrome-512x512.png">|' -e 's|og:image:width" content="1200"|og:image:width" content="512"|' -e 's|og:image:height" content="630"|og:image:height" content="512"|' -e 's|summary_large_image|summary|' index.html

    sed -i '/INICIO: logo completo de Notica/,/FIN: logo completo de Notica/d' styles.css

Opcional: borrar icons/logo-nav.png e icons/og-notica.png. Las líneas originales del HTML también están en pageLalo_respaldo_secciones/logo_navbar_emblema_index.html y logo_footer_texto_index.html.

## Notas
- Las vistas previas (WhatsApp, Facebook) se guardan en caché y pueden tardar en actualizarse.
- En Android, el botón solo aparece sobre HTTPS (en noticaapp.com). Si la app ya está instalada, la pantalla de inicio puede conservar el ícono viejo hasta reinstalarla.
- No tocar la config de Firebase (pagelalo-1b210) en index.html.
