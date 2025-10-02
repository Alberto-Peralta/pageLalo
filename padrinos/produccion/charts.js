// charts.js - Sistema de gráficos de progreso con metas configurables

// Función para obtener/guardar metas desde Firebase
async function getGoalsSettings(userId) {
    try {
        const { ref, get } = window.firebaseServices;
        const { database } = window.firebaseServices;
        const goalsRef = ref(database, `users/${userId}/settings/goals`);
        const snapshot = await get(goalsRef);
        
        if (snapshot.exists()) {
            return snapshot.val();
        }
        
        // Valores predeterminados
        return {
            visitedGoal: 100,
            moneyGoal: 100
        };
    } catch (error) {
        console.error('Error loading goals:', error);
        return { visitedGoal: 100, moneyGoal: 100 };
    }
}

async function saveGoalsSettings(userId, settings) {
    try {
        const { ref, set } = window.firebaseServices;
        const { database } = window.firebaseServices;
        const goalsRef = ref(database, `users/${userId}/settings/goals`);
        await set(goalsRef, settings);
        return true;
    } catch (error) {
        console.error('Error saving goals:', error);
        return false;
    }
}

// Función para crear gráfico circular de progreso
function createProgressChart(containerId, currentPercentage, goalPercentage, label, color, actual, total) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const size = 140;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    
    // Calcular offset basado en el progreso hacia la meta
    const progressToGoal = goalPercentage > 0 ? Math.min((currentPercentage / goalPercentage) * 100, 100) : 0;
    const offset = circumference - (progressToGoal / 100) * circumference;

    const statusColor = progressToGoal >= 100 ? '#10b981' : 
                       progressToGoal >= 75 ? '#3b82f6' : 
                       progressToGoal >= 50 ? '#f59e0b' : '#ef4444';

    container.innerHTML = `
        <div class="progress-chart-container">
            <svg width="${size}" height="${size}" class="progress-chart">
                <circle
                    class="progress-chart-bg"
                    stroke="#e5e7eb"
                    stroke-width="${strokeWidth}"
                    fill="transparent"
                    r="${radius}"
                    cx="${size / 2}"
                    cy="${size / 2}"
                />
                <circle
                    class="progress-chart-fill"
                    stroke="${statusColor}"
                    stroke-width="${strokeWidth}"
                    fill="transparent"
                    r="${radius}"
                    cx="${size / 2}"
                    cy="${size / 2}"
                    style="
                        stroke-dasharray: ${circumference} ${circumference};
                        stroke-dashoffset: ${offset};
                        transform: rotate(-90deg);
                        transform-origin: 50% 50%;
                        transition: stroke-dashoffset 1s ease, stroke 0.5s ease;
                    "
                />
            </svg>
            <div class="progress-chart-label">
                <div class="progress-chart-percentage" style="color: ${statusColor};">
                    ${progressToGoal.toFixed(0)}%
                </div>
                <div class="progress-chart-text">${label}</div>
                <div class="progress-chart-subtext">
                    ${actual} / ${total}
                </div>
                <div class="progress-chart-goal">
                    Meta: ${goalPercentage}%
                </div>
            </div>
        </div>
    `;
}

// Función para crear gráfico de barras horizontal con meta
function createBarChart(containerId, current, target, goalPercentage, label, color) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentPercentage = target > 0 ? (current / target) * 100 : 0;
    const goalAmount = (target * goalPercentage) / 100;
    const progressToGoal = goalPercentage > 0 ? Math.min((current / goalAmount) * 100, 100) : 0;

    const statusColor = progressToGoal >= 100 ? '#10b981' : 
                       progressToGoal >= 75 ? '#3b82f6' : 
                       progressToGoal >= 50 ? '#f59e0b' : '#ef4444';

    container.innerHTML = `
        <div class="bar-chart-container">
            <div class="bar-chart-header">
                <span class="bar-chart-label">${label}</span>
                <span class="bar-chart-values">${current} / ${goalAmount.toFixed(label.includes('$') ? 2 : 0)} (Meta: ${goalPercentage}%)</span>
            </div>
            <div class="bar-chart-track">
                <div class="bar-chart-goal-marker" style="left: ${goalPercentage}%;" title="Meta: ${goalPercentage}%">
                    <div class="goal-marker-line"></div>
                </div>
                <div class="bar-chart-fill" style="width: ${Math.min(currentPercentage, 100)}%; background-color: ${statusColor};"></div>
            </div>
            <div class="bar-chart-footer">
                <span class="bar-chart-percentage" style="color: ${statusColor};">
                    ${progressToGoal.toFixed(1)}% de la meta alcanzado
                </span>
            </div>
        </div>
    `;
}

// Función para calcular y mostrar gráficos de metas
async function updateGoalsCharts(sponsors, userId) {
    if (!sponsors || sponsors.length === 0) return;

    const goalsSettings = await getGoalsSettings(userId);

    // Calcular padrinos visitados
    const totalSponsors = sponsors.length;
    const visitedCount = sponsors.filter(s => {
        const status = getSponsorStatusForChart(s);
        return status === 'completed' || status === 'visited_no_contribution';
    }).length;
    const visitedPercentage = (visitedCount / totalSponsors) * 100;

    // Calcular dinero recaudado
    const totalExpected = sponsors.reduce((sum, s) => sum + (s.importe || 0), 0);
    const totalCollected = sponsors.reduce((sum, sponsor) => {
        if (!sponsor.visits) return sum;
        const sortedVisits = Object.values(sponsor.visits).sort((a, b) => b.timestamp - a.timestamp);
        const lastVisit = sortedVisits[0];
        return (lastVisit && lastVisit.status === 'completed') ? sum + (lastVisit.amount || 0) : sum;
    }, 0);
    const moneyPercentage = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    // Crear gráficos circulares con metas personalizadas
    createProgressChart(
        'visitedProgressChart', 
        visitedPercentage, 
        goalsSettings.visitedGoal,
        'Padrinos Visitados', 
        '#10b981',
        visitedCount,
        `${Math.round((totalSponsors * goalsSettings.visitedGoal) / 100)}`
    );
    
    createProgressChart(
        'moneyProgressChart', 
        moneyPercentage, 
        goalsSettings.moneyGoal,
        'Recaudación', 
        '#3b82f6',
        `$${totalCollected.toFixed(2)}`,
        `$${((totalExpected * goalsSettings.moneyGoal) / 100).toFixed(2)}`
    );

    // Crear gráficos de barras con metas
    createBarChart(
        'visitedBarChart', 
        visitedCount, 
        totalSponsors, 
        goalsSettings.visitedGoal,
        'Padrinos Visitados', 
        '#10b981'
    );
    
    createBarChart(
        'moneyBarChart', 
        totalCollected, 
        totalExpected, 
        goalsSettings.moneyGoal,
        'Dinero Recaudado ($)', 
        '#3b82f6'
    );

    // Actualizar valores en el formulario de configuración
    const visitedGoalInput = document.getElementById('visitedGoalInput');
    const moneyGoalInput = document.getElementById('moneyGoalInput');
    if (visitedGoalInput) visitedGoalInput.value = goalsSettings.visitedGoal;
    if (moneyGoalInput) moneyGoalInput.value = goalsSettings.moneyGoal;
}

// Función auxiliar para obtener estado del padrino
function getSponsorStatusForChart(sponsor) {
    if (!sponsor.visits || Object.keys(sponsor.visits).length === 0) return 'pending';
    const sortedVisits = Object.values(sponsor.visits).sort((a, b) => b.timestamp - a.timestamp);
    const lastVisit = sortedVisits[0];
    if (lastVisit.status === 'completed') return 'completed';
    if (lastVisit.status === 'visited_no_contribution') return 'visited_no_contribution';
    return 'pending';
}

// Función para mostrar modal de gráficos
function showGoalsChartsModal(sponsors, userId) {
    const modal = document.getElementById('goalsChartsModal');
    if (!modal) {
        createGoalsChartsModal(userId);
    }
    
    updateGoalsCharts(sponsors, userId);
    document.getElementById('goalsChartsModal').classList.remove('hidden');
}

// Función para crear el modal de gráficos
function createGoalsChartsModal(userId) {
    const modalHTML = `
        <div id="goalsChartsModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-2xl p-6 w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6 pb-4 border-b">
                    <h2 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-chart-pie mr-2 text-blue-600"></i>
                        Progreso de Metas
                    </h2>
                    <div class="flex items-center space-x-3">
                        <button id="configureGoalsBtn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                            <i class="fas fa-cog mr-1"></i> Configurar Metas
                        </button>
                        <button id="closeGoalsChartsBtn" class="text-gray-500 hover:text-gray-700 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="space-y-8">
                    <!-- Gráficos Circulares -->
                    <div class="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6">
                        <h3 class="text-lg font-semibold mb-6 text-gray-800">Resumen de Metas</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="flex flex-col items-center">
                                <div id="visitedProgressChart"></div>
                            </div>
                            <div class="flex flex-col items-center">
                                <div id="moneyProgressChart"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Gráficos de Barras -->
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-gray-800">Progreso Detallado</h3>
                        <div class="bg-white border border-gray-200 rounded-xl p-6">
                            <div id="visitedBarChart"></div>
                        </div>
                        <div class="bg-white border border-gray-200 rounded-xl p-6">
                            <div id="moneyBarChart"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event listeners
    document.getElementById('closeGoalsChartsBtn').addEventListener('click', () => {
        document.getElementById('goalsChartsModal').classList.add('hidden');
    });

    document.getElementById('configureGoalsBtn').addEventListener('click', () => {
        showGoalsConfigModal(userId);
    });
}

// Modal de configuración de metas
function showGoalsConfigModal(userId) {
    let modal = document.getElementById('goalsConfigModal');
    
    if (!modal) {
        const modalHTML = `
            <div id="goalsConfigModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                    <div class="flex justify-between items-center mb-6 pb-4 border-b">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-bullseye mr-2 text-blue-600"></i>
                            Configurar Metas
                        </h2>
                        <button id="closeGoalsConfigBtn" class="text-gray-500 hover:text-gray-700 text-xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="goalsConfigForm" class="space-y-6">
                        <div>
                            <label for="visitedGoalInput" class="block text-sm font-medium text-gray-700 mb-2">
                                Meta de Padrinos Visitados (%)
                            </label>
                            <div class="relative">
                                <input type="number" id="visitedGoalInput" min="1" max="100" value="100"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <span class="absolute right-3 top-3 text-gray-500">%</span>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Ejemplo: 95% = visitar 95 de cada 100 padrinos</p>
                        </div>

                        <div>
                            <label for="moneyGoalInput" class="block text-sm font-medium text-gray-700 mb-2">
                                Meta de Recaudación (%)
                            </label>
                            <div class="relative">
                                <input type="number" id="moneyGoalInput" min="1" max="100" value="100"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <span class="absolute right-3 top-3 text-gray-500">%</span>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Ejemplo: 80% = recaudar el 80% del total esperado</p>
                        </div>

                        <div class="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" id="cancelGoalsConfigBtn" class="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium">
                                Cancelar
                            </button>
                            <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                                Guardar Metas
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('goalsConfigModal');
        
        // Event listeners para cerrar
        document.getElementById('closeGoalsConfigBtn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('cancelGoalsConfigBtn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // Event listener para guardar
        document.getElementById('goalsConfigForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const visitedGoal = parseInt(document.getElementById('visitedGoalInput').value);
            const moneyGoal = parseInt(document.getElementById('moneyGoalInput').value);
            
            if (visitedGoal < 1 || visitedGoal > 100 || moneyGoal < 1 || moneyGoal > 100) {
                window.showToast('Las metas deben estar entre 1% y 100%', 'warning');
                return;
            }
            
            const success = await saveGoalsSettings(userId, { visitedGoal, moneyGoal });
            
            if (success) {
                window.showToast('Metas actualizadas correctamente', 'success');
                modal.classList.add('hidden');
                
                // Recargar gráficos con las nuevas metas
                const sponsors = window.currentSponsorsData || [];
                updateGoalsCharts(sponsors, userId);
            } else {
                window.showToast('Error al guardar las metas', 'error');
            }
        });
    }
    
    // Cargar valores actuales
    getGoalsSettings(userId).then(settings => {
        document.getElementById('visitedGoalInput').value = settings.visitedGoal;
        document.getElementById('moneyGoalInput').value = settings.moneyGoal;
    });
    
    modal.classList.remove('hidden');
}

// Exportar funciones globalmente
window.chartsModule = {
    showGoalsChartsModal,
    updateGoalsCharts,
    createProgressChart,
    createBarChart,
    getGoalsSettings,
    saveGoalsSettings
};