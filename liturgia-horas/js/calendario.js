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

  /** Bautismo del Señor: domingo después del 6 de enero (criterio usado en México). */
  function bautismo(y) {
    var e = utc(y, 0, 6);
    return addDays(e, 7 - e.getUTCDay());
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
    return fecha.getUTCFullYear() % 2 === 1 ? "I" : "II";
  }

  function semanaSalterio(n) { return ((n - 1) % 4) + 1; }

  /**
   * Información litúrgica de una fecha.
   * Devuelve { fecha, iso, dow, dia, diaKey, tiempo, semana, salterio, titulo, soportado }
   * tiempo: 'ordinario' | 'adviento' | 'navidad' | 'cuaresma' | 'pascua'
   */
  function info(fecha) {
    var y = fecha.getUTCFullYear();
    var dow = fecha.getUTCDay();
    var E = pascua(y), ceniza = addDays(E, -46), pentecostes = addDays(E, 49);
    var adv = adviento(y), nav = utc(y, 11, 25), bau = bautismo(y);
    var r = { fecha: fecha, iso: isoDate(fecha), dow: dow, dia: DIAS[dow], diaKey: DIA_KEY[dow],
      tiempo: null, semana: null, salterio: null, titulo: "", soportado: false };

    if (fecha >= nav || fecha <= bau) {
      r.tiempo = "navidad";
    } else if (fecha >= adv) {
      r.tiempo = "adviento";
    } else if (fecha >= ceniza && fecha < E) {
      r.tiempo = "cuaresma";
    } else if (fecha >= E && fecha <= pentecostes) {
      r.tiempo = "pascua";
    } else {
      r.tiempo = "ordinario";
      var n;
      if (fecha < ceniza) {
        // Parte 1: la semana I empieza el lunes después del Bautismo del Señor.
        n = dow === 0 ? diffDays(fecha, bau) / 7 + 1
                      : Math.floor((diffDays(fecha, bau) - 1) / 7) + 1;
      } else {
        // Parte 2: se cuenta hacia atrás desde Cristo Rey (domingo XXXIV, el que precede al Adviento).
        var cristoRey = addDays(adv, -7);
        var domingoPrevio = addDays(fecha, -dow);
        n = 34 - diffDays(cristoRey, domingoPrevio) / 7;
      }
      r.semana = n;
      r.salterio = semanaSalterio(n);
      r.soportado = true;
      r.titulo = (dow === 0 ? "Domingo " + ROMANOS[n] + " del Tiempo Ordinario"
                            : DIAS[dow] + " de la semana " + ROMANOS[n] + " del Tiempo Ordinario");
    }
    return r;
  }

  var api = { pascua: pascua, adviento: adviento, bautismo: bautismo, info: info, cicloDominical: cicloDominical, anioFerial: anioFerial, anioLiturgico: anioLiturgico,
    utc: utc, addDays: addDays, isoDate: isoDate, parseIso: parseIso, fromLocal: fromLocal,
    ROMANOS: ROMANOS, DIAS: DIAS, DIA_KEY: DIA_KEY };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Calendario = api;
})(typeof window !== "undefined" ? window : globalThis);
