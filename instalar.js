// Botón "Instalar app": Android/Chrome usa el diálogo nativo; iPhone muestra pasos.
(function () {
  var yaInstalada = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (yaInstalada) return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  var ua = navigator.userAgent || '';
  var esIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var promptInstalar = null;

  try { if (sessionStorage.getItem('notica-instalar-oculto') === '1') return; } catch (e) {}

  var css = document.createElement('style');
  css.textContent =
    '#instalar-app{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;align-items:center;gap:4px;background:#0b3d91;color:#fff;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.3);font-family:inherit}' +
    '#instalar-app[hidden]{display:none}' +
    '#instalar-app .ia-btn{background:none;border:0;color:inherit;font:inherit;font-weight:600;padding:12px 8px 12px 18px;cursor:pointer;display:flex;align-items:center;gap:8px}' +
    '#instalar-app .ia-x{background:none;border:0;color:inherit;font-size:20px;line-height:1;padding:10px 14px 10px 6px;cursor:pointer;opacity:.8}' +
    '#instalar-ios{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:16px}' +
    '#instalar-ios[hidden]{display:none}' +
    '#instalar-ios .ia-card{background:#fff;color:#222;border-radius:16px;padding:20px;max-width:380px;width:100%;font-family:inherit}' +
    '#instalar-ios h3{margin:0 0 10px;font-size:1.1rem}' +
    '#instalar-ios ol{margin:0 0 14px 18px;padding:0;line-height:1.6}' +
    '#instalar-ios button{width:100%;padding:12px;border:0;border-radius:10px;background:#0b3d91;color:#fff;font:inherit;font-weight:600;cursor:pointer}';
  document.head.appendChild(css);

  var caja = document.createElement('div');
  caja.id = 'instalar-app';
  caja.hidden = true;
  caja.innerHTML = '<button type="button" class="ia-btn">📲 Instalar app</button><button type="button" class="ia-x" aria-label="Cerrar">×</button>';
  document.body.appendChild(caja);

  var modal = document.createElement('div');
  modal.id = 'instalar-ios';
  modal.hidden = true;
  modal.innerHTML = '<div class="ia-card"><h3>Instalar Notica en tu iPhone</h3><ol><li>Toca el botón <b>Compartir</b> (el cuadro con la flecha hacia arriba).</li><li>Elige <b>Añadir a pantalla de inicio</b>.</li><li>Toca <b>Añadir</b>.</li></ol><button type="button">Entendido</button></div>';
  document.body.appendChild(modal);

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    promptInstalar = e;
    caja.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    caja.hidden = true;
    promptInstalar = null;
  });
  if (esIOS) caja.hidden = false;

  caja.querySelector('.ia-btn').addEventListener('click', function () {
    if (promptInstalar) {
      promptInstalar.prompt();
      promptInstalar.userChoice.then(function () {
        promptInstalar = null;
        caja.hidden = true;
      });
    } else if (esIOS) {
      modal.hidden = false;
    }
  });
  caja.querySelector('.ia-x').addEventListener('click', function () {
    caja.hidden = true;
    try { sessionStorage.setItem('notica-instalar-oculto', '1'); } catch (e) {}
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.tagName === 'BUTTON') modal.hidden = true;
  });
})();
