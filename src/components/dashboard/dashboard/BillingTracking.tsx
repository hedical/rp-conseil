import React from 'react';
import { useData } from '../../../hooks/useData';

const BillingTracking: React.FC = () => {
    const { sales } = useData();

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

    // Grouping logic
    const years = Array.from(new Set(sales.map(s => s.annee))).sort((a, b) => b - a);

    const statsByYear = years.map(year => {
        const yearSales = sales.filter(s => s.annee === year);
        const nonCancelledSales = yearSales.filter(s => !s.statut.toLowerCase().includes('annul'));
        const cancelledSales = yearSales.filter(s => s.statut.toLowerCase().includes('annul'));

        const nbParrainage = yearSales.filter(s => s.type === 'P').length;
        const nbFiches = yearSales.filter(s => s.type === 'F').length;
        const totalSales = nbParrainage + nbFiches;
        const tauxParrainage = totalSales > 0 ? (nbParrainage / totalSales) * 100 : 0;

        const montantFacturable = nonCancelledSales.reduce((acc, s) => acc + parseCurrency(s.montantFacturable), 0);

        const regle = nonCancelledSales
            .filter(s => s.statut === 'Réglé')
            .reduce((acc, s) => acc + parseCurrency(s.montantFacturable), 0);

        const attente = nonCancelledSales
            .filter(s => s.statut === 'Facturé en attente de paiement')
            .reduce((acc, s) => acc + parseCurrency(s.montantFacturable), 0);

        const aFacturer = nonCancelledSales
            .filter(s => s.statut === 'A facturer')
            .reduce((acc, s) => acc + parseCurrency(s.montantFacturable), 0);

        const tauxFacturation = montantFacturable > 0 ? ((regle + attente) / montantFacturable) * 100 : 0;
        const tauxReglement = montantFacturable > 0 ? (regle / montantFacturable) * 100 : 0;

        const montantAnnulations = cancelledSales.reduce((acc, s) => acc + parseCurrency(s.annulation), 0);
        const tauxAnnulation = totalSales > 0 ? (cancelledSales.length / totalSales) * 100 : 0;

        const totalCARPC = nonCancelledSales.reduce((acc, s) => acc + parseCurrency(s.caPerso) + parseCurrency(s.fIngenierieRPC), 0);
        const totalCAEpsilium = nonCancelledSales.reduce((acc, s) => acc + parseCurrency(s.caGeneral) + parseCurrency(s.fIngenierie), 0);

        const partRemunerationRPC = totalCAEpsilium > 0 ? (totalCARPC / totalCAEpsilium) * 100 : 0;

        return {
            year,
            nbParrainage,
            nbFiches,
            tauxParrainage,
            montantFacturable,
            regle,
            attente,
            aFacturer,
            tauxFacturation,
            tauxReglement,
            nbSales: totalSales,
            nbAnnulations: cancelledSales.length,
            montantAnnulations,
            tauxAnnulation,
            totalCARPC,
            totalCAEpsilium,
            partRemunerationRPC
        };
    });

    const formatPrice = (val: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

    const formatPct = (val: number) =>
        val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

    return (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-100">
                <h3 className="text-xl font-bold text-zinc-900 uppercase tracking-tight">Indicateurs par année</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="p-4 font-bold text-zinc-900 w-64 border-r border-zinc-200"></th>
                            {statsByYear.map(s => (
                                <th key={s.year} className="p-4 font-bold text-zinc-900 text-center text-lg border-r border-zinc-200 min-w-32 italic">
                                    {s.year}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {/* Section Activité */}
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic">Nb Parrainage</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200">{s.nbParrainage}</td>)}
                        </tr>
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic">Nb Fiches</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200">{s.nbFiches}</td>)}
                        </tr>
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic">Taux de parrainage</td>
                            {statsByYear.map(s => (
                                <td key={s.year} className={`p-3 text-center border-r border-zinc-200 font-medium ${s.tauxParrainage < 50 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {formatPct(s.tauxParrainage)}
                                </td>
                            ))}
                        </tr>

                        {/* Section Facturation */}
                        <tr className="bg-zinc-100">
                            <td className="p-3 font-bold text-zinc-900 border-r border-zinc-200 italic">Montant facturable hors annulation (1+2+3)</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200 font-bold">{formatPrice(s.montantFacturable)}</td>)}
                        </tr>
                        <tr>
                            <td className="p-3 font-medium text-green-600 border-r border-zinc-200 italic">1 - Réglé</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200 text-green-600 font-medium">{formatPrice(s.regle)}</td>)}
                        </tr>
                        <tr>
                            <td className="p-3 font-medium text-blue-600 border-r border-zinc-200 italic">2 - Facturé en attente de paiement</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200 text-blue-600 font-medium">{formatPrice(s.attente)}</td>)}
                        </tr>
                        <tr>
                            <td className="p-3 font-medium text-orange-500 border-r border-zinc-200 italic">3 - A facturer</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200 text-orange-500 font-medium">{formatPrice(s.aFacturer)}</td>)}
                        </tr>

                        {/* Taux */}
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic border-t border-zinc-300">Taux de facturation</td>
                            {statsByYear.map(s => (
                                <td key={s.year} className={`p-3 text-center border-r border-zinc-200 font-medium border-t border-zinc-300 ${s.tauxFacturation < 90 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {formatPct(s.tauxFacturation)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic">Taux de règlement</td>
                            {statsByYear.map(s => (
                                <td key={s.year} className={`p-3 text-center border-r border-zinc-200 font-medium ${s.tauxReglement < 90 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {formatPct(s.tauxReglement)}
                                </td>
                            ))}
                        </tr>

                        {/* Section Annulations */}
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic">Nombre de ventes</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200">{s.nbSales}</td>)}
                        </tr>
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic">Annulations</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200">{s.nbAnnulations}</td>)}
                        </tr>
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic">Montant des annulations</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200 font-medium">{formatPrice(s.montantAnnulations)}</td>)}
                        </tr>
                        <tr>
                            <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200 italic">Taux d'annulation</td>
                            {statsByYear.map(s => (
                                <td key={s.year} className={`p-3 text-center border-r border-zinc-200 font-medium ${s.tauxAnnulation > 15 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {formatPct(s.tauxAnnulation)}
                                </td>
                            ))}
                        </tr>

                        {/* Section Totaux CA */}
                        <tr className="border-t-2 border-zinc-900">
                            <td className="p-3 font-bold text-zinc-900 border-r border-zinc-200 italic uppercase">Total CA RPC</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200 font-bold text-lg">{formatPrice(s.totalCARPC)}</td>)}
                        </tr>
                        <tr className="bg-zinc-50">
                            <td className="p-3 font-bold text-zinc-900 border-r border-zinc-200 italic uppercase">Total CA EPSILIUM</td>
                            {statsByYear.map(s => <td key={s.year} className="p-3 text-center border-r border-zinc-200 font-bold text-lg">{formatPrice(s.totalCAEpsilium)}</td>)}
                        </tr>
                        <tr>
                            <td className="p-2 text-[10px] text-zinc-500 border-r border-zinc-200 italic">Part de la rémunération RPC</td>
                            {statsByYear.map(s => <td key={s.year} className="p-2 text-center border-r border-zinc-200 text-[10px] font-medium">{formatPct(s.partRemunerationRPC)}</td>)}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillingTracking;
