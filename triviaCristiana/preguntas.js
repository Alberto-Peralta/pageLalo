const preguntas = [
  // Dificultad 1
  { pregunta: "¿Quién fue el primer Papa de la Iglesia Católica?", opciones: ["A) San Pedro", "B) San Pablo", "C) San Juan", "D) San Andrés"], respuesta: "A", genero: "Historia de la Iglesia", dificultad: 1 },
  { pregunta: "¿Qué significa la palabra 'Evangelio'?", opciones: ["A) Palabra de Dios", "B) Buena noticia", "C) Camino de vida", "D) Revelación"], respuesta: "B", genero: "Biblia", dificultad: 1 },
  
  // Dificultad 2
  { pregunta: "¿Qué Papa inició el Concilio Vaticano II?", opciones: ["A) Pablo VI", "B) Juan XXIII", "C) Pío XII", "D) Benedicto XV"], respuesta: "B", genero: "Historia de la Iglesia", dificultad: 2 },
  { pregunta: "¿Quién recibió los 10 Mandamientos?", opciones: ["A) Abraham", "B) Moisés", "C) Elías", "D) Aarón"], respuesta: "B", genero: "Biblia", dificultad: 2 },
  
  // Dificultad 3
  { pregunta: "¿En qué idioma fue escrito originalmente el Nuevo Testamento?", opciones: ["A) Latín", "B) Griego", "C) Hebreo", "D) Arameo"], respuesta: "B", genero: "Biblia", dificultad: 3 },
  { pregunta: "¿Qué encíclica habla de la Doctrina Social de la Iglesia?", opciones: ["A) Pacem in Terris", "B) Rerum Novarum", "C) Humanae Vitae", "D) Laudato Si'"], respuesta: "B", genero: "Historia de la Iglesia", dificultad: 3 },
  
  // Dificultad 4
  { pregunta: "¿Qué rey ordenó la construcción del Templo de Jerusalén?", opciones: ["A) David", "B) Salomón", "C) Saúl", "D) Josué"], respuesta: "B", genero: "Biblia", dificultad: 4 },
  { pregunta: "¿Qué concilio definió el dogma de la Inmaculada Concepción?", opciones: ["A) Concilio de Trento", "B) Vaticano I", "C) Éfeso", "D) No fue definido en un concilio"], respuesta: "D", genero: "Historia de la Iglesia", dificultad: 4 },
  
  // Dificultad 5
  { pregunta: "¿Quién es considerado el 'Doctor de la Iglesia' más influyente?", opciones: ["A) Santo Tomás de Aquino", "B) San Agustín", "C) San Jerónimo", "D) San Gregorio Magno"], respuesta: "A", genero: "Historia de la Iglesia", dificultad: 5 },
  { pregunta: "¿Cuál es el libro más largo de la Biblia?", opciones: ["A) Salmos", "B) Isaías", "C) Génesis", "D) Apocalipsis"], respuesta: "A", genero: "Biblia", dificultad: 5 },

  // Dificultad 6
  { pregunta: "¿Qué significa la palabra 'Papa'?", opciones: ["A) Pastor Universal", "B) Padre", "C) Obispo de Roma", "D) Vicario de Cristo"], respuesta: "B", genero: "Historia de la Iglesia", dificultad: 6 },
  { pregunta: "¿Qué libro de la Biblia narra la salida de los israelitas de Egipto?", opciones: ["A) Génesis", "B) Levítico", "C) Números", "D) Éxodo"], respuesta: "D", genero: "Biblia", dificultad: 6 },
  
  // Dificultad 7
  { pregunta: "¿Qué concilio estableció el Canon de la Biblia?", opciones: ["A) Nicea I", "B) Trento", "C) Cartago", "D) Jerusalén"], respuesta: "C", genero: "Historia de la Iglesia", dificultad: 7 },
  { pregunta: "¿Qué evangelista era médico de profesión?", opciones: ["A) Mateo", "B) Marcos", "C) Lucas", "D) Juan"], respuesta: "C", genero: "Biblia", dificultad: 7 },

  // Dificultad 8
  { pregunta: "¿Quién es conocido como el 'Padre de la Teología Occidental'?", opciones: ["A) San Agustín", "B) San Ambrosio", "C) San Jerónimo", "D) Santo Tomás de Aquino"], respuesta: "A", genero: "Historia de la Iglesia", dificultad: 8 },
  { pregunta: "¿Qué rey tuvo un sueño interpretado por Daniel?", opciones: ["A) Nabucodonosor", "B) Ciro", "C) Darío", "D) Artajerjes"], respuesta: "A", genero: "Biblia", dificultad: 8 },
  
  // Dificultad 9
  { pregunta: "¿Qué Papa definió el dogma de la Asunción?", opciones: ["A) Pío IX", "B) Pío XII", "C) León XIII", "D) Benedicto XV"], respuesta: "B", genero: "Historia de la Iglesia", dificultad: 9 },
  { pregunta: "¿Qué profeta fue tragado por un pez?", opciones: ["A) Jonás", "B) Elías", "C) Isaías", "D) Amós"], respuesta: "A", genero: "Biblia", dificultad: 9 },

  // Dificultad 10
  { pregunta: "¿Qué documento de 313 d.C. otorgó libertad de culto a los cristianos?", opciones: ["A) Edicto de Milán", "B) Edicto de Tesalónica", "C) Edicto de Nicea", "D) Edicto de Éfeso"], respuesta: "A", genero: "Historia de la Iglesia", dificultad: 10 },
  { pregunta: "¿Cuál es el último libro del Antiguo Testamento?", opciones: ["A) Malaquías", "B) Zacarías", "C) Habacuc", "D) Daniel"], respuesta: "A", genero: "Biblia", dificultad: 10 },

   // Dificultad 11
   { pregunta: "¿Cuál fue el tema principal de la encíclica 'Humanae Vitae' de Pablo VI?", opciones: ["A) La paz mundial", "B) El control de la natalidad", "C) La justicia social", "D) La unidad de los cristianos"], respuesta: "B", genero: "Encíclicas", dificultad: 11 },
   { pregunta: "¿En qué concilio se definió el dogma de la transubstanciación?", opciones: ["A) Concilio de Éfeso", "B) Concilio de Nicea", "C) Concilio de Trento", "D) Concilio Vaticano II"], respuesta: "C", genero: "Concilios", dificultad: 11 },
 
   // Dificultad 12
   { pregunta: "¿Qué Papa escribió la encíclica 'Evangelium Vitae'?", opciones: ["A) Juan Pablo II", "B) Benedicto XVI", "C) Pablo VI", "D) Francisco"], respuesta: "A", genero: "Encíclicas", dificultad: 12 },
   { pregunta: "¿Cuál fue el propósito principal del Concilio Vaticano I?", opciones: ["A) Reformar la liturgia", "B) Definir la infalibilidad papal", "C) Promover el ecumenismo", "D) Abordar la reforma protestante"], respuesta: "B", genero: "Concilios", dificultad: 12 },
 
   // Dificultad 13
   { pregunta: "¿Qué encíclica se considera un hito en la Doctrina Social de la Iglesia?", opciones: ["A) Laudato Si'", "B) Rerum Novarum", "C) Fides et Ratio", "D) Deus Caritas Est"], respuesta: "B", genero: "Encíclicas", dificultad: 13 },
   { pregunta: "¿En qué año se llevó a cabo el Concilio Vaticano II?", opciones: ["A) 1958", "B) 1962", "C) 1970", "D) 1980"], respuesta: "B", genero: "Concilios", dificultad: 13 },
 
   // Dificultad 14
   { pregunta: "¿Qué santo fue llamado 'Doctor de la Gracia'?", opciones: ["A) San Agustín", "B) Santo Tomás de Aquino", "C) San Jerónimo", "D) San Gregorio Magno"], respuesta: "A", genero: "Historia de la Iglesia", dificultad: 14 },
   { pregunta: "¿Qué documento conciliar trató sobre la libertad religiosa?", opciones: ["A) Gaudium et Spes", "B) Dignitatis Humanae", "C) Lumen Gentium", "D) Sacrosanctum Concilium"], respuesta: "B", genero: "Concilios", dificultad: 14 },
 
   // Dificultad 15
   { pregunta: "¿Qué Papa llamó al Concilio de Trento?", opciones: ["A) Pablo III", "B) Julio II", "C) Clemente VII", "D) Pío IV"], respuesta: "A", genero: "Historia de la Iglesia", dificultad: 15 },
   { pregunta: "¿Qué encíclica de León XIII aborda la relación entre la fe y la ciencia?", opciones: ["A) Providentissimus Deus", "B) Aeterni Patris", "C) Rerum Novarum", "D) Humanae Vitae"], respuesta: "A", genero: "Encíclicas", dificultad: 15 }
 ];
