/* Notica: aviso para silenciar el telefono cerca de un templo.
   - Lee los templos de Firebase por REST (sin SDK).
   - La ubicacion se compara en el telefono: no se guarda ni se envia a ningun servidor.
   - Una web no puede activar el modo silencio por si sola: la app guia al usuario. */
(function () {
  'use strict';

  var DB = 'https://pagelalo-1b210-default-rtdb.firebaseio.com';
  var RADIO_M = 80;          // distancia para considerar que esta en el templo
  var ANTES_MIN = 10;        // la misa cuenta desde 10 min antes
  var DESPUES_MIN = 60;      // y hasta 60 min despues de la hora
  var CACHE_HORAS = 6;
  var NOMBRE_ATAJO = 'Silencio Notica';
  var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

  var K_PREF = 'notica_silencio_pref';    // 'on' | 'off'
  var K_HOY = 'notica_silencio_hoy';      // fecha en que pidio "hoy no"
  var K_CHIP = 'notica_silencio_chip';    // '1' si descarto la invitacion
  var K_CACHE = 'notica_silencio_templos';

  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function quitar(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function hoyTxt() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* ---------- Calculos ---------- */

  function distanciaM(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Convierte textos como "8:00 am", "7 pm", "19:00" o "19 h" en minutos del dia.
  function minutosDe(texto) {
    var salida = [];
    var re = /(\d{1,2})(?::(\d{2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?|hrs|h)?/gi;
    var m;
    while ((m = re.exec(String(texto))) !== null) {
      var suf = (m[3] || '').toLowerCase().replace(/[\s.]/g, '');
      if (!m[2] && !suf) { continue; }          // un numero suelto no es una hora
      var h = parseInt(m[1], 10);
      var min = m[2] ? parseInt(m[2], 10) : 0;
      if (h > 23 || min > 59) { continue; }
      if (suf === 'pm' && h < 12) { h += 12; }
      else if (suf === 'am' && h === 12) { h = 0; }
      else if (!suf && h >= 1 && h <= 6) { h += 12; }   // "5:00" sin am/pm: se asume tarde
      salida.push(h * 60 + min);
    }
    return salida;
  }

  function hayMisaAhora(templo, ahora) {
    var lista = templo.horarios && templo.horarios[DIAS[ahora.getDay()]];
    if (!lista) { return false; }
    if (typeof lista === 'string') { lista = [lista]; }
    var actual = ahora.getHours() * 60 + ahora.getMinutes();
    for (var i = 0; i < lista.length; i++) {
      var horas = minutosDe(lista[i]);
      for (var j = 0; j < horas.length; j++) {
        if (actual >= horas[j] - ANTES_MIN && actual <= horas[j] + DESPUES_MIN) { return true; }
      }
    }
    return false;
  }

  /* ---------- Datos (Firebase REST, sin descargar las imagenes) ---------- */

  function campo(id, nombre) {
    return fetch(DB + '/templos/' + id + '/' + nombre + '.json').then(function (r) { return r.json(); });
  }

  function cargarTemplos() {
    var c = leer(K_CACHE);
    if (c) {
      try {
        var o = JSON.parse(c);
        if (Date.now() - o.t < CACHE_HORAS * 3600000) { return Promise.resolve(o.lista); }
      } catch (e) {}
    }
    return fetch(DB + '/templos.json?shallow=true')
      .then(function (r) { return r.json(); })
      .then(function (ids) {
        return Promise.all(Object.keys(ids || {}).map(function (id) {
          return Promise.all([campo(id, 'nombre'), campo(id, 'ubicacion'), campo(id, 'horarios')])
            .then(function (v) { return { id: id, nombre: v[0], ubicacion: v[1], horarios: v[2] }; });
        }));
      })
      .then(function (lista) {
        guardar(K_CACHE, JSON.stringify({ t: Date.now(), lista: lista }));
        return lista;
      });
  }

  function temploMasCercano(lista, lat, lon) {
    var mejor = null;
    lista.forEach(function (t) {
      var u = t.ubicacion;
      if (!u || !u.latitud || !u.longitud) { return; }
      var la = parseFloat(u.latitud);
      var lo = parseFloat(u.longitud);
      if (isNaN(la) || isNaN(lo)) { return; }
      var d = distanciaM(lat, lon, la, lo);
      if (d <= RADIO_M && (!mejor || d < mejor.d)) { mejor = { templo: t, d: d }; }
    });
    return mejor;
  }

  /* ---------- Interfaz ---------- */

  function el(tag, props, hijos) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'class') { n.className = props[k]; }
      else if (k === 'text') { n.textContent = props[k]; }
      else { n.setAttribute(k, props[k]); }
    });
    (hijos || []).forEach(function (h) { n.appendChild(h); });
    return n;
  }

  function estilos() {
    if (document.getElementById('ns-estilos')) { return; }
    var css =
      '.ns-panel{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);' +
      'width:min(92vw,420px);box-sizing:border-box;padding:18px 18px 14px;border-radius:14px;' +
      'background:#14213d;color:#f6f1e4;border-top:2px solid #c9a24b;box-shadow:0 12px 36px rgba(0,0,0,.35);' +
      'font-family:inherit;line-height:1.45;z-index:2147483000;animation:ns-sube .28s ease-out}' +
      '.ns-panel h2{margin:0 0 6px;font-size:1.05rem;font-weight:600;color:#f6f1e4}' +
      '.ns-panel p{margin:0 0 12px;font-size:.92rem;color:#e3dcc8}' +
      '.ns-panel ol{margin:0 0 12px;padding-left:20px;font-size:.92rem;color:#e3dcc8}' +
      '.ns-fila{display:flex;flex-wrap:wrap;gap:8px}' +
      '.ns-btn{border:1px solid #c9a24b;background:transparent;color:#f6f1e4;border-radius:999px;' +
      'padding:9px 16px;font:inherit;font-size:.9rem;cursor:pointer}' +
      '.ns-btn.ns-primario{background:#c9a24b;color:#14213d;font-weight:600}' +
      '.ns-btn:focus-visible,.ns-mini:focus-visible,.ns-chip:focus-visible{outline:2px solid #f6f1e4;outline-offset:2px}' +
      '.ns-pie{display:flex;gap:14px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(246,241,228,.15)}' +
      '.ns-mini{background:none;border:0;padding:4px 0;color:#bfb8a3;font:inherit;font-size:.8rem;' +
      'text-decoration:underline;cursor:pointer}' +
      '.ns-chip{position:fixed;left:14px;bottom:max(14px,env(safe-area-inset-bottom));display:flex;align-items:center;' +
      'gap:8px;padding:8px 8px 8px 12px;border-radius:999px;background:#14213d;color:#f6f1e4;font:inherit;' +
      'font-size:.82rem;border:1px solid #c9a24b;cursor:pointer;z-index:2147482000;opacity:.92}' +
      '.ns-chip span.ns-x{display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;' +
      'border-radius:50%;color:#bfb8a3}' +
      '@keyframes ns-sube{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '@media (prefers-reduced-motion:reduce){.ns-panel{animation:none}}';
    var s = el('style', { id: 'ns-estilos' });
    s.textContent = css;
    document.head.appendChild(s);
  }

  function cerrarTodo() {
    ['ns-panel-activo', 'ns-chip-activo'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) { n.remove(); }
    });
  }

  function boton(texto, primario, accion) {
    var b = el('button', { type: 'button', class: 'ns-btn' + (primario ? ' ns-primario' : ''), text: texto });
    b.addEventListener('click', accion);
    return b;
  }

  function mini(texto, accion) {
    var b = el('button', { type: 'button', class: 'ns-mini', text: texto });
    b.addEventListener('click', accion);
    return b;
  }

  function panel(titulo, texto, botones, conPie, extra) {
    estilos();
    cerrarTodo();
    var hijos = [el('h2', { text: titulo })];
    if (texto) { hijos.push(el('p', { text: texto })); }
    if (extra) { hijos.push(extra); }
    hijos.push(el('div', { class: 'ns-fila' }, botones));
    if (conPie) {
      hijos.push(el('div', { class: 'ns-pie' }, [
        mini('Hoy no', function () { guardar(K_HOY, hoyTxt()); cerrarTodo(); }),
        mini('No volver a avisar', function () { guardar(K_PREF, 'off'); cerrarTodo(); })
      ]));
    }
    var p = el('div', { id: 'ns-panel-activo', class: 'ns-panel', role: 'dialog', 'aria-live': 'polite' }, hijos);
    document.body.appendChild(p);
    return p;
  }

  function esIPhone() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function mostrarGuia() {
    var pasos = el('ol', {});
    var textos = esIPhone()
      ? ['Desliza desde la esquina superior derecha para abrir el Centro de control.',
         'Toca Concentracion y elige No molestar, o usa el interruptor lateral de silencio.']
      : ['Baja la barra de ajustes rapidos y toca Silencio o No molestar.',
         'Tambien puedes pulsar un boton de volumen y elegir el modo silencio.'];
    textos.forEach(function (t) { pasos.appendChild(el('li', { text: t })); });

    var botones = [];
    if (esIPhone()) {
      botones.push(boton('Usar mi atajo', true, function () {
        window.location.href = 'shortcuts://run-shortcut?name=' + encodeURIComponent(NOMBRE_ATAJO);
      }));
    }
    botones.push(boton('Listo', !esIPhone(), cerrarTodo));
    panel('Pon tu telefono en silencio',
          esIPhone()
            ? 'Notica no puede cambiarlo por ti. Si creaste un atajo llamado "' + NOMBRE_ATAJO + '", puedes ejecutarlo desde aqui.'
            : 'Notica no puede cambiarlo por ti, pero toma unos segundos:',
          botones, false, pasos);
  }

  function avisarCerca(templo, hayMisa) {
    var nombre = templo.nombre || 'un templo';
    if (hayMisa) {
      panel('Hay misa ahora en ' + nombre,
            'Es buen momento para poner tu telefono en silencio.',
            [boton('Como silenciarlo', true, mostrarGuia), boton('Ya esta', false, cerrarTodo)], true);
    } else {
      panel('Estas cerca de ' + nombre,
            'Estas dentro del templo?',
            [boton('Si, estoy dentro', true, mostrarGuia), boton('No', false, cerrarTodo)], true);
    }
  }

  function mensaje(titulo, texto) {
    panel(titulo, texto, [boton('Entendido', true, cerrarTodo)], false);
  }

  /* ---------- Deteccion ---------- */

  function detectar(manual) {
    if (!('geolocation' in navigator)) {
      if (manual) { mensaje('Ubicacion no disponible', 'Este navegador no permite consultar la ubicacion.'); }
      return;
    }
    navigator.geolocation.getCurrentPosition(function (pos) {
      if (pos.coords.accuracy > 250 && !manual) { return; }
      cargarTemplos().then(function (lista) {
        var cerca = temploMasCercano(lista, pos.coords.latitude, pos.coords.longitude);
        if (!cerca) {
          if (manual) { mensaje('Avisos activados', 'Cuando estes cerca de un templo registrado en Notica, te lo recordaremos.'); }
          return;
        }
        avisarCerca(cerca.templo, hayMisaAhora(cerca.templo, new Date()));
      }).catch(function () {
        if (manual) { mensaje('Sin conexion', 'No pudimos consultar los templos. Intenta de nuevo mas tarde.'); }
      });
    }, function () {
      if (manual) {
        mensaje('No pudimos ver tu ubicacion',
                'Revisa que el permiso de ubicacion de este sitio este permitido en tu navegador.');
      }
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  function explicar() {
    panel('Avisarte para silenciar el telefono en misa?',
          'Notica compara tu ubicacion con la de los templos registrados, solo en este momento y dentro de tu telefono. ' +
          'No se guarda ni se envia a ningun servidor. Al continuar, tu navegador te pedira permiso.',
          [boton('Activar avisos', true, function () {
             guardar(K_PREF, 'on');
             quitar(K_CHIP);
             cerrarTodo();
             detectar(true);
           }),
           boton('Ahora no', false, function () { guardar(K_CHIP, '1'); cerrarTodo(); })],
          false);
  }

  function mostrarChip() {
    estilos();
    var x = el('span', { class: 'ns-x', 'aria-hidden': 'true', text: '\u00d7' });
    var c = el('button', { id: 'ns-chip-activo', type: 'button', class: 'ns-chip',
                           'aria-label': 'Avisarme para silenciar el telefono en templos' },
               [el('span', { text: 'Silencio en templos' }), x]);
    c.addEventListener('click', function (e) {
      if (e.target === x) { guardar(K_CHIP, '1'); cerrarTodo(); return; }
      explicar();
    });
    document.body.appendChild(c);
  }

  function iniciar() {
    // Enlace opcional en el pie de pagina: <a href="#" data-silencio-reactivar>
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-silencio-reactivar]');
      if (a) { e.preventDefault(); quitar(K_HOY); quitar(K_CHIP); explicar(); }
    });

    var pref = leer(K_PREF);
    if (pref === 'off') { return; }
    if (pref === 'on') {
      if (leer(K_HOY) === hoyTxt()) { return; }
      detectar(false);
      return;
    }
    if (leer(K_CHIP) === '1') { return; }
    setTimeout(mostrarChip, 3000);
  }

  window.NoticaSilencio = { reactivar: function () { quitar(K_HOY); quitar(K_CHIP); explicar(); } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
