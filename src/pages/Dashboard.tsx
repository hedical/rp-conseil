import React from 'react';
import { useData } from '../hooks/useData';
import StatCard from '../components/dashboard/StatCard';
import ActivityChart from '../components/dashboard/ActivityChart';
import BillingTracking from '../components/dashboard/dashboard/BillingTracking';
import { BadgeEuro, Users, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { sales, clients, loading, error } = useData();

    if (loading) return <div className="p-10 text-center text-zinc-500">Chargement des données...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erreur: {error}</div>;

    // Calculate totals
    const totalSalesCount = sales.length;
    const totalClientsCount = clients.length;

    const parseCurrency = (val: any): number => {
        if (val === undefined || val === null || val === 'SO' || val === '') return 0;
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        try {
            const str = String(val).replace(/\s/g, '').replace(/[^0-9,.-]+/g, '').replace(',', '.');
            const parsed = parseFloat(str);
            return isNaN(parsed) ? 0 : parsed;
        } catch {
            return 0;
        }
    };

    const totalCAGeneral = sales.reduce((acc, sale) => {
        const status = (sale.statut || '').toLowerCase();
        if (status.includes('annul')) return acc;
        return acc + parseCurrency(sale.caGeneral) + parseCurrency(sale.fIngenierie);
    }, 0);

    const totalCAPerso = sales.reduce((acc, sale) => {
        const status = (sale.statut || '').toLowerCase();
        if (status.includes('annul')) return acc;
        return acc + parseCurrency(sale.caPerso) + parseCurrency(sale.fIngenierieRPC);
    }, 0);

    const caPersoPercentage = totalCAGeneral > 0
        ? ((totalCAPerso / totalCAGeneral) * 100).toFixed(2) + '%'
        : '0%';

    // Prepare chart data with CA Général and CA Perso breakdown
    const salesByYear = sales.reduce((acc: any, sale) => {
        const year = sale.annee;
        const clientName = sale.client_nom || 'Inconnu';
        const status = (sale.statut || '').toLowerCase();
        if (status.includes('annul')) return acc; // Only show non-cancelled in the chart to match cards

        if (!acc[year]) {
            acc[year] = { caGeneral: 0, caPerso: 0 };
        }
        acc[year].caGeneral += parseCurrency(sale.caGeneral) + parseCurrency(sale.fIngenierie);
        acc[year].caPerso += parseCurrency(sale.caPerso) + parseCurrency(sale.fIngenierieRPC);
        return acc;
    }, {});

    const chartData = Object.keys(salesByYear).map(year => ({
        name: year,
        "CA Général": salesByYear[year].caGeneral,
        "CA Perso": salesByYear[year].caPerso
    })).sort((a, b) => parseInt(a.name) - parseInt(b.name));

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="CA Général Total"
                    value={`${totalCAGeneral.toLocaleString('fr-FR')} €`}
                    icon={BadgeEuro}
                />
                <StatCard
                    title="CA Perso Total"
                    value={`${totalCAPerso.toLocaleString('fr-FR')} €`}
                    subtitle={`${caPersoPercentage} du CA Général`}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Clients Actifs"
                    value={totalClientsCount}
                    icon={Users}
                />
                <StatCard
                    title="Ventes Totales"
                    value={totalSalesCount}
                    icon={AlertCircle}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ActivityChart data={chartData} />
                </div>
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-6 text-zinc-900 border-b border-zinc-100 pb-2">Dernières Ventes</h3>
                    <div className="space-y-4">
                        {[...sales].sort((a, b) => b.id - a.id).slice(0, 5).map(sale => (
                            <div key={sale.id} className="flex items-center justify-between p-3 rounded-md hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all">
                                <div>
                                    <p className="font-medium text-zinc-900">{sale.client_nom}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">{sale.produit}</span>
                                        <span className="text-xs text-zinc-500">{sale.annee}</span>
                                    </div>
                                </div>
                                <span className="font-semibold text-zinc-900">{sale.caGeneral}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <BillingTracking />
        </div>
    );
};

export default Dashboard;
