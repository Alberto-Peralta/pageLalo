// Este archivo contiene toda la lógica para generar el contenido del modal de reportes.

// --- Funciones de cálculo y estado (necesarias para los reportes) ---
const getSponsorStatusForReport = (sponsor) => {
    if (!sponsor.visits || Object.keys(sponsor.visits).length === 0) return 'pending';
    const sortedVisits = Object.values(sponsor.visits).sort((a, b) => b.timestamp - a.timestamp);
    const lastVisit = sortedVisits[0];
    if (lastVisit.status === 'completed') return 'completed';
    if (lastVisit.status === 'visited_no_contribution') return 'visited_no_contribution';
    return 'pending';
};

const getTotalContributedForReport = (sponsor) => {
    if (getSponsorStatusForReport(sponsor) !== 'completed') return 0;
    if (!sponsor.visits) return 0;
    return Object.values(sponsor.visits)
        .filter(v => v.status === 'completed')
        .reduce((sum, visit) => sum + (visit.amount || 0), 0);
};

// --- Función principal que se llamará desde script.js ---
function generateReportsContent(sponsors) {
    const reportsContent = document.getElementById('reportsContent');
    if (!sponsors) {
        reportsContent.innerHTML = `<p>Error: No se pudieron cargar los datos de los padrinos.</p>`;
        return;
    }

    const totalExpected = sponsors.reduce((total, sponsor) => total + (sponsor.importe || 0), 0);
    const totalCollected = sponsors.reduce((total, sponsor) => {
        if (!sponsor.visits) return total;
        const sortedVisits = Object.values(sponsor.visits).sort((a, b) => b.timestamp - a.timestamp);
        const lastVisit = sortedVisits[0];
        return (lastVisit && lastVisit.status === 'completed') ? total + (lastVisit.amount || 0) : total;
    }, 0);

    const totalPendingAmount = Math.max(0, totalExpected - totalCollected);
    const completedCount = sponsors.filter(s => getSponsorStatusForReport(s) === 'completed').length;
    const visitedCount = sponsors.filter(s => getSponsorStatusForReport(s) === 'visited_no_contribution').length;
    const totalVisitedOrCompleted = completedCount + visitedCount;
    const progressPercentage = sponsors.length > 0 ? (totalVisitedOrCompleted / sponsors.length) * 100 : 0;

    const sectorStats = {};
    sponsors.forEach(sponsor => {
        const sector = sponsor.sector || 'Sin sector';
        if (!sectorStats[sector]) {
            sectorStats[sector] = { total: 0, completed: 0, visited: 0, collected: 0, expected: 0 };
        }
        sectorStats[sector].total++;
        sectorStats[sector].expected += sponsor.importe || 0;
        const status = getSponsorStatusForReport(sponsor);
        if (status === 'completed') sectorStats[sector].completed++;
        else if (status === 'visited_no_contribution') sectorStats[sector].visited++;
        sectorStats[sector].collected += getTotalContributedForReport(sponsor);
    });

    // El resto de la función es idéntica a la que tenías
    let content = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="report-stat"><div class="report-stat-value text-blue-600">${sponsors.length}</div><div class="report-stat-label">Total Padrinos</div></div>
            <div class="report-stat"><div class="report-stat-value text-green-600">${completedCount}</div><div class="report-stat-label">Completados</div></div>
            <div class="report-stat"><div class="report-stat-value text-emerald-600">$${totalCollected.toFixed(2)}</div><div class="report-stat-label">Recaudado</div></div>
            <div class="report-stat"><div class="report-stat-value text-red-600">$${totalPendingAmount.toFixed(2)}</div><div class="report-stat-label">Pendiente</div></div>
        </div>
        <div class="report-chart mb-8">
            <h3 class="text-lg font-bold mb-4">Progreso de Visitas</h3>
            <div class="contribution-summary">
                <div class="contribution-amount">${totalVisitedOrCompleted} de ${sponsors.length} padrinos visitados</div>
                <div class="contribution-progress">
                    <div class="progress-bar"><div class="progress-bar-fill" style="width: ${Math.min(progressPercentage, 100)}%"></div></div>
                    <div class="contribution-percentage">${progressPercentage.toFixed(1)}% visitados</div>
                </div>
            </div>
        </div>
        <div class="report-chart">
            <h3 class="text-lg font-bold mb-4">Estadísticas por Sector</h3>
            <div class="space-y-4">
    `;
    Object.entries(sectorStats).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([sector, stats]) => {
        const sectorVisitedCount = stats.completed + stats.visited;
        const sectorProgress = stats.total > 0 ? (sectorVisitedCount / stats.total) * 100 : 0;
        content += `<div class="border border-gray-200 rounded-lg p-4"><div class="flex justify-between items-center mb-2"><h4 class="font-semibold">${sector}</h4><span class="text-sm text-gray-600">${sectorVisitedCount}/${stats.total} visitados</span></div><div class="text-sm text-gray-600 mb-2">Recaudado: $${stats.collected.toFixed(2)} de $${stats.expected.toFixed(2)}</div><div class="progress-bar"><div class="progress-bar-fill" style="width: ${Math.min(sectorProgress, 100)}%"></div></div><div class="text-xs text-gray-500 mt-1">${sectorProgress.toFixed(1)}% visitados</div></div>`;
    });
    content += '</div></div>';
    reportsContent.innerHTML = content;
}