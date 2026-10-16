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
  var ALE = null;   // 'quitar' en Cuaresma, 'agregar' en Pascua
  function quitarAl(l) {
    var r = l.replace(/[\s,]*¡?[Aa]leluya(?:,\s*[Aa]leluya)*[.!]?\s*$/, "");
    if (r === l) return l;
    return /[,;:]$/.test(r) ? r.replace(/[,;:]$/, ".") : (/[.?!»]$/.test(r) ? r : r + ".");
  }
  function textoHtml(t) {
    if (!t) return "";
    return t.split(/\n{2,}/).map(function (p) {
      var ls = p.split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).filter(Boolean);
      if (!ls.length) return "";
      if (ALE === "quitar") ls = ls.map(quitarAl);
      else if (ALE === "agregar" && /^Ant\./.test(ls[0]) && !/[Aa]leluya[.!]?$/.test(ls[ls.length - 1])) {
        ls[ls.length - 1] = ls[ls.length - 1].replace(/[.]?\s*$/, ". Aleluya.");
      }
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
  var INTRO = "V. Dios mío, ven en mi auxilio.\nR. Señor, date prisa en socorrerme.\nGloria al Padre, y al Hijo, y al Espíritu Santo.\nComo era en el principio, ahora y siempre,\npor los siglos de los siglos. Amén.";

  function intro(ctx) { return INTRO + (ctx.info.tiempo === "cuaresma" ? "" : " Aleluya."); }

  // primera sección con texto, buscando en varias fuentes (arreglos de secciones)
  function primera(tipo, fuentes) {
    for (var i = 0; i < fuentes.length; i++) {
      var x = sec(fuentes[i], tipo);
      if (x && (x.texto || x.ant_ciclo)) return x;
    }
    return null;
  }
  function bl(tit, x, cls) { return x && x.texto ? bloque(tit + (x.ref ? " · " + x.ref : ""), textoHtml(x.texto), cls) : ""; }
  function himnosComunes(arr, tit) {
    return (arr || []).filter(function (x) { return x.tipo === "himno" && x.texto && x.texto.length > 20; }).map(function (x, i, l) {
      return bloque(tit + (l.length > 1 ? " · " + (x.ref ? x.ref : (i + 1)) : ""), textoHtml(x.texto));
    }).join("");
  }
  function antDeInvitatorio(secs) {
    var x = sec(secs, "inicio");
    return x ? (x.texto.match(/^Ant\..*$/m) || [""])[0] : "";
  }

  // Octava de Pascua: "Antífona / TERCIA: ... / SEXTA: ... / NONA: ... / En una de estas Horas se dicen los siguientes salmos:"
  function antIntermedia(t, sub) {
    var nombres = { tercia: "TERCIA", sexta: "SEXTA", nona: "NONA" };
    var lines = t.split("\n"), ants = {}, cur = null, resto = [], en = false;
    lines.forEach(function (l) {
      var m = /^(TERCIA|SEXTA|NONA):\s*(.*)$/.exec(l.trim());
      if (m) { cur = m[1]; ants[cur] = m[2]; en = true; return; }
      if (en && cur && l.trim() && !/^En una de estas Horas/.test(l.trim()) && !/^Salmo\b/.test(l.trim())) { ants[cur] += " " + l.trim(); return; }
      if (/^Antífona\s*$/.test(l.trim())) return;
      cur = null;
      resto.push(l);
    });
    var a = ants[nombres[sub]];
    return (a ? "Ant. " + a + "\n\n" : "") + resto.join("\n").replace(/^\s+/, "");
  }

  // Tiempo pascual: en la Hora intermedia las antífonas son "Aleluya, aleluya, aleluya."
  function antPascuaInter(t) {
    return t.split(/\n{2,}/).map(function (p) {
      var m = /^Ant\.\s*(\d)?\.?/.exec(p);
      return m ? "Ant. " + (m[1] ? m[1] + ". " : "") + "Aleluya, aleluya, aleluya." : p;
    }).join("\n\n");
  }

  function armarHora(hora, ctx) {
    var ord = ctx.ord, info = ctx.info, sal = ctx.sal, comp = ctx.comp, P = ctx.P || {}, K = ctx.K || null;
    var dk = info.diaKey, h = "";
    var esDom = dk === "dom";
    var S = sal[dk] || {};
    var faltaOracion = nota("La oración de este día no está disponible todavía.");

    var M = ctx.M || null;   // memoria obligatoria de un santo sobre la feria
    function oracionLaudes() {
      if (M && M.oracion) return { texto: M.oracion };
      return primera("oracion", [P.laudes, S.laudes]);
    }
    function avisoMemoria(oficio) {
      if (!M) return "";
      var t = "Memoria obligatoria: " + M.titulo + ". El himno, la salmodia y la lectura breve son los del día" +
        (M.comun ? " (o " + M.comun.replace(/^Del /, "del ").replace(/\.$/, "") + ")" : "") + ".";
      return nota(t) + (oficio && M.semblanza ? bloque("Semblanza", textoHtml(M.semblanza)) : "");
    }

    if (hora === "invitatorio") {
      var antInv = antDeInvitatorio(P.invitatorio) || antDeInvitatorio(K && K.invitatorio) || antDeInvitatorio(S.invitatorio);
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
      var s = S.oficio, po = P.oficio;
      h += avisoMemoria(true);
      if (ctx.santo && !M && ctx.santo.semblanza) h += bloque("Semblanza", textoHtml(ctx.santo.semblanza));
      if (ctx.santo && ctx.santo.nota) h += nota(ctx.santo.nota);
      h += bloque("Introducción", textoHtml(intro(ctx)));
      var hP = primera("himno", [po]);
      var hOf = sec(s, "himno");
      if (hP) {
        h += bl("Himno", hP);
      } else if (K && K.oficio && himnosComunes(K.oficio, "Himno")) {
        h += himnosComunes(K.oficio, "Himno");
      } else if (hOf && /^Se puede tomar de Laudes/.test(hOf.texto)) {
        var usaL = new Date().getHours() < 14;
        var fuente = usaL ? S.laudes : (esDom ? S.visperas2 : S.visperas);
        h += secHtml(fuente, "himno", "Himno · de " + (usaL ? "Laudes" : "Vísperas"));
        var alt = hOf.texto.split(/\n\s*O bien:\s*\n/)[1];
        if (alt) h += bloque("Himno · alternativo", textoHtml(alt.trim()));
        h += nota("En el Oficio de lectura se puede tomar el himno de Laudes o el de Vísperas, según la hora del día.");
      } else {
        h += secHtml(s, "himno", "Himno");
      }
      h += bl("Salmodia", primera("salmodia", [po, s]));
      h += bl("Versículo", primera("versiculo", [po, s]));
      if (po && po.some(function (x) { return x.tipo === "lectura3"; })) {
        h += nota("Hoy la Vigilia pascual reemplaza el Oficio de lectura. Quienes no hayan asistido a la Vigilia pueden leer, por lo menos, cuatro de las lecturas con sus cánticos y oraciones; aquí se ofrecen tres.");
        var nlec = 0;
        po.forEach(function (x) {
          if (/^lectura[123]$/.test(x.tipo)) { nlec++; h += bloque(nlec + "ª lectura", textoHtml(x.texto), "lectura"); }
          else if (x.tipo === "oracion") h += bloque("Oración", textoHtml(x.texto));
        });
        return h;
      }
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
        if (M && M.horas.oficio) {
          var ml = sec(M.horas.oficio, "lectura2");
          if (ml) { ag.l2 = ml; ag.resp2 = M.horas.oficio.filter(function (x) { return x.tipo === "responsorio"; }); ag.oracion = { texto: M.oracion }; }
        }
        if (ag.l2) {
          h += bloque("Segunda lectura", textoHtml(ag.l2.texto), "lectura");
          h += responsoriosHtml(ag.resp2);
        }
        if (ag.teDeum) h += bloque("Himno Te Deum", textoHtml(ord.te_deum));
        var oo = ag.oracion || oracionLaudes();
        h += bloque("Oración", oo ? textoHtml(oo.texto) : nota("Oración del día: consulta el libro."));
        h += bloque("Conclusión", textoHtml("V. Bendigamos al Señor.\nR. Demos gracias a Dios."));
      } else {
        h += nota("Las lecturas de este Oficio no están disponibles todavía.");
      }
      return h;
    }

    if (hora === "laudes" || hora === "visperas") {
      var esL = hora === "laudes";
      var key = esL ? "laudes" : (esDom ? "visperas2" : "visperas");
      var hS = S[key], hP2 = P[key], cicloDom = ctx.cicloDom;
      if (!esL && ctx.visperas1) { hS = ctx.visperas1.data; hP2 = ctx.visperas1.prop; cicloDom = ctx.visperas1.ciclo; }
      var Mh = (M && !(!esL && ctx.visperas1)) ? M : null;
      if (Mh) h += avisoMemoria(false);
      if (!esL && ctx.visperas1) h += nota("I Vísperas de: " + ctx.visperas1.info.titulo + ".");
      h += bloque("Introducción", textoHtml(intro(ctx)));
      var hym = primera("himno", [hP2]);
      if (hym) h += bl("Himno", hym);
      else {
        var KK = (!esL && ctx.visperas1) ? ctx.visperas1.K : K;
        var hc = KK ? himnosComunes(esL ? KK.laudes : KK.visperas, "Himno") : "";
        h += hc || secHtml(hS, "himno", "Himno");
      }
      h += bl("Salmodia", primera("salmodia", [hP2, hS]));
      h += bl("Lectura breve", primera("lectura_breve", [hP2, hS]));
      h += bl("Responsorio breve", primera("responsorio_breve", [hP2, hS]));
      var ceS = sec(hS, "cantico_evangelico"), ceP = sec(hP2, "cantico_evangelico");
      if (ceS || ceP) {
        var cant = esL ? ord.benedictus : ord.magnificat;
        var antHtml = "", ciclo = "";
        var ceM = Mh && Mh.horas[esL ? "laudes" : "visperas2"] ? sec(Mh.horas[esL ? "laudes" : "visperas2"], "cantico_evangelico") : null;
        if (ceM && /^Ant\./m.test(ceM.texto)) antHtml = textoHtml(sinCanticoFinal(ceM.texto));
        else if (ceP && ceP.ant_ciclo && ceP.ant_ciclo[cicloDom]) { antHtml = textoHtml("Ant. " + ceP.ant_ciclo[cicloDom]); ciclo = " · Ciclo " + cicloDom; }
        else if (ceP && /^Ant\./m.test(ceP.texto)) antHtml = textoHtml(ceP.texto);
        else if (ceS && /^Ant\./m.test(sinCanticoFinal(ceS.texto))) antHtml = textoHtml(sinCanticoFinal(ceS.texto));
        else antHtml = nota("La antífona de este día no está disponible todavía.");
        h += bloque("Cántico evangélico" + ciclo, antHtml + textoHtml(cant), "cantico");
      }
      h += bl("Preces", primera("preces", [hP2, hS]));
      h += bloque("Padre nuestro", textoHtml(ord.padre_nuestro));
      var o = Mh && Mh.oracion ? { texto: Mh.oracion } : primera("oracion", [hP2, hS]);
      if (!o && esDom) o = oracionLaudes();   // la oración del domingo es la misma en Laudes y Vísperas
      h += o ? bloque("Oración", textoHtml(o.texto)) : bloque("Oración", faltaOracion);
      h += bloque("Conclusión", textoHtml(BENDICION));
      return h;
    }

    if (hora === "intermedia") {
      var im = S.intermedia || {}, pim = P.intermedia || {};
      var sub = ctx.sub;
      h += '<div class="selector" role="group" aria-label="Hora menor">' + ["tercia", "sexta", "nona"].map(function (n) {
        return '<button type="button" data-sub="' + n + '" class="' + (sub === n ? "on" : "") + '">' + n.charAt(0).toUpperCase() + n.slice(1) + "</button>";
      }).join("") + "</div>";
      h += avisoMemoria(false);
      h += bloque("Introducción", textoHtml(intro(ctx)));
      var hI = primera("himno", [pim.comun]);
      var hKI = K && K.intermedia && K.intermedia.comun ? himnosComunes(K.intermedia.comun, "Himno") : "";
      h += hI ? bl("Himno", hI) : (hKI || bl("Himno", primera("himno", [im.comun])));
      var smI = primera("salmodia", [pim.comun, im.comun]);
      if (smI && /(^|\n)(Antífona\s*\n+)?\s*TERCIA:/.test(smI.texto)) smI = { texto: antIntermedia(smI.texto, sub), ref: smI.ref };
      else if (smI && info.tiempo === "pascua") smI = { texto: antPascuaInter(smI.texto), ref: smI.ref };
      h += bl("Salmodia", smI);
      h += bl("Lectura breve", primera("lectura_breve", [pim[sub], im[sub]]));
      var oi = primera("oracion", [pim[sub]]);
      if (!oi && sec(pim[sub], "oracion_tercia")) oi = primera("oracion", [pim.tercia]) || primera("oracion", [im.tercia]);
      if (!oi && sec(pim[sub], "oracion_laudes")) oi = oracionLaudes();
      if (!oi) oi = primera("oracion", [im[sub]]);
      if (!oi && esDom) oi = oracionLaudes();
      h += oi ? bloque("Oración", textoHtml(oi.texto)) : "";
      h += bloque("Conclusión", textoHtml("V. Bendigamos al Señor.\nR. Demos gracias a Dios."));
      return h;
    }

    if (hora === "completas") {
      var ck = ctx.completasKey;
      var cd = comp[ck];
      var fijo = ord.completas_fijo;
      h += bloque("Introducción", textoHtml(intro(ctx)));
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
    $("#lit-titulo").textContent = (info.soportado || info.motivo) ? info.titulo : (tiempoNombre[info.tiempo] || "") + " — aún no disponible";
    $("#lit-sub").textContent = info.soportado ? (info.sub ? info.sub + " · Salterio, semana " + C.ROMANOS[info.salterio] : "Salterio, semana " + C.ROMANOS[info.salterio]) : "";
    if (info.soportado && info.santo && info.santo.rango === "M") $("#lit-sub").textContent += " · Memoria: " + info.santo.titulo;
    document.title = "Liturgia de las Horas · " + C.isoDate(f);
    try { history.replaceState(null, "", "#" + C.isoDate(f)); } catch (e) {}

    var cont = $("#lit-contenido"), tabs = $("#lit-tabs");
    if (!info.soportado && info.motivo === "santoral") {
      tabs.innerHTML = "";
      cont.innerHTML = '<div class="aviso"><strong>' + esc(info.titulo) + '.</strong><p>Esta celebración aún no está cargada en esta sección.</p><button type="button" id="lit-proximo" class="btn">Ir al siguiente día disponible</button></div>';
      $("#lit-proximo").addEventListener("click", function () {
        var d = f;
        for (var i = 0; i < 400; i++) { d = C.addDays(d, 1); if (C.info(d).soportado) break; }
        ir(d);
      });
      return;
    }
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

    // I Vísperas del día siguiente (domingo o solemnidad), si su rango es mayor que el de hoy
    var manana = C.addDays(f, 1), infoManana = C.info(manana);
    var usaV1 = !!(infoManana.soportado && infoManana.v1 && (!info.v1 || infoManana.rango < info.rango));
    var nombres = HORAS.map(function (h) {
      var n = h.nombre;
      if (h.id === "visperas" && usaV1) n = "I Vísperas";
      else if (h.id === "visperas" && info.v1) n = "II Vísperas";
      return { id: h.id, nombre: n };
    });
    tabs.innerHTML = nombres.map(function (h) {
      return '<button type="button" role="tab" data-hora="' + h.id + '" aria-selected="' + (estado.hora === h.id) + '" class="' + (estado.hora === h.id ? "on" : "") + '">' + h.nombre + "</button>";
    }).join("");

    cont.innerHTML = '<p class="cargando">Cargando…</p>';
    var needV1 = usaV1 && estado.hora === "visperas";
    var P = {
      ord: getJSON("ordinario.json"), comp: getJSON("completas.json"),
      sal: getJSON("salterio/semana" + info.salterio + ".json"),
      prop: info.propio ? getJSON(info.propio.archivo) : Promise.resolve(null),
      kom: info.comunes ? getJSON(info.comunes.archivo) : Promise.resolve(null),
      sal1: needV1 ? getJSON("salterio/semana" + infoManana.salterio + ".json") : Promise.resolve(null),
      prop1: needV1 && infoManana.propio ? getJSON(infoManana.propio.archivo) : Promise.resolve(null),
      extra: info.extraOficio ? getJSON(info.extraOficio.archivo) : Promise.resolve(null),
      kom1: needV1 && infoManana.comunes ? getJSON(infoManana.comunes.archivo) : Promise.resolve(null),
      santo: info.santo && info.santo.rango === "M" ? getJSON(info.santo.archivo) : Promise.resolve(null)
    };
    var claves = Object.keys(P);
    Promise.all(claves.map(function (k) { return P[k]; })).then(function (arr) {
      var r = {};
      claves.forEach(function (k, i) { r[k] = arr[i]; });
      var ctx = { info: info, ord: r.ord, comp: r.comp, sal: r.sal,
        P: r.prop && info.propio ? (info.propio.clave ? (info.santo && info.santo.rango !== "M" ? r.prop[info.propio.clave].horas : r.prop[info.propio.clave]) : r.prop) : null,
        santo: r.prop && info.santo && info.santo.rango !== "M" ? r.prop[info.santo.clave] : null,
        M: r.santo && info.santo && info.santo.rango === "M" ? r.santo[info.santo.clave] : null,
        K: r.kom && info.comunes ? r.kom[info.comunes.clave] : null,
        extraOficio: r.extra && info.extraOficio ? r.extra[info.extraOficio.clave] : null,
        sub: estado.sub, salmoInv: estado.salmoInv,
        ciclo: estado.ciclo, anioFerial: C.anioFerial(f), cicloDom: C.cicloDominical(f),
        completasKey: usaV1 || info.diaKey === "sab" ? "dom1" : (info.rango < 2 ? "dom" : info.diaKey), visperas1: null };
      if (info.cel && ctx.P) ctx.P = Object.assign({}, ctx.P, { visperas: ctx.P.visperas2 });
      if (ctx.P && ctx.P.visperas && !ctx.P.visperas2) ctx.P = Object.assign({}, ctx.P, { visperas2: ctx.P.visperas });
      ALE = info.tiempo === "cuaresma" ? "quitar" : (info.tiempo === "pascua" ? "agregar" : null);
      if (info.teDeum && ctx.P && ctx.P.oficio) ctx.P.oficio = ctx.P.oficio.concat([{ tipo: "te_deum" }]);
      if (needV1 && r.sal1 && (r.sal1.dom || infoManana.santo)) {
        var pd = r.prop1 && infoManana.propio ? (infoManana.propio.clave ? r.prop1[infoManana.propio.clave] : r.prop1) : null;
        if (pd && pd.horas) pd = pd.horas;
        ctx.visperas1 = { info: infoManana, data: infoManana.santo ? null : r.sal1.dom.visperas1, prop: pd ? pd.visperas1 : null, ciclo: C.cicloDominical(manana),
          K: r.kom1 && infoManana.comunes ? r.kom1[infoManana.comunes.clave] : null };
      }
      if (ctx.extraOficio && ctx.extraOficio.oficio) {
        ctx.P = Object.assign({}, ctx.P || {});
        ctx.P.oficio = ctx.extraOficio.oficio.concat(info.extraOficio.teDeum ? [{ tipo: "te_deum" }] : []);
      }
      var html = armarHora(estado.hora, ctx);
      html += '<p class="pie">Texto: Liturgia de las Horas según el rito romano, edición típica española con doble lectura bíblica de la edición latinoamericana. © Comisión Episcopal de Liturgia de la Conferencia Episcopal Española. Distribución gratuita; prohibida su venta. Santoral: calendario de México; no incluye las memorias libres.</p>';
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
