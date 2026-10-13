// liturgia/admin.js
// Panel para subir el misal mensual (.md) a Firebase en liturgia/AAAA-MM-DD
import { database, auth } from '../templos/firebase-config.js';
import { ref, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { parsearMisal } from './parser.js';

// Solo cortesía de interfaz: la seguridad real son las reglas de Firebase.
var ADMIN_UIDS = ['4E3dppwJOlPARubLeRAFAu9Hhps2', 'xqhClOg845dSU5XIu4vqTCy4XAj2'];
var datosListos = null;

function $(id) { return document.getElementById(id); }
function limpiarHijos(el) { while (el.firstChild) { el.removeChild(el.firstChild); } }

onAuthStateChanged(auth, function (user) {
  if (user && ADMIN_UIDS.indexOf(user.uid) !== -1) {
    $('pantallaLogin').style.display = 'none';
    $('panel').style.display = 'block';
    $('correo').textContent = user.email || '';
    return;
  }
  $('panel').style.display = 'none';
  $('pantallaLogin').style.display = 'block';
  if (user && user.isAnonymous === false) {
    $('errorLogin').textContent = 'Esta cuenta no tiene permiso para subir la liturgia.';
    signOut(auth);
  }
});

$('formLogin').addEventListener('submit', async function (e) {
  e.preventDefault();
  $('errorLogin').textContent = '';
  try {
    await signInWithEmailAndPassword(auth, $('email').value.trim(), $('clave').value);
  } catch (err) {
    console.error(err);
    $('errorLogin').textContent = 'No se pudo iniciar sesión. Revisa tu correo y contraseña.';
  }
});

$('salir').addEventListener('click', function () { signOut(auth); });

function contarPartes(dia) {
  var n = 0;
  dia.misas.forEach(function (m) { n += m.partes.length; });
  return n;
}

function contarLetras(dia) {
  var n = 0;
  dia.misas.forEach(function (m) {
    m.partes.forEach(function (p) { n += p.texto.length; });
  });
  return n;
}

function mostrarVistaPrevia(res) {
  var claves = Object.keys(res.dias).sort();
  var lista = $('avisos');
  limpiarHijos(lista);
  res.avisos.forEach(function (a) {
    var li = document.createElement('li');
    li.textContent = a;
    lista.appendChild(li);
  });
  $('bloqueAvisos').style.display = res.avisos.length > 0 ? 'block' : 'none';

  var cuerpo = $('filas');
  limpiarHijos(cuerpo);
  var totalMisas = 0;
  var totalPartes = 0;
  claves.forEach(function (k) {
    var d = res.dias[k];
    totalMisas += d.misas.length;
    totalPartes += contarPartes(d);
    var tr = document.createElement('tr');
    [k, d.titulo, String(d.misas.length), String(contarPartes(d)), String(contarLetras(d))].forEach(function (v) {
      var td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    cuerpo.appendChild(tr);
  });
  $('resumen').textContent = claves.length + ' día(s), ' + totalMisas + ' misa(s) y ' + totalPartes + ' parte(s) leídos.';
  $('vistaPrevia').style.display = claves.length > 0 ? 'block' : 'none';
  $('subir').disabled = claves.length === 0;
  $('subir').textContent = 'Subir ' + claves.length + ' día(s)';
}

$('archivo').addEventListener('change', async function (e) {
  $('resultado').textContent = '';
  datosListos = null;
  var f = e.target.files[0];
  if (!f) { return; }
  try {
    var texto = await f.text();
    var res = parsearMisal(texto);
    datosListos = res.dias;
    mostrarVistaPrevia(res);
    if (Object.keys(res.dias).length === 0) {
      $('resultado').textContent = 'No se encontró ningún día. Cada día debe empezar con una línea como: ## 2026-10-14';
    }
  } catch (err) {
    console.error(err);
    $('resultado').textContent = 'No se pudo leer el archivo.';
  }
});

$('subir').addEventListener('click', async function () {
  if (datosListos === null) { return; }
  var n = Object.keys(datosListos).length;
  if (n === 0) { return; }
  var pregunta = 'Se subirán ' + n + ' día(s) a la base de datos y quedarán visibles públicamente. ' +
    'Si algún día ya existe, se sobrescribe. ¿Continuar?';
  if (window.confirm(pregunta) === false) { return; }
  $('subir').disabled = true;
  $('resultado').textContent = 'Subiendo...';
  try {
    await update(ref(database, 'liturgia'), datosListos);
    $('resultado').textContent = 'Listo: se subieron ' + n + ' día(s).';
  } catch (err) {
    console.error(err);
    var msg = String(err && err.message ? err.message : err);
    if (msg.indexOf('PERMISSION_DENIED') !== -1 || msg.toLowerCase().indexOf('permission') !== -1) {
      $('resultado').textContent = 'Sin permiso para escribir. Revisa las reglas de la base de datos y que esta cuenta sea la administradora.';
    } else {
      $('resultado').textContent = 'Error al subir: ' + msg;
    }
  }
  $('subir').disabled = false;
});
