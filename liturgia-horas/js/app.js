/* Sección Liturgia de las Horas — interfaz.
 * Carga los JSON de ./data y arma cada Hora según la fecha.
 */
(function () {
  "use strict";
  var C = window.Calendario;
  var $ = function (s, el) { return (el || document).querySelector(s); };

  var HORAS = [
    { id: "invitatorio", nombre: "Invitatorio" },
    { id: "oficio", nombre: "Oficio de lectura" },
    { id: "laudes", nombre: "Laudes" },
    { id: "intermedia", nombre: "Hora intermedia" },
    { id: "visperas", nombre: "Vísperas" },
    { id: "completas", nombre: "Completas" }
  ];

  var cache = {};
  function getJSON(path) {
    if (!cache[path]) {
      cache[path] = fetch("data/" + path).then(function (r) {
        if (!r.ok) throw new Error("No se pudo cargar " + path);
        return r.json();
      });
    }
    return cache[path];
  }

  // ---------- preferencias (localStorage con try/catch) ----------
  function pref(k, v) {
    try {
      if (v === undefined) return localStorage.getItem("lit_" + k);
      localStorage.setItem("lit_" + k, v);
    } catch (e) { return null; }
  }

  // ---------- texto -> HTML ----------
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function esMayus(l) {
    return l.length > 3 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{3}/.test(l);
  }
  function linea(l) {
    var m;
    if ((m = /^(Ant\.(?:\s*\d)?\.?)\s*(.*)$/.exec(l))) return '<span class="rub">' + esc(m[1]) + "</span> " + esc(m[2]);
    if ((m = /^([VR]\.)\s*(.*)$/.exec(l))) return '<span class="rub">' + m[1] + "</span> " + esc(m[2]);
    return esc(l);
  }
  function textoHtml(t) {
    if (!t) return "";
    return t.split(/\n{2,}/).map(function (p) {
      var ls = p.split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).filter(Boolean);
      if (!ls.length) return "";
      var out = [], cls = "";
      var i = 0;
      // encabezados de salmo / cántico / título en mayúsculas al comienzo del párrafo
      while (i < ls.length) {
        var l = ls[i].trim();
        if (/^(Salmo|Cántico)\b/.test(l) && l.length < 60) {
          out.push('<h4 class="salmo">' + esc(l) + "</h4>"); i++;
        } else if (esMayus(l)) {
          out.push('<p class="tit">' + esc(l) + "</p>"); i++;
        } else break;
      }
      var resto = ls.slice(i);
      if (resto.length) {
        var verso = resto.every(function (l) { return l.length < 70; }) && resto.length > 1;
        out.push('<p class="' + (verso ? "verso" : "prosa") + '">' + resto.map(function (l) { return linea(l.trim()); }).join("<br>") + "</p>");
      }
      return out.join("");
    }).join("");
  }

  function bloque(titulo, html, extra) {
    if (!html) return "";
    return '<section class="bloque' + (extra ? " " + extra : "") + '"><h3>' + esc(titulo) + "</h3>" + html + "</section>";
  }
  function nota(t) { return '<p class="nota">' + esc(t) + "</p>"; }

  function sec(secs, tipo) {
    for (var i = 0; i < (secs || []).length; i++) if (secs[i].tipo === tipo) return secs[i];
    return null;
  }
  function secHtml(secs, tipo, titulo, opts) {
    var s = sec(secs, tipo);
    if (!s || !s.texto) return "";
    var t = s.texto;
    var h = textoHtml(t);
    var tit = titulo + (s.ref ? " · " + s.ref : "");
    return bloque(tit, h, opts && opts.cls);
  }
  function sinCanticoFinal(t) {
    // el Salterio deja "Benedictus"/"Magníficat" como última línea: se reemplaza por el texto del Ordinario
    return t.replace(/\n(Benedictus|Magn[ií]ficat)\s*$/i, "").trim();
  }

  var BENDICION = "V. El Señor nos bendiga, nos guarde de todo mal y nos lleve a la vida eterna.\nR. Amén.";

  // ---------- Oficio de lectura: lecturas del Propio ----------
  function agruparOficio(secs) {
    var grupos = [], cur = null, l2 = null, resp2 = [], oracion = null, teDeum = false;
    (secs || []).forEach(function (x) {
      if (x.tipo === "lectura1") { cur = { anio: x.anio || null, lec: x, resp: [] }; grupos.push(cur); }
      else if (x.tipo === "lectura2") { cur = null; l2 = x; }
      else if (x.tipo === "responsorio") { if (cur) cur.resp.push(x); else resp2.push(x); }
      else if (x.tipo === "te_deum") { teDeum = true; }
      else if (x.tipo === "oracion") { oracion = x; }
    });
    return { grupos: grupos, l2: l2, resp2: resp2, oracion: oracion, teDeum: teDeum };
  }
  function elegirGrupo(grupos, pref) {
    var g = null, i;
    for (i = 0; i < grupos.length; i++) if (grupos[i].anio === pref) { g = grupos[i]; break; }
    if (!g) for (i = 0; i < grupos.length; i++) if (!grupos[i].anio) { g = grupos[i]; break; }
    return g || grupos[0] || null;
  }
  function responsoriosHtml(rs) {
    return rs.map(function (r) {
      return bloque("Responsorio" + (r.ref ? " · " + r.ref : ""), textoHtml(r.texto), "resp");
    }).join("");
  }

  // ---------- armado de cada hora ----------
  function armarHora(hora, ctx) {
    var ord = ctx.ord, info = ctx.info, sal = ctx.sal, comp = ctx.comp;
    var dk = info.diaKey, h = "";
    var esDom = dk === "dom";
    var faltaOracion = nota("La oración de este día no está disponible todavía.");

    if (hora === "invitatorio") {
      var inv = sec(sal[dk].invitatorio, "inicio");
      var antInv = inv ? (inv.texto.match(/^Ant\..*$/m) || [""])[0] : "";
      h += bloque("Invitatorio", textoHtml(ord.invitatorio.versiculo) + (antInv ? textoHtml(antInv) : ""));
      h += '<div class="selector" role="group" aria-label="Salmo invitatorio">' +
        ["94", "99", "66", "23"].map(function (n) {
          return '<button type="button" data-salmo="' + n + '" class="' + (ctx.salmoInv === n ? "on" : "") + '">Salmo ' + n + "</button>";
        }).join("") + "</div>";
      h += bloque("Salmo " + ctx.salmoInv, textoHtml(ord.invitatorio.salmos[ctx.salmoInv].replace(/^Salmo \d+\s*/, "")));
      h += nota("La antífona se dice antes del salmo y se repite entre las estrofas. En Laudes, el Invitatorio es opcional si se empieza el día con esa hora.");
      return h;
    }

    if (hora === "oficio") {
      var s = sal[dk].oficio;
      h += bloque("Introducción", textoHtml("V. Dios mío, ven en mi auxilio.\nR. Señor, date prisa en socorrerme.\nGloria al Padre, y al Hijo, y al Espíritu Santo.\nComo era en el principio, ahora y siempre,\npor los siglos de los siglos. Amén."));
      var hOf = sec(s, "himno");
      if (hOf && /^Se puede tomar de Laudes/.test(hOf.texto)) {
        var usaL = new Date().getHours() < 14;
        var fuente = usaL ? sal[dk].laudes : (esDom ? sal[dk].visperas2 : sal[dk].visperas);
        h += secHtml(fuente, "himno", "Himno · de " + (usaL ? "Laudes" : "Vísperas"));
        var alt = hOf.texto.split(/\n\s*O bien:\s*\n/)[1];
        if (alt) h += bloque("Himno · alternativo", textoHtml(alt.trim()));
        h += nota("En el Oficio de lectura se puede tomar el himno de Laudes o el de Vísperas, según la hora del día.");
      } else {
        h += secHtml(s, "himno", "Himno");
      }
      h += secHtml(s, "salmodia", "Salmodia");
      h += secHtml(s, "versiculo", "Versículo");
      var po = ctx.prop && ctx.prop[dk] && ctx.prop[dk].oficio;
      if (po) {
        var ag = agruparOficio(po);
        var hayAnual = ag.grupos.some(function (g) { return g.anio === "anual"; });
        var pref = (hayAnual && ctx.ciclo === "anual") ? "anual" : ctx.anioFerial;
        if (hayAnual) {
          h += '<div class="selector" role="group" aria-label="Ciclo de lecturas">' +
            '<button type="button" data-ciclo="bienal" class="' + (pref !== "anual" ? "on" : "") + '">Ciclo bienal (Año ' + ctx.anioFerial + ')</button>' +
            '<button type="button" data-ciclo="anual" class="' + (pref === "anual" ? "on" : "") + '">Ciclo anual</button></div>';
        }
        var g = elegirGrupo(ag.grupos, pref);
        if (g) {
          h += bloque("Primera lectura", textoHtml(g.lec.texto), "lectura");
          h += responsoriosHtml(g.resp);
        }
        if (ag.l2) {
          h += bloque("Segunda lectura", textoHtml(ag.l2.texto), "lectura");
          h += responsoriosHtml(ag.resp2);
        }
        if (ag.teDeum) h += bloque("Himno Te Deum", textoHtml(ord.te_deum));
        h += bloque("Oración", ag.oracion ? textoHtml(ag.oracion.texto) : nota("Oración del día: consulta el libro."));
        h += bloque("Conclusión", textoHtml("V. Bendigamos al Señor.\nR. Demos gracias a Dios."));
      } else {
        h += nota("Las lecturas de este Oficio no están disponibles todavía.");
      }
      return h;
    }

    if (hora === "laudes" || hora === "visperas") {
      var key = hora === "laudes" ? "laudes" : (esDom ? "visperas2" : "visperas");
      var data = sal[dk][key];
      if (hora === "visperas" && ctx.visperas1) { data = ctx.visperas1.data; }
      var esL = hora === "laudes";
      var titulo = esL ? "Laudes" : (ctx.visperas1 ? "I Vísperas del domingo " + C.ROMANOS[ctx.visperas1.info.semana] : (esDom ? "II Vísperas" : "Vísperas"));
      h += bloque("Introducción", textoHtml("V. Dios mío, ven en mi auxilio.\nR. Señor, date prisa en socorrerme.\nGloria al Padre, y al Hijo, y al Espíritu Santo.\nComo era en el principio, ahora y siempre,\npor los siglos de los siglos. Amén."));
      h += secHtml(data, "himno", "Himno");
      h += secHtml(data, "salmodia", "Salmodia");
      h += secHtml(data, "lectura_breve", "Lectura breve");
      h += secHtml(data, "responsorio_breve", "Responsorio breve");
      var propHora = null, cicloDom = ctx.cicloDom;
      if (esL) { propHora = ctx.prop && ctx.prop[dk] && ctx.prop[dk].laudes; }
      else if (ctx.visperas1) { propHora = ctx.visperas1.prop; cicloDom = ctx.visperas1.ciclo; }
      else if (esDom) { propHora = ctx.prop && ctx.prop.dom && ctx.prop.dom.visperas2; }
      var ce = sec(data, "cantico_evangelico");
      if (ce) {
        var cant = esL ? ord.benedictus : ord.magnificat;
        var antTxt = sinCanticoFinal(ce.texto), antProp = "";
        var cp = propHora && sec(propHora, "cantico_evangelico");
        if (cp && cp.ant_ciclo && cp.ant_ciclo[cicloDom]) antProp = "Ant. " + cp.ant_ciclo[cicloDom];
        var sinAnt = !/^Ant\./m.test(antTxt);
        var antHtml = antProp ? textoHtml(antProp) : (sinAnt ? nota("La antífona de este día no está disponible todavía.") : textoHtml(antTxt));
        h += bloque("Cántico evangélico" + (antProp ? " · Ciclo " + cicloDom : ""), antHtml + textoHtml(cant), "cantico");
      }
      h += secHtml(data, "preces", "Preces");
      h += bloque("Padre nuestro", textoHtml(ord.padre_nuestro));
      var o = sec(data, "oracion") || (propHora && sec(propHora, "oracion"));
      h += o ? bloque("Oración", textoHtml(o.texto)) : bloque("Oración", faltaOracion);
      h += bloque("Conclusión", textoHtml(BENDICION));
      return h;
    }

    if (hora === "intermedia") {
      var im = sal[dk].intermedia;
      var sub = ctx.sub;
      h += '<div class="selector" role="group" aria-label="Hora menor">' + ["tercia", "sexta", "nona"].map(function (n) {
        return '<button type="button" data-sub="' + n + '" class="' + (sub === n ? "on" : "") + '">' + n.charAt(0).toUpperCase() + n.slice(1) + "</button>";
      }).join("") + "</div>";
      h += bloque("Introducción", textoHtml("V. Dios mío, ven en mi auxilio.\nR. Señor, date prisa en socorrerme.\nGloria al Padre, y al Hijo, y al Espíritu Santo.\nComo era en el principio, ahora y siempre,\npor los siglos de los siglos. Amén."));
      h += secHtml(im.comun, "himno", "Himno");
      h += secHtml(im.comun, "salmodia", "Salmodia");
      h += secHtml(im[sub], "lectura_breve", "Lectura breve");
      h += secHtml(im[sub], "oracion", "Oración");
      h += bloque("Conclusión", textoHtml("V. Bendigamos al Señor.\nR. Demos gracias a Dios."));
      return h;
    }

    if (hora === "completas") {
      var ck = ctx.completasKey;
      var cd = comp[ck];
      var fijo = ord.completas_fijo;
      h += bloque("Introducción", textoHtml("V. Dios mío, ven en mi auxilio.\nR. Señor, date prisa en socorrerme.\nGloria al Padre, y al Hijo, y al Espíritu Santo.\nComo era en el principio, ahora y siempre,\npor los siglos de los siglos. Amén. Aleluya."));
      h += bloque("Examen de conciencia", textoHtml(fijo.examen.replace(/^EXAMEN DE CONCIENCIA\s*/, "")));
      h += secHtml(cd, "himno", "Himno");
      h += secHtml(cd, "salmodia", "Salmodia");
      h += secHtml(cd, "lectura_breve", "Lectura breve");
      h += bloque("Responsorio breve", textoHtml(fijo.responsorio_breve));
      h += bloque("Cántico evangélico", textoHtml(fijo.cantico_ant) + textoHtml(ord.nunc_dimittis), "cantico");
      h += secHtml(cd, "oracion", "Oración");
      h += bloque("Conclusión", textoHtml("V. El Señor todopoderoso nos conceda una noche tranquila y una santa muerte.\nR. Amén."));
      return h;
    }
    return "";
  }

  // ---------- estado y vista ----------
  var estado = { fecha: null, hora: null, sub: "tercia", salmoInv: "94", ciclo: "bienal" };

  function horaPorDefecto(esHoy) {
    if (!esHoy) return "laudes";
    var hh = new Date().getHours();
    return hh < 5 ? "oficio" : hh < 9 ? "laudes" : hh < 15 ? "intermedia" : hh < 19 ? "visperas" : "completas";
  }
  function subPorDefecto() {
    var hh = new Date().getHours();
    return hh < 12 ? "tercia" : hh < 15 ? "sexta" : "nona";
  }

  function fechaLarga(d) {
    var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return C.DIAS[d.getUTCDay()] + " " + d.getUTCDate() + " de " + meses[d.getUTCMonth()] + " de " + d.getUTCFullYear();
  }

  var tiempoNombre = { adviento: "Adviento", navidad: "Navidad", cuaresma: "Cuaresma", pascua: "Pascua" };

  function render() {
    var f = estado.fecha, info = C.info(f);
    var esHoy = C.isoDate(f) === C.isoDate(C.fromLocal(new Date()));
    $("#lit-fecha").textContent = fechaLarga(f);
    $("#lit-fecha-input").value = C.isoDate(f);
    $("#lit-titulo").textContent = info.soportado ? info.titulo : (tiempoNombre[info.tiempo] || "") + " — aún no disponible";
    $("#lit-sub").textContent = info.soportado ? "Salterio, semana " + C.ROMANOS[info.salterio] : "";
    document.title = "Liturgia de las Horas · " + C.isoDate(f);
    try { history.replaceState(null, "", "#" + C.isoDate(f)); } catch (e) {}

    var cont = $("#lit-contenido"), tabs = $("#lit-tabs");
    if (!info.soportado) {
      tabs.innerHTML = "";
      cont.innerHTML = '<div class="aviso"><strong>Esta fecha cae en ' + (tiempoNombre[info.tiempo] || "otro tiempo") + '.</strong><p>Por ahora la sección tiene cargado el <em>Tiempo Ordinario</em> (Salterio de 4 semanas, Ordinario y Completas). Los tiempos fuertes (Adviento, Navidad, Cuaresma y Pascua) se agregan en la siguiente etapa.</p><button type="button" id="lit-proximo" class="btn">Ir al siguiente día en Tiempo Ordinario</button></div>';
      $("#lit-proximo").addEventListener("click", function () {
        var d = f;
        for (var i = 0; i < 400; i++) { d = C.addDays(d, 1); if (C.info(d).soportado) break; }
        ir(d);
      });
      return;
    }

    if (!estado.hora) estado.hora = horaPorDefecto(esHoy);

    // sábado: I Vísperas y Completas del domingo
    var esSab = info.diaKey === "sab";
    var manana = C.addDays(f, 1), infoManana = C.info(manana);
    var nombres = HORAS.map(function (h) {
      var n = h.nombre;
      if (h.id === "visperas" && esSab) n = "I Vísperas";
      if (h.id === "visperas" && info.diaKey === "dom") n = "II Vísperas";
      return { id: h.id, nombre: n };
    });
    tabs.innerHTML = nombres.map(function (h) {
      return '<button type="button" role="tab" data-hora="' + h.id + '" aria-selected="' + (estado.hora === h.id) + '" class="' + (estado.hora === h.id ? "on" : "") + '">' + h.nombre + "</button>";
    }).join("");

    cont.innerHTML = '<p class="cargando">Cargando…</p>';
    var pedidos = [getJSON("ordinario.json"), getJSON("completas.json"), getJSON("salterio/semana" + info.salterio + ".json"),
      getJSON("propio_to/semana" + info.semana + ".json")];
    var needV1 = esSab && estado.hora === "visperas" && infoManana.soportado;
    if (needV1) { pedidos.push(getJSON("salterio/semana" + infoManana.salterio + ".json")); pedidos.push(getJSON("propio_to/semana" + infoManana.semana + ".json")); }
    Promise.all(pedidos).then(function (r) {
      var sal = r[2];
      var ctx = { info: info, ord: r[0], comp: r[1], sal: sal, prop: r[3], sub: estado.sub, salmoInv: estado.salmoInv,
        ciclo: estado.ciclo, anioFerial: C.anioFerial(f), cicloDom: C.cicloDominical(f),
        completasKey: esSab ? "dom1" : info.diaKey, visperas1: null };
      if (needV1 && r[4]) ctx.visperas1 = { info: infoManana, data: r[4].dom.visperas1, prop: (r[5].dom || {}).visperas1, ciclo: C.cicloDominical(manana) };
      var html = armarHora(estado.hora, ctx);
      html += '<p class="pie">Texto: Liturgia de las Horas según el rito romano, edición típica española con doble lectura bíblica de la edición latinoamericana. © Comisión Episcopal de Liturgia de la Conferencia Episcopal Española. Distribución gratuita; prohibida su venta. Aún no incluye memorias, fiestas ni solemnidades de santos; ni Adviento, Navidad, Cuaresma y Pascua.</p>';
      cont.innerHTML = html;
      cont.scrollTop = 0;
    }).catch(function (e) {
      cont.innerHTML = '<div class="aviso"><strong>No se pudo cargar el texto.</strong><p>' + esc(String(e.message || e)) + "</p></div>";
    });
  }

  function ir(d) { estado.fecha = d; estado.hora = null; render(); window.scrollTo(0, 0); }

  function aplicarTam(px) {
    document.documentElement.style.setProperty("--lit-tam", px + "px");
    pref("tam", String(px));
  }

  function init() {
    var hash = C.parseIso((location.hash || "").slice(1));
    estado.fecha = hash || C.fromLocal(new Date());
    estado.sub = subPorDefecto();

    var tam = parseInt(pref("tam"), 10);
    var actual = tam >= 14 && tam <= 30 ? tam : 20;
    aplicarTam(actual);

    $("#lit-ant").addEventListener("click", function () { ir(C.addDays(estado.fecha, -1)); });
    $("#lit-sig").addEventListener("click", function () { ir(C.addDays(estado.fecha, 1)); });
    $("#lit-hoy").addEventListener("click", function () { ir(C.fromLocal(new Date())); });
    $("#lit-fecha-input").addEventListener("change", function (e) { var d = C.parseIso(e.target.value); if (d) ir(d); });
    $("#lit-mas").addEventListener("click", function () { actual = Math.min(30, actual + 2); aplicarTam(actual); });
    $("#lit-menos").addEventListener("click", function () { actual = Math.max(14, actual - 2); aplicarTam(actual); });
    $("#lit-tabs").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-hora]");
      if (b) { estado.hora = b.getAttribute("data-hora"); render(); }
    });
    $("#lit-contenido").addEventListener("click", function (e) {
      var s = e.target.closest("button[data-salmo]"), u = e.target.closest("button[data-sub]"), cc = e.target.closest("button[data-ciclo]");
      if (cc) { estado.ciclo = cc.getAttribute("data-ciclo"); render(); }
      if (s) { estado.salmoInv = s.getAttribute("data-salmo"); render(); }
      if (u) { estado.sub = u.getAttribute("data-sub"); render(); }
    });
    window.addEventListener("hashchange", function () {
      var d = C.parseIso((location.hash || "").slice(1));
      if (d && C.isoDate(d) !== C.isoDate(estado.fecha)) ir(d);
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
