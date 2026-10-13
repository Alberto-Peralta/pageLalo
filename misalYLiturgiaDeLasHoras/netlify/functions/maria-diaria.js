// netlify/functions/maria-diaria.js
// Genera una vez al día el contenido de "5 minutos con María" con la API de Magisterium.
// No recibe texto del usuario: el tema sale de una lista fija según la fecha.

var TEMAS = [
  'La Anunciación (Lc 1,26-38): el sí de María',
  'La Visitación (Lc 1,39-56) y el Magnificat',
  'El nacimiento de Jesús y María, que guardaba todo en su corazón (Lc 2,1-20)',
  'La presentación en el templo y la profecía de Simeón (Lc 2,22-35)',
  'Las bodas de Caná: "Hagan lo que él les diga" (Jn 2,1-12)',
  'María al pie de la cruz (Jn 19,25-27)',
  'María en Pentecostés con los apóstoles (Hch 1,12-14)',
  'La Inmaculada Concepción',
  'La Asunción de María',
  'María, Madre de la Iglesia',
  'María en el Catecismo de la Iglesia Católica (párrafos 484 a 511)',
  'La maternidad divina: María, Madre de Dios (Theotokos)',
  'María, modelo de fe y de discipulado (Lumen Gentium, capítulo 8)',
  'El Rosario como oración contemplativa (Rosarium Virginis Mariae)',
  'La devoción a María según Marialis Cultus',
  'María en la encarnación y la misión según Redemptoris Mater',
  'María y la alegría del Evangelio (Evangelii Gaudium, 284 a 288)',
  'Nuestra Señora de Guadalupe',
  'María, madre de misericordia',
  'La humildad de María',
  'María y el silencio: la escucha de la Palabra',
  'Los dolores de María',
  'La perpetua virginidad de María',
  'María intercesora: cómo entender su mediación',
  'La Salve y el Ave María: de dónde vienen',
  'María en la vida de los santos',
  'Consagrarse a María: su sentido',
  'María, estrella de la evangelización',
  'María y la familia de Nazaret',
  'María y la esperanza'
];

var API_URL = 'https://www.magisterium.com/api/v1/chat/completions';
var cache = { fecha: null, data: null };

function fechaMexico() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

function diaDelAnio(fecha) {
  var p = fecha.split('-');
  var inicio = Date.UTC(Number(p[0]), 0, 0);
  var hoy = Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return Math.round((hoy - inicio) / 86400000);
}

function construirPrompt(tema) {
  return 'Prepara el contenido de una devoción diaria breve llamada "5 minutos con María" (una lectura de unos cinco minutos), en español, con tono cercano, sereno y sencillo, para público general. ' +
    'Tema de hoy: ' + tema + '. ' +
    'Usa exactamente estas cuatro secciones, cada una con su encabezado en una línea sola: ' +
    'ENSEÑANZA (qué enseña la Iglesia sobre este tema, en un párrafo, con la referencia al documento o pasaje bíblico), ' +
    'REFLEXIÓN (un párrafo breve que lo aplique a la vida diaria), ' +
    'ORACIÓN (una oración breve de cuatro a seis líneas, sin inventar citas), ' +
    'PARA MEDITAR (una sola pregunta). ' +
    'No inventes citas textuales ni atribuyas frases a papas, santos o documentos si no estás seguro; si no tienes certeza de una cita, resume la idea sin comillas. Máximo 350 palabras en total.';
}

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    try {
      var fecha = fechaMexico();
      var cabeceras = { 'Content-Type': 'application/json; charset=utf-8' };

      if (cache.fecha === fecha && cache.data) {
        cabeceras['Cache-Control'] = 'public, max-age=3600, s-maxage=43200';
        return { statusCode: 200, headers: cabeceras, body: JSON.stringify(cache.data) };
      }

      var tema = TEMAS[diaDelAnio(fecha) % TEMAS.length];

      var apiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.MAGISTERIUM_API_KEY
        },
        body: JSON.stringify({
          model: 'magisterium-1',
          messages: [{ role: 'user', content: construirPrompt(tema) }]
        })
      });

      var data = await apiResponse.json();

      if (apiResponse.ok === false) {
        var msg = (data && data.error && data.error.message) ? data.error.message : 'Error en la API de Magisterium';
        throw new Error(msg);
      }

      var texto = (data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content : '';
      if (texto === '') {
        throw new Error('Respuesta vacía de Magisterium');
      }

      var resultado = { fecha: fecha, tema: tema, texto: texto, citas: data.citations || null };
      cache.fecha = fecha;
      cache.data = resultado;

      cabeceras['Cache-Control'] = 'public, max-age=3600, s-maxage=43200';
      return { statusCode: 200, headers: cabeceras, body: JSON.stringify(resultado) };
    } catch (error) {
      console.error('Error en maria-diaria:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'No se pudo generar el contenido de hoy.' })
      };
    }
  }
  return { statusCode: 405, body: 'Método no permitido' };
};
