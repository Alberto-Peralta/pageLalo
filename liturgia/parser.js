// liturgia/parser.js
// Convierte el misal mensual (.md) en { dias, avisos }. Sin imports: se puede probar en Node.
function fechaReal(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s) === false) { return false; }
  var d = new Date(s + 'T00:00:00Z');
  return isNaN(d.getTime()) === false && d.toISOString().slice(0, 10) === s;
}

export function parsearMisal(md) {
  var lineas = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  var dias = {};
  var vistas = {};
  var avisos = [];
  var fecha = null;
  var dia = null;
  var misa = null;
  var parte = null;
  var buf = [];
  var enCab = false;

  function cerrarParte() {
    if (parte === null) { return; }
    var parrafos = buf.join('\n').split(/\n\s*\n/)
      .map(function (p) { return p.replace(/\s*\n\s*/g, ' ').trim(); })
      .filter(function (p) { return p !== ''; });
    parte.texto = parrafos.join('\n\n');
    if (parte.texto.length < 20) {
      avisos.push(fecha + ': la parte "' + parte.tipo + '" tiene el texto muy corto o vacío.');
    }
    if (!parte.cita) { delete parte.cita; }
    if (!parte.resumen) { delete parte.resumen; }
    misa.partes.push(parte);
    parte = null;
    buf = [];
  }

  function cerrarMisa() {
    if (misa === null) { return; }
    if (misa.partes.length === 0) {
      avisos.push(fecha + ': la misa "' + misa.titulo + '" no tiene partes.');
    }
    dia.misas.push(misa);
    misa = null;
  }

  function cerrarDia() {
    cerrarParte();
    cerrarMisa();
    if (dia !== null) {
      if (dia.misas.length === 0) {
        avisos.push(fecha + ': el día no tiene ningún título con ###. Se omite.');
      } else {
        dia.titulo = dia.misas[0].titulo;
        dias[fecha] = dia;
      }
    }
    dia = null;
  }

  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i];
    var t = l.trim();
    var mDia = t.match(/^##\s+(\S+)\s*$/);
    var mMisa = t.match(/^###\s+(.+)$/);
    var mParte = t.match(/^####\s+(.+)$/);

    if (mDia) {
      cerrarDia();
      fecha = mDia[1];
      if (fechaReal(fecha) === false) {
        avisos.push('Fecha inválida: ' + fecha + '. Se omite ese día.');
      } else if (vistas[fecha]) {
        avisos.push('La fecha ' + fecha + ' aparece repetida. Se usa la primera.');
      } else {
        vistas[fecha] = true;
        dia = { misas: [] };
      }
      continue;
    }

    if (mMisa) {
      cerrarParte();
      cerrarMisa();
      if (fecha === null) {
        avisos.push('Hay un título con ### antes de cualquier fecha: ' + mMisa[1].slice(0, 40));
      } else if (dia !== null) {
        misa = { titulo: mMisa[1].trim(), partes: [] };
      }
      continue;
    }

    if (mParte) {
      cerrarParte();
      if (misa === null) {
        if (dia !== null) {
          avisos.push(fecha + ': la parte "' + mParte[1].trim() + '" aparece antes del primer ###. Se omite.');
        }
        continue;
      }
      parte = { tipo: mParte[1].trim(), cita: '', resumen: '', texto: '' };
      buf = [];
      enCab = true;
      continue;
    }

    if (parte === null) {
      if (misa !== null && misa.color === undefined) {
        var mc = t.match(/^Color:\s*(.+)$/);
        if (mc) { misa.color = mc[1].trim(); }
      }
      continue;
    }

    if (enCab) {
      if (t === '') { buf.push(l); continue; }
      var mCita = t.match(/^Cita:\s*(.*)$/);
      var mRes = t.match(/^Resumen:\s*(.*)$/);
      if (mCita) { parte.cita = mCita[1].trim(); continue; }
      if (mRes) { parte.resumen = mRes[1].trim(); continue; }
      enCab = false;
    }
    buf.push(l);
  }
  cerrarDia();
  return { dias: dias, avisos: avisos };
}
