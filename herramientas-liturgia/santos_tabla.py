# Calendario mexicano (Calendario Romano General + propio de México) con los rangos que usa Notica.
# S = solemnidad, F = fiesta, M = memoria obligatoria. Las memorias libres no sustituyen a la feria.
S = ["03-19", "03-25", "06-24", "06-29", "08-15", "11-01", "12-08", "12-12"]
F = ["01-25", "02-02", "02-22", "04-25", "05-03", "05-14", "05-31", "07-03", "07-22", "07-25", "08-06", "08-10",
     "08-24", "09-08", "09-14", "09-21", "09-29", "10-18", "10-28", "11-09", "11-30", "12-26", "12-27", "12-28"]
M = ["01-02", "01-17", "01-21", "01-24", "01-26", "01-28", "01-31", "02-05", "02-06", "02-10", "02-14", "02-23",
     "03-07", "04-11", "04-29", "05-02", "05-21", "05-26", "06-01", "06-03", "06-05", "06-11", "06-13", "06-21",
     "06-28", "07-11", "07-15", "07-26", "07-29", "07-31", "08-01", "08-04", "08-08", "08-14", "08-20", "08-21",
     "08-22", "08-23", "08-27", "08-28", "08-29", "09-03", "09-13", "09-15", "09-16", "09-20", "09-27", "09-30",
     "10-01", "10-02", "10-04", "10-07", "10-15", "10-17", "11-04", "11-10", "11-11", "11-12", "11-17", "11-21",
     "11-22", "11-24", "12-03", "12-07", "12-09", "12-13", "12-14"]
# Común de cada fiesta/solemnidad cuando la entrada remite a él para lo que no es propio
COMUN = {"01-25": "apostoles", "02-22": "apostoles", "04-25": "apostoles", "05-03": "apostoles", "05-14": "apostoles",
         "06-29": "apostoles", "07-03": "apostoles", "07-25": "apostoles", "08-24": "apostoles", "09-21": "apostoles",
         "10-18": "apostoles", "10-28": "apostoles", "11-30": "apostoles", "12-27": "apostoles",
         "05-31": "maria", "08-15": "maria", "09-08": "maria", "12-08": "maria", "12-12": "maria",
         "08-10": "martires_uno", "12-26": "martires_uno", "12-28": "martires_varios",
         "07-22": "mujeres", "03-19": "varones", "06-24": "varones", "11-09": "dedicacion"}

TITULOS = {
 "03-19": "San José, esposo de la Virgen María", "03-25": "La Anunciación del Señor", "06-24": "La Natividad de san Juan Bautista",
 "06-29": "San Pedro y san Pablo, apóstoles", "08-15": "La Asunción de la Virgen María", "11-01": "Todos los Santos",
 "12-08": "La Inmaculada Concepción de la Virgen María", "12-12": "Nuestra Señora de Guadalupe",
 "01-25": "La Conversión del apóstol san Pablo", "02-02": "La Presentación del Señor", "02-22": "La Cátedra del apóstol san Pedro",
 "04-25": "San Marcos, evangelista", "05-03": "San Felipe y Santiago, apóstoles", "05-14": "San Matías, apóstol",
 "05-31": "La Visitación de la Virgen María", "07-03": "Santo Tomás, apóstol", "07-22": "Santa María Magdalena",
 "07-25": "Santiago, apóstol", "08-06": "La Transfiguración del Señor", "08-10": "San Lorenzo, diácono y mártir",
 "08-24": "San Bartolomé, apóstol", "09-08": "La Natividad de la Virgen María", "09-14": "La Exaltación de la Santa Cruz",
 "09-21": "San Mateo, apóstol y evangelista", "09-29": "Santos Arcángeles Miguel, Gabriel y Rafael", "10-18": "San Lucas, evangelista",
 "10-28": "San Simón y san Judas, apóstoles", "11-09": "La Dedicación de la Basílica de Letrán", "11-30": "San Andrés, apóstol",
 "12-26": "San Esteban, protomártir", "12-27": "San Juan, apóstol y evangelista", "12-28": "Los Santos Inocentes, mártires",
 "08-22": "Santa María Virgen, Reina", "09-15": "Nuestra Señora, la Virgen de los Dolores", "10-07": "Nuestra Señora, la Virgen del Rosario",
 "11-21": "La Presentación de la Santísima Virgen",
}
NOTAS = {"07-25": "El libro fuente da este día con el propio de España: la oración conserva la mención del patrocinio sobre España."}
