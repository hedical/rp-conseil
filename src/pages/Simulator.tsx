import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Calculator, TrendingUp, Target, Info } from 'lucide-react';

const parseCurrency = (str: string) => {
    if (!str) return 0;
    return parseFloat(str.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;
};

const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.match(/^\d{4}$/)) return new Date(parseInt(dateStr), 0, 1);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
};

const Simulator: React.FC = () => {
    const { sales, loading, error } = useData();

    // --- Compute available years ---
    const availableYears = useMemo(() => {
        if (!sales) return [];
        const years = Array.from(new Set(sales.map(s => s.annee).filter(Boolean)));
        return years.sort((a, b) => b - a);
    }, [sales]);

    const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

    // Set initial selected year once data is loaded
    React.useEffect(() => {
        if (availableYears.length > 0 && selectedYear === undefined) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    // --- Compute base stats from the selected year of data ---
    const baseStats = useMemo(() => {
        if (!sales || sales.length === 0 || selectedYear === undefined) return null;
        const lastYearSales = sales.filter(s => s.annee === selectedYear && s.annulationBoolean !== 'X');
        const nbSales = lastYearSales.length;
        const totalCAPerso = lastYearSales.reduce((sum, s) => sum + parseCurrency(s.caPerso), 0);
        const totalCAGeneral = lastYearSales.reduce((sum, s) => sum + parseCurrency(s.caGeneral), 0);
        const avgCAPerso = nbSales > 0 ? totalCAPerso / nbSales : 0;
        const avgCAGeneral = nbSales > 0 ? totalCAGeneral / nbSales : 0;
        const fichePct = nbSales > 0 ? (lastYearSales.filter(s => s.type === 'F').length / nbSales) * 100 : 50;
        return { year: selectedYear, nbSales, totalCAPerso, totalCAGeneral, avgCAPerso, avgCAGeneral, fichePct };
    }, [sales, selectedYear]);

    // --- Simulator controls ---
    const [nbVentes, setNbVentes] = useState<number>(30);
    const [fichePct, setFichePct] = useState<number>(50);
    const [avgCAPersoOverride, setAvgCAPersoOverride] = useState<number>(5000);
    const [avgCAGeneralOverride, setAvgCAGeneralOverride] = useState<number>(15000);

    // Update defaults when stats load OR when reference year changes
    React.useEffect(() => {
        if (baseStats) {
            setNbVentes(baseStats.nbSales || 1);
            setFichePct(Math.round(baseStats.fichePct));
            setAvgCAPersoOverride(Math.round(baseStats.avgCAPerso) || 1000);
            setAvgCAGeneralOverride(Math.round(baseStats.avgCAGeneral) || 1000);
        }
    }, [baseStats]);

    // --- Projected values ---
    const projected = useMemo(() => {
        const nbFiche = Math.round(nbVentes * (fichePct / 100));
        const nbParrainage = nbVentes - nbFiche;
        const totalCAPerso = nbVentes * avgCAPersoOverride;
        const totalCAGeneral = nbVentes * avgCAGeneralOverride;
        return { nbFiche, nbParrainage, totalCAPerso, totalCAGeneral };
    }, [nbVentes, fichePct, avgCAPersoOverride, avgCAGeneralOverride]);

    // --- Chart: comparison N vs N+1 ---
    const comparisonData = useMemo(() => {
        if (!baseStats) return [];
        return [
            {
                name: `${baseStats.year} (réel)`,
                CAPerso: Math.round(baseStats.totalCAPerso),
                CAGeneral: Math.round(baseStats.totalCAGeneral),
            },
            {
                name: `${baseStats.year + 1} (prévu)`,
                CAPerso: Math.round(projected.totalCAPerso),
                CAGeneral: Math.round(projected.totalCAGeneral),
            },
        ];
    }, [baseStats, projected]);

    // --- Compute seasonality weights based on ALL historical data ---
    const seasonalWeights = useMemo(() => {
        if (!sales || sales.length === 0) return Array(12).fill(1 / 12);

        const monthlyCounts = Array(12).fill(0);
        let totalValide = 0;

        sales.forEach(s => {
            if (s.annulationBoolean === 'X') return;
            const date = parseDate(s.dateVente);
            if (date) {
                monthlyCounts[date.getMonth()]++;
                totalValide++;
            }
        });

        if (totalValide === 0) return Array(12).fill(1 / 12);
        return monthlyCounts.map(count => count / totalValide);
    }, [sales]);

    // --- Monthly breakdown chart ---
    const monthlyBreakdown = useMemo(() => {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

        return monthNames.map((name, index) => {
            const weight = seasonalWeights[index];
            const monthVentes = nbVentes * weight;
            return {
                name,
                ca: Math.round(monthVentes * avgCAPersoOverride),
            };
        });
    }, [nbVentes, avgCAPersoOverride, seasonalWeights]);

    if (loading) return <div className="p-10 text-center text-zinc-500">Chargement des données...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erreur: {error}</div>;

    const growthCAPerso = baseStats ? ((projected.totalCAPerso - baseStats.totalCAPerso) / baseStats.totalCAPerso) * 100 : 0;
    const growthCAGeneral = baseStats ? ((projected.totalCAGeneral - baseStats.totalCAGeneral) / baseStats.totalCAGeneral) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-zinc-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Calculator className="text-zinc-400" size={24} />
                        <h2 className="text-2xl font-bold text-zinc-900">Simulateur N+1</h2>
                    </div>

                    <div className="flex items-center gap-3 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                        <label className="text-sm font-medium text-zinc-500 whitespace-nowrap">Année de référence :</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-white border border-zinc-200 px-3 py-1.5 rounded-md text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className="text-zinc-500 text-sm mt-2">
                    Ajustez les paramètres pour obtenir une projection du CA prévisionnel.
                    {baseStats && (
                        <span className="ml-2 text-zinc-400 italic">
                            ({baseStats.nbSales} ventes réelles trouvées)
                        </span>
                    )}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls panel */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-8">
                    <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                        <Target size={18} className="text-zinc-400" />
                        Paramètres
                    </h3>

                    {/* Nb Ventes */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-700">Nombre de ventes</label>
                            <span className="text-sm font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">{nbVentes}</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={200}
                            value={nbVentes}
                            onChange={e => setNbVentes(parseInt(e.target.value))}
                            className="w-full accent-zinc-900"
                        />
                        <div className="flex justify-between text-xs text-zinc-400 mt-1">
                            <span>1</span><span>200</span>
                        </div>
                        {baseStats && (
                            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                <Info size={11} /> Réel {baseStats.year} : {baseStats.nbSales} ventes
                            </p>
                        )}
                    </div>

                    {/* Fiche % */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-700">Part Fiche (Partenaire)</label>
                            <span className="text-sm font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">{fichePct}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={fichePct}
                            onChange={e => setFichePct(parseInt(e.target.value))}
                            className="w-full accent-zinc-900"
                        />
                        <div className="flex justify-between text-xs text-zinc-400 mt-1">
                            <span>0% (tout parrainage)</span><span>100% (tout fiche)</span>
                        </div>
                        <div className="mt-2 flex gap-2 text-xs">
                            <span className="bg-zinc-900 text-white px-2 py-1 rounded-full">Fiche : {projected.nbFiche}</span>
                            <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full">Parrainage : {projected.nbParrainage}</span>
                        </div>
                    </div>

                    {/* Avg CA Perso */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-700">CA Perso moyen / vente</label>
                            <span className="text-sm font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">{avgCAPersoOverride.toLocaleString('fr-FR')} €</span>
                        </div>
                        <input
                            type="range"
                            min={500}
                            max={50000}
                            step={100}
                            value={avgCAPersoOverride}
                            onChange={e => setAvgCAPersoOverride(parseInt(e.target.value))}
                            className="w-full accent-zinc-900"
                        />
                        <div className="flex justify-between text-xs text-zinc-400 mt-1">
                            <span>500 €</span><span>50 000 €</span>
                        </div>
                        {baseStats && (
                            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                <Info size={11} /> Réel {baseStats.year} : {Math.round(baseStats.avgCAPerso).toLocaleString('fr-FR')} €/vente
                            </p>
                        )}
                    </div>

                    {/* Avg CA General (commission EPSILUM) */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-700">Commission EPSILUM moy. / vente</label>
                            <span className="text-sm font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">{avgCAGeneralOverride.toLocaleString('fr-FR')} €</span>
                        </div>
                        <input
                            type="range"
                            min={1000}
                            max={150000}
                            step={500}
                            value={avgCAGeneralOverride}
                            onChange={e => setAvgCAGeneralOverride(parseInt(e.target.value))}
                            className="w-full accent-zinc-900"
                        />
                        <div className="flex justify-between text-xs text-zinc-400 mt-1">
                            <span>1 000 €</span><span>150 000 €</span>
                        </div>
                        {baseStats && (
                            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                <Info size={11} /> Réel {baseStats.year} : {Math.round(baseStats.avgCAGeneral).toLocaleString('fr-FR')} €/vente
                            </p>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-zinc-200 rounded-lg p-6">
                            <p className="text-xs text-zinc-400 mb-1">CA Perso Prévisionnel</p>
                            <p className="text-3xl font-bold text-zinc-900">{projected.totalCAPerso.toLocaleString('fr-FR')} €</p>
                            <p className={`text-sm mt-2 font-medium ${growthCAPerso >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {growthCAPerso >= 0 ? '▲' : '▼'} {Math.abs(growthCAPerso).toFixed(1)}% vs {baseStats?.year}
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-lg p-6">
                            <p className="text-xs text-zinc-400 mb-1">Commission EPSILUM Prévisionnelle</p>
                            <p className="text-3xl font-bold text-zinc-900">{projected.totalCAGeneral.toLocaleString('fr-FR')} €</p>
                            <p className={`text-sm mt-2 font-medium ${growthCAGeneral >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {growthCAGeneral >= 0 ? '▲' : '▼'} {Math.abs(growthCAGeneral).toFixed(1)}% vs {baseStats?.year}
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-100 rounded-lg p-5 border">
                            <p className="text-xs text-zinc-400 mb-1">Ventes simulées</p>
                            <p className="text-2xl font-bold text-zinc-900">{nbVentes}</p>
                            <p className="text-xs text-zinc-400 mt-1">{projected.nbFiche} fiches · {projected.nbParrainage} parrainages</p>
                        </div>
                        <div className="bg-white border border-zinc-100 rounded-lg p-5 border">
                            <p className="text-xs text-zinc-400 mb-1">CA Perso / mois (moyen)</p>
                            <p className="text-2xl font-bold text-zinc-900">{Math.round(projected.totalCAPerso / 12).toLocaleString('fr-FR')} €</p>
                            <p className="text-xs text-zinc-400 mt-1">{(nbVentes / 12).toFixed(1)} ventes/mois</p>
                        </div>
                    </div>

                    {/* Comparison chart N vs N+1 */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                            <TrendingUp className="text-zinc-400" size={20} />
                            <h3 className="text-base font-semibold text-zinc-900">Comparaison Réel vs Prévisionnel</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={comparisonData} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }}
                                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any, name: any) => [
                                        `${parseInt(value).toLocaleString('fr-FR')} €`,
                                        name === 'CAPerso' ? 'CA Perso' : 'Commission EPSILUM'
                                    ]}
                                />
                                <Bar dataKey="CAPerso" name="CAPerso" radius={[4, 4, 0, 0]}>
                                    <Cell fill="#18181b" />
                                    <Cell fill="#3f3f46" />
                                </Bar>
                                <Bar dataKey="CAGeneral" name="CAGeneral" radius={[4, 4, 0, 0]}>
                                    <Cell fill="#a1a1aa" />
                                    <Cell fill="#d4d4d8" />
                                </Bar>
                                {baseStats && (
                                    <ReferenceLine y={baseStats.totalCAPerso} stroke="#ef4444" strokeDasharray="4 4" />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Monthly CA forecast */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                            <Calculator className="text-zinc-400" size={20} />
                            <h3 className="text-base font-semibold text-zinc-900">CA Perso Mensuel Estimé</h3>
                            <span className="text-xs text-zinc-400 ml-auto italic">Basé sur l'historique de saisonnalité</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={monthlyBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }}
                                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    cursor={{ fill: '#f4f4f5' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${parseInt(value).toLocaleString('fr-FR')} €`, 'CA Perso']}
                                />
                                <Bar dataKey="ca" radius={[4, 4, 0, 0]} fill="#18181b" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Simulator;
