const preguntas = [
  // Nivel 1
  { pregunta: "¿Quién fue el primer hombre creado por Dios?", opciones: ["A) Adán", "B) Moisés", "C) Noé", "D) Abraham"], respuesta: "A", genero: "Biblia", nivel: 1 },
  { pregunta: "¿Qué significa el nombre 'Jesús'?", opciones: ["A) Salvador", "B) Rey de Reyes", "C) El Ungido", "D) Hijo de Dios"], respuesta: "A", genero: "Biblia", nivel: 1 },
  { pregunta: "¿Cómo se llama la madre de Jesús?", opciones: ["A) Ester", "B) María", "C) Marta", "D) Sara"], respuesta: "B", genero: "Biblia", nivel: 1 },
  { pregunta: "¿Quién escribió los Evangelios?", opciones: ["A) San Pedro", "B) San Juan", "C) San Lucas", "D) San Mateo"], respuesta: "B", genero: "Biblia", nivel: 1 },
  { pregunta: "¿Qué significa 'Evangelio'?", opciones: ["A) Buenas Noticias", "B) Palabra de Dios", "C) Ley de Moisés", "D) Paz de Cristo"], respuesta: "A", genero: "Biblia", nivel: 1 },
  // Nivel 2
  { pregunta: "¿Qué río cruzaron los israelitas cuando salieron de Egipto?", opciones: ["A) Jordán", "B) Nilo", "C) Mar Rojo", "D) Éufrates"], respuesta: "C", genero: "Biblia", nivel: 2 },
  { pregunta: "¿Quién traicionó a Jesús?", opciones: ["A) Pedro", "B) Judas", "C) Juan", "D) Santiago"], respuesta: "B", genero: "Biblia", nivel: 2 },
  { pregunta: "¿En qué libro de la Biblia encontramos la historia de Moisés?", opciones: ["A) Génesis", "B) Éxodo", "C) Levítico", "D) Números"], respuesta: "B", genero: "Biblia", nivel: 2 },
  { pregunta: "¿Quién bautizó a Jesús?", opciones: ["A) Pedro", "B) Juan el Bautista", "C) Santiago", "D) Andrés"], respuesta: "B", genero: "Biblia", nivel: 2 },
  // Nivel 3
  { pregunta: "¿Cuál es el primer mandamiento?", opciones: ["A) Amarás a tu prójimo como a ti mismo", "B) No matarás", "C) Amarás al Señor tu Dios", "D) No robarás"], respuesta: "C", genero: "Biblia", nivel: 3 },
  { pregunta: "¿Cuántos libros tiene el Antiguo Testamento?", opciones: ["A) 39", "B) 66", "C) 72", "D) 24"], respuesta: "A", genero: "Biblia", nivel: 3 },
  { pregunta: "¿En qué ciudad nació Jesús?", opciones: ["A) Nazaret", "B) Jerusalén", "C) Belén", "D) Roma"], respuesta: "C", genero: "Biblia", nivel: 3 },
  // Nivel 4
  { pregunta: "¿Qué alimento descendió del cielo para alimentar al pueblo de Israel en el desierto?", opciones: ["A) Maná", "B) Pan", "C) Carne", "D) Frutas"], respuesta: "A", genero: "Biblia", nivel: 4 },
  { pregunta: "¿Qué evangelio es conocido como el más teológico?", opciones: ["A) Evangelio de Mateo", "B) Evangelio de Marcos", "C) Evangelio de Lucas", "D) Evangelio de Juan"], respuesta: "D", genero: "Biblia", nivel: 4 },
  { pregunta: "¿Qué libro sigue al de los Hechos de los Apóstoles?", opciones: ["A) Romanos", "B) Gálatas", "C) Apocalipsis", "D) Filipenses"], respuesta: "A", genero: "Biblia", nivel: 4 },
  // Nivel 5
  { pregunta: "¿Quién fue el primer papa de la Iglesia Católica?", opciones: ["A) Pedro", "B) Pablo", "C) Juan", "D) Andrés"], respuesta: "A", genero: "Iglesia Católica", nivel: 5 },
  { pregunta: "¿En qué concilio se definió la naturaleza divina y humana de Cristo?", opciones: ["A) Concilio de Nicea", "B) Concilio de Trento", "C) Concilio Vaticano II", "D) Concilio de Calcedonia"], respuesta: "A", genero: "Iglesia Católica", nivel: 5 },
  { pregunta: "¿Cuál de los siguientes santos es conocido como el patrono de los viajeros?", opciones: ["A) San Francisco de Asís", "B) San Cristóbal", "C) San Juan Bautista", "D) San Antonio de Padua"], respuesta: "B", genero: "Santos", nivel: 5 },
  { pregunta: "¿En qué país nació San Francisco de Asís?", opciones: ["A) España", "B) Italia", "C) Francia", "D) Portugal"], respuesta: "B", genero: "Santos", nivel: 5 },
  // Nivel 6
  { pregunta: "¿Qué fecha conmemora la festividad de la Natividad de la Virgen María?", opciones: ["A) 8 de septiembre", "B) 25 de diciembre", "C) 1 de enero", "D) 15 de agosto"], respuesta: "A", genero: "Fechas importantes", nivel: 6 },
  { pregunta: "¿Qué Papa convocó el Concilio Vaticano II?", opciones: ["A) Papa Francisco", "B) Papa Pío XII", "C) Papa Juan XXIII", "D) Papa Benedicto XVI"], respuesta: "C", genero: "Iglesia Católica", nivel: 6 },
  { pregunta: "¿Qué Papa proclamó el dogma de la Asunción de la Virgen María?", opciones: ["A) Papa Pío IX", "B) Papa Juan XXIII", "C) Papa León XIII", "D) Papa Benedicto XVI"], respuesta: "A", genero: "Iglesia Católica", nivel: 6 },
  { pregunta: "¿Qué fecha conmemora la festividad de la Natividad de la Virgen María?", opciones: ["A) 8 de septiembre", "B) 25 de diciembre", "C) 1 de enero", "D) 15 de agosto"], respuesta: "A", genero: "Fechas importantes", nivel: 6 },
  // Nivel 7
  { pregunta: "¿En qué concilio se aprobó el dogma de la Inmaculada Concepción?", opciones: ["A) Concilio de Trento", "B) Concilio Vaticano I", "C) Concilio Vaticano II", "D) Concilio de Éfeso"], respuesta: "B", genero: "Iglesia Católica", nivel: 7 },
  { pregunta: "¿Qué santo fue el fundador de la Orden de los Jesuitas?", opciones: ["A) San Ignacio de Loyola", "B) San Francisco de Asís", "C) San Benito", "D) Santo Tomás de Aquino"], respuesta: "A", genero: "Santos", nivel: 7 },
  // Nivel 8
  { pregunta: "¿Quién fue el primer santo canonizado por el Papa Francisco?", opciones: ["A) San Juan Pablo II", "B) Santa Teresa de Calcuta", "C) San Francisco de Asís", "D) San Pedro"], respuesta: "A", genero: "Santos", nivel: 8 },
  // Nivel 9
  { pregunta: "¿Qué concilio resolvió la cuestión del arianismo?", opciones: ["A) Concilio de Éfeso", "B) Concilio de Nicea", "C) Concilio de Trento", "D) Concilio Vaticano II"], respuesta: "B", genero: "Iglesia Católica", nivel: 9 },
  { pregunta: "¿Cuántos libros conforman el Nuevo Testamento?", opciones: ["A) 27", "B) 66", "C) 39", "D) 40"], respuesta: "A", genero: "Biblia", nivel: 9 },
  // Nivel 10
  { pregunta: "¿Qué Papa canonizó a Santa Teresa de Calcuta?", opciones: ["A) Papa Francisco", "B) Papa Juan Pablo II", "C) Papa Pío XII", "D) Papa Benedicto XVI"], respuesta: "B", genero: "Santos", nivel: 10 },
  { pregunta: "¿Qué concilio definió la doctrina de la transubstanciación?", opciones: ["A) Concilio de Trento", "B) Concilio de Nicea", "C) Concilio Vaticano I", "D) Concilio de Calcedonia"], respuesta: "A", genero: "Iglesia Católica", nivel: 10 },
  // Nivel 11
  { pregunta: "¿Qué Santo es conocido por haber fundado la Orden de las Carmelitas?", opciones: ["A) San Benito", "B) Santa Teresa de Ávila", "C) San Francisco de Asís", "D) San Ignacio de Loyola"], respuesta: "B", genero: "Santos", nivel: 11 },
  { pregunta: "¿Cuál es el nombre del Papa que emitió la encíclica 'Humanae Vitae' sobre la regulación de la natalidad?", opciones: ["A) Papa Juan XXIII", "B) Papa Pío XII", "C) Papa Pablo VI", "D) Papa Francisco"], respuesta: "C", genero: "Iglesia Católica", nivel: 11 },
  // Nivel 12
  { pregunta: "¿En qué año murió San Pedro?", opciones: ["A) 64 d.C.", "B) 30 d.C.", "C) 100 d.C.", "D) 200 d.C."], respuesta: "A", genero: "Historia de la Iglesia", nivel: 12 },
  { pregunta: "¿En qué año fue fundado el Vaticano?", opciones: ["A) 1929", "B) 1492", "C) 325", "D) 410"], respuesta: "A", genero: "Historia de la Iglesia", nivel: 12 },
  { pregunta: "¿Qué Santo fundó la Orden de los Dominicos?", opciones: ["A) San Benito", "B) San Francisco de Asís", "C) Santo Domingo de Guzmán", "D) San Ignacio de Loyola"], respuesta: "C", genero: "Santos", nivel: 12 },
  // Nivel 13
  { pregunta: "¿Qué Papa instauró el Año Santo Jubilar?", opciones: ["A) Papa Pío XII", "B) Papa Francisco", "C) Papa Juan Pablo II", "D) Papa León XIII"], respuesta: "C", genero: "Iglesia Católica", nivel: 13 },
  { pregunta: "¿Cuál es el nombre del primer Papa que renunció en siglos?", opciones: ["A) Papa Pío XII", "B) Papa Benedicto XVI", "C) Papa Juan Pablo II", "D) Papa Francisco"], respuesta: "B", genero: "Iglesia Católica", nivel: 13 },
  { pregunta: "¿Qué Papa canonizó a San Juan Pablo II?", opciones: ["A) Papa Francisco", "B) Papa Benedicto XVI", "C) Papa Pío XII", "D) Papa Juan XXIII"], respuesta: "A", genero: "Santos", nivel: 13 },
  { pregunta: "¿En qué ciudad nació San Francisco de Asís?", opciones: ["A) Asís", "B) Roma", "C) Florencia", "D) Nápoles"], respuesta: "A", genero: "Santos", nivel: 13 },
  // Nivel 14
  { pregunta: "¿Qué evento histórico dio origen a la Iglesia Católica?", opciones: ["A) La Resurrección de Jesús", "B) El Concilio de Nicea", "C) La Muerte de San Pedro", "D) La Pentecostés"], respuesta: "D", genero: "Historia de la Iglesia", nivel: 14 },
  { pregunta: "¿Cuál es el nombre del líder del primer cisma en la Iglesia?", opciones: ["A) Martín Lutero", "B) Juan Calvino", "C) San Pedro", "D) El Papa Gregorio I"], respuesta: "A", genero: "Iglesia Católica", nivel: 14 },
  { pregunta: "¿Qué santo es conocido por haber sido el primer Papa misionero?", opciones: ["A) San Pedro", "B) San Pablo", "C) San Francisco de Asís", "D) San Juan Pablo II"], respuesta: "B", genero: "Santos", nivel: 14 },
  { pregunta: "¿En qué año fue fundado el Movimiento de Cursillos de Cristiandad?", opciones: ["A) 1930", "B) 1940", "C) 1950", "D) 1960"], respuesta: "C", genero: "Iglesia Católica", nivel: 14 },
  // Nivel 15
  { pregunta: "¿En qué año se produjo la Reforma Protestante?", opciones: ["A) 1517", "B) 1204", "C) 1582", "D) 1789"], respuesta: "A", genero: "Historia de la Iglesia", nivel: 15 },
  { pregunta: "¿En qué ciudad ocurrió el Concilio de Trento?", opciones: ["A) Roma", "B) Trento", "C) Lyon", "D) Jerusalén"], respuesta: "B", genero: "Iglesia Católica", nivel: 15 },
  { pregunta: "¿Quién escribió la obra 'La Ciudad de Dios'?", opciones: ["A) San Agustín", "B) Santo Tomás de Aquino", "C) San Francisco de Asís", "D) San Juan Bosco"], respuesta: "A", genero: "Literatura Cristiana", nivel: 15 },
  { pregunta: "¿Cuál es el nombre del Papa actual?", opciones: ["A) Papa Benedicto XVI", "B) Papa Francisco", "C) Papa Juan Pablo II", "D) Papa Pío XII"], respuesta: "B", genero: "Iglesia Católica", nivel: 15 }
];