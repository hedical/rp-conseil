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

const Simulator: React.FC = () => {
    const { sales, loading, error } = useData();

    // --- Compute base stats from the last full year of data ---
    const baseStats = useMemo(() => {
        if (!sales || sales.length === 0) return null;
        const years = sales.map(s => s.annee).filter(Boolean);
        const maxYear = Math.max(...years);
        const lastYearSales = sales.filter(s => s.annee === maxYear && s.annulationBoolean !== 'X');
        const nbSales = lastYearSales.length;
        const totalCAPerso = lastYearSales.reduce((sum, s) => sum + parseCurrency(s.caPerso), 0);
        const totalCAGeneral = lastYearSales.reduce((sum, s) => sum + parseCurrency(s.caGeneral), 0);
        const avgCAPerso = nbSales > 0 ? totalCAPerso / nbSales : 0;
        const avgCAGeneral = nbSales > 0 ? totalCAGeneral / nbSales : 0;
        const fichePct = nbSales > 0 ? (lastYearSales.filter(s => s.type === 'F').length / nbSales) * 100 : 50;
        return { maxYear, nbSales, totalCAPerso, totalCAGeneral, avgCAPerso, avgCAGeneral, fichePct };
    }, [sales]);

    // --- Simulator controls ---
    const [nbVentes, setNbVentes] = useState<number>(baseStats?.nbSales ?? 30);
    const [fichePct, setFichePct] = useState<number>(Math.round(baseStats?.fichePct ?? 50));
    const [avgCAPersoOverride, setAvgCAPersoOverride] = useState<number>(Math.round(baseStats?.avgCAPerso ?? 5000));
    const [avgCAGeneralOverride, setAvgCAGeneralOverride] = useState<number>(Math.round(baseStats?.avgCAGeneral ?? 15000));

    // Update defaults when stats load
    React.useEffect(() => {
        if (baseStats) {
            setNbVentes(baseStats.nbSales);
            setFichePct(Math.round(baseStats.fichePct));
            setAvgCAPersoOverride(Math.round(baseStats.avgCAPerso));
            setAvgCAGeneralOverride(Math.round(baseStats.avgCAGeneral));
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
                name: `${baseStats.maxYear} (réel)`,
                CAPerso: Math.round(baseStats.totalCAPerso),
                CAGeneral: Math.round(baseStats.totalCAGeneral),
            },
            {
                name: `${baseStats.maxYear + 1} (prévu)`,
                CAPerso: Math.round(projected.totalCAPerso),
                CAGeneral: Math.round(projected.totalCAGeneral),
            },
        ];
    }, [baseStats, projected]);

    // --- Monthly breakdown chart ---
    const monthlyBreakdown = useMemo(() => {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const ventesPerMonth = nbVentes / 12;
        return monthNames.map(name => ({
            name,
            ca: Math.round(ventesPerMonth * avgCAPersoOverride),
        }));
    }, [nbVentes, avgCAPersoOverride]);

    if (loading) return <div className="p-10 text-center text-zinc-500">Chargement des données...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erreur: {error}</div>;

    const growthCAPerso = baseStats ? ((projected.totalCAPerso - baseStats.totalCAPerso) / baseStats.totalCAPerso) * 100 : 0;
    const growthCAGeneral = baseStats ? ((projected.totalCAGeneral - baseStats.totalCAGeneral) / baseStats.totalCAGeneral) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-zinc-200">
                <div className="flex items-center gap-3 mb-1">
                    <Calculator className="text-zinc-400" size={24} />
                    <h2 className="text-2xl font-bold text-zinc-900">Simulateur N+1</h2>
                </div>
                <p className="text-zinc-500 text-sm ml-9">
                    Ajustez les paramètres pour obtenir une projection du CA prévisionnel.
                    {baseStats && (
                        <span className="ml-2 text-zinc-400 italic">
                            Données de référence : {baseStats.maxYear} ({baseStats.nbSales} ventes réelles)
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
                                <Info size={11} /> Réel {baseStats.maxYear} : {baseStats.nbSales} ventes
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
                                <Info size={11} /> Réel {baseStats.maxYear} : {Math.round(baseStats.avgCAPerso).toLocaleString('fr-FR')} €/vente
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
                                <Info size={11} /> Réel {baseStats.maxYear} : {Math.round(baseStats.avgCAGeneral).toLocaleString('fr-FR')} €/vente
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
                                {growthCAPerso >= 0 ? '▲' : '▼'} {Math.abs(growthCAPerso).toFixed(1)}% vs {baseStats?.maxYear}
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-lg p-6">
                            <p className="text-xs text-zinc-400 mb-1">Commission EPSILUM Prévisionnelle</p>
                            <p className="text-3xl font-bold text-zinc-900">{projected.totalCAGeneral.toLocaleString('fr-FR')} €</p>
                            <p className={`text-sm mt-2 font-medium ${growthCAGeneral >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {growthCAGeneral >= 0 ? '▲' : '▼'} {Math.abs(growthCAGeneral).toFixed(1)}% vs {baseStats?.maxYear}
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
                            <span className="text-xs text-zinc-400 ml-auto italic">Hypothèse : répartition uniforme</span>
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
