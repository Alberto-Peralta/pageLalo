// birthdays.js - Sistema de gestión de cumpleaños de padrinos

// Función para verificar si es el mes de cumpleaños
function isBirthdayMonth(sponsor) {
    if (!sponsor) return false;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    
    // Verificar fecha completa de nacimiento
    if (sponsor.fechaNacimiento) {
        try {
            const birth = new Date(sponsor.fechaNacimiento);
            if (birth.getMonth() === currentMonth) return true;
        } catch (error) {
            // Ignorar error y continuar
        }
    }
    
    // Verificar solo cumpleaños (DD/MM)
    if (sponsor.cumpleanos) {
        try {
            const parts = sponsor.cumpleanos.split('/');
            if (parts.length === 2) {
                const month = parseInt(parts[1]) - 1; // Meses en JS son 0-11
                if (month === currentMonth) return true;
            }
        } catch (error) {
            // Ignorar error
        }
    }
    
    return false;
}

// Función para calcular edad
function calculateAge(sponsor) {
    if (!sponsor || !sponsor.fechaNacimiento) return null;
    
    try {
        const birth = new Date(sponsor.fechaNacimiento);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    } catch (error) {
        return null;
    }
}

// Función para formatear fecha de nacimiento
function formatBirthDate(birthDate) {
    if (!birthDate) return '';
    
    try {
        const date = new Date(birthDate);
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    } catch (error) {
        return '';
    }
}

// Función para obtener día y mes formateados
function getBirthdayDayMonth(sponsor) {
    if (!sponsor) return '';
    
    // Intentar con fecha completa primero
    if (sponsor.fechaNacimiento) {
        try {
            const date = new Date(sponsor.fechaNacimiento);
            const options = { day: '2-digit', month: 'long' };
            return date.toLocaleDateString('es-ES', options);
        } catch (error) {
            // Continuar con cumpleaños simple
        }
    }
    
    // Intentar con solo cumpleaños
    if (sponsor.cumpleanos) {
        try {
            const parts = sponsor.cumpleanos.split('/');
            if (parts.length === 2) {
                const day = parts[0];
                const monthNum = parseInt(parts[1]) - 1;
                const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                return `${day} de ${months[monthNum]}`;
            }
        } catch (error) {
            // Ignorar error
        }
    }
    
    return '';
}

// Función para crear badge de cumpleaños
function createBirthdayBadge(birthDate) {
    if (!isBirthdayMonth(birthDate)) return '';
    
    const dayMonth = getBirthdayDayMonth(birthDate);
    const age = calculateAge(birthDate);
    const ageText = age ? ` (${age} años)` : '';
    
    return `
        <div class="birthday-badge">
            <i class="fas fa-birthday-cake mr-1"></i>
            Cumple: ${dayMonth}${ageText}
        </div>
    `;
}

// Función para enviar mensaje de cumpleaños por WhatsApp
function sendBirthdayWhatsApp(phone, name, sponsor) {
    if (!phone) {
        window.showToast('Este padrino no tiene teléfono registrado', 'warning');
        return;
    }
    
    const age = calculateAge(sponsor);
    const ageText = age ? ` en tus ${age} años` : '';
    
    const formatted = formatPhoneNumberForWhatsApp(phone);
    const message = encodeURIComponent(
        `¡Feliz cumpleaños ${name}! 🎉🎂\n\n` +
        `Te deseamos un día maravilloso${ageText}. ` +
        `Que Dios te bendiga y te llene de salud y alegría.\n\n` +
        `Con cariño, tus Misioneros.`
    );
    
    window.open(`https://wa.me/${formatted}?text=${message}`, '_blank');
}

// Función auxiliar para formatear teléfono
function formatPhoneNumberForWhatsApp(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `52${cleaned}`;
    }
    return cleaned;
}

// Función para agregar los campos de fecha de nacimiento y cumpleaños al formulario
function enhanceSponsorForm() {
    const importeDiv = document.getElementById('importe').closest('div');
    
    if (!document.getElementById('fechaNacimiento')) {
        const birthdayFields = document.createElement('div');
        birthdayFields.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
        birthdayFields.innerHTML = `
            <div>
                <label for="fechaNacimiento" class="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento (Opcional)
                </label>
                <input 
                    type="date" 
                    id="fechaNacimiento" 
                    name="fechaNacimiento" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
            </div>
            <div>
                <label for="cumpleanos" class="block text-sm font-medium text-gray-700 mb-1">
                    Solo Cumpleaños (Opcional)
                </label>
                <input 
                    type="text" 
                    id="cumpleanos" 
                    name="cumpleanos" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="DD/MM (ej: 15/03)"
                >
                <p class="text-xs text-gray-500 mt-1">Formato: día/mes</p>
            </div>
        `;
        
        // Insertar después del div que contiene el importe
        const parentGrid = importeDiv.parentElement;
        const nextElement = parentGrid.nextElementSibling;
        if (nextElement) {
            parentGrid.parentNode.insertBefore(birthdayFields, nextElement);
        } else {
            parentGrid.parentNode.appendChild(birthdayFields);
        }
    }
}

// Función para agregar información de cumpleaños a la tarjeta del padrino
function addBirthdayInfoToCard(sponsor, cardElement) {
    if (!sponsor.fechaNacimiento && !sponsor.cumpleanos) return cardElement;
    
    if (isBirthdayMonth(sponsor)) {
        const birthdaySection = document.createElement('div');
        birthdaySection.className = 'birthday-alert';
        
        const age = calculateAge(sponsor);
        const ageText = age ? ` (${age} años)` : '';
        
        birthdaySection.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-birthday-cake text-pink-600 mr-2 text-xl"></i>
                    <div>
                        <p class="font-semibold text-pink-800">¡Cumpleaños este mes!</p>
                        <p class="text-sm text-pink-700">${getBirthdayDayMonth(sponsor)}${ageText}</p>
                    </div>
                </div>
                ${sponsor.telefono ? `
                    <button 
                        class="birthday-whatsapp-btn"
                        onclick="window.birthdayModule.sendBirthdayWhatsApp('${sponsor.telefono}', '${sponsor.nombre}', ${JSON.stringify(sponsor).replace(/"/g, '&quot;')})"
                        title="Enviar felicitación por WhatsApp"
                    >
                        <i class="fab fa-whatsapp mr-1"></i>
                        Felicitar
                    </button>
                ` : ''}
            </div>
        `;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(cardElement, 'text/html');
        const cardDiv = doc.querySelector('.sponsor-card');
        
        // Insertar antes de los botones de acción
        const actionsDiv = cardDiv.querySelector('.flex.justify-between.items-center.border-t');
        if (actionsDiv) {
            actionsDiv.parentNode.insertBefore(birthdaySection, actionsDiv);
        }
        
        return doc.body.innerHTML;
    }
    
    return cardElement;
}

// Función para agregar filtro de cumpleaños
function addBirthdayFilter() {
    // El filtro ya está en el HTML, solo agregamos el event listener
    const birthdayFilter = document.getElementById('birthdayFilter');
    if (birthdayFilter && !birthdayFilter.dataset.listenerAdded) {
        birthdayFilter.addEventListener('change', () => {
            if (typeof window.handleFilterChange === 'function') {
                window.handleFilterChange();
            }
        });
        birthdayFilter.dataset.listenerAdded = 'true';
    }
}

// Función para filtrar por cumpleaños
function filterByBirthday(sponsors, filterValue) {
    if (filterValue === 'all') return sponsors;
    
    if (filterValue === 'this_month') {
        return sponsors.filter(sponsor => isBirthdayMonth(sponsor.fechaNacimiento));
    }
    
    return sponsors;
}

// Función para mostrar contador de cumpleaños en el header
function updateBirthdayCounter(sponsors) {
    const birthdaysThisMonth = sponsors.filter(s => isBirthdayMonth(s)).length;
    
    if (birthdaysThisMonth > 0) {
        const header = document.querySelector('header .flex.items-center.space-x-4');
        
        let birthdayCounter = document.getElementById('birthdayCounter');
        if (!birthdayCounter) {
            birthdayCounter = document.createElement('div');
            birthdayCounter.id = 'birthdayCounter';
            birthdayCounter.className = 'birthday-counter';
            header.insertBefore(birthdayCounter, header.firstChild);
        }
        
        birthdayCounter.innerHTML = `
            <i class="fas fa-birthday-cake"></i>
            <span>${birthdaysThisMonth}</span>
        `;
        birthdayCounter.title = `${birthdaysThisMonth} cumpleaños este mes`;
    } else {
        const birthdayCounter = document.getElementById('birthdayCounter');
        if (birthdayCounter) {
            birthdayCounter.remove();
        }
    }
}

// Función de inicialización
function initBirthdayModule() {
    // Agregar estilos CSS si no existen
    if (!document.getElementById('birthday-styles')) {
        const styles = document.createElement('style');
        styles.id = 'birthday-styles';
        styles.textContent = `
            .birthday-badge {
                display: inline-flex;
                align-items: center;
                background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
                color: #be185d;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                margin-top: 4px;
            }
            
            .birthday-alert {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 2px solid #fbbf24;
                border-radius: 12px;
                padding: 12px;
                margin: 12px 0;
                animation: birthdayPulse 2s ease-in-out infinite;
            }
            
            @keyframes birthdayPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
                50% { box-shadow: 0 0 0 8px rgba(251, 191, 36, 0); }
            }
            
            .birthday-whatsapp-btn {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
            }
            
            .birthday-whatsapp-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            }
            
            .birthday-counter {
                background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
                color: #be185d;
                padding: 8px 16px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .birthday-counter:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
            }
            
            .birthday-counter i {
                font-size: 18px;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Mejorar el formulario
    enhanceSponsorForm();
    
    // Agregar filtro
    addBirthdayFilter();
}

// Exportar funciones globalmente
window.birthdayModule = {
    isBirthdayMonth,
    calculateAge,
    formatBirthDate,
    getBirthdayDayMonth,
    createBirthdayBadge,
    sendBirthdayWhatsApp,
    addBirthdayInfoToCard,
    filterByBirthday,
    updateBirthdayCounter,
    initBirthdayModule,
    enhanceSponsorForm
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBirthdayModule);
} else {
    initBirthdayModule();
}