// reports.js - Módulo de Reportes y Estadísticas
class ReportsModule {
    constructor(sponsors, getSponsorStatus, getTotalContributed) {
        this.sponsors = sponsors;
        this.getSponsorStatus = getSponsorStatus;
        this.getTotalContributed = getTotalContributed;
    }

    // Cálculos básicos
    calculateTotalCollected() {
        return this.sponsors.reduce((total, sponsor) => {
            if (!sponsor.visits || Object.keys(sponsor.visits).length === 0) {
                return total;
            }
            const sortedVisits = Object.values(sponsor.visits).sort((a, b) => b.timestamp - a.timestamp);
            const lastVisit = sortedVisits[0];

            if (lastVisit.status === 'completed') {
                return total + (lastVisit.amount || 0);
            }
            return total;
        }, 0);
    }

    calculateTotalExpected() {
        return this.sponsors.reduce((total, sponsor) => total + (sponsor.importe || 0), 0);
    }

    calculateTotalPending() {
        const collected = this.calculateTotalCollected();
        const expected = this.calculateTotalExpected();
        return Math.max(0, expected - collected);
    }

    // Estadísticas por estado
    getStatusStats() {
        const stats = {
            completed: 0,
            visited: 0,
            pending: 0
        };

        this.sponsors.forEach(sponsor => {
            const status = this.getSponsorStatus(sponsor);
            if (status === 'completed') {
                stats.completed++;
            } else if (status === 'visited_no_contribution') {
                stats.visited++;
            } else {
                stats.pending++;
            }
        });

        return stats;
    }

    // Estadísticas por sector
    getSectorStats() {
        const sectorStats = {};
        
        this.sponsors.forEach(sponsor => {
            const sector = sponsor.sector || 'Sin sector';
            if (!sectorStats[sector]) {
                sectorStats[sector] = {
                    total: 0,
                    completed: 0,
                    visited: 0,
                    collected: 0,
                    expected: 0
                };
            }
            
            sectorStats[sector].total++;
            sectorStats[sector].expected += sponsor.importe || 0;
            
            const status = this.getSponsorStatus(sponsor);
            if (status === 'completed') {
                sectorStats[sector].completed++;
            } else if (status === 'visited_no_contribution') {
                sectorStats[sector].visited++;
            }
            
            sectorStats[sector].collected += this.getTotalContributed(sponsor);
        });
        
        return sectorStats;
    }

    // Estadísticas por etiqueta
    getTagStats() {
        const tagStats = {};
        
        this.sponsors.forEach(sponsor => {
            const tag = sponsor.etiqueta && sponsor.etiqueta.trim() ? sponsor.etiqueta.trim() : 'Sin etiqueta';
            if (!tagStats[tag]) {
                tagStats[tag] = {
                    total: 0,
                    completed: 0,
                    visited: 0,
                    collected: 0,
                    expected: 0
                };
            }
            
            tagStats[tag].total++;
            tagStats[tag].expected += sponsor.importe || 0;
            
            const status = this.getSponsorStatus(sponsor);
            if (status === 'completed') {
                tagStats[tag].completed++;
            } else if (status === 'visited_no_contribution') {
                tagStats[tag].visited++;
            }
            
            tagStats[tag].collected += this.getTotalContributed(sponsor);
        });
        
        return tagStats;
    }

    // Top padrinos por aporte
    getTopContributors(limit = 10) {
        return this.sponsors
            .filter(sponsor => this.getSponsorStatus(sponsor) === 'completed')
            .map(sponsor => ({
                name: `${sponsor.tratamiento || ''} ${sponsor.nombre || 'Sin nombre'}`.trim(),
                numpad: sponsor.numpad || '',
                contribution: this.getTotalContributed(sponsor),
                expected: sponsor.importe || 0,
                sector: sponsor.sector || 'Sin sector'
            }))
            .sort((a, b) => b.contribution - a.contribution)
            .slice(0, limit);
    }

    // Estadísticas de visitas
    getVisitStats() {
        let totalVisits = 0;
        let sponsorsWithMultipleVisits = 0;
        const visitDistribution = {};

        this.sponsors.forEach(sponsor => {
            const visitCount = sponsor.visits ? Object.keys(sponsor.visits).length : 0;
            totalVisits += visitCount;
            
            if (visitCount > 1) {
                sponsorsWithMultipleVisits++;
            }
            
            const range = this.getVisitRange(visitCount);
            visitDistribution[range] = (visitDistribution[range] || 0) + 1;
        });

        return {
            totalVisits,
            averageVisitsPerSponsor: this.sponsors.length > 0 ? (totalVisits / this.sponsors.length).toFixed(1) : 0,
            sponsorsWithMultipleVisits,
            visitDistribution
        };
    }

    getVisitRange(count) {
        if (count === 0) return '0 visitas';
        if (count === 1) return '1 visita';
        if (count <= 3) return '2-3 visitas';
        if (count <= 5) return '4-5 visitas';
        return '6+ visitas';
    }

    // Generar contenido HTML del reporte
    generateReportsContent() {
        const totalExpected = this.calculateTotalExpected();
        const totalCollected = this.calculateTotalCollected();
        const totalPendingAmount = this.calculateTotalPending();
        const statusStats = this.getStatusStats();
        const sectorStats = this.getSectorStats();
        const tagStats = this.getTagStats();
        const topContributors = this.getTopContributors(5);
        const visitStats = this.getVisitStats();
        
        const totalVisitedOrCompleted = statusStats.completed + statusStats.visited;
        const progressPercentage = this.sponsors.length > 0 ? (totalVisitedOrCompleted / this.sponsors.length) * 100 : 0;
        const collectionPercentage = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
        
        let content = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="report-stat">
                    <div class="report-stat-value text-blue-600">${this.sponsors.length}</div>
                    <div class="report-stat-label">Total Padrinos</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value text-green-600">${statusStats.completed}</div>
                    <div class="report-stat-label">Completados</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value text-emerald-600">$${totalCollected.toFixed(2)}</div>
                    <div class="report-stat-label">Recaudado</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value text-red-600">$${totalPendingAmount.toFixed(2)}</div>
                    <div class="report-stat-label">Pendiente</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="report-chart">
                    <h3 class="text-lg font-bold mb-4">Progreso de Visitas</h3>
                    <div class="contribution-summary">
                        <div class="contribution-amount">${totalVisitedOrCompleted} de ${this.sponsors.length} padrinos visitados</div>
                        <div class="contribution-progress">
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${Math.min(progressPercentage, 100)}%"></div>
                            </div>
                            <div class="contribution-percentage">${progressPercentage.toFixed(1)}% visitados</div>
                        </div>
                    </div>
                </div>
                
                <div class="report-chart">
                    <h3 class="text-lg font-bold mb-4">Progreso de Recaudación</h3>
                    <div class="contribution-summary">
                        <div class="contribution-amount">$${totalCollected.toFixed(2)} de $${totalExpected.toFixed(2)}</div>
                        <div class="contribution-progress">
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${Math.min(collectionPercentage, 100)}%"></div>
                            </div>
                            <div class="contribution-percentage">${collectionPercentage.toFixed(1)}% recaudado</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Estadísticas de visitas
        content += `
            <div class="report-chart mb-6">
                <h3 class="text-lg font-bold mb-4">Estadísticas de Visitas</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">${visitStats.totalVisits}</div>
                        <div class="text-sm text-gray-600">Total Visitas</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">${visitStats.averageVisitsPerSponsor}</div>
                        <div class="text-sm text-gray-600">Promedio por Padrino</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">${visitStats.sponsorsWithMultipleVisits}</div>
                        <div class="text-sm text-gray-600">Con Múltiples Visitas</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-orange-600">${statusStats.visited}</div>
                        <div class="text-sm text-gray-600">Visitados Sin Aporte</div>
                    </div>
                </div>
            </div>
        `;

        // Top contribuyentes
        if (topContributors.length > 0) {
            content += `
                <div class="report-chart mb-6">
                    <h3 class="text-lg font-bold mb-4">Top Contribuyentes</h3>
                    <div class="space-y-3">
            `;
            
            topContributors.forEach((contributor, index) => {
                const percentage = totalCollected > 0 ? (contributor.contribution / totalCollected) * 100 : 0;
                content += `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span class="text-sm font-bold text-blue-600">${index + 1}</span>
                            </div>
                            <div>
                                <div class="font-semibold">${contributor.name}</div>
                                <div class="text-sm text-gray-600">${contributor.numpad ? `#${contributor.numpad} - ` : ''}${contributor.sector}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-green-600">$${contributor.contribution.toFixed(2)}</div>
                            <div class="text-sm text-gray-600">${percentage.toFixed(1)}%</div>
                        </div>
                    </div>
                `;
            });
            
            content += '</div></div>';
        }

        // Estadísticas por sector
        content += `
            <div class="report-chart mb-6">
                <h3 class="text-lg font-bold mb-4">Estadísticas por Sector</h3>
                <div class="space-y-4">
        `;
        
        Object.entries(sectorStats)
            .sort(([,a], [,b]) => b.collected - a.collected)
            .forEach(([sector, stats]) => {
                const sectorVisitedCount = stats.completed + stats.visited;
                const sectorProgress = stats.total > 0 ? (sectorVisitedCount / stats.total) * 100 : 0;
                const sectorCollectionProgress = stats.expected > 0 ? (stats.collected / stats.expected) * 100 : 0;
                
                content += `
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-semibold">${sector}</h4>
                            <span class="text-sm text-gray-600">${stats.total} padrinos</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>Visitados: ${sectorVisitedCount}/${stats.total} (${sectorProgress.toFixed(1)}%)</div>
                            <div>Recaudado: $${stats.collected.toFixed(2)} de $${stats.expected.toFixed(2)} (${sectorCollectionProgress.toFixed(1)}%)</div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <div class="text-xs text-gray-500 mb-1">Progreso de visitas</div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${Math.min(sectorProgress, 100)}%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="text-xs text-gray-500 mb-1">Progreso de recaudación</div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill bg-emerald-500" style="width: ${Math.min(sectorCollectionProgress, 100)}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        
        content += '</div></div>';

        // Estadísticas por etiqueta (solo si hay etiquetas)
        const tagsWithData = Object.entries(tagStats).filter(([tag]) => tag !== 'Sin etiqueta');
        if (tagsWithData.length > 0) {
            content += `
                <div class="report-chart">
                    <h3 class="text-lg font-bold mb-4">Estadísticas por Etiqueta</h3>
                    <div class="space-y-3">
            `;
            
            tagsWithData
                .sort(([,a], [,b]) => b.collected - a.collected)
                .forEach(([tag, stats]) => {
                    const tagVisitedCount = stats.completed + stats.visited;
                    const tagProgress = stats.total > 0 ? (tagVisitedCount / stats.total) * 100 : 0;
                    
                    content += `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center">
                                <span class="tag mr-3">${tag}</span>
                                <div class="text-sm text-gray-600">${stats.total} padrinos</div>
                            </div>
                            <div class="text-right">
                                <div class="font-semibold text-green-600">$${stats.collected.toFixed(2)}</div>
                                <div class="text-sm text-gray-600">${tagVisitedCount}/${stats.total} visitados (${tagProgress.toFixed(1)}%)</div>
                            </div>
                        </div>
                    `;
                });
            
            content += '</div></div>';
        }
        
        return content;
    }

    // Exportar datos para CSV
    exportData() {
        const exportData = this.sponsors.map(sponsor => {
            const status = this.getSponsorStatus(sponsor);
            const statusInfo = {
                completed: 'Completado',
                visited_no_contribution: 'Visitado',
                pending: 'Pendiente'
            };
            
            return {
                'No. Padrino': sponsor.numpad || '',
                'Nombre': `${sponsor.tratamiento || ''} ${sponsor.nombre || ''}`.trim(),
                'Dirección': sponsor.direccion || '',
                'Teléfono': sponsor.telefono || '',
                'Sector': sponsor.sector || '',
                'Etiqueta': sponsor.etiqueta || '',
                'Importe Esperado': sponsor.importe || 0,
                'Estado': statusInfo[status] || 'Pendiente',
                'Total Contribuido': this.getTotalContributed(sponsor),
                'Visitas': sponsor.visits ? Object.keys(sponsor.visits).length : 0,
                'Notas': sponsor.notas || ''
            };
        });
        
        return exportData;
    }
}

// Función para crear CSV
function generateCSV(data) {
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            // Escapar comillas y envolver en comillas si contiene coma o comilla
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','))
    ].join('\n');
    
    return csvContent;
}

// Función para descargar CSV
function downloadCSV(data, filename = 'reporte_padrinos.csv') {
    const csv = generateCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Exportar la clase para uso en otros archivos
window.ReportsModule = ReportsModule;
window.generateCSV = generateCSV;
window.downloadCSV = downloadCSV;