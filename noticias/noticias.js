// noticias/noticias.js
// Pagina publica: lee noticias_publicas y parroquias, con filtros.
import { database } from '../templos/firebase-config.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

var noticias = [];
var parroquias = {};

function $(id) { return document.getElementById(id); }
function limpiarHijos(el) { while (el.firstChild) { el.removeChild(el.firstChild); } }

function urlSegura(u) {
  return typeof u === 'string' && (u.indexOf('https://') === 0 || u.indexOf('http://') === 0);
}

function idYoutube(u) {
  try {
    var x = new URL(u);
    var h = x.hostname.replace('www.', '');
    var id = null;
    if (h === 'youtu.be') { id = x.pathname.slice(1); }
    else if (h === 'youtube.com' || h === 'm.youtube.com') { id = x.searchParams.get('v'); }
    if (id && /^[A-Za-z0-9_-]{6,20}$/.test(id)) { return id; }
  } catch (e) { }
  return null;
}

function nombreParroquia(id) {
  if (parroquias[id] && parroquias[id].nombre) { return parroquias[id].nombre; }
  return id;
}

function crear(tag, clase, texto) {
  var el = document.createElement(tag);
  if (clase) { el.className = clase; }
  if (texto !== undefined) { el.textContent = texto; }
  return el;
}

function formatoFecha(s) {
  var d = new Date(s);
  if (isNaN(d.getTime())) { return s; }
  return d.toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' });
}

function tarjeta(n) {
  var a = document.createElement('article');
  a.appendChild(crear('span', 'etiqueta', n.tipo));
  a.appendChild(crear('h2', '', n.titulo));
  var meta = nombreParroquia(n.parroquia);
  if (n.publicado) { meta += ' - ' + new Date(n.publicado).toLocaleDateString('es-MX'); }
  a.appendChild(crear('div', 'meta', meta));

  if (n.fechaEvento || n.lugar) {
    var ev = crear('div', 'evento');
    if (n.fechaEvento) { ev.appendChild(crear('div', '', 'Fecha: ' + formatoFecha(n.fechaEvento))); }
    if (n.lugar) { ev.appendChild(crear('div', '', 'Lugar: ' + n.lugar)); }
    a.appendChild(ev);
  }

  String(n.cuerpo || '').split(String.fromCharCode(10)).forEach(function (linea) {
    if (linea.trim() !== '') { a.appendChild(crear('p', '', linea)); }
  });

  if (n.video && urlSegura(n.video)) {
    var yt = idYoutube(n.video);
    if (yt) {
      var cont = crear('div', 'video');
      var fr = document.createElement('iframe');
      fr.src = 'https://www.youtube.com/embed/' + yt;
      fr.title = n.titulo;
      fr.setAttribute('allowfullscreen', '');
      fr.setAttribute('loading', 'lazy');
      cont.appendChild(fr);
      a.appendChild(cont);
    } else {
      var p = document.createElement('p');
      var l = crear('a', '', 'Ver video');
      l.href = n.video;
      l.target = '_blank';
      l.rel = 'noopener noreferrer';
      p.appendChild(l);
      a.appendChild(p);
    }
  }

  if (n.fuentes && n.fuentes.length > 0) {
    var f = crear('div', 'fuentes');
    var intro = 'Fuentes consultadas:';
    if (n.parroquia === 'mundo') { intro = 'Redactado por Notica con base en las fuentes citadas:'; }
    f.appendChild(crear('div', '', intro));
    var ul = document.createElement('ul');
    n.fuentes.forEach(function (fu) {
      var li = document.createElement('li');
      if (urlSegura(fu.url)) {
        var an = crear('a', '', fu.titulo);
        an.href = fu.url;
        an.target = '_blank';
        an.rel = 'noopener noreferrer';
        li.appendChild(an);
      } else {
        li.textContent = fu.titulo;
      }
      ul.appendChild(li);
    });
    f.appendChild(ul);
    a.appendChild(f);
  }
  return a;
}

function pintar() {
  var tipo = $('filtroTipo').value;
  var par = $('filtroParroquia').value;
  var lista = noticias.filter(function (n) {
    if (tipo !== '' && n.tipo !== tipo) { return false; }
    if (par !== '' && n.parroquia !== par) { return false; }
    return true;
  });
  if (tipo === 'evento') {
    lista.sort(function (a, b) { return String(a.fechaEvento || '').localeCompare(String(b.fechaEvento || '')); });
  } else {
    lista.sort(function (a, b) { return (b.publicado || 0) - (a.publicado || 0); });
  }
  var cont = $('lista');
  limpiarHijos(cont);
  $('estado').textContent = lista.length === 0 ? 'No hay publicaciones.' : '';
  lista.forEach(function (n) { cont.appendChild(tarjeta(n)); });
}

async function iniciar() {
  try {
    var r = await Promise.all([
      get(ref(database, 'noticias_publicas')),
      get(ref(database, 'parroquias'))
    ]);
    var np = r[0].exists() ? r[0].val() : {};
    parroquias = r[1].exists() ? r[1].val() : {};
    noticias = Object.keys(np).map(function (id) { return np[id]; });
    var sel = $('filtroParroquia');
    Object.keys(parroquias).sort().forEach(function (id) {
      var op = document.createElement('option');
      op.value = id;
      op.textContent = nombreParroquia(id);
      sel.appendChild(op);
    });
    pintar();
  } catch (err) {
    console.error(err);
    $('estado').textContent = 'No se pudieron cargar las noticias.';
  }
}

$('filtroTipo').addEventListener('change', pintar);
$('filtroParroquia').addEventListener('change', pintar);
iniciar();
