import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Users, FileText, Award, Filter, Clock, Calendar } from 'lucide-react';

const Analysis: React.FC = () => {
    const { sales, clients, loading, error } = useData();
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const navigate = useNavigate();


    // Get unique years for filter
    const uniqueYears = Array.from(new Set(sales.map(sale => sale.annee))).sort((a, b) => b - a);

    // Filter sales by selected year
    const filteredSales = selectedYear === 'all' ? sales : sales.filter(sale => sale.annee === parseInt(selectedYear));

    const parseCurrency = (str: string) => {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9,-]+/g, "").replace(',', '.'));
    };

    // Helper: Parse date "DD/MM/YYYY" or "YYYY"
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        if (dateStr.match(/^\d{4}$/)) return new Date(parseInt(dateStr), 0, 1); // Only year
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    };

    // Helper: Calculate days between two dates
    const daysBetween = (d1: Date, d2: Date): number => {
        const diff = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // 1. Répartition Fiche vs Parrainage
    const sourceData = filteredSales.reduce((acc: any, sale) => {
        const source = sale.type === 'F' ? 'Fiche (Partenaire)' : 'Parrainage (Client)';
        if (!acc[source]) acc[source] = { count: 0, ca: 0 };
        acc[source].count++;
        acc[source].ca += parseCurrency(sale.caPerso);
        return acc;
    }, {});

    const sourceChartData = Object.keys(sourceData).map(key => ({
        name: key,
        value: sourceData[key].count,
        ca: sourceData[key].ca
    }));

    // 2. Répartition par Produit
    const productData = filteredSales.reduce((acc: any, sale) => {
        const product = sale.produit;
        if (!acc[product]) acc[product] = { count: 0, ca: 0 };
        acc[product].count++;
        acc[product].ca += parseCurrency(sale.caPerso);
        return acc;
    }, {});

    const productChartData = Object.keys(productData).map(key => ({
        name: key,
        count: productData[key].count,
        ca: productData[key].ca
    })).sort((a, b) => b.ca - a.ca);

    // 3. Top Promoteurs
    const promoterData = filteredSales.reduce((acc: any, sale) => {
        const promoter = sale.promoteur;
        if (!acc[promoter]) acc[promoter] = { count: 0, ca: 0 };
        acc[promoter].count++;
        acc[promoter].ca += parseCurrency(sale.caPerso);
        return acc;
    }, {});

    const topPromoters = Object.keys(promoterData).map(key => ({
        name: key,
        count: promoterData[key].count,
        ca: promoterData[key].ca
    })).sort((a, b) => b.ca - a.ca).slice(0, 5);

    // 4. Statut des Ventes
    const statusData = filteredSales.reduce((acc: any, sale) => {
        const status = sale.statut;
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
    }, {});

    const statusChartData = Object.keys(statusData).map(key => ({
        name: key,
        value: statusData[key]
    }));

    // 5. Évolution temporelle (par année)
    const timelineData = filteredSales.reduce((acc: any, sale) => {
        const year = sale.annee;
        if (!acc[year]) acc[year] = { fiche: 0, parrainage: 0 };
        if (sale.type === 'F') {
            acc[year].fiche++;
        } else {
            acc[year].parrainage++;
        }
        return acc;
    }, {});

    const timelineChartData = Object.keys(timelineData).map(year => ({
        name: year,
        Fiche: timelineData[year].fiche,
        Parrainage: timelineData[year].parrainage
    })).sort((a, b) => parseInt(a.name) - parseInt(b.name));

    // --- Advanced Analytics Calculations ---

    // 1. Sponsorship Lag (Temps moyen avant parrainage)
    const sponsorshipLag = React.useMemo(() => {
        let totalDays = 0;
        let count = 0;

        const clientFirstSale = new Map<string, Date>();
        clients.forEach(c => {
            const dates = c.sales
                .map(s => parseDate(s.dateVente))
                .filter(d => d !== null) as Date[];
            if (dates.length > 0) {
                const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
                clientFirstSale.set(c.name.trim().toLowerCase(), firstDate);
            }
        });

        clients.forEach(c => {
            const parrainName = c.sales[0]?.parrain?.trim();
            if (parrainName && clientFirstSale.has(parrainName.toLowerCase())) {
                const parrainDate = clientFirstSale.get(parrainName.toLowerCase())!;
                const godchildDate = clientFirstSale.get(c.name.trim().toLowerCase());
                if (godchildDate && godchildDate > parrainDate) {
                    const days = daysBetween(parrainDate, godchildDate);
                    totalDays += days;
                    count++;
                }
            }
        });

        return count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0;
    }, [clients]);

    // 2. Sales Cycle (Vente -> Facture) per Product (Cycle administratif)
    const salesCycleByProduct = React.useMemo(() => {
        const cycles: Record<string, { totalDays: number; count: number }> = {};
        filteredSales.forEach(s => { // Use filteredSales to obey year filter
            const dateVente = parseDate(s.dateVente);
            const dateFacture = parseDate(s.dateFacture);

            if (dateVente && dateFacture && s.produit) {
                const days = daysBetween(dateVente, dateFacture);
                if (days > 0 && days < 1000) {
                    if (!cycles[s.produit]) cycles[s.produit] = { totalDays: 0, count: 0 };
                    cycles[s.produit].totalDays += days;
                    cycles[s.produit].count++;
                }
            }
        });

        return Object.entries(cycles).map(([product, data]) => ({
            product,
            avgDays: Math.round(data.totalDays / data.count)
        })).sort((a, b) => b.avgDays - a.avgDays);
    }, [filteredSales]);

    // 3. Seasonality (Ventes par mois)
    const seasonality = React.useMemo(() => {
        const months = Array(12).fill(0);
        filteredSales.forEach(s => { // Use filteredSales
            const date = parseDate(s.dateVente);
            if (date) {
                months[date.getMonth()]++;
            }
        });

        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        return months.map((count, index) => ({
            name: monthNames[index],
            sales: count
        }));
    }, [filteredSales]);

    const COLORS = ['#18181b', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8'];

    if (loading) return <div className="p-10 text-center text-zinc-500">Chargement des données...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erreur: {error}</div>;

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg border border-zinc-200 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">Analyses Approfondies</h2>
                    <p className="text-zinc-500">Visualisations détaillées de votre activité</p>
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="text-zinc-400" size={18} />
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-4 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-white text-zinc-900 font-medium text-sm cursor-pointer hover:border-zinc-400 transition-colors"
                    >
                        <option value="all">Toutes les années</option>
                        {uniqueYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>


            {/* Advanced Analytics Section */}

            {/* Row 0.5: Sponsorship & Seasonality */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card: Sponsorship Lag */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6 relative overflow-hidden group hover:border-zinc-300 transition-all">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100 relative z-10">
                        <Users className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Délai Parrainage</h3>
                    </div>

                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity z-0">
                        <Users size={80} className="text-indigo-600" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-xs text-zinc-400 mb-4">Temps moyen entre 1ère vente Parrain et Filleul</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-zinc-900">{sponsorshipLag}</span>
                            <span className="text-sm font-medium text-zinc-500">jours</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-50 text-xs text-zinc-400 italic">
                            Utile pour anticiper l'apport d'affaires
                        </div>
                    </div>
                </div>

                {/* Card: Seasonality */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <Calendar className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Saisonnalité des Ventes</h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={seasonality}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f4f4f5' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                                    {seasonality.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#18181b' : '#3f3f46'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 0.6: Cycle Administratif (Horizontal Bar Chart) */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                    <Clock className="text-zinc-400" size={20} />
                    <h3 className="text-lg font-semibold text-zinc-900">Cycle Administratif (Vente → Facture)</h3>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesCycleByProduct} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="product"
                                type="category"
                                tick={{ fill: '#3f3f46', fontSize: 13, fontWeight: 500 }}
                                width={120}
                            />
                            <Tooltip
                                cursor={{ fill: '#f4f4f5' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`${value} jours`, 'Délai moyen']}
                            />
                            <Bar dataKey="avgDays" fill="#18181b" radius={[0, 4, 4, 0]} barSize={32}>
                                {salesCycleByProduct.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                                {/* Label inside or right of bar */}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 1: Source & Product */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fiche vs Parrainage */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <Users className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Origine des Ventes</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={sourceChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: any) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sourceChartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `${value} ventes`} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        {sourceChartData.map((item, idx) => (
                            <div key={idx} className="bg-zinc-50 p-3 rounded border border-zinc-100">
                                <p className="text-zinc-500 text-xs mb-1">{item.name}</p>
                                <p className="font-bold text-zinc-900">{item.ca.toLocaleString('fr-FR')} €</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Produits */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <FileText className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Répartition par Produit</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={productChartData} layout="vertical" margin={{ left: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                            <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#71717a', fontSize: 12 }} width={70} />
                            <Tooltip
                                formatter={(value: any, name: any) => name === 'count' ? [`${value} ventes`, 'Nombre'] : [`${value.toLocaleString()} €`, 'CA']}
                                contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', backgroundColor: 'white' }}
                            />
                            <Bar dataKey="count" fill="#18181b" radius={[0, 2, 2, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Clickable product list */}
                    <div className="mt-4 space-y-2">
                        <p className="text-xs text-zinc-400 mb-2">Cliquez pour voir le détail d'un produit :</p>
                        {productChartData.map((p: any) => (
                            <button
                                key={p.name}
                                onClick={() => navigate(`/analysis/product/${encodeURIComponent(p.name)}`)}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-md bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 hover:border-zinc-200 transition-all text-left group"
                            >
                                <span className="text-sm font-medium text-zinc-800 group-hover:text-zinc-900">{p.name}</span>
                                <span className="text-xs text-zinc-400">{p.count} ventes →</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Timeline & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Évolution Temporelle */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <TrendingUp className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Évolution Fiche vs Parrainage</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={timelineChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', backgroundColor: 'white' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Fiche" stroke="#18181b" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Parrainage" stroke="#71717a" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Statut */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <Award className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Statut des Dossiers</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: any) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusChartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 3: Top Promoteurs */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                    <Award className="text-zinc-400" size={20} />
                    <h3 className="text-lg font-semibold text-zinc-900">Top 5 Promoteurs (CA Perso)</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topPromoters}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                        <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
                        <Tooltip
                            formatter={(value: any) => `${value.toLocaleString()} €`}
                            contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', backgroundColor: 'white' }}
                        />
                        <Bar dataKey="ca" fill="#18181b" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div >
    );
};

export default Analysis;
