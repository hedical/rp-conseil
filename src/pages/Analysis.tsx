import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Users, FileText, Award, Filter, Clock, Calendar, AlertCircle } from 'lucide-react';

const Analysis: React.FC = () => {
    const { sales, clients, loading, error } = useData();
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const navigate = useNavigate();


    // Get unique years for filter
    const uniqueYears = Array.from(new Set(sales.map(sale => sale.annee))).sort((a, b) => b - a);

    // Filter sales by selected year
    const filteredSales = selectedYear === 'all' ? sales : sales.filter(sale => sale.annee === parseInt(selectedYear));

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

    // 6. Évolution du taux d'annulation
    const cancellationTrendData = React.useMemo(() => {
        const yearGroups: Record<number, { total: number; cancelled: number }> = {};

        // Use all sales to see progression even if a year is filtered out from view
        sales.forEach(s => {
            const year = s.annee;
            if (!yearGroups[year]) yearGroups[year] = { total: 0, cancelled: 0 };
            yearGroups[year].total++;
            if ((s.statut || '').toLowerCase().includes('annul')) {
                yearGroups[year].cancelled++;
            }
        });

        return Object.entries(yearGroups).map(([year, data]) => ({
            name: year,
            rate: data.total > 0 ? parseFloat(((data.cancelled / data.total) * 100).toFixed(2)) : 0
        })).sort((a, b) => parseInt(a.name) - parseInt(b.name));
    }, [sales]);

    // --- Advanced Analytics Calculations ---

    // 4. Sponsorship Leaderboard (Meilleurs Parrains)
    const referralLeaderboard = React.useMemo(() => {
        const sponsors: Record<string, { name: string; godchildrenCount: number; totalCA: number }> = {};

        filteredSales.forEach(s => {
            const parrainName = s.parrain?.trim();
            if (parrainName && parrainName !== 'SO' && parrainName !== '') {
                if (!sponsors[parrainName]) {
                    sponsors[parrainName] = { name: parrainName, godchildrenCount: 0, totalCA: 0 };
                }
                // We count unique godchildren as sales where this parrain is mentioned
                // (Note: This might overcount if one godchild has multiple sales, 
                // but usually parrainage is per deal or per client entry)
                sponsors[parrainName].godchildrenCount++;
                sponsors[parrainName].totalCA += parseCurrency(s.caPerso);
            }
        });

        return Object.values(sponsors)
            .sort((a, b) => b.totalCA - a.totalCA)
            .slice(0, 10);
    }, [filteredSales]);

    // 5. Referral Conversion Time (Délai moyen de conversion parrainé)
    // Temps entre date_entree du client et sa première vente
    const referralConversionTime = React.useMemo(() => {
        let totalDays = 0;
        let count = 0;

        clients.forEach(c => {
            // Only consider godchildren (type 'P' in their sales)
            const godchildSales = (c.sales || []).filter(s => s.type === 'P');
            if (godchildSales.length > 0 && c.date_entree) {
                const dateEntree = new Date(c.date_entree);
                const firstSaleDate = parseDate(godchildSales[0].dateVente);

                if (firstSaleDate && firstSaleDate >= dateEntree) {
                    const days = daysBetween(dateEntree, firstSaleDate);
                    // Filter outlier or negative results
                    if (days >= 0 && days < 730) { // < 2 years
                        totalDays += days;
                        count++;
                    }
                }
            }
        });

        return count > 0 ? Math.round(totalDays / count) : 0;
    }, [clients]);

    // 6. Sponsorship Lag (Viralité: Délai avant 1er parrainage)
    const sponsorshipLag = React.useMemo(() => {
        let totalDays = 0;
        let count = 0;

        const clientFirstSale = new Map<string, Date>();
        clients.forEach(c => {
            const dates = (c.sales || [])
                .map(s => parseDate(s.dateVente))
                .filter(d => d !== null) as Date[];
            if (dates.length > 0) {
                const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
                clientFirstSale.set(c.nom.trim().toLowerCase(), firstDate);
            }
        });

        clients.forEach(c => {
            const parrainName = c.sales?.[0]?.parrain?.trim();
            if (parrainName && clientFirstSale.has(parrainName.toLowerCase())) {
                const parrainDate = clientFirstSale.get(parrainName.toLowerCase())!;
                const godchildDate = clientFirstSale.get(c.nom.trim().toLowerCase());
                if (godchildDate && godchildDate > parrainDate) {
                    const days = daysBetween(parrainDate, godchildDate);
                    if (days > 0 && days < 1000) {
                        totalDays += days;
                        count++;
                    }
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

            {/* Sponsorship Dashboard */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Award className="text-zinc-900" size={24} />
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Analyse des Parrainages</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Metric: Best Sponsor */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Meilleur Parrain</p>
                            <h3 className="text-xl font-black text-zinc-900 truncate">
                                {referralLeaderboard[0]?.name || "N/A"}
                            </h3>
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-100">
                            <p className="text-2xl font-black text-zinc-900">
                                {referralLeaderboard[0]?.totalCA.toLocaleString('fr-FR')} €
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">CA Apporté</p>
                        </div>
                    </div>

                    {/* Metric: Conv Time */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Délai Conversion</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-zinc-900">{referralConversionTime}</span>
                                <span className="text-sm font-bold text-zinc-400">jours</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium leading-tight mt-2 italic">
                            Temps moyen avant 1ère vente parrainée
                        </p>
                    </div>

                    {/* Metric: Viral Speed */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Vitesse de Viralité</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-zinc-900">{sponsorshipLag}</span>
                                <span className="text-sm font-bold text-zinc-400">jours</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium leading-tight mt-2 italic">
                            Délai avant qu'un parrain recommande
                        </p>
                    </div>

                    {/* Metric: Godchildren Count */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Volume Parrainage</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-zinc-900">
                                    {filteredSales.filter(s => s.type === 'P').length}
                                </span>
                                <span className="text-sm font-bold text-zinc-400">ventes</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium leading-tight mt-2 italic">
                            Nombre total de ventes par recommandation
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leaderboard Chart */}
                    <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Top 10 des Meilleurs Parrains</h3>
                            <Award className="text-zinc-200" size={20} />
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={referralLeaderboard} layout="vertical" margin={{ left: 40, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fill: '#18181b', fontSize: 11, fontWeight: 700 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f4f4f5' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${value.toLocaleString()} €`, 'CA Apporté']}
                                    />
                                    <Bar dataKey="totalCA" fill="#18181b" radius={[0, 6, 6, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Leaderboard List/Details */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Détails Classement</h3>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                            {referralLeaderboard.map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${index === 0 ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-zinc-900">{item.name}</p>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase">{item.godchildrenCount} recommandation(s)</p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-zinc-900">{Math.round(item.totalCA / 1000)}k€</p>
                                </div>
                            ))}
                        </div>
                    </div>
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

            {/* Row 2.5: Cancellation Trend */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                    <AlertCircle className="text-zinc-400" size={20} />
                    <h3 className="text-lg font-semibold text-zinc-900">Évolution du Taux d'Annulation (%)</h3>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cancellationTrendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12 }}
                                unit="%"
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`${value}%`, 'Taux d\'annulation']}
                            />
                            <Line
                                type="monotone"
                                dataKey="rate"
                                stroke="#18181b"
                                strokeWidth={3}
                                dot={{ r: 6, fill: '#18181b', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 8, strokeWidth: 0 }}
                            />
                        </LineChart>
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
