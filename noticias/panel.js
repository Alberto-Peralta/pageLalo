// noticias/panel.js
// Panel de noticias: login, rol y gestion de parroquias.
import { database, auth } from '../templos/firebase-config.js';
import { ref, get, set, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Solo cortesia de interfaz: la seguridad real son las reglas de Firebase.
var SUPER_UIDS = ['4E3dppwJOlPARubLeRAFAu9Hhps2', 'xqhClOg845dSU5XIu4vqTCy4XAj2'];
var rolActual = null;

function $(id) { return document.getElementById(id); }
function limpiarHijos(el) { while (el.firstChild) { el.removeChild(el.firstChild); } }

function crearId(nombre) {
  var origen = 'áéíóúüñ';
  var destino = 'aeiouun';
  var salida = '';
  nombre.toLowerCase().split('').forEach(function (c) {
    var k = origen.indexOf(c);
    salida += (k === -1 ? c : destino.charAt(k));
  });
  salida = salida.replace(/[^a-z0-9]+/g, '-');
  salida = salida.replace(/^-+/, '').replace(/-+$/, '');
  return salida;
}

function mensajeError(err) {
  var msg = String(err && err.message ? err.message : err);
  if (msg.toLowerCase().indexOf('permission') !== -1) {
    return 'Sin permiso para esta accion. Revisa las reglas de la base de datos.';
  }
  return 'Error: ' + msg;
}

async function cargarParroquias() {
  var lista = $('listaParroquias');
  limpiarHijos(lista);
  var snap = await get(ref(database, 'parroquias'));
  if (snap.exists() === false) {
    var vacio = document.createElement('li');
    vacio.textContent = 'Aun no hay parroquias.';
    lista.appendChild(vacio);
    return;
  }
  var datos = snap.val();
  Object.keys(datos).sort().forEach(function (id) {
    var li = document.createElement('li');
    var p = datos[id];
    var extra = p.decanato ? ' (decanato: ' + p.decanato + ')' : '';
    li.textContent = id + ' - ' + p.nombre + extra;
    lista.appendChild(li);
  });
}

onAuthStateChanged(auth, async function (user) {
  if (user === null) {
    $('panel').style.display = 'none';
    $('pantallaLogin').style.display = 'block';
    return;
  }
  var rol = null;
  if (SUPER_UIDS.indexOf(user.uid) !== -1) {
    rol = 'superadmin';
  } else {
    try {
      var s = await get(ref(database, 'roles/' + user.uid));
      if (s.exists() && (s.val().rol === 'editor' || s.val().rol === 'revisor')) { rol = s.val().rol; parroquiaDelRol = s.val().parroquia || null; }
    } catch (err) {
      console.error(err);
    }
  }
  if (rol === null) {
    $('panel').style.display = 'none';
    $('pantallaLogin').style.display = 'block';
    if (user.isAnonymous === false) {
      $('errorLogin').textContent = 'Esta cuenta no tiene permiso para el panel de noticias.';
      signOut(auth);
    }
    return;
  }
  rolActual = rol;
  await prepararNoticias(user, rol);
  $('pantallaLogin').style.display = 'none';
  $('panel').style.display = 'block';
  $('correo').textContent = user.email || '';
  $('rol').textContent = rol;
  if (rol === 'superadmin') {
    $('seccionParroquias').style.display = 'block';
    try { await cargarParroquias(); } catch (err) { console.error(err); }
  }
});

$('formLogin').addEventListener('submit', async function (e) {
  e.preventDefault();
  $('errorLogin').textContent = '';
  try {
    await signInWithEmailAndPassword(auth, $('email').value.trim(), $('clave').value);
  } catch (err) {
    console.error(err);
    $('errorLogin').textContent = 'No se pudo iniciar sesion. Revisa tu correo y contrasena.';
  }
});

$('salir').addEventListener('click', function () { signOut(auth); });

$('formParroquia').addEventListener('submit', async function (e) {
  e.preventDefault();
  var nombre = $('parroquiaNombre').value.trim();
  var decanato = $('parroquiaDecanato').value.trim();
  var id = crearId(nombre);
  if (id === '') {
    $('resultadoParroquia').textContent = 'El nombre no es valido.';
    return;
  }
  try {
    await set(ref(database, 'parroquias/' + id), { nombre: nombre, decanato: decanato });
    $('resultadoParroquia').textContent = 'Guardada: ' + id;
    $('formParroquia').reset();
    await cargarParroquias();
  } catch (err) {
    console.error(err);
    $('resultadoParroquia').textContent = mensajeError(err);
  }
});

$('crearMundo').addEventListener('click', async function () {
  try {
    await set(ref(database, 'parroquias/mundo'), { nombre: 'Iglesia en el mundo', decanato: '' });
    $('resultadoParroquia').textContent = 'Guardada: mundo';
    await cargarParroquias();
  } catch (err) {
    console.error(err);
    $('resultadoParroquia').textContent = mensajeError(err);
  }
});

$('importarTemplos').addEventListener('click', async function () {
  try {
    var snapT = await get(ref(database, 'templos'));
    if (snapT.exists() === false) {
      $('resultadoParroquia').textContent = 'No hay templos.';
      return;
    }
    var snapP = await get(ref(database, 'parroquias'));
    var existentes = snapP.exists() ? snapP.val() : {};
    var templos = snapT.val();
    var ids = Object.keys(templos);
    var nuevas = 0;
    for (var i = 0; i < ids.length; i++) {
      if (existentes[ids[i]] !== undefined) { continue; }
      var nombre = templos[ids[i]].nombre || ids[i];
      await set(ref(database, 'parroquias/' + ids[i]), { nombre: nombre, decanato: '', temploId: ids[i] });
      nuevas++;
    }
    $('resultadoParroquia').textContent = 'Importadas: ' + nuevas;
    await cargarParroquias();
  } catch (err) {
    console.error(err);
    $('resultadoParroquia').textContent = mensajeError(err);
  }
});

var parroquiaDelRol = null;
var usuarioNoticias = null;


async function prepararNoticias(user, rol) {
  usuarioNoticias = user;
  try {
    var snap = await get(ref(database, 'parroquias'));
    var sel = $('noticiaParroquia');
    limpiarHijos(sel);
    var datos = snap.exists() ? snap.val() : {};
    Object.keys(datos).sort().forEach(function (id) {
      if (rol === 'editor' && id !== parroquiaDelRol) { return; }
      var op = document.createElement('option');
      op.value = id;
      op.textContent = datos[id].nombre || id;
      sel.appendChild(op);
    });
    await cargarPendientes();
  } catch (err) {
    console.error(err);
  }
}

var editando = null;

function textoFuentes(fuentes) {
  return (fuentes || []).map(function (f) {
    return f.url ? f.titulo + ' | ' + f.url : f.titulo;
  }).join(String.fromCharCode(10));
}

function salirEdicion() {
  editando = null;
  $('formNoticia').reset();
  $('formNoticia').querySelector('button[type="submit"]').textContent = 'Enviar a revisión';
  var c = $('cancelarEdicion');
  if (c) { c.remove(); }
}

function editarNoticia(id, n) {
  editando = { id: id, n: n };
  $('noticiaTipo').value = n.tipo || 'noticia';
  $('noticiaParroquia').value = n.parroquia || '';
  $('noticiaTitulo').value = n.titulo || '';
  $('noticiaCuerpo').value = n.cuerpo || '';
  $('noticiaFecha').value = n.fechaEvento || '';
  $('noticiaLugar').value = n.lugar || '';
  $('noticiaVideo').value = n.video || '';
  $('noticiaFuentes').value = textoFuentes(n.fuentes);
  var btn = $('formNoticia').querySelector('button[type="submit"]');
  btn.textContent = 'Guardar cambios';
  if ($('cancelarEdicion') === null) {
    var c = document.createElement('button');
    c.type = 'button';
    c.id = 'cancelarEdicion';
    c.className = 'sec';
    c.textContent = 'Cancelar edición';
    c.addEventListener('click', salirEdicion);
    btn.after(c);
  }
  $('resultadoNoticia').textContent = 'Editando: ' + (n.titulo || '');
  $('formNoticia').scrollIntoView({ behavior: 'smooth' });
}

$('formNoticia').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (usuarioNoticias === null) { return; }
  var fuentes = [];
  $('noticiaFuentes').value.split(String.fromCharCode(10)).forEach(function (linea) {
    var t = linea.trim();
    if (t === '') { return; }
    var partes = t.split('|');
    var url = '';
    if (partes.length === 2) { url = partes[1].trim(); }
    fuentes.push({ titulo: partes[0].trim(), url: url });
  });
  var registro = {
    tipo: $('noticiaTipo').value,
    parroquia: $('noticiaParroquia').value,
    titulo: $('noticiaTitulo').value.trim(),
    cuerpo: $('noticiaCuerpo').value.trim(),
    autorUid: editando === null ? usuarioNoticias.uid : editando.n.autorUid,
    autorCorreo: editando === null ? (usuarioNoticias.email || '') : (editando.n.autorCorreo || ''),
    creado: editando === null ? Date.now() : editando.n.creado,
    estado: 'pendiente'
  };
  if ($('noticiaFecha').value === '') {
    registro.fechaEvento = null;
    delete registro.fechaEvento;
  } else {
    registro.fechaEvento = $('noticiaFecha').value;
  }
  if ($('noticiaLugar').value.trim() === '') {
    registro.lugar = null;
    delete registro.lugar;
  } else {
    registro.lugar = $('noticiaLugar').value.trim();
  }
  if ($('noticiaVideo').value.trim() === '') {
    registro.video = null;
    delete registro.video;
  } else {
    registro.video = $('noticiaVideo').value.trim();
  }
  if (fuentes.length === 0) {
    registro.fuentes = null;
    delete registro.fuentes;
  } else {
    registro.fuentes = fuentes;
  }
  try {
    if (editando === null) {
      await push(ref(database, 'noticias_pendientes'), registro);
      $('resultadoNoticia').textContent = 'Enviada a revision.';
      $('formNoticia').reset();
    } else {
      await set(ref(database, 'noticias_pendientes/' + editando.id), registro);
      $('resultadoNoticia').textContent = 'Cambios guardados.';
      salirEdicion();
    }
    await cargarPendientes();
  } catch (err) {
    console.error(err);
    $('resultadoNoticia').textContent = mensajeError(err);
  }
});

async function cargarPendientes() {
  var lista = $('listaPendientes');
  limpiarHijos(lista);
  var snap = await get(ref(database, 'noticias_pendientes'));
  if (snap.exists() === false) {
    var vacio = document.createElement('li');
    vacio.textContent = 'No hay publicaciones pendientes.';
    lista.appendChild(vacio);
    return;
  }
  var datos = snap.val();
  var puedeAprobar = (rolActual === 'superadmin' || rolActual === 'revisor');
  Object.keys(datos).forEach(function (id) {
    var n = datos[id];
    var li = document.createElement('li');
    li.textContent = '[' + n.tipo + '] ' + n.titulo + ' (' + n.parroquia + ') ';
    if (puedeAprobar) {
      var bp = document.createElement('button');
      bp.textContent = 'Publicar';
      bp.addEventListener('click', function () { publicarNoticia(id, n); });
      li.appendChild(bp);
    }
    if (puedeAprobar || n.autorUid === usuarioNoticias.uid) {
      var be = document.createElement('button');
      be.textContent = 'Editar';
      be.addEventListener('click', function () { editarNoticia(id, n); });
      li.appendChild(be);
    }
    var bd = document.createElement('button');
    bd.textContent = 'Descartar';
    bd.className = 'sec';
    bd.addEventListener('click', function () { descartarNoticia(id); });
    li.appendChild(bd);
    lista.appendChild(li);
  });
}

async function publicarNoticia(id, n) {
  var copia = {};
  Object.keys(n).forEach(function (k) { copia[k] = n[k]; });
  copia.estado = 'publicado';
  copia.publicado = Date.now();
  copia.publicadoPor = usuarioNoticias.uid;
  delete copia.autorCorreo;
  try {
    await set(ref(database, 'noticias_publicas/' + id), copia);
    await remove(ref(database, 'noticias_pendientes/' + id));
    $('resultadoNoticia').textContent = 'Publicada.';
    await cargarPendientes();
  } catch (err) {
    console.error(err);
    $('resultadoNoticia').textContent = mensajeError(err);
  }
}

async function descartarNoticia(id) {
  if (window.confirm('Se eliminara esta publicacion pendiente. Continuar?') === false) { return; }
  try {
    await remove(ref(database, 'noticias_pendientes/' + id));
    $('resultadoNoticia').textContent = 'Descartada.';
    await cargarPendientes();
  } catch (err) {
    console.error(err);
    $('resultadoNoticia').textContent = mensajeError(err);
  }
}
