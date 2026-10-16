/* Calendario litúrgico (rito romano) — motor sin dependencias.
 * Trabaja con fechas "de calendario" en UTC para evitar líos de zona horaria/horario de verano.
 * Etapa actual: identifica tiempo litúrgico, semana y semana del Salterio.
 */
(function (root) {
  "use strict";

  var DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  var DIA_KEY = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
  var ROMANOS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII",
    "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI",
    "XXVII", "XXVIII", "XXIX", "XXX", "XXXI", "XXXII", "XXXIII", "XXXIV"];
  var MS = 86400000;

  function utc(y, m, d) { return new Date(Date.UTC(y, m, d)); }
  function addDays(dt, n) { return new Date(dt.getTime() + n * MS); }
  function diffDays(a, b) { return Math.round((a.getTime() - b.getTime()) / MS); }
  function isoDate(dt) { return dt.toISOString().slice(0, 10); }
  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? utc(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function fromLocal(dt) { return utc(dt.getFullYear(), dt.getMonth(), dt.getDate()); }

  /** Domingo de Pascua (algoritmo anónimo gregoriano / Meeus-Jones-Butcher). */
  function pascua(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return utc(y, mes - 1, dia);
  }

  /** I Domingo de Adviento: domingo más cercano al 30 de noviembre (el domingo desde el 27 de nov). */
  function adviento(y) {
    var d = utc(y, 10, 27);
    return addDays(d, (7 - d.getUTCDay()) % 7);
  }

  /** Epifanía del Señor (México): domingo entre el 2 y el 8 de enero. */
  function epifania(y) {
    var d = utc(y, 0, 2);
    return addDays(d, (7 - d.getUTCDay()) % 7);
  }
  /** Bautismo del Señor: domingo siguiente a la Epifanía; si ésta cae en 7 u 8 de enero, el lunes siguiente. */
  function bautismo(y) {
    var e = epifania(y);
    return e.getUTCDate() >= 7 ? addDays(e, 1) : addDays(e, 7);
  }

  /** Año litúrgico (el año civil en que termina): del I Domingo de Adviento al siguiente. */
  function anioLiturgico(fecha) {
    var y = fecha.getUTCFullYear();
    return fecha >= adviento(y) ? y + 1 : y;
  }
  /** Ciclo dominical A/B/C. 2025-26 = A, 2026-27 = B, 2027-28 = C (el año civil en que termina: 2026 -> A). */
  function cicloDominical(fecha) {
    return { 1: "A", 2: "B", 0: "C" }[anioLiturgico(fecha) % 3];
  }
  /** Año de las ferias del T.O. (I = años impares, II = pares). */
  function anioFerial(fecha) {
    return anioLiturgico(fecha) % 2 === 1 ? "I" : "II";
  }

  function semanaSalterio(n) { return ((n - 1) % 4) + 1; }


  var MESES_ROM = ROMANOS;

  /** Cuaresma y Semana Santa. */
  function cuaresma(r, fecha, E, ceniza) {
    var dow = fecha.getUTCDay(), dk = DIA_KEY[dow];
    var palmas = addDays(E, -7);
    r.tiempo = "cuaresma"; r.soportado = true; r.sub = "Tiempo de Cuaresma";
    r.v1 = false; r.rango = 9;
    if (fecha >= palmas) {
      r.sub = "Semana Santa";
      r.salterio = 2;
      r.comunes = { archivo: "cuaresma/comunes.json", clave: "santa" };
      r.propio = { archivo: "cuaresma/sa.json", clave: dk };
      var t = { dom: "Domingo de Ramos en la Pasión del Señor", lun: "Lunes Santo", mar: "Martes Santo", mie: "Miércoles Santo",
        jue: "Jueves Santo", vie: "Viernes Santo de la Pasión del Señor", sab: "Sábado Santo" };
      r.titulo = t[dk];
      r.rango = 2;
      if (dow === 0) { r.v1 = true; }
      return;
    }
    r.comunes = { archivo: "cuaresma/comunes.json", clave: "cuaresma" };
    if (fecha < addDays(ceniza, 4)) {
      r.salterio = 4;
      r.propio = { archivo: "cuaresma/c0.json", clave: dk };
      r.titulo = dow === 3 ? "Miércoles de Ceniza" : DIAS[dow] + " después de Ceniza";
      if (dow === 3) r.rango = 2;
      return;
    }
    var n = Math.floor(diffDays(fecha, addDays(ceniza, 4)) / 7) + 1;
    r.semana = n; r.salterio = semanaSalterio(n);
    r.propio = { archivo: "cuaresma/c" + n + ".json", clave: dk };
    if (dow === 0) { r.titulo = "Domingo " + ROMANOS[n] + " de Cuaresma"; r.v1 = true; r.rango = 2; }
    else r.titulo = DIAS[dow] + " de la semana " + ROMANOS[n] + " de Cuaresma";
  }

  /** Tiempo pascual (en México la Ascensión se celebra el domingo VII de Pascua). */
  function pascual(r, fecha, E) {
    var dow = fecha.getUTCDay(), dk = DIA_KEY[dow];
    var delta = diffDays(fecha, E);
    r.tiempo = "pascua"; r.soportado = true; r.sub = "Tiempo de Pascua";
    r.v1 = false; r.rango = 9;
    r.comunes = { archivo: "pascua/comunes.json", clave: delta < 43 ? "hasta_ascension" : "despues_ascension" };
    function cel(k, titulo, sal) {
      r.propio = { archivo: "pascua/" + k + ".json", clave: null };
      r.cel = true; r.teDeum = true; r.v1 = true; r.rango = 1; r.titulo = titulo; r.salterio = sal;
    }
    if (delta === 0) {
      r.propio = { archivo: "pascua/pa.json", clave: "dom" };
      r.titulo = "Domingo de Pascua de la Resurrección del Señor (solemnidad)";
      r.salterio = 1; r.rango = 1; r.sub = "Octava de Pascua";
    } else if (delta < 7) {
      r.propio = { archivo: "pascua/oct.json", clave: dk };
      r.titulo = DIAS[dow] + " dentro de la Octava de Pascua (solemnidad)";
      r.salterio = 1; r.rango = 1; r.sub = "Octava de Pascua";
    } else if (delta === 42) {
      cel("asc", "La Ascensión del Señor (solemnidad)", 3);
    } else if (delta === 49) {
      cel("pent", "Domingo de Pentecostés (solemnidad)", 1);
    } else {
      var n = Math.floor(delta / 7) + 1;
      r.semana = n;
      r.propio = { archivo: "pascua/p" + n + ".json", clave: dk };
      if (dow === 0) {
        r.titulo = n === 2 ? "Domingo II de Pascua (de la Octava)" : "Domingo " + ROMANOS[n] + " de Pascua";
        r.salterio = n === 2 ? 1 : semanaSalterio(n);
        r.v1 = true; r.rango = 2;
      } else {
        r.titulo = DIAS[dow] + " de la semana " + ROMANOS[n] + " de Pascua";
        r.salterio = semanaSalterio(n);
      }
    }
  }

  var NOMBRE_DIC = { 26: "San Esteban, primer mártir (fiesta)", 27: "San Juan, apóstol y evangelista (fiesta)", 28: "Los Santos Inocentes, mártires (fiesta)" };

  /** Tiempo de Navidad (rito romano, calendario de México). Rellena r con propio/comunes/rango. */
  function navidad(r, fecha) {
    var y = fecha.getUTCFullYear(), m = fecha.getUTCMonth(), d = fecha.getUTCDate(), dow = fecha.getUTCDay();
    var cy = m === 11 ? y : y - 1;
    var epi = epifania(cy + 1), bau = bautismo(cy + 1);
    var nat = utc(cy, 11, 25);
    var sag = nat.getUTCDay() === 0 ? utc(cy, 11, 30) : addDays(nat, 7 - nat.getUTCDay());
    r.tiempo = "navidad";
    r.sub = "Tiempo de Navidad";
    r.soportado = true;
    r.comunes = { archivo: "navidad/comunes.json", clave: fecha < epi ? "hasta_epifania" : "desde_epifania" };
    function cel(k, titulo, o) {
      o = o || {};
      r.propio = { archivo: "navidad/" + k + ".json", clave: null };
      r.cel = true; r.titulo = titulo; r.teDeum = true;
      r.v1 = o.v1 !== undefined ? o.v1 : dow === 0;
      r.rango = o.rango || 2;
      r.salterio = o.salterio || 1;
    }
    function feria(clave, titulo, sal) {
      r.propio = { archivo: "navidad/ferias.json", clave: clave };
      r.titulo = titulo; r.salterio = sal; r.v1 = false; r.rango = 9;
    }
    if (m === 11 && d === 25) {
      cel("nat", "Natividad del Señor (solemnidad)", { v1: true, rango: 1, salterio: 1 });
    } else if (fecha.getTime() === sag.getTime()) {
      cel("sagrada", "La Sagrada Familia de Jesús, María y José (fiesta)", { salterio: 1 });
    } else if (m === 11 && d >= 26 && d <= 28) {
      r.soportado = false;
      r.titulo = NOMBRE_DIC[d];
      r.motivo = "santoral";
      r.salterio = 1; r.v1 = false; r.rango = 9;
    } else if (m === 11 && d >= 29) {
      feria("dia" + (d - 24), d + " de diciembre · Día " + ROMANOS[d - 24] + " dentro de la Octava de Navidad", 1);
    } else if (m === 0 && d === 1) {
      cel("madre", "Santa María, Madre de Dios (solemnidad)", { v1: true, rango: 1, salterio: 1 });
    } else if (fecha < epi) {
      feria("ene" + d, DIAS[dow] + " " + d + " de enero · Tiempo de Navidad", 2);
    } else if (fecha.getTime() === epi.getTime()) {
      cel("epifania", "La Epifanía del Señor (solemnidad)", { v1: true, rango: 1, salterio: 2 });
    } else if (fecha.getTime() === bau.getTime()) {
      cel("bautismo", "El Bautismo del Señor (fiesta)", { v1: dow === 0, salterio: 1 });
    } else {
      feria("post" + (6 + dow), DIAS[dow] + " después de la Epifanía", 2);
    }
  }

  /**
   * Información litúrgica de una fecha.
   * Devuelve { fecha, iso, dow, dia, diaKey, tiempo, semana, salterio, titulo, soportado }
   * tiempo: 'ordinario' | 'adviento' | 'navidad' | 'cuaresma' | 'pascua'
   */
  function infoBase(fecha) {
    var y = fecha.getUTCFullYear();
    var dow = fecha.getUTCDay();
    var E = pascua(y), ceniza = addDays(E, -46), pentecostes = addDays(E, 49);
    var adv = adviento(y), nav = utc(y, 11, 25), bau = bautismo(y);
    var r = { fecha: fecha, iso: isoDate(fecha), dow: dow, dia: DIAS[dow], diaKey: DIA_KEY[dow],
      tiempo: null, semana: null, salterio: null, titulo: "", soportado: false };

    if (fecha >= nav || fecha <= bau) {
      navidad(r, fecha);
    } else if (fecha >= adv) {
      r.tiempo = "adviento";
      var w = Math.floor(diffDays(fecha, adv) / 7) + 1;      // semana de Adviento (1..4)
      var dd = fecha.getUTCDate(), mm = fecha.getUTCMonth();
      r.semana = w;
      r.salterio = semanaSalterio(w);
      r.soportado = true;
      var diaSemana = dow === 0 ? "Domingo " + ROMANOS[w] + " de Adviento" : DIAS[dow] + " de la semana " + ROMANOS[w] + " de Adviento";
      if (dow !== 0 && mm === 11 && dd >= 17) {
        r.titulo = DIAS[dow] + " " + dd + " de diciembre (Adviento)";
        r.propio = { archivo: "adviento/dic.json", clave: String(dd) };
      } else {
        r.titulo = diaSemana;
        r.propio = { archivo: "adviento/s" + w + ".json", clave: DIA_KEY[dow] };
      }
      r.comunes = { archivo: "adviento/comunes.json", clave: (mm === 11 && dd >= 17) ? "desde17" : "hasta16" };
      if (dow === 0 && mm === 11 && dd >= 17) {
        // Domingo IV: versículo, lecturas y responsorios del día del mes; después, Te Deum.
        r.extraOficio = { archivo: "adviento/dic.json", clave: String(dd), teDeum: true };
      }
    } else if (fecha >= ceniza && fecha < E) {
      cuaresma(r, fecha, E, ceniza);
    } else if (fecha >= E && fecha <= pentecostes) {
      pascual(r, fecha, E);
    } else {
      r.tiempo = "ordinario";
      var n;
      if (fecha < ceniza) {
        // Parte 1: la semana I empieza después del Bautismo del Señor (el lunes, o el martes si el Bautismo es lunes).
        // El primer domingo después del Bautismo es el II del Tiempo Ordinario.
        var sPrimero = addDays(bau, 7 - bau.getUTCDay());
        var domPrev = addDays(fecha, -dow);
        n = domPrev < sPrimero ? 1 : 2 + diffDays(domPrev, sPrimero) / 7;
      } else {
        // Parte 2: se cuenta hacia atrás desde Cristo Rey (domingo XXXIV, el que precede al Adviento).
        var cristoRey = addDays(adv, -7);
        var domingoPrevio = addDays(fecha, -dow);
        n = 34 - diffDays(cristoRey, domingoPrevio) / 7;
      }
      r.semana = n;
      r.salterio = semanaSalterio(n);
      r.soportado = true;
      r.propio = { archivo: "propio_to/semana" + n + ".json", clave: DIA_KEY[dow] };
      r.titulo = (dow === 0 ? "Domingo " + ROMANOS[n] + " del Tiempo Ordinario"
                            : DIAS[dow] + " de la semana " + ROMANOS[n] + " del Tiempo Ordinario");
      if (n === 34 && dow === 0) r.titulo = "Nuestro Señor Jesucristo, Rey del Universo (solemnidad)";
    }
    if (r.soportado && r.v1 === undefined) { r.v1 = dow === 0; r.rango = dow === 0 ? (r.tiempo === "ordinario" ? 3 : 2) : 9; }
    return r;
  }

  /* ---------- Propio de los Santos (calendario de México) ----------
   * Rangos numéricos (menor = más alto): 1 Natividad/Pascua/Epifanía…, 1.5 solemnidad de santos, 2 domingos de
   * Adviento-Cuaresma-Pascua / Semana Santa / Ceniza / Octava, 2.5 fiestas del Señor, 3 domingo del T.O., 7 fiestas de
   * santos, 9 ferias, 10 memorias obligatorias. */
  var FIESTAS_SENOR = { "02-02": 1, "08-06": 1, "09-14": 1, "11-09": 1 };
  function mmdd(dt) { return isoDate(dt).slice(5); }
  function idx(k) { return (root.SANTOS_IDX || {})[k] || null; }

  function aplicarSanto(f, r) {
    var E = pascua(f.getUTCFullYear());
    var k = mmdd(f), e = idx(k), aplica = null, trasl = false;
    // Solemnidades del Señor en el Tiempo Ordinario (después de Pentecostés)
    var dP = diffDays(f, addDays(E, 49)), TO = dP === 7 ? "trinidad" : dP === 11 ? "corpus" : dP === 19 ? "corazon" : null;
    if (TO && r.tiempo === "ordinario" && idx("to:" + TO)) {
      var et = idx("to:" + TO);
      r.santo = { archivo: "santos/to.json", clave: TO, rango: "S", titulo: et[1] };
      r.propio = { archivo: "santos/to.json", clave: TO };
      r.comunes = null; r.extraOficio = null; r.cel = true; r.soportado = true; r.motivo = null;
      r.titulo = et[1] + " (solemnidad)"; r.sub = "Solemnidad · Tiempo Ordinario";
      r.rango = 1.5; r.v1 = et[2] === "I"; r.teDeum = false;
      return;
    }
    // Conmemoración de todos los fieles difuntos (2 nov): si cae en domingo se dice el Oficio del domingo
    if (e && e[0] === "D") {
      if (f.getUTCDay() !== 0 && r.rango >= 3) {
        r.santo = { archivo: "santos/11.json", clave: "02", rango: "D", titulo: e[1] };
        r.propio = { archivo: r.santo.archivo, clave: "02" };
        r.comunes = null; r.extraOficio = null; r.cel = true; r.soportado = true; r.motivo = null;
        r.titulo = e[1]; r.sub = "Conmemoración · Tiempo Ordinario";
        r.rango = 2.8; r.v1 = false; r.teDeum = false;
      }
      return;
    }
    var impedido = r.rango <= 2 || r.sub === "Semana Santa" || r.sub === "Octava de Pascua";
    if (e && e[0] === "S" && !impedido) aplica = [k, e];
    if (!aplica) {
      // solemnidad impedida el domingo (Adviento, Cuaresma, Pascua): pasa al lunes
      var ayer = addDays(f, -1), ke = idx(mmdd(ayer));
      if (ke && ke[0] === "S" && ayer.getUTCDay() === 0 && !impedido) {
        var ia = infoBase(ayer);
        if (ia.tiempo !== "ordinario" && ia.tiempo !== "navidad" && ia.sub !== "Semana Santa" && ia.sub !== "Octava de Pascua") { aplica = [mmdd(ayer), ke]; trasl = true; }
      }
    }
    if (!aplica) {
      // San José (19 mar) en Semana Santa -> sábado anterior a Ramos; Anunciación (25 mar) en Semana Santa/Octava -> lunes después de la Octava
      var y = f.getUTCFullYear(), j = utc(y, 2, 19), a = utc(y, 2, 25);
      var ij = infoBase(j), ia2 = infoBase(a);
      if (f.getTime() === addDays(E, -8).getTime() && ij.sub === "Semana Santa" && idx("03-19")) aplica = ["03-19", idx("03-19")], trasl = true;
      else if (f.getTime() === addDays(E, 8).getTime() && (ia2.sub === "Semana Santa" || ia2.sub === "Octava de Pascua") && idx("03-25")) aplica = ["03-25", idx("03-25")], trasl = true;
    }
    if (!aplica && e && e[0] === "F") {
      var senor = !!FIESTAS_SENOR[k];
      if (!impedido || (senor && r.rango === 3)) aplica = [k, e];
    }
    if (aplica) {
      var ent = aplica[1], rk = ent[0];
      var mm = aplica[0].slice(0, 2), dd = aplica[0].slice(3);
      r.santo = { archivo: "santos/" + mm + ".json", clave: dd, rango: rk, titulo: ent[1] };
      r.propio = { archivo: r.santo.archivo, clave: dd };
      r.comunes = null; r.extraOficio = null;
      r.cel = true; r.soportado = true; r.motivo = null;
      r.titulo = ent[1] + (rk === "S" ? " (solemnidad)" : " (fiesta)") + (trasl ? " · trasladada" : "");
      r.sub = (rk === "S" ? "Solemnidad" : "Fiesta") + (r.tiempo ? " · " + ({ adviento: "Adviento", navidad: "Navidad", cuaresma: "Cuaresma", pascua: "Pascua", ordinario: "Tiempo Ordinario" })[r.tiempo] : "");
      var senor2 = !!FIESTAS_SENOR[aplica[0]];
      r.rango = rk === "S" ? 1.5 : (senor2 ? 2.5 : 7);
      r.v1 = !trasl && ent[2] === "I" && (rk === "S" || f.getUTCDay() === 0);
      r.teDeum = false;
      return;
    }
    // memoria obligatoria: sólo sobre ferias libres (no en Cuaresma, Semana Santa, Octava, 17-24 dic)
    if (e && e[0] === "M" && r.soportado && r.rango === 9 && r.tiempo !== "cuaresma" &&
        !(r.tiempo === "adviento" && f.getUTCMonth() === 11 && f.getUTCDate() >= 17) &&
        !(r.tiempo === "navidad" && f.getUTCMonth() === 11)) {
      r.santo = { archivo: "santos/" + k.slice(0, 2) + ".json", clave: k.slice(3), rango: "M", titulo: e[1] };
    }
  }

  function info(fecha) {
    var r = infoBase(fecha);
    if (r.tiempo) aplicarSanto(fecha, r);
    return r;
  }

  var api = { pascua: pascua, epifania: epifania, adviento: adviento, bautismo: bautismo, info: info, cicloDominical: cicloDominical, anioFerial: anioFerial, anioLiturgico: anioLiturgico,
    utc: utc, addDays: addDays, isoDate: isoDate, parseIso: parseIso, fromLocal: fromLocal,
    ROMANOS: ROMANOS, DIAS: DIAS, DIA_KEY: DIA_KEY };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Calendario = api;
})(typeof window !== "undefined" ? window : globalThis);
