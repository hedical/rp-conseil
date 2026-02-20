import React from 'react';
import { useData } from '../context/DataContext';
import StatCard from '../components/dashboard/StatCard';
import ActivityChart from '../components/dashboard/ActivityChart';
import { BadgeEuro, Users, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { sales, clients, loading, error } = useData();

    if (loading) return <div className="p-10 text-center text-zinc-500">Chargement des données...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erreur: {error}</div>;

    // Calculate totals
    const totalSalesCount = sales.length;
    const totalClientsCount = clients.length;

    const parseCurrency = (str: string) => {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9,-]+/g, "").replace(',', '.'));
    };

    const totalCAGeneral = sales.reduce((acc, sale) => acc + parseCurrency(sale.caGeneral), 0);
    const totalCAPerso = sales.reduce((acc, sale) => acc + parseCurrency(sale.caPerso), 0);

    // Prepare chart data with CA Général and CA Perso breakdown
    const salesByYear = sales.reduce((acc: any, sale) => {
        const year = sale.annee;
        if (!acc[year]) {
            acc[year] = { caGeneral: 0, caPerso: 0 };
        }
        acc[year].caGeneral += parseCurrency(sale.caGeneral);
        acc[year].caPerso += parseCurrency(sale.caPerso);
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
                    trend="+12%"
                    trendUp={true}
                />
                <StatCard
                    title="CA Perso Total"
                    value={`${totalCAPerso.toLocaleString('fr-FR')} €`}
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
                                    <p className="font-medium text-zinc-900">{sale.nom}</p>
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
        </div>
    );
};

export default Dashboard;
