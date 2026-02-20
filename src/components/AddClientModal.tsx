import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { updateSaleData } from '../services/api';
import type { Sale } from '../types';
import { X, Plus, Loader } from 'lucide-react';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialClientName?: string;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, initialClientName }) => {
    const { sales, password, refetchData } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial state for new sale
    const [newSale, setNewSale] = useState<Partial<Sale>>({
        produit: 'PINEL',
        type: 'F',
        annee: new Date().getFullYear(),
        statut: 'A facturer',
        remuneration: '0,00%',
        prix: '0,00 €',
        caPerso: '0,00 €',
        caGeneral: '0,00 €',
        // Initialize other fields as empty strings to avoid uncontrolled input warnings
        nom: initialClientName || '',
        programme: '',
        promoteur: '',
        dateVente: '',
    });

    // Update nom if initialClientName changes
    useEffect(() => {
        if (initialClientName) {
            setNewSale(prev => ({ ...prev, nom: initialClientName }));
        }
    }, [initialClientName]);

    // Calculate next ID when modal opens or sales change
    const [nextId, setNextId] = useState<number>(0);

    useEffect(() => {
        if (isOpen && sales.length > 0) {
            const allIds = sales.map(s => s.id).filter(id => !isNaN(id));
            const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
            const computedNext = maxId + 1;

            console.log("🔍 Computing Next ID:", {
                totalSales: sales.length,
                maxFound: maxId,
                next: computedNext
            });

            setNextId(computedNext);
        }
    }, [isOpen, sales]);

    const handleChange = (field: keyof Sale, value: any) => {
        setNewSale(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            setError("Mot de passe manquant. Veuillez recharger la page.");
            return;
        }

        if (!newSale.nom || !newSale.produit) {
            setError("Le nom et le produit sont obligatoires.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Prepare the full sale object
            const saleToSubmit: Sale = {
                ...newSale as Sale,
                id: nextId,
                row_number: 0, // New items don't have a row number yet, n8n will assign append
                // Default values for fields not in form
                parrain: '',
                prixPack: '0,00 €',
                dispositif: newSale.produit || '',
                fIngenierie: 'SO',
                fIngenierieRPC: '0,00 €',
                montantFacturable: newSale.caPerso || '0,00 €',
                dateFacture: '',
                annulation: '',
                annulationBoolean: '',
                commentaires: '',
            };

            await updateSaleData(saleToSubmit, password);
            await refetchData();

            onClose();
            // Reset form (optional, as component unmounts on close usually)
            setNewSale({
                produit: 'PINEL',
                type: 'F',
                annee: new Date().getFullYear(),
                statut: 'A facturer',
                remuneration: '0,00%',
                prix: '0,00 €',
                caPerso: '0,00 €',
                caGeneral: '0,00 €',
                nom: initialClientName || '',
                programme: '',
                promoteur: '',
                dateVente: '',
            });

        } catch (err) {
            console.error("Error adding client:", err);
            setError("Erreur lors de l'ajout. Vérifiez votre connexion.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-zinc-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <Plus className="text-zinc-900" size={24} />
                        {initialClientName ? `Nouveau Produit pour ${initialClientName}` : 'Nouveau Dossier Client'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ID - Read Only */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">ID Dossier (Auto)</label>
                            <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-500 font-mono font-bold">
                                {nextId}
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Nom du Client *</label>
                            <input
                                type="text"
                                value={newSale.nom}
                                onChange={(e) => handleChange('nom', e.target.value)}
                                className={`w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-black transition-all ${initialClientName ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : ''}`}
                                placeholder="ex: DUPONT Jean"
                                required
                                disabled={!!initialClientName}
                            />
                        </div>

                        {/* Deal Info */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Produit *</label>
                            <input
                                type="text"
                                value={newSale.produit}
                                onChange={(e) => handleChange('produit', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                                placeholder="ex: PINEL"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Année</label>
                            <input
                                type="number"
                                value={newSale.annee}
                                onChange={(e) => handleChange('annee', parseInt(e.target.value))}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Type (F/P)</label>
                            <select
                                value={newSale.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg bg-white"
                            >
                                <option value="F">Fiche (Partenaire)</option>
                                <option value="P">Parrainage (Client)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Statut</label>
                            <select
                                value={newSale.statut}
                                onChange={(e) => handleChange('statut', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg bg-white"
                            >
                                <option value="A facturer">A facturer</option>
                                <option value="Facturé">Facturé</option>
                                <option value="Réglé">Réglé</option>
                                <option value="Annulé">Annulé</option>
                                <option value="Litige">Litige</option>
                            </select>
                        </div>

                        {/* Financials */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Prix</label>
                            <input
                                type="text"
                                value={newSale.prix}
                                onChange={(e) => handleChange('prix', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Commission (%)</label>
                            <input
                                type="text"
                                value={newSale.remuneration}
                                onChange={(e) => handleChange('remuneration', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">CA Perso</label>
                            <input
                                type="text"
                                value={newSale.caPerso}
                                onChange={(e) => handleChange('caPerso', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">CA Général</label>
                            <input
                                type="text"
                                value={newSale.caGeneral}
                                onChange={(e) => handleChange('caGeneral', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Programme / Lot</label>
                            <input
                                type="text"
                                value={newSale.programme}
                                onChange={(e) => handleChange('programme', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Promoteur</label>
                            <input
                                type="text"
                                value={newSale.promoteur}
                                onChange={(e) => handleChange('promoteur', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-lg font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                            disabled={isSubmitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? <><Loader className="animate-spin" size={20} /> Ajout en cours...</> : <><Plus size={20} /> Ajouter le Client</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
