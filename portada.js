// PORTADA NUEVA (Notica): Evangelio del dia, noticias y buscador
(function () {
  var BASE = 'https://pagelalo-1b210-default-rtdb.firebaseio.com/';
  var ZONA = 'America/Mexico_City';
  var SALUDOS = ['Buenas noches', 'Buenos días', 'Buenas tardes'];
  var TRAMO = [0,0,0,0,0,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,0,0,0,0];

  var PAGINAS = [
    ['Juegos católicos', './juegos/index.html'],
    ['Rosarios', './rosarios/index.html'],
    ['Rosario', './rosario/index.html'],
    ['Rosario de Exequias', './rosario_difuntos/index.html'],
    ['Rosario de Aurora', './rosario_aurora/index.html'],
    ['Coronilla de la Misericordia', './coronilla/index.html'],
    ['5 minutos con María', './cinco-minutos-maria/index.html'],
    ['Biblia', './biblia/index.html'],
    ['Liturgia del día', './liturgia/index.html'],
    ['Intenciones de oración', './intenciones/index.html'],
    ['Trivia: ¿Quién quiere ser cristiano?', './triviaCristiana/index.html'],
    ['Criptograma bíblico', './criptograma_biblico/index.html'],
    ['Templos de Delicias', './templos/index.html'],
    ['Noticias', './noticias/index.html'],
    ['Chat litúrgico', './fray-noti/chat.html'],
    ['Recursos descargables', '#recursos']
  ];

  function $(id) { return document.getElementById(id); }

  function crear(tag, clase, texto) {
    var el = document.createElement(tag);
    if (clase) { el.className = clase; }
    if (texto !== undefined) { el.textContent = texto; }
    return el;
  }

  function lista(x) {
    if (!x) { return []; }
    if (Array.isArray(x)) { return x.filter(function (e) { return e; }); }
    return Object.keys(x).sort(function (a, b) { return Number(a) - Number(b); }).map(function (k) { return x[k]; });
  }

  function hoy() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  function hora() {
    var h = Number(new Intl.DateTimeFormat('en-US', { timeZone: ZONA, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
    return h;
  }

  function fechaBonita(s) {
    var t = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
      .format(new Date(s + 'T00:00:00Z'));
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function sinAcentos(s) {
    var de = 'áéíóúüñ';
    var a = 'aeiouun';
    return String(s).toLowerCase().split('').map(function (c) {
      var k = de.indexOf(c);
      return k === -1 ? c : a.charAt(k);
    }).join('');
  }

  function pintarSaludo() {
    var el = $('pn-saludo');
    if (el) { el.textContent = SALUDOS[TRAMO[hora()] || 0]; }
  }

  function cargarEvangelio() {
    var fecha = hoy();
    var elFecha = $('pn-ev-fecha');
    var elCita = $('pn-ev-cita');
    var enlace = $('pn-ev-link');
    if (elFecha === null || elCita === null) { return; }
    elFecha.textContent = fechaBonita(fecha);
    fetch(BASE + 'liturgia/' + fecha + '.json')
      .then(function (r) {
        if (r.ok === false) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (d) {
        var hallado = null;
        if (d && d.misas) {
          lista(d.misas).forEach(function (misa, i) {
            lista(misa.partes).forEach(function (p, j) {
              if (hallado === null && p.tipo === 'Evangelio') { hallado = { p: p, i: i, j: j }; }
            });
          });
        }
        if (hallado === null) {
          elCita.textContent = 'Todavía no está cargada la liturgia de hoy.';
          return;
        }
        elCita.textContent = hallado.p.cita || 'Evangelio del día';
        if (enlace) { enlace.href = './liturgia/index.html#m' + (hallado.i + 1) + '-p' + (hallado.j + 1); }
      })
      .catch(function (e) {
        console.error(e);
        elCita.textContent = 'No se pudo cargar el Evangelio.';
      });
  }

  function cargarNoticias() {
    var cont = $('pn-noticias-lista');
    if (cont === null) { return; }
    Promise.all([
      fetch(BASE + 'noticias_publicas.json').then(function (r) { return r.json(); }),
      fetch(BASE + 'parroquias.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
      var np = res[0] || {};
      var par = res[1] || {};
      var items = Object.keys(np).map(function (id) { return np[id]; })
        .filter(function (n) { return n && n.titulo; })
        .sort(function (a, b) { return (b.publicado || 0) - (a.publicado || 0); })
        .slice(0, 5);
      cont.textContent = '';
      if (items.length === 0) {
        cont.appendChild(crear('p', 'pn-estado', 'Aún no hay noticias publicadas.'));
        return;
      }
      items.forEach(function (n) {
        var a = crear('a', 'pn-noticia');
        a.href = './noticias/index.html';
        a.appendChild(crear('span', 'pn-noticia-tipo', n.tipo || 'Noticia'));
        a.appendChild(crear('div', 'pn-noticia-titulo', n.titulo));
        var nombre = (par[n.parroquia] && par[n.parroquia].nombre) ? par[n.parroquia].nombre : '';
        var meta = nombre;
        if (n.publicado) {
          var f = new Date(n.publicado).toLocaleDateString('es-MX');
          meta = meta === '' ? f : meta + ' - ' + f;
        }
        a.appendChild(crear('div', 'pn-noticia-meta', meta));
        cont.appendChild(a);
      });
    }).catch(function (e) {
      console.error(e);
      cont.textContent = '';
      cont.appendChild(crear('p', 'pn-estado', 'No se pudieron cargar las noticias.'));
    });
  }

  function iniciarExplorar() {
    var panel = $('pn-explorar');
    var caja = $('pn-buscar');
    var res = $('pn-resultados');
    var abrir = $('pn-btn-explorar');
    var cerrar = $('pn-cerrar');
    if (panel === null || caja === null || res === null) { return; }

    function mostrar(texto) {
      var q = sinAcentos(texto).trim();
      res.textContent = '';
      var hallados = PAGINAS.filter(function (p) { return q === '' || sinAcentos(p[0]).indexOf(q) !== -1; });
      if (hallados.length === 0) {
        res.appendChild(crear('p', 'pn-estado', 'No encontré nada con esa búsqueda.'));
        return;
      }
      hallados.forEach(function (p) {
        var a = crear('a', 'pn-resultado', p[0]);
        a.href = p[1];
        a.addEventListener('click', function () { panel.hidden = true; });
        res.appendChild(a);
      });
    }

    function abrirPanel() {
      panel.hidden = false;
      caja.value = '';
      mostrar('');
      caja.focus();
    }
    function cerrarPanel() { panel.hidden = true; }

    if (abrir) { abrir.addEventListener('click', abrirPanel); }
    if (cerrar) { cerrar.addEventListener('click', cerrarPanel); }
    caja.addEventListener('input', function () { mostrar(caja.value); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { cerrarPanel(); } });
  }

  function iniciarMenu() {
    var inicio = $('pn-btn-inicio');
    if (inicio) { inicio.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }); }
    document.querySelectorAll('.pn-nav-item.pronto').forEach(function (b) {
      b.addEventListener('click', function () { alert('Próximamente'); });
    });
  }

  pintarSaludo();
  cargarEvangelio();
  cargarNoticias();
  iniciarExplorar();
  iniciarMenu();
})();
