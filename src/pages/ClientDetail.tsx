import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { updateSaleData, deleteSaleData } from '../services/api';
import { ArrowLeft, Edit, Save, FileText, CheckCircle, Trash2, Plus, Calculator, Upload, Users, Calendar, Info, Clock } from 'lucide-react';
import AddClientModal from '../components/AddClientModal';
import ImportClientModal from '../components/ImportClientModal';
import ClientAnalysisModal from '../components/ClientAnalysisModal';
import FinancialSimulationModal from '../components/FinancialSimulationModal';

const ClientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { clients, refetchData, products } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [editedSales, setEditedSales] = useState<any[]>([]);

    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

    // Find client
    const client = clients.find(c => c.id === id);

    if (!client) {
        return <div className="p-8 text-center text-zinc-500">Client introuvable</div>;
    }

    // Split name for import modal (assuming "NOM Prénom")
    const nameParts = client.nom.split(' ');
    const initialNom = nameParts[0] || '';
    const initialPrenom = nameParts.slice(1).join(' ') || '';

    const startEditing = () => {
        if (client) {
            setEditedSales(JSON.parse(JSON.stringify(client.sales || []))); // Deep copy
            setIsEditing(true);
        }
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditedSales([]);
        setSaveError(null);
    };

    const handleSaleChange = (index: number, field: string, value: any) => {
        const newSales = [...editedSales];
        newSales[index] = { ...newSales[index], [field]: value };
        setEditedSales(newSales);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            // Update all modified sales
            for (const sale of editedSales) {
                await updateSaleData(sale);
            }

            // Refresh data after successful update
            await refetchData();

            setIsEditing(false);
            alert("✅ Modifications enregistrées avec succès !");
        } catch (error) {
            console.error("Save error:", error);
            setSaveError("Erreur lors de la sauvegarde. Vérifiez votre connexion et réessayez.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSale = async (saleId: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.")) return;

        setIsDeleting(true);
        try {
            await deleteSaleData(saleId);
            await refetchData();
            // If it was the last sale, redirect to list
            if ((client.sales?.length || 0) <= 1) {
                navigate('/');
            }
        } catch (error) {
            alert("Erreur lors de la suppression.");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!window.confirm(`ATTENTION : Vous allez supprimer TOUS les dossiers de ${client.nom}. Êtes-vous sûr ?`)) return;

        setIsDeleting(true);
        try {
            // In Supabase with cascade delete, we only need to delete the client
            const { error } = await supabase.from('clients').delete().eq('id', client.id);
            if (error) throw error;

            await refetchData();
            navigate('/');
        } catch (error) {
            alert("Erreur lors de la suppression du client.");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 fade-in">
            <div className="flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-zinc-500 hover:text-zinc-900 transition-colors font-medium text-sm"
                >
                    <ArrowLeft size={16} className="mr-2" /> Retour à la liste
                </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-10 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
                                {client.nom}
                            </h1>
                            <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 uppercase tracking-widest">Actif</span>
                        </div>
                        <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">ID: {client.id} • {client.sales?.length || 0} dossiers actifs</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-zinc-900 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-sm font-bold shadow-sm"
                        >
                            <Upload size={16} />
                            <span>Importer</span>
                        </button>

                        <button
                            onClick={() => setIsSimulationModalOpen(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all text-sm font-bold shadow-lg shadow-zinc-200"
                        >
                            <Calculator size={16} />
                            <span>Simulation</span>
                        </button>

                        <button
                            onClick={() => setIsAddProductModalOpen(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-zinc-200 transition-colors text-sm font-bold"
                        >
                            <Plus size={16} /> <span>Produit</span>
                        </button>

                        <button
                            onClick={handleDeleteClient}
                            disabled={isDeleting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-bold border border-red-100"
                        >
                            <Trash2 size={16} /> <span>Supprimer</span>
                        </button>

                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            {isEditing && (
                                <button
                                    onClick={cancelEditing}
                                    disabled={isSaving}
                                    className="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all border border-zinc-200 hover:border-zinc-900 text-zinc-500 hover:text-zinc-900 bg-white"
                                >
                                    Annuler
                                </button>
                            )}
                            <button
                                onClick={() => isEditing ? handleSave() : startEditing()}
                                disabled={isSaving}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${isEditing
                                    ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                                    : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 shadow-sm'
                                    }`}
                            >
                                {isEditing ? <><Save size={16} /> {isSaving ? '...' : 'Valider'}</> : <><Edit size={16} /> Modifier</>}
                            </button>
                        </div>
                    </div>
                </div>

                {saveError && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold uppercase tracking-wide">
                        {saveError}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-12">
                    <div className="space-y-6">
                        <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-6 h-fit">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Informations Financières</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Chiffre d'affaires Total (Général)</p>
                                    <p className="text-3xl font-bold text-zinc-900 tracking-tight">{client.totalCA.toLocaleString('fr-FR')} €</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Chiffre d'affaires Total (Perso)</p>
                                    <p className="text-3xl font-bold text-zinc-900 tracking-tight">{client.totalCAPerso.toLocaleString('fr-FR')} €</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsAnalysisModalOpen(true)}
                                className="mt-8 w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-zinc-900 text-zinc-900 hover:text-white border border-zinc-200 hover:border-zinc-900 rounded-xl transition-all font-bold text-sm shadow-sm"
                            >
                                <Info size={16} />
                                Voir plus de détails
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-8">

                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3 pb-4 border-b border-zinc-100">
                            <FileText size={20} className="text-zinc-400" />
                            Historique des Dossiers
                        </h3>

                        <div className="grid gap-4">
                            <div className="grid gap-4">
                                {(isEditing ? editedSales : (client.sales || [])).map((sale, idx) => (
                                    <div key={idx} className="bg-white border border-zinc-200 rounded-lg p-6 hover:border-zinc-400 transition-all duration-200 relative group">
                                        {/* Delete Button for individual sale */}
                                        {!isEditing && (
                                            <button
                                                onClick={() => handleDeleteSale(sale.id)}
                                                className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Supprimer ce dossier"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}

                                        {isEditing ? (
                                            <div className="space-y-6">
                                                {/* Edit Section: Product & Origin */}
                                                <div className="border-b border-zinc-100 pb-4">
                                                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
                                                        <FileText size={14} /> Produit & Origine
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Produit</label>
                                                            <select
                                                                value={sale.produit}
                                                                onChange={(e) => handleSaleChange(idx, 'produit', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm focus:ring-1 focus:ring-zinc-900 outline-none bg-white"
                                                                required
                                                            >
                                                                <option value="">Choisir un produit...</option>
                                                                {products.map(p => (
                                                                    <option key={p.id} value={p.nom}>{p.nom}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Type (F/P)</label>
                                                            <select
                                                                value={sale.type}
                                                                onChange={(e) => handleSaleChange(idx, 'type', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm focus:ring-1 focus:ring-zinc-900 outline-none bg-white"
                                                            >
                                                                <option value="F">Fiche (F)</option>
                                                                <option value="P">Parrainage (P)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Parrain</label>
                                                            <input
                                                                type="text"
                                                                value={sale.parrain}
                                                                onChange={(e) => handleSaleChange(idx, 'parrain', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm focus:ring-1 focus:ring-zinc-900 outline-none"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Programme / Lot / Localisation</label>
                                                            <input
                                                                type="text"
                                                                value={sale.programme}
                                                                onChange={(e) => handleSaleChange(idx, 'programme', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm focus:ring-1 focus:ring-zinc-900 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Dispositif</label>
                                                            <input
                                                                type="text"
                                                                value={sale.dispositif}
                                                                onChange={(e) => handleSaleChange(idx, 'dispositif', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm focus:ring-1 focus:ring-zinc-900 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Promoteur</label>
                                                            <input
                                                                type="text"
                                                                value={sale.promoteur}
                                                                onChange={(e) => handleSaleChange(idx, 'promoteur', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm focus:ring-1 focus:ring-zinc-900 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Edit Section: Financials */}
                                                <div className="border-b border-zinc-100 pb-4">
                                                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
                                                        <Calculator size={14} /> Données Financières
                                                    </h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Prix Pack</label>
                                                            <input
                                                                type="text"
                                                                value={sale.prixPack}
                                                                onChange={(e) => handleSaleChange(idx, 'prixPack', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Prix</label>
                                                            <input
                                                                type="text"
                                                                value={sale.prix}
                                                                onChange={(e) => handleSaleChange(idx, 'prix', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">T. Rem (%)</label>
                                                            <input
                                                                type="text"
                                                                value={sale.remuneration}
                                                                onChange={(e) => handleSaleChange(idx, 'remuneration', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Montant Facturable</label>
                                                            <input
                                                                type="text"
                                                                value={sale.montantFacturable}
                                                                onChange={(e) => handleSaleChange(idx, 'montantFacturable', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">CA Général</label>
                                                            <input
                                                                type="text"
                                                                value={sale.caGeneral}
                                                                onChange={(e) => handleSaleChange(idx, 'caGeneral', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">CA Perso</label>
                                                            <input
                                                                type="text"
                                                                value={sale.caPerso}
                                                                onChange={(e) => handleSaleChange(idx, 'caPerso', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">F. Ingénierie</label>
                                                            <input
                                                                type="text"
                                                                value={sale.fIngenierie}
                                                                onChange={(e) => handleSaleChange(idx, 'fIngenierie', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">F. Ingénierie RPC</label>
                                                            <input
                                                                type="text"
                                                                value={sale.fIngenierieRPC}
                                                                onChange={(e) => handleSaleChange(idx, 'fIngenierieRPC', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Edit Section: Admin & Status */}
                                                <div>
                                                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
                                                        <Clock size={14} /> Statut & Dates
                                                    </h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Année</label>
                                                            <input
                                                                type="number"
                                                                value={sale.annee}
                                                                onChange={(e) => handleSaleChange(idx, 'annee', parseInt(e.target.value))}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Date Vente</label>
                                                            <input
                                                                type="text"
                                                                value={sale.dateVente}
                                                                onChange={(e) => handleSaleChange(idx, 'dateVente', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Date Facture</label>
                                                            <input
                                                                type="text"
                                                                value={sale.dateFacture}
                                                                onChange={(e) => handleSaleChange(idx, 'dateFacture', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Statut</label>
                                                            <select
                                                                value={sale.statut}
                                                                onChange={(e) => handleSaleChange(idx, 'statut', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm bg-white"
                                                            >
                                                                <option value="A facturer">A facturer</option>
                                                                <option value="Facturé">Facturé</option>
                                                                <option value="Réglé">Réglé</option>
                                                                <option value="Annulé">Annulé</option>
                                                                <option value="Litige">Litige</option>
                                                                <option value="En cours">En cours</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Annulation (X)</label>
                                                            <select
                                                                value={sale.annulationBoolean}
                                                                onChange={(e) => handleSaleChange(idx, 'annulationBoolean', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm bg-white"
                                                            >
                                                                <option value="">Non</option>
                                                                <option value="X">X (Annulé)</option>
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-3">
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Motif Annulation</label>
                                                            <input
                                                                type="text"
                                                                value={sale.annulation}
                                                                onChange={(e) => handleSaleChange(idx, 'annulation', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-4">
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Commentaires / N° Facture</label>
                                                            <textarea
                                                                value={sale.commentaires}
                                                                onChange={(e) => handleSaleChange(idx, 'commentaires', e.target.value)}
                                                                className="w-full p-2 border border-zinc-200 rounded text-sm h-20"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {/* Display Mode: Grouped Sections */}

                                                {/* Header: Product & Badge */}
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <h4 className="font-black text-xl text-zinc-900 leading-tight">{sale.produit}</h4>
                                                            <span className="text-[10px] px-2 py-1 bg-zinc-900 text-white rounded-md font-black tracking-widest">{sale.annee}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-500 text-xs font-bold uppercase tracking-wide">
                                                            <span className="text-zinc-900">{sale.dispositif || "SANS DISPOSITIF"}</span>
                                                            <span className="text-zinc-300 hidden sm:inline">•</span>
                                                            <span className="truncate max-w-[200px]">{sale.programme}</span>
                                                            <span className="text-zinc-300 hidden sm:inline">•</span>
                                                            <span className="truncate max-w-[150px]">{sale.promoteur}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-zinc-100">
                                                        <div className="sm:text-right">
                                                            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-0.5">CA Perso</p>
                                                            <p className="font-black text-2xl text-zinc-900 tracking-tighter leading-none">{sale.caPerso || "0 €"}</p>
                                                        </div>
                                                        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${sale.statut === 'Réglé' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-50' :
                                                            (sale.statut || '').toLowerCase().includes('annul') || sale.annulationBoolean === 'X' ? 'bg-red-50 text-red-700 border-red-100' :
                                                                'bg-zinc-100 text-zinc-600 border-zinc-200'
                                                            }`}>
                                                            {sale.statut === 'Réglé' && <CheckCircle size={10} />}
                                                            {sale.statut}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Financial Details Row */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-zinc-50/80 p-5 rounded-2xl border border-zinc-100/50">
                                                    <div className="space-y-1">
                                                        <span className="block text-[10px] text-zinc-400 uppercase font-black tracking-widest">Prix Pack / Final</span>
                                                        <span className="text-xs font-bold text-zinc-900">{sale.prixPack} / {sale.prix}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="block text-[10px] text-zinc-400 uppercase font-black tracking-widest">T. Rém / Factu.</span>
                                                        <span className="text-xs font-bold text-zinc-900">{sale.remuneration} / {sale.montantFacturable}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="block text-[10px] text-zinc-400 uppercase font-black tracking-widest">CA Général</span>
                                                        <span className="text-xs font-bold text-zinc-900">{sale.caGeneral}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="block text-[10px] text-zinc-400 uppercase font-black tracking-widest">F. Ingé RPC</span>
                                                        <span className="text-xs font-bold text-zinc-900">{sale.fIngenierieRPC}</span>
                                                    </div>
                                                </div>

                                                {/* Origin & Tracking */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500 shrink-0">
                                                            <Users size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-0.5">Origine</span>
                                                            <span className="text-xs font-bold text-zinc-900 truncate block">
                                                                {sale.type === 'F' ? 'Fiche' : 'Parrainage'}
                                                                {sale.parrain && <span className="block text-[10px] text-zinc-500 font-medium normal-case mt-0.5">via {sale.parrain}</span>}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500 shrink-0">
                                                            <Calendar size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-0.5">Suivi Temporel</span>
                                                            <span className="text-xs font-bold text-zinc-900 block">
                                                                Vente : <span className="text-zinc-500">{sale.dateVente || 'N/A'}</span>
                                                                <span className="block text-[10px] text-zinc-400 font-medium normal-case mt-0.5">Fact : {sale.dateFacture || 'N/A'}</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Comments / Info */}
                                                    <div className="md:col-span-2 flex items-start gap-3">
                                                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500 shrink-0">
                                                            <Info size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="block text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-1">Commentaires & Notes</span>
                                                            <p className="text-xs text-zinc-600 leading-relaxed font-medium line-clamp-3 overflow-hidden">
                                                                {sale.commentaires ? `"${sale.commentaires}"` : "Aucun commentaire particulier."}
                                                                {sale.annulation && <span className="block mt-1.5 text-red-600 font-black uppercase text-[9px] tracking-widest bg-red-50 p-1 rounded inline-block">Motif: {sale.annulation}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddClientModal
                isOpen={isAddProductModalOpen}
                onClose={() => setIsAddProductModalOpen(false)}
                initialClientName={client.nom}
            />

            <ImportClientModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                clientId={client.id}
                initialNom={initialNom}
                initialPrenom={initialPrenom}
            />
            <ClientAnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
                client={client}
            />
            <FinancialSimulationModal
                isOpen={isSimulationModalOpen}
                onClose={() => setIsSimulationModalOpen(false)}
                client={client}
            />
        </div>
    );
};

export default ClientDetail;
