import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowLeft, Package, TrendingUp, Clock, Users, Calendar } from 'lucide-react';

const COLORS = ['#18181b', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8'];

const ProductAnalysis: React.FC = () => {
    const { productName } = useParams<{ productName: string }>();
    const navigate = useNavigate();
    const { sales, loading, error } = useData();

    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        if (dateStr.match(/^\d{4}$/)) return new Date(parseInt(dateStr), 0, 1);
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    };

    const daysBetween = (d1: Date, d2: Date): number => {
        const diff = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const parseCurrency = (str: string) => {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;
    };

    // All hooks must run before any conditional returns
    const productSales = React.useMemo(() => {
        return sales.filter(s => s.produit === productName);
    }, [sales, productName]);

    // 1. Evolution by Year (CA + Count)
    const evolutionByYear = React.useMemo(() => {
        const byYear: Record<number, { ca: number; count: number }> = {};
        productSales.forEach(s => {
            if (!byYear[s.annee]) byYear[s.annee] = { ca: 0, count: 0 };
            byYear[s.annee].ca += parseCurrency(s.caPerso);
            byYear[s.annee].count++;
        });
        return Object.entries(byYear)
            .map(([year, data]) => ({ year: parseInt(year), ...data }))
            .sort((a, b) => a.year - b.year);
    }, [productSales]);

    // 2. Admin Cycle by Year (avg days Vente -> Facture)
    const cycleByYear = React.useMemo(() => {
        const byYear: Record<number, { totalDays: number; count: number }> = {};
        productSales.forEach(s => {
            const dv = parseDate(s.dateVente);
            const df = parseDate(s.dateFacture);
            if (dv && df) {
                const days = daysBetween(dv, df);
                if (days > 0 && days < 1000) {
                    if (!byYear[s.annee]) byYear[s.annee] = { totalDays: 0, count: 0 };
                    byYear[s.annee].totalDays += days;
                    byYear[s.annee].count++;
                }
            }
        });
        return Object.entries(byYear)
            .map(([year, data]) => ({
                year: parseInt(year),
                avgDays: data.count > 0 ? Math.round(data.totalDays / data.count) : 0
            }))
            .sort((a, b) => a.year - b.year);
    }, [productSales]);

    // 3. Source: Fiche vs Parrainage
    const sourceData = React.useMemo(() => {
        const fiche = productSales.filter(s => s.type === 'F').length;
        const parrainage = productSales.filter(s => s.type !== 'F').length;
        return [
            { name: 'Fiche (Partenaire)', value: fiche },
            { name: 'Parrainage (Client)', value: parrainage },
        ].filter(d => d.value > 0);
    }, [productSales]);

    // 4. Seasonality by Month
    const seasonality = React.useMemo(() => {
        const months = Array(12).fill(0);
        productSales.forEach(s => {
            const d = parseDate(s.dateVente);
            if (d) months[d.getMonth()]++;
        });
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        return months.map((count, i) => ({ name: monthNames[i], sales: count }));
    }, [productSales]);

    // Stats
    const totalCA = React.useMemo(() => productSales.reduce((sum, s) => sum + parseCurrency(s.caPerso), 0), [productSales]);
    const avgCycle = React.useMemo(() => {
        const validCycles = cycleByYear.filter(c => c.avgDays > 0);
        return validCycles.length > 0
            ? Math.round(validCycles.reduce((s, c) => s + c.avgDays, 0) / validCycles.length)
            : 0;
    }, [cycleByYear]);

    if (loading) return <div className="p-10 text-center text-zinc-500">Chargement des données...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erreur: {error}</div>;
    if (!productName) return <div className="p-10 text-center text-zinc-500">Produit non trouvé.</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-zinc-200">
                <button
                    onClick={() => navigate('/analysis')}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Retour aux Analyses
                </button>
                <div className="flex items-center gap-3">
                    <Package className="text-zinc-400" size={24} />
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">{productName}</h2>
                        <p className="text-zinc-500">Analyse détaillée du produit</p>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-zinc-50 rounded-lg p-4">
                        <p className="text-xs text-zinc-400 mb-1">Nombre de ventes</p>
                        <p className="text-2xl font-bold text-zinc-900">{productSales.length}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-4">
                        <p className="text-xs text-zinc-400 mb-1">CA Total</p>
                        <p className="text-2xl font-bold text-zinc-900">{totalCA.toLocaleString('fr-FR')} €</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-4">
                        <p className="text-xs text-zinc-400 mb-1">Cycle Moyen</p>
                        <p className="text-2xl font-bold text-zinc-900">{avgCycle > 0 ? `${avgCycle}j` : 'N/A'}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-4">
                        <p className="text-xs text-zinc-400 mb-1">Parrainages</p>
                        <p className="text-2xl font-bold text-zinc-900">
                            {productSales.filter(s => s.type !== 'F').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Row 1: Evolution + Cycle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Evolution par an */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <TrendingUp className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Évolution Annuelle</h3>
                    </div>
                    {evolutionByYear.length === 0 ? (
                        <p className="text-zinc-400 text-sm text-center py-10">Pas de données disponibles</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={evolutionByYear}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any, name: any) =>
                                        name === 'ca' ? [`${value.toLocaleString('fr-FR')} €`, 'CA'] : [value, 'Ventes']
                                    }
                                />
                                <Legend formatter={(value) => value === 'ca' ? 'CA (€)' : 'Nombre de ventes'} />
                                <Bar yAxisId="left" dataKey="ca" name="ca" fill="#18181b" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="count" name="count" stroke="#71717a" strokeWidth={2} dot={{ r: 4 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Cycle Administratif par an */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <Clock className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Cycle Admin. par Année</h3>
                    </div>
                    {cycleByYear.length === 0 ? (
                        <p className="text-zinc-400 text-sm text-center py-10">Pas de données disponibles</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={cycleByYear}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} unit="j" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value} jours`, 'Délai moyen']}
                                />
                                <Line type="monotone" dataKey="avgDays" stroke="#18181b" strokeWidth={2.5} dot={{ r: 5, fill: '#18181b' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Row 2: Source + Seasonality */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <Users className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Origine des Ventes</h3>
                    </div>
                    {sourceData.length === 0 ? (
                        <p className="text-zinc-400 text-sm text-center py-10">Pas de données disponibles</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    outerRadius={110}
                                    dataKey="value"
                                >
                                    {sourceData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [`${value} ventes`]} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Seasonality */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                        <Calendar className="text-zinc-400" size={20} />
                        <h3 className="text-lg font-semibold text-zinc-900">Saisonnalité</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={seasonality}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} allowDecimals={false} />
                            <Tooltip
                                cursor={{ fill: '#f4f4f5' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`${value} vente(s)`, 'Quantité']}
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
    );
};

export default ProductAnalysis;
