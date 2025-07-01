document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const languageSelect = document.getElementById('language-select');
    const mysterySelect = document.getElementById('mystery-select');
    const prevBtn = document.getElementById('prev-btn'); // AÑADIDO
    const nextBtn = document.getElementById('next-btn');
    const mysteryTitleElem = document.getElementById('mystery-title');
    const prayerTextElem = document.getElementById('prayer-text');
    const beadContainer = document.getElementById('bead-container');
    const backgroundImageElem = document.getElementById('background-image');
    const progressBar = document.getElementById('progress-bar');
    const prayerArea = document.getElementById('prayer-area');

    // Estado de la aplicación
    let currentLanguage = 'es';
    let currentMysteryKey = 'joyful';
    let prayerSequence = [];
    let currentStep = -1;

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

        // ... (La lógica para construir la secuencia no cambia)
        // 1. Introducción
        addPrayer('sign_of_cross', 1, '✠');
        addPrayer('versicle', 1, 'V');
        addPrayer('gloria', 1, 'G');
        addPrayer('creed', 1, 'C');
        addPrayer('our_father', 1, '†');
        addPrayer('hail_mary', 3, '♥');
        addPrayer('gloria', 1, 'G');
        // 2. Misterios (5x)
        for (let i = 0; i < 5; i++) {
            sequence.push({ type: 'mystery_announcement', mysteryIndex: i });
            addPrayer('our_father', 1, '†');
            addPrayer('hail_mary', 10, '♥');
            addPrayer('gloria', 1, 'G');
            addPrayer('mary_mother', 1, 'M');
            addPrayer('fatima_prayer', 1, 'J');
        }
        // 3. Oraciones Finales
        addPrayer('salve_regina', 1, 'S');
        addPrayer('litany', 1, 'L');
        addPrayer('pope_intentions', 1, 'P');
        addPrayer('our_father', 1, '†');
        addPrayer('hail_mary', 1, '♥');
        addPrayer('gloria', 1, 'G');
        addPrayer('final_sign_of_cross', 1, '✠');
        sequence.push({ type: 'end' });

        return sequence;
    };

    // --- MANEJO DEL ESTADO DE LOS BOTONES --- (FUNCIÓN NUEVA)
    const updateButtonStates = () => {
        const langContent = rosaryContent[currentLanguage] || rosaryContent.es;
        
        // Botón "Anterior"
        prevBtn.disabled = (currentStep <= -1);
        prevBtn.textContent = langContent.prev_btn;

        // Botón "Siguiente"
        if (currentStep >= prayerSequence.length - 1) {
            nextBtn.textContent = "Reiniciar";
        } else if (currentStep === prayerSequence.length - 2) {
            nextBtn.textContent = "Finalizar";
        } else {
            nextBtn.textContent = langContent.next_btn;
        }
    };
    
    // --- RENDERIZADO EN PANTALLA ---
    const renderStep = () => {
        prayerArea.scrollTop = 0;

        if (currentStep < 0) { // Pantalla de bienvenida
            mysteryTitleElem.textContent = "Santo Rosario Interactivo";
            prayerTextElem.textContent = "Selecciona el idioma y los misterios para comenzar.";
            beadContainer.innerHTML = '';
            backgroundImageElem.style.backgroundImage = `url('images/default.jpg')`;
            progressBar.style.width = '0%';
            updateButtonStates();
            return;
        }

        const step = prayerSequence[currentStep];
        const content = rosaryContent[currentLanguage];
        let mystery, bgImage = 'default.jpg';
        
        beadContainer.innerHTML = '';
        mysteryTitleElem.textContent = '';

        if (step.type === 'mystery_announcement') {
            mystery = content.mysteries[currentMysteryKey][step.mysteryIndex];
            mysteryTitleElem.textContent = mystery.title;
            prayerTextElem.textContent = mystery.text;
            bgImage = mystery.image;
        } else if (step.type === 'prayer') {
            const mysteryIndex = findCurrentMysteryIndex(currentStep);
            if (mysteryIndex !== null) {
                mystery = content.mysteries[currentMysteryKey][mysteryIndex];
                mysteryTitleElem.textContent = mystery.title;
                bgImage = mystery.image;
            }
            prayerTextElem.textContent = content.prayers[step.prayerKey];
            renderBeads(step.totalBeads, step.currentBead, step.icon);
        } else if (step.type === 'end') {
            mysteryTitleElem.textContent = "Fin del Rosario";
            prayerTextElem.textContent = "Has completado el Santo Rosario.";
            bgImage = 'default.jpg';
        }

        backgroundImageElem.style.backgroundImage = `url('images/${bgImage}')`;
        const progress = (currentStep / (prayerSequence.length - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        
        updateButtonStates(); // Actualiza los botones en cada paso
    };

    const renderBeads = (total, activeIndex, icon) => {
        // ... (Sin cambios en esta función)
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
        // ... (Sin cambios en esta función)
        let mysteryBlockStart = 7;
        for (let i = 0; i < 5; i++) {
            const mysteryBlockEnd = mysteryBlockStart + 15;
            if(stepIndex >= mysteryBlockStart && stepIndex < mysteryBlockEnd) {
                return i;
            }
            mysteryBlockStart = mysteryBlockEnd;
        }
        return null;
    }

    // --- MANEJADORES DE EVENTOS ---
    const handleNext = () => {
        if (currentStep >= prayerSequence.length - 1) {
            currentStep = -1; // Reiniciar
        } else {
            currentStep++;
        }
        renderStep();
    };
    
    // FUNCIÓN NUEVA
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
        switch (day) {
            case 1: case 6: currentMysteryKey = 'joyful'; break;
            case 3: case 0: currentMysteryKey = 'glorious'; break;
            case 2: case 5: currentMysteryKey = 'sorrowful'; break;
            case 4: currentMysteryKey = 'luminous'; break;
        }
        mysterySelect.value = currentMysteryKey;
    };

    setMysteryForToday();
    prevBtn.addEventListener('click', handlePrevious); // AÑADIDO
    nextBtn.addEventListener('click', handleNext);
    languageSelect.addEventListener('change', handleLanguageChange);
    mysterySelect.addEventListener('change', handleMysteryChange);
    
    resetAndStart();
});