document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const languageSelect = document.getElementById('language-select');
    const mysterySelect = document.getElementById('mystery-select');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const mysteryTitleElem = document.getElementById('mystery-title');
    const prayerTextElem = document.getElementById('prayer-text');
    const beadContainer = document.getElementById('bead-container');
    const backgroundImageElem = document.getElementById('background-image');
    const progressBar = document.getElementById('progress-bar');
    const prayerArea = document.getElementById('prayer-area');
    const citationElem = document.getElementById('citation-text');
    const verseElem = document.getElementById('verse-text');
    const reflectionElem = document.getElementById('reflection-text');
    const controlsContainer = document.querySelector('.controls');

    // Estado de la aplicación
    let currentLanguage = 'es';
    let currentMysteryKey = 'joyful';
    let prayerSequence = [];
    let currentStep = -1;
    let currentBgImage = '';
    let currentLitanyPart = 0;

    // --- CONSTRUCCIÓN DE LA SECUENCIA DE ORACIONES ---
    const buildPrayerSequence = () => {
        const sequence = [];
        const addPrayer = (key, count = 1, icon) => {
            if (count > 1) {
                for (let i = 0; i < count; i++) {
                    sequence.push({ type: 'prayer', prayerKey: key, totalBeads: count, currentBead: i, icon: icon });
                }
            } else {
                sequence.push({ type: 'prayer', prayerKey: key, totalBeads: 1, currentBead: 0, icon: icon });
            }
        };
        
        addPrayer('sign_of_cross', 1, '✠');
        addPrayer('versicle', 1, 'V');
        addPrayer('gloria', 1, 'G');
        addPrayer('creed', 1, 'C');
        addPrayer('our_father', 1, '†');
        addPrayer('hail_mary', 3, '♥');
        addPrayer('gloria', 1, 'G');
        
        for (let i = 0; i < 5; i++) {
            sequence.push({ type: 'mystery_announcement', mysteryIndex: i });
            addPrayer('our_father', 1, '†');
            addPrayer('hail_mary', 10, '♥');
            addPrayer('gloria', 1, 'G');
            addPrayer('mary_mother', 1, 'M');
            addPrayer('fatima_prayer', 1, 'J');
        }
        
        addPrayer('salve_regina', 1, 'S');
        
        // Añadir partes de las letanías como pasos separados
        sequence.push({ type: 'litany', part: 'intro' });
        for (let i = 0; i < rosaryContent[currentLanguage].prayers.litany.invocations.length; i++) {
            sequence.push({ type: 'litany', part: 'invocation', index: i });
        }
        sequence.push({ type: 'litany', part: 'conclusion' });
        
        addPrayer('pope_intentions', 1, 'P');
        addPrayer('our_father', 1, '†');
        addPrayer('hail_mary', 1, '♥');
        addPrayer('gloria', 1, 'G');
        addPrayer('final_sign_of_cross', 1, '✠');
        sequence.push({ type: 'end' });
        
        return sequence;
    };

    // --- MANEJO DEL ESTADO DE LOS BOTONES ---
    const updateButtonStates = () => {
        const langContent = rosaryContent[currentLanguage] || rosaryContent.es;
        prevBtn.disabled = (currentStep <= -1);
        prevBtn.textContent = langContent.prev_btn;
        
        if (currentStep >= prayerSequence.length - 1) {
            nextBtn.textContent = "Reiniciar";
        } else if (currentStep === prayerSequence.length - 2) {
            nextBtn.textContent = "Finalizar";
        } else {
            nextBtn.textContent = langContent.next_btn;
        }
    };
    
    // --- OBTENER NOMBRE DEL TIPO DE MISTERIO ---
    const getMysteryTypeName = () => {
        const names = {
            'joyful': 'Gozoso',
            'luminous': 'Luminoso',
            'sorrowful': 'Doloroso',
            'glorious': 'Glorioso'
        };
        return names[currentMysteryKey] || '';
    };
    
    // --- RENDERIZADO EN PANTALLA ---
    const renderStep = () => {
        prayerArea.scrollTop = 0;
        const content = rosaryContent[currentLanguage];

        // Limpiar elementos
        mysteryTitleElem.textContent = '';
        prayerTextElem.textContent = '';
        citationElem.textContent = '';
        verseElem.textContent = '';
        reflectionElem.textContent = '';
        beadContainer.innerHTML = '';

        // Mostrar u ocultar controles según el paso
        if (currentStep < 0) { // Pantalla de bienvenida
            controlsContainer.classList.remove('hidden');
            mysteryTitleElem.textContent = "Santo Rosario Interactivo";
            prayerTextElem.textContent = content.prayers.welcome_invitation;
            currentBgImage = content.default_image;
        } else {
            controlsContainer.classList.add('hidden');
            const step = prayerSequence[currentStep];

            if (step.type === 'mystery_announcement') {
                const mystery = content.mysteries[currentMysteryKey][step.mysteryIndex];
                mysteryTitleElem.textContent = `${step.mysteryIndex + 1}° Misterio ${getMysteryTypeName()} - ${mystery.title}`;
                prayerTextElem.textContent = "";
                citationElem.textContent = mystery.citation_text;
                verseElem.textContent = mystery.verse_text;
                reflectionElem.textContent = mystery.reflection_text;
                currentBgImage = mystery.image;
            } 
            else if (step.type === 'prayer') {
                const prayerTitles = {
                    'sign_of_cross': "Señal de la Cruz",
                    'versicle': "Versículo Inicial",
                    'creed': "Credo de los Apóstoles",
                    'our_father': "Padre Nuestro",
                    'hail_mary': "Ave María",
                    'gloria': "Gloria",
                    'mary_mother': "Oración a María Madre",
                    'fatima_prayer': "Oración de Fátima",
                    'salve_regina': "Salve Regina",
                    'pope_intentions': "Oración por las Intenciones del Papa",
                    'final_sign_of_cross': "Señal de la Cruz Final"
                };
                
                mysteryTitleElem.textContent = prayerTitles[step.prayerKey];
                prayerTextElem.textContent = content.prayers[step.prayerKey];
                renderBeads(step.totalBeads, step.currentBead, step.icon);
                
                const mysteryIndex = findCurrentMysteryIndex(currentStep);
                if (mysteryIndex === null) {
                    currentBgImage = content.default_image;
                }
            } 
            else if (step.type === 'litany') {
                mysteryTitleElem.textContent = "Letanías Lauretanas";
                
                if (step.part === 'intro') {
                    prayerTextElem.textContent = content.prayers.litany.intro;
                } 
                else if (step.part === 'invocation') {
                    prayerTextElem.textContent = content.prayers.litany.invocations[step.index];
                } 
                else if (step.part === 'conclusion') {
                    prayerTextElem.textContent = content.prayers.litany.conclusion;
                }
                
                currentBgImage = content.default_image;
            } 
            else if (step.type === 'end') {
                mysteryTitleElem.textContent = "Fin del Rosario";
                prayerTextElem.textContent = "Has completado el Santo Rosario.";
                currentBgImage = content.default_image;
            }
        }

        // Actualizar imagen de fondo y barra de progreso
        backgroundImageElem.style.backgroundImage = `url('images/${currentBgImage}')`;
        const progress = (currentStep < 0) ? 0 : (currentStep / (prayerSequence.length - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        
        updateButtonStates();
    };

    const renderBeads = (total, activeIndex, icon) => {
        for (let i = 0; i < total; i++) {
            const bead = document.createElement('div');
            bead.classList.add('bead');
            if (icon === '♥') bead.classList.add('heart');
            if (i === activeIndex) {
                bead.classList.add('active');
            }
            bead.textContent = icon;
            beadContainer.appendChild(bead);
        }
    };
    
    const findCurrentMysteryIndex = (stepIndex) => {
        let mysteryBlockStart = 7; // Después de las oraciones iniciales
        for (let i = 0; i < 5; i++) {
            const mysteryBlockEnd = mysteryBlockStart + 15; // 15 pasos por misterio
            if(stepIndex >= mysteryBlockStart && stepIndex < mysteryBlockEnd) {
                return i;
            }
            mysteryBlockStart = mysteryBlockEnd;
        }
        return null;
    };

    // --- MANEJADORES DE EVENTOS ---
    const handleNext = () => {
        if (currentStep >= prayerSequence.length - 1) {
            currentStep = -1; // Reiniciar
        } else {
            currentStep++;
        }
        renderStep();
    };
    
    const handlePrevious = () => {
        if (currentStep > -1) {
            currentStep--;
        }
        renderStep();
    };

    const resetAndStart = () => {
        currentStep = -1;
        prayerSequence = buildPrayerSequence();
        renderStep();
    };

    const handleLanguageChange = (e) => {
        currentLanguage = e.target.value;
        resetAndStart();
    };

    const handleMysteryChange = (e) => {
        currentMysteryKey = e.target.value;
        resetAndStart();
    };
    
    // --- INICIALIZACIÓN ---
    const setMysteryForToday = () => {
        const day = new Date().getDay();
        // Jueves es el día 4, por lo que corresponde a los Luminosos
        switch (day) {
            case 1: case 6: currentMysteryKey = 'joyful'; break;
            case 3: case 0: currentMysteryKey = 'glorious'; break;
            case 2: case 5: currentMysteryKey = 'sorrowful'; break;
            case 4: currentMysteryKey = 'luminous'; break;
        }
        mysterySelect.value = currentMysteryKey;
    };

    // Configurar eventos
    setMysteryForToday();
    prevBtn.addEventListener('click', handlePrevious);
    nextBtn.addEventListener('click', handleNext);
    languageSelect.addEventListener('change', handleLanguageChange);
    mysterySelect.addEventListener('change', handleMysteryChange);
    
    // Iniciar aplicación
    resetAndStart();
});