document.addEventListener('DOMContentLoaded', () => {
    const rosaryContainer = document.querySelector('.rosary-container');
    const prayerDisplayText = document.getElementById('current-prayer-text');
    const mysteryImage = document.getElementById('mystery-image');
    const mysteryTitle = document.getElementById('mystery-title');
    const mysteryDay = document.getElementById('mystery-day');
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');
    const mysterySelectionButtons = document.querySelectorAll('.mystery-selection button');
    const languageSelectionButtons = document.querySelectorAll('.language-selector button');
    const litanyContainer = document.querySelector('.litany-container');
    const litanyBeadsContainer = document.querySelector('.litany-beads');
    const currentLitanyText = document.getElementById('current-litany-text');
    const nextLitanyButton = document.getElementById('next-litany-button');

    let currentPrayerIndex = 0;
    let currentMysteryType = 'gozosos'; // Por defecto
    let currentLanguage = 'es'; // Por defecto
    let currentLitanyIndex = 0;
    let isLitanyMode = false;

    // --- Datos de Oraciones y Misterios (los mismos que antes) ---
    const prayers = {
        es: {
            opening: [
                "Por la señal de la Santa Cruz, de nuestros enemigos líbranos, Señor, Dios nuestro. En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.",
                "Señor mío, Jesucristo, Dios y Hombre verdadero, Creador y Redentor mío, por ser Vos quien sois, y porque os amo sobre todas las cosas, me pesa de todo corazón haberos ofendido; propongo firmemente nunca más pecar, confesarme y cumplir la penitencia que me fuere impuesta. Amén."
            ],
            credo: "Creo en Dios, Padre Todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, Señor nuestro, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios Padre Todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos. Creo en el Espíritu Santo, la Santa Iglesia Católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.",
            padreNuestro: "Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en tentación, y líbranos del mal. Amén.",
            aveMaria: "Dios te salve, María, llena eres de gracia; el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.",
            gloria: "Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en un principio, ahora y siempre, por los siglos de los siglos. Amén.",
            fatima: "Oh Jesús mío, perdona nuestros pecados, líbranos del fuego del infierno, lleva todas las almas al Cielo, especialmente a las más necesitadas de tu misericordia.",
            salve: "Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando, en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro, muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh clementísima, oh piadosa, oh dulce Virgen María! Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.",
            litanyIntro: "Señor, ten piedad de nosotros.",
            litanyChrist: "Cristo, ten piedad de nosotros.",
            litanyLord: "Señor, ten piedad de nosotros. Cristo, óyenos. Cristo, escúchanos.",
            litanyGodFather: "Dios Padre celestial, ten piedad de nosotros.",
            litanyGodSon: "Dios Hijo, Redentor del mundo, ten piedad de nosotros.",
            litanyGodHolySpirit: "Dios Espíritu Santo, ten piedad de nosotros.",
            litanyHolyTrinity: "Santísima Trinidad, un solo Dios, ten piedad de nosotros.",
            litanies: [
                {invocation: "Santa María,", response: "Ruega por nosotros."},
                {invocation: "Santa Madre de Dios,", response: "Ruega por nosotros."},
                {invocation: "Santa Virgen de las Vírgenes,", response: "Ruega por nosotros."},
                {invocation: "Madre de Cristo,", response: "Ruega por nosotros."},
                {invocation: "Madre de la Iglesia,", response: "Ruega por nosotros."},
                {invocation: "Madre de la divina gracia,", response: "Ruega por nosotros."},
                {invocation: "Madre purísima,", response: "Ruega por nosotros."},
                {invocation: "Madre castísima,", response: "Ruega por nosotros."},
                {invocation: "Madre virginal,", response: "Ruega por nosotros."},
                {invocation: "Madre inmaculada,", response: "Ruega por nosotros."},
                {invocation: "Madre amable,", response: "Ruega por nosotros."},
                {invocation: "Madre admirable,", response: "Ruega por nosotros."},
                {invocation: "Madre del buen consejo,", response: "Ruega por nosotros."},
                {invocation: "Madre del Creador,", response: "Ruega por nosotros."},
                {invocation: "Madre del Salvador,", response: "Ruega por nosotros."},
                {invocation: "Virgen prudentísima,", response: "Ruega por nosotros."},
                {invocation: "Virgen digna de veneración,", response: "Ruega por nosotros."},
                {invocation: "Virgen digna de alabanza,", response: "Ruega por nosotros."},
                {invocation: "Virgen poderosa,", response: "Ruega por nosotros."},
                {invocation: "Virgen clemente,", response: "Ruega por nosotros."},
                {invocation: "Virgen fiel,", response: "Ruega por nosotros."},
                {invocation: "Espejo de justicia,", response: "Ruega por nosotros."},
                {invocation: "Trono de la sabiduría,", response: "Ruega por nosotros."},
                {invocation: "Causa de nuestra alegría,", response: "Ruega por nosotros."},
                {invocation: "Vaso espiritual,", response: "Ruega por nosotros."},
                {invocation: "Vaso digno de honor,", response: "Ruega por nosotros."},
                {invocation: "Vaso insigne de devoción,", response: "Ruega por nosotros."},
                {invocation: "Rosa mística,", response: "Ruega por nosotros."},
                {invocation: "Torre de David,", response: "Ruega por nosotros."},
                {invocation: "Torre de marfil,", response: "Ruega por nosotros."},
                {invocation: "Casa de oro,", response: "Ruega por nosotros."},
                {invocation: "Arca de la Alianza,", response: "Ruega por nosotros."},
                {invocation: "Puerta del cielo,", response: "Ruega por nosotros."},
                {invocation: "Estrella de la mañana,", response: "Ruega por nosotros."},
                {invocation: "Salud de los enfermos,", response: "Ruega por nosotros."},
                {invocation: "Refugio de los pecadores,", response: "Ruega por nosotros."},
                {invocation: "Consuelo de los afligidos,", response: "Ruega por nosotros."},
                {invocation: "Auxilio de los cristianos,", response: "Ruega por nosotros."},
                {invocation: "Reina de los Ángeles,", response: "Ruega por nosotros."},
                {invocation: "Reina de los Patriarcas,", response: "Ruega por nosotros."},
                {invocation: "Reina de los Profetas,", response: "Ruega por nosotros."},
                {invocation: "Reina de los Apóstoles,", "response": "Ruega por nosotros."},
                {invocation: "Reina de los Mártires,", response: "Ruega por nosotros."},
                {invocation: "Reina de los Confesores,", response: "Ruega por nosotros."},
                {invocation: "Reina de las Vírgenes,", response: "Ruega por nosotros."},
                {invocation: "Reina de todos los Santos,", response: "Ruega por nosotros."},
                {invocation: "Reina concebida sin pecado original,", response: "Ruega por nosotros."},
                {invocation: "Reina asunta a los cielos,", response: "Ruega por nosotros."},
                {invocation: "Reina del Santísimo Rosario,", response: "Ruega por nosotros."},
                {invocation: "Reina de la familia,", response: "Ruega por nosotros."},
                {invocation: "Reina de la paz,", response: "Ruega por nosotros."},
            ],
            litanyLambOfGod: [
                {invocation: "Cordero de Dios, que quitas el pecado del mundo,", response: "Perdónanos, Señor."},
                {invocation: "Cordero de Dios, que quitas el pecado del mundo,", response: "Escúchanos, Señor."},
                {invocation: "Cordero de Dios, que quitas el pecado del mundo,", response: "Ten piedad de nosotros."}
            ],
            litanyConclusion: "Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén."
        },
        la: {
            opening: [
                "Per signum Sanctae Crucis, de inimicis nostris libera nos, Deus noster. In nomine Patris, et Filii, et Spiritus Sancti. Amen.",
                "Domine mi, Jesu Christe, Deus et Homo verus, Creator et Redemptor meus, eo quod tu sis, et quia amo te super omnia, doleat mihi ex toto corde quod te offenderim; firmiter propono numquam deinceps peccare, confiteri, et poenitentiam mihi iniunctam implere. Amen."
            ],
            credo: "Credo in Deum Patrem omnipotentem, Creatorem caeli et terrae. Et in Iesum Christum, Filium eius unicum, Dominum nostrum, qui conceptus est de Spiritu Sancto, natus ex Maria Virgine, passus sub Pontio Pilato, crucifixus, mortuus, et sepultus, descendit ad inferos, tertia die resurrexit a mortuis, ascendit ad caelos, sedet ad dexteram Dei Patris omnipotentis, inde venturus est iudicare vivos et mortuos. Credo in Spiritum Sanctum, sanctam Ecclesiam Catholicam, Sanctorum communionem, remissionem peccatorum, carnis resurrectionem, vitam aeternam. Amen.",
            padreNuestro: "Pater noster, qui es in caelis, sanctificetur nomen tuum. Adveniat regnum tuum. Fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie. Et dimitte nobis debita nostra, sicut et nos dimittimus debitoribus nostris. Et ne nos inducas in tentationem: sed libera nos a malo. Amen.",
            aveMaria: "Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.",
            gloria: "Gloria Patri, et Filio, et Spiritui Sancto. Sicut erat in principio, et nunc, et semper, et in saecula saeculorum. Amen.",
            fatima: "O mi Iesu, dimitte nobis debita nostra, libera nos a poenis inferni, perduc in caelum omnes animas, praesertim eas quae misericordiae tuae maxime indigent.",
            salve: "Salve, Regina, Mater misericordiae; vita, dulcedo, et spes nostra, salve. Ad te clamamus, exsules filii Hevae. Ad te suspiramus, gementes et flentes in hac lacrimarum valle. Eia ergo, Advocata nostra, illos tuos misericordes oculos ad nos converte. Et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende. O clemens, O pia, O dulcis Virgo Maria. Ora pro nobis, Sancta Dei Genetrix. Ut digni efficiamur promissionibus Christi.",
            litanyIntro: "Kyrie, eleison.",
            litanyChrist: "Christe, eleison.",
            litanyLord: "Kyrie, eleison. Christe, audi nos. Christe, exaudi nos.",
            litanyGodFather: "Pater de caelis, Deus, miserere nobis.",
            litanyGodSon: "Fili, Redemptor mundi, Deus, miserere nobis.",
            litanyGodHolySpirit: "Spiritus Sancte, Deus, miserere nobis.",
            litanyHolyTrinity: "Sancta Trinitas, unus Deus, miserere nobis.",
            litanies: [
                {invocation: "Sancta Maria,", response: "Ora pro nobis."},
                {invocation: "Sancta Dei Genetrix,", response: "Ora pro nobis."},
                {invocation: "Sancta Virgo virginum,", response: "Ora pro nobis."},
                {invocation: "Mater Christi,", response: "Ora pro nobis."},
                {invocation: "Mater Ecclesiae,", response: "Ora pro nobis."},
                {invocation: "Mater divinae gratiae,", response: "Ora pro nobis."},
                {invocation: "Mater purissima,", response: "Ora pro nobis."},
                {invocation: "Mater castissima,", response: "Ora pro nobis."},
                {invocation: "Mater inviolata,", response: "Ora pro nobis."},
                {invocation: "Mater intemerata,", response: "Ora pro nobis."},
                {invocation: "Mater amabilis,", response: "Ora pro nobis."},
                {invocation: "Mater admirabilis,", response: "Ora pro nobis."},
                {invocation: "Mater boni consilii,", response: "Ora pro nobis."},
                {invocation: "Mater Creatoris,", response: "Ora pro nobis."},
                {invocation: "Mater Salvatoris,", response: "Ora pro nobis."},
                {invocation: "Virgo prudentissima,", response: "Ora pro nobis."},
                {invocation: "Virgo veneranda,", response: "Ora pro nobis."},
                {invocation: "Virgo praedicanda,", response: "Ora pro nobis."},
                {invocation: "Virgo potens,", response: "Ora pro nobis."},
                {invocation: "Virgo clemens,", response: "Ora pro nobis."},
                {invocation: "Virgo fidelis,", response: "Ora pro nobis."},
                {invocation: "Speculum iustitiae,", response: "Ora pro nobis."},
                {invocation: "Sedes sapientiae,", response: "Ora pro nobis."},
                {invocation: "Causa nostrae laetitiae,", response: "Ora pro nobis."},
                {invocation: "Vas spirituale,", response: "Ora pro nobis."},
                {invocation: "Vas honorabile,", response: "Ora pro nobis."},
                {invocation: "Vas insigne devotionis,", response: "Ora pro nobis."},
                {invocation: "Rosa mystica,", response: "Ora pro nobis."},
                {invocation: "Turris Davidica,", response: "Ora pro nobis."},
                {invocation: "Turris eburnea,", response: "Ora pro nobis."},
                {invocation: "Domus aurea,", response: "Ora pro nobis."},
                {invocation: "Foederis arca,", response: "Ora pro nobis."},
                {invocation: "Ianua caeli,", response: "Ora pro nobis."},
                {invocation: "Stella matutina,", response: "Ora pro nobis."},
                {invocation: "Salus infirmorum,", response: "Ora pro nobis."},
                {invocation: "Refugium peccatorum,", response: "Ora pro nobis."},
                {invocation: "Consolatrix afflictorum,", response: "Ora pro nobis."},
                {invocation: "Auxilium Christianorum,", response: "Ora pro nobis."},
                {invocation: "Regina Angelorum,", response: "Ora pro nobis."},
                {invocation: "Regina Patriarcharum,", response: "Ora pro nobis."},
                {invocation: "Regina Prophetarum,", response: "Ora pro nobis."},
                {invocation: "Regina Apostolorum,", response: "Ora pro nobis."},
                {invocation: "Regina Martyrum,", response: "Ora pro nobis."},
                {invocation: "Regina Confessorum,", response: "Ora pro nobis."},
                {invocation: "Regina Virginum,", response: "Ora pro nobis."},
                {invocation: "Regina Sanctorum omnium,", response: "Ora pro nobis."},
                {invocation: "Regina sine labe originali concepta,", response: "Ora pro nobis."},
                {invocation: "Regina in caelum assumpta,", response: "Ora pro nobis."},
                {invocation: "Regina Sacratissimi Rosarii,", response: "Ora pro nobis."},
                {invocation: "Regina familiae,", response: "Ora pro nobis."},
                {invocation: "Regina pacis,", response: "Ora pro nobis."},
            ],
            litanyLambOfGod: [
                {invocation: "Agnus Dei, qui tollis peccata mundi,", response: "Parce nobis, Domine."},
                {invocation: "Agnus Dei, qui tollis peccata mundi,", response: "Exaudi nos, Domine."},
                {invocation: "Agnus Dei, qui tollis peccata mundi,", response: "Miserere nobis."}
            ],
            litanyConclusion: "Ora pro nobis, Sancta Dei Genetrix. Ut digni efficiamur promissionibus Christi. Amen."
        },
        it: {
            opening: [
                "Per il segno della Santa Croce, dai nostri nemici liberaci, Signore, Dio nostro. Nel nome del Padre, e del Figlio, e dello Spirito Santo. Amen.",
                "Mio Signore Gesù Cristo, Dio e uomo vero, Creatore e Redentore mio, per essere Tu quel che sei, e perché Ti amo sopra ogni cosa, mi pento con tutto il cuore di averti offeso; propongo fermamente di non peccare mai più, di confessarmi e di adempiere la penitenza che mi sarà imposta. Amen."
            ],
            credo: "Credo in Dio, Padre onnipotente, creatore del cielo e della terra. E in Gesù Cristo, suo unico Figlio, nostro Signore, il quale fu concepito di Spirito Santo, nacque da Maria Vergine, patì sotto Ponzio Pilato, fu crocifisso, morì e fu sepolto; discese agli inferi; il terzo giorno risuscitò da morte; salì al cielo, siede alla destra di Dio Padre onnipotente; di là verrà a giudicare i vivi e i morti. Credo nello Spirito Santo, la santa Chiesa cattolica, la comunione dei santi, la remissione dei peccati, la risurrezione della carne, la vita eterna. Amen.",
            padreNuestro: "Padre nostro, che sei nei cieli, sia santificato il tuo nome, venga il tuo regno, sia fatta la tua volontà, come in cielo così in terra. Dacci oggi il nostro pane quotidiano, e rimetti a noi i nostri debiti come noi li rimettiamo ai nostri debitori, e non ci indurre in tentazione, ma liberaci dal male. Amen.",
            aveMaria: "Ave, o Maria, piena di grazia, il Signore è con te. Tu sei benedetta fra le donne e benedetto è il frutto del tuo seno, Gesù. Santa Maria, Madre di Dio, prega per noi peccatori, adesso e nell'ora della nostra morte. Amen.",
            gloria: "Gloria al Padre e al Figlio e allo Spirito Santo. Come era nel principio, ora e sempre, nei secoli dei secoli. Amen.",
            fatima: "O Gesù, perdona le nostre colpe, preservaci dal fuoco dell'inferno, porta in cielo tutte le anime, specialmente le più bisognose della tua misericordia.",
            salve: "Salve, Regina, Madre di misericordia; vita, dolcezza e speranza nostra, salve. A Te ricorriamo, esuli figli di Eva; a Te sospiriamo, gementi e piangenti in questa valle di lacrime. Orsù dunque, avvocata nostra, rivolgi a noi quegli occhi tuoi misericordiosi. E mostraci, dopo questo esilio, Gesù, il frutto benedetto del tuo seno. O clemente, o pia, o dolce Vergine Maria. Prega per noi, Santa Madre di Dio. Perché siamo fatti degni delle promesse di Cristo.",
            litanyIntro: "Signore, pietà.",
            litanyChrist: "Cristo, pietà.",
            litanyLord: "Signore, pietà. Cristo, ascoltaci. Cristo, esaudiscici.",
            litanyGodFather: "Padre del cielo, Dio, abbi pietà di noi.",
            litanyGodSon: "Figlio, Redentore del mondo, Dio, abbi pietà di noi.",
            litanyGodHolySpirit: "Spirito Santo, Dio, abbi pietà di noi.",
            litanyHolyTrinity: "Santa Trinità, unico Dio, abbi pietà di noi.",
            litanies: [
                {invocation: "Santa Maria,", response: "Prega per noi."},
                {invocation: "Santa Madre di Dio,", response: "Prega per noi."},
                {invocation: "Santa Vergine delle vergini,", response: "Prega per noi."},
                {invocation: "Madre di Cristo,", response: "Prega per noi."},
                {invocation: "Madre della Chiesa,", response: "Prega per noi."},
                {invocation: "Madre della Divina Grazia,", response: "Prega per noi."},
                {invocation: "Madre purissima,", response: "Prega per noi."},
                {invocation: "Madre castissima,", response: "Prega per noi."},
                {invocation: "Madre sempre vergine,", response: "Prega per noi."},
                {invocation: "Madre immacolata,", response: "Prega per noi."},
                {invocation: "Madre amabile,", response: "Prega per noi."},
                {invocation: "Madre ammirabile,", response: "Prega per noi."},
                {invocation: "Madre del buon consiglio,", response: "Prega per noi."},
                {invocation: "Madre del Creatore,", response: "Prega per noi."},
                {invocation: "Madre del Salvatore,", response: "Prega per noi."},
                {invocation: "Vergine prudentissima,", response: "Prega per noi."},
                {invocation: "Vergine degna di onore,", response: "Prega per noi."},
                {invocation: "Vergine degna di lode,", response: "Prega per noi."},
                {invocation: "Vergine potente,", response: "Prega per noi."},
                {invocation: "Vergine clemente,", response: "Prega per noi."},
                {invocation: "Vergine fedele,", response: "Prega per noi."},
                {invocation: "Specchio di giustizia,", response: "Prega per nosotros."},
                {invocation: "Sede della sapienza,", response: "Prega per noi."},
                {invocation: "Causa della nostra letizia,", response: "Prega per noi."},
                {invocation: "Vaso spirituale,", response: "Prega per noi."},
                {invocation: "Vaso degno d'onore,", response: "Prega per noi."},
                {invocation: "Vaso insigne di devozione,", response: "Prega per noi."},
                {invocation: "Rosa mistica,", response: "Prega per noi."},
                {invocation: "Torre di Davide,", response: "Prega per noi."},
                {invocation: "Torre d'avorio,", response: "Prega per noi."},
                {invocation: "Casa d'oro,", response: "Prega per noi."},
                {invocation: "Arca dell'alleanza,", response: "Prega per noi."},
                {invocation: "Porta del cielo,", response: "Prega per noi."},
                {invocation: "Stella del mattino,", response: "Prega per noi."},
                {invocation: "Salute degli infermi,", response: "Prega per noi."},
                {invocation: "Rifugio dei peccatori,", response: "Prega per noi."},
                {invocation: "Consolatrice degli afflitti,", response: "Prega per noi."},
                {invocation: "Aiuto dei cristiani,", response: "Prega per noi."},
                {invocation: "Regina degli Angeli,", response: "Prega per noi."},
                {invocation: "Regina dei Patriarchi,", response: "Prega per noi."},
                {invocation: "Regina dei Profeti,", response: "Prega per noi."},
                {invocation: "Regina degli Apostoli,", response: "Prega per noi."},
                {invocation: "Regina dei Martiri,", response: "Prega per noi."},
                {invocation: "Regina dei Confessori,", response: "Prega per noi."},
                {invocation: "Regina delle Vergini,", response: "Prega per noi."},
                {invocation: "Regina di tutti i Santi,", response: "Prega per noi."},
                {invocation: "Regina concepita senza peccato originale,", response: "Prega per noi."},
                {invocation: "Regina assunta in cielo,", response: "Prega per noi."},
                {invocation: "Regina del Santissimo Rosario,", response: "Prega per noi."},
                {invocation: "Regina della famiglia,", response: "Prega per noi."},
                {invocation: "Regina della pace,", response: "Prega per noi."},
            ],
            litanyLambOfGod: [
                {invocation: "Agnello di Dio, che togli i peccati del mondo,", response: "Perdonaci, o Signore."},
                {invocation: "Agnello di Dio, che togli i peccati del mondo,", response: "Ascoltaci, o Signore."},
                {invocation: "Agnello di Dio, che togli i peccati del mondo,", response: "Abbi pietà di noi."}
            ],
            litanyConclusion: "Prega per noi, Santa Madre di Dio. Perché siamo fatti degni delle promesse di Cristo."
        }
    };

    const mysteries = { /* ... (mismo contenido que antes) ... */
        es: {
            gozosos: {
                day: "Lunes y Sábado",
                image: "https://source.unsplash.com/random/200x200/?joy,baby,mary,pastel,minimalist",
                titles: [
                    "1. La Anunciación del Ángel a María",
                    "2. La Visitación de María a su prima Isabel",
                    "3. El Nacimiento de Jesús en Belén",
                    "4. La Presentación de Jesús en el Templo",
                    "5. Jesús perdido y hallado en el Templo"
                ]
            },
            dolorosos: {
                day: "Martes y Viernes",
                image: "https://source.unsplash.com/random/200x200/?suffering,cross,jesus,pastel,minimalist",
                titles: [
                    "1. La Oración de Jesús en el Huerto",
                    "2. La Flagelación de Jesús",
                    "3. La Coronación de espinas",
                    "4. Jesús con la Cruz a cuestas",
                    "5. La Crucifixión y Muerte de Jesús"
                ]
            },
            gloriosos: {
                day: "Miércoles y Domingo",
                image: "https://source.unsplash.com/random/200x200/?glory,resurrection,heaven,pastel,minimalist",
                titles: [
                    "1. La Resurrección de Jesús",
                    "2. La Ascensión de Jesús al Cielo",
                    "3. La Venida del Espíritu Santo",
                    "4. La Asunción de María al Cielo",
                    "5. La Coronación de María como Reina del Cielo y Tierra"
                ]
            },
            luminosos: {
                day: "Jueves",
                image: "https://source.unsplash.com/random/200x200/?light,baptism,wedding,pastel,minimalist",
                titles: [
                    "1. El Bautismo de Jesús en el Jordán",
                    "2. La Autorrevelación de Jesús en Caná",
                    "3. El Anuncio del Reino de Dios y la invitación a la conversión",
                    "4. La Transfiguración de Jesús",
                    "5. La Institución de la Eucaristía"
                ]
            }
        },
        la: {
            gozosos: {
                day: "Lunae et Sabbato",
                image: "https://source.unsplash.com/random/200x200/?joy,baby,mary,pastel,minimalist",
                titles: [
                    "1. Annuntiatio Incarnationis Domini",
                    "2. Visitatio Beatae Mariae Virginis ad Elisabeth",
                    "3. Nativitas Domini Nostri Iesu Christi",
                    "4. Praesentatio Domini Iesu in Templo",
                    "5. Inventio Iesu in Templo"
                ]
            },
            dolorosos: {
                day: "Martis et Veneris",
                image: "https://source.unsplash.com/random/200x200/?suffering,cross,jesus,pastel,minimalist",
                titles: [
                    "1. Oratio Iesu in Horto",
                    "2. Flagellatio Domini Nostri Iesu Christi",
                    "3. Coronatio Spinis",
                    "4. Baiulatio Crucis",
                    "5. Crucifixio et Mors Domini Nostri Iesu Christi"
                ]
            },
            gloriosos: {
                day: "Mercurii et Dominici",
                image: "https://source.unsplash.com/random/200x200/?glory,resurrection,heaven,pastel,minimalist",
                titles: [
                    "1. Resurrectio Domini Nostri Iesu Christi",
                    "2. Ascensio Domini Nostri Iesu Christi in Caelum",
                    "3. Descensus Spiritus Sancti super Apostolos",
                    "4. Assumptio Beatae Mariae Virginis in Caelum",
                    "5. Coronatio Beatae Mariae Virginis in Caelo et in Terra"
                ]
            },
            luminosos: {
                day: "Iovis",
                image: "https://source.unsplash.com/random/200x200/?light,baptism,wedding,pastel,minimalist",
                titles: [
                    "1. Baptisma Domini in Iordane",
                    "2. Autosufficientia Domini in Cana Galilaeae",
                    "3. Praedicatio Regni Dei et invitatorum ad conversionem",
                    "4. Transfiguratio Domini Nostri Iesu Christi",
                    "5. Institutio Eucharistiae"
                ]
            }
        },
        it: {
            gozosos: {
                day: "Lunedì e Sabato",
                image: "https://source.unsplash.com/random/200x200/?joy,baby,mary,pastel,minimalist",
                titles: [
                    "1. L'Annunciazione dell'Angelo a Maria",
                    "2. La Visitazione di Maria a santa Elisabetta",
                    "3. La Nascita di Gesù nella grotta di Betlemme",
                    "4. La Presentazione di Gesù al Tempio",
                    "5. Il Ritrovamento di Gesù nel Tempio"
                ]
            },
            dolorosos: {
                day: "Martedì e Venerdì",
                image: "https://source.unsplash.com/random/200x200/?suffering,cross,jesus,pastel,minimalist",
                titles: [
                    "1. L'Agonia di Gesù nell'Orto degli Ulivi",
                    "2. La Flagellazione di Gesù alla colonna",
                    "3. L'Incoronazione di spine",
                    "4. Gesù è caricato della croce",
                    "5. La Crocifissione e la Morte di Gesù"
                ]
            },
            gloriosos: {
                day: "Mercoledì e Domenica",
                image: "https://source.unsplash.com/random/200x200/?glory,resurrection,heaven,pastel,minimalist",
                titles: [
                    "1. La Resurrezione di Gesù",
                    "2. L'Ascensione di Gesù al Cielo",
                    "3. La Discesa dello Spirito Santo nel Cenacolo",
                    "4. L'Assunzione di Maria al Cielo",
                    "5. L'Incoronazione di Maria Regina del Cielo e della Terra"
                ]
            },
            luminosos: {
                day: "Giovedì",
                image: "https://source.unsplash.com/random/200x200/?light,baptism,wedding,pastel,minimalist",
                titles: [
                    "1. Il Battesimo di Gesù al Giordano",
                    "2. L'Autorivelazione di Gesù alle nozze di Cana",
                    "3. L'Annuncio del Regno di Dio e l'invito alla conversione",
                    "4. La Trasfigurazione di Gesù sul monte Tabor",
                    "5. L'Istituzione dell'Eucaristia"
                ]
            }
        }
    };

    // --- Funciones de Renderizado y Lógica del Rosario ---

    function generateRosaryBeads() {
        rosaryContainer.innerHTML = '';
        const beads = [];

        // Oraciones iniciales (Señal de la cruz, Credo, Acto de Contrición)
        beads.push({ type: 'initial', prayer: prayers[currentLanguage].opening[0] });
        beads.push({ type: 'initial', prayer: prayers[currentLanguage].opening[1] });
        beads.push({ type: 'credo', prayer: prayers[currentLanguage].credo, isCruciform: true }); // Credo como cuenta "grande" y cruciforme

        // Cuentas antes del primer misterio
        beads.push({ type: 'padreNuestro', prayer: prayers[currentLanguage].padreNuestro, isCruciform: true });
        for (let i = 0; i < 3; i++) {
            beads.push({ type: 'aveMaria', prayer: prayers[currentLanguage].aveMaria });
        }
        beads.push({ type: 'gloria', prayer: prayers[currentLanguage].gloria, fatima: prayers[currentLanguage].fatima, isCruciform: true }); // Gloria como cuenta "grande" y cruciforme por la oración de Fátima

        // Cinco misterios (cada uno con un Padre Nuestro, 10 Avemarías, Gloria y Fátima)
        for (let i = 0; i < 5; i++) {
            beads.push({ type: 'mysteryStart', mysteryIndex: i, isCruciform: true }); // Representa el inicio de un misterio, será una cuenta "grande" y cruciforme
            beads.push({ type: 'padreNuestro', prayer: prayers[currentLanguage].padreNuestro, isCruciform: true });
            for (let j = 0; j < 10; j++) {
                beads.push({ type: 'aveMaria', prayer: prayers[currentLanguage].aveMaria });
            }
            beads.push({ type: 'gloria', prayer: prayers[currentLanguage].gloria, fatima: prayers[currentLanguage].fatima, isCruciform: true });
        }

        // Final (Salve)
        beads.push({ type: 'salve', prayer: prayers[currentLanguage].salve, isCruciform: true }); // Salve como cuenta "grande" y cruciforme

        beads.forEach((beadData, index) => {
            const beadElement = document.createElement('div');
            beadElement.classList.add('bead');
            // Añadir la clase 'cruciform' si es una cuenta de Padre Nuestro o similar
            if (beadData.isCruciform) {
                beadElement.classList.add('cruciform');
            }
            beadElement.dataset.index = index;
            beadElement.dataset.type = beadData.type;
            rosaryContainer.appendChild(beadElement);
        });

        return beads;
    }

    let rosaryBeadsData = []; // Para almacenar los datos de las cuentas generadas

    function updateRosaryDisplay() {
        const beads = document.querySelectorAll('.rosary-container .bead');
        beads.forEach((bead, index) => {
            if (index === currentPrayerIndex) {
                bead.classList.add('active');
            } else {
                bead.classList.remove('active');
            }
        });

        // Habilitar/deshabilitar botón "Regresar"
        if (currentPrayerIndex > 0) {
            prevButton.removeAttribute('disabled');
        } else {
            prevButton.setAttribute('disabled', 'true');
        }


        // Actualizar la oración en pantalla
        let currentBeadData = rosaryBeadsData[currentPrayerIndex];
        if (!currentBeadData) {
            prayerDisplayText.textContent = "";
            return;
        }

        let prayerTextToShow = currentBeadData.prayer;

        if (currentBeadData.type === 'gloria' && currentBeadData.fatima) {
            prayerTextToShow += "\n" + currentBeadData.fatima;
        } else if (currentBeadData.type === 'mysteryStart') {
            const mysteryIndex = currentBeadData.mysteryIndex;
            prayerTextToShow = `${mysteries[currentLanguage][currentMysteryType].titles[mysteryIndex]}`;
        }
        prayerDisplayText.textContent = prayerTextToShow;

        // Actualizar la información del misterio
        const mysteryData = mysteries[currentLanguage][currentMysteryType];
        // Añadir el parámetro 'pastel' y 'minimalist' a la URL para intentar obtener imágenes con esa temática
        mysteryImage.src = mysteryData.image.replace(/random\/(.*?)\//, `random/$1,pastel,minimalist/`);

        let activeMysteryTitle = '';
        // Lógica para mostrar el título del misterio actual de forma más precisa
        // Las oraciones iniciales son 3 (Señal, Contrición, Credo)
        // Luego 1 PN, 3 AM, 1 Gloria (5 cuentas) antes del primer misterio
        // Cada misterio son 1 PN (título), 1 PN, 10 AM, 1 Gloria (13 cuentas por misterio)

        const prayersBeforeFirstDecade = 5; // Credo, PN, 3 AM, Gloria
        const prayersPerDecade = 13; // MysteryStart (título), PN, 10 AM, Gloria

        if (currentPrayerIndex >= prayersBeforeFirstDecade) {
            const effectiveIndex = currentPrayerIndex - prayersBeforeFirstDecade;
            const currentDecade = Math.floor(effectiveIndex / prayersPerDecade);

            if (currentDecade >= 0 && currentDecade < 5) { // Hay 5 décadas
                activeMysteryTitle = mysteryData.titles[currentDecade];
            }
        }
        
        mysteryTitle.textContent = activeMysteryTitle;
        mysteryDay.textContent = `Se reza: ${mysteryData.day}`;
    }

    function advancePrayer() {
        if (isLitanyMode) {
            advanceLitany();
            return;
        }

        currentPrayerIndex++;
        if (currentPrayerIndex >= rosaryBeadsData.length) {
            alert("¡Has terminado de rezar el Rosario! Ahora puedes rezar las Letanías Lauretanas.");
            rosaryContainer.style.display = 'none';
            prayerDisplayText.style.display = 'none';
            nextButton.style.display = 'none';
            prevButton.style.display = 'none'; // Ocultar también el botón de regresar
            litanyContainer.style.display = 'block';
            isLitanyMode = true;
            generateLitanyBeads();
            updateLitanyDisplay();
            return;
        }
        updateRosaryDisplay();
    }

    function regressPrayer() {
        if (isLitanyMode) {
            // Si estamos en modo letanías, el botón de regresar no tiene efecto por ahora o se podría implementar
            return;
        }

        if (currentPrayerIndex > 0) {
            currentPrayerIndex--;
            updateRosaryDisplay();
        }
    }


    // --- Funciones de Letanías Lauretanas (mismas que antes, solo ajuste de imagen) ---

    function generateLitanyBeads() {
        litanyBeadsContainer.innerHTML = '';
        const litaniesData = prayers[currentLanguage].litanies;

        // Intro
        const introBeads = [
            prayers[currentLanguage].litanyIntro,
            prayers[currentLanguage].litanyChrist,
            prayers[currentLanguage].litanyLord,
            prayers[currentLanguage].litanyGodFather,
            prayers[currentLanguage].litanyGodSon,
            prayers[currentLanguage].litanyGodHolySpirit,
            prayers[currentLanguage].litanyHolyTrinity
        ];

        introBeads.forEach((prayer, index) => {
            const beadElement = document.createElement('div');
            beadElement.classList.add('litany-bead');
            beadElement.dataset.index = index;
            beadElement.dataset.type = 'intro';
            beadElement.dataset.prayer = prayer;
            litanyBeadsContainer.appendChild(beadElement);
        });

        // Litanies
        litaniesData.forEach((litany, index) => {
            const beadElement = document.createElement('div');
            beadElement.classList.add('litany-bead');
            beadElement.dataset.index = index + introBeads.length;
            beadElement.dataset.type = 'litany';
            beadElement.dataset.invocation = litany.invocation;
            beadElement.dataset.response = litany.response;
            litanyBeadsContainer.appendChild(beadElement);
        });

        // Lamb of God
        const lambOfGodBeads = prayers[currentLanguage].litanyLambOfGod;
        lambOfGodBeads.forEach((prayer, index) => {
            const beadElement = document.createElement('div');
            beadElement.classList.add('litany-bead');
            beadElement.dataset.index = introBeads.length + litaniesData.length + index;
            beadElement.dataset.type = 'lambOfGod';
            beadElement.dataset.invocation = prayer.invocation;
            beadElement.dataset.response = prayer.response;
            litanyBeadsContainer.appendChild(beadElement);
        });

        // Conclusion
        const conclusionBead = document.createElement('div');
        conclusionBead.classList.add('litany-bead');
        conclusionBead.dataset.index = introBeads.length + litaniesData.length + lambOfGodBeads.length;
        conclusionBead.dataset.type = 'conclusion';
        conclusionBead.dataset.prayer = prayers[currentLanguage].litanyConclusion;
        litanyBeadsContainer.appendChild(conclusionBead);
    }

    function updateLitanyDisplay() {
        const beads = document.querySelectorAll('.litany-beads .litany-bead');
        beads.forEach((bead, index) => {
            if (index === currentLitanyIndex) {
                bead.classList.add('active');
            } else {
                bead.classList.remove('active');
            }
        });

        let litanyText = '';
        if (currentLitanyIndex < beads.length) {
            const currentBead = beads[currentLitanyIndex];
            const type = currentBead.dataset.type;

            if (type === 'intro' || type === 'conclusion') {
                litanyText = currentBead.dataset.prayer;
            } else if (type === 'litany' || type === 'lambOfGod') {
                litanyText = `${currentBead.dataset.invocation} ${currentBead.dataset.response}`;
            }
        } else {
            litanyText = "¡Has terminado las Letanías Lauretanas! Gloria a Dios.";
            nextLitanyButton.style.display = 'none';
        }
        currentLitanyText.textContent = litanyText;
    }

    function advanceLitany() {
        currentLitanyIndex++;
        updateLitanyDisplay();
    }


    // --- Inicialización y Event Listeners ---

    function initializeRosary(mysteryType, lang) {
        currentPrayerIndex = 0;
        currentLitanyIndex = 0;
        isLitanyMode = false;
        litanyContainer.style.display = 'none';
        rosaryContainer.style.display = 'grid';
        prayerDisplayText.style.display = 'flex';
        nextButton.style.display = 'block';
        prevButton.style.display = 'block';

        currentMysteryType = mysteryType;
        currentLanguage = lang;

        languageSelectionButtons.forEach(button => {
            if (button.dataset.lang === currentLanguage) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        mysterySelectionButtons.forEach(button => {
            if (button.dataset.mysteryType === currentMysteryType) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        rosaryBeadsData = generateRosaryBeads();
        updateRosaryDisplay();
    }

    nextButton.addEventListener('click', advancePrayer);
    prevButton.addEventListener('click', regressPrayer);
    nextLitanyButton.addEventListener('click', advanceLitany);

    mysterySelectionButtons.forEach(button => {
        button.addEventListener('click', () => {
            initializeRosary(button.dataset.mysteryType, currentLanguage);
        });
    });

    languageSelectionButtons.forEach(button => {
        button.addEventListener('click', () => {
            initializeRosary(currentMysteryType, button.dataset.lang);
        });
    });

    // Inicializar con el misterio Gozoso en español al cargar la página
    initializeRosary('gozosos', 'es');
});