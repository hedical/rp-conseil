import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { createClient, createSaleData } from '../services/api';
import type { Sale } from '../types';
import { X, Plus, Loader } from 'lucide-react';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialClientName?: string;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, initialClientName }) => {
    const { clients, refetchData, products } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial state for new sale
    const [newSale, setNewSale] = useState<Partial<Sale>>({
        produit: '',
        type: 'F',
        annee: new Date().getFullYear(),
        statut: 'A facturer',
        remuneration: '0,00%',
        prix: '0,00 €',
        caPerso: '0,00 €',
        caGeneral: '0,00 €',
        programme: '',
        promoteur: '',
        dateVente: '',
        parrain: '',
        dispositif: 'PINEL',
        prixPack: '0,00 €',
        fIngenierie: 'SO',
        fIngenierieRPC: '0,00 €',
        montantFacturable: '0,00 €',
        dateFacture: '',
        annulation: '',
        commentaires: '',
    });

    const [clientNom, setClientNom] = useState(initialClientName || '');

    // Update nom if initialClientName changes
    useEffect(() => {
        if (initialClientName) {
            setClientNom(initialClientName);
        }
    }, [initialClientName]);

    const handleChange = (field: keyof Sale | 'nom', value: any) => {
        if (field === 'nom') {
            setClientNom(value);
        } else {
            setNewSale(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientNom || !newSale.produit) {
            setError("Le nom et le produit sont obligatoires.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let clientId: string;

            // 1. Find or create client
            const existingClient = clients.find(c => c.nom.toLowerCase() === clientNom.toLowerCase());

            if (existingClient) {
                clientId = existingClient.id;
            } else {
                clientId = await createClient({ nom: clientNom });
            }

            // 2. Create the sale
            const saleToSubmit: Partial<Sale> = {
                ...newSale,
                client_id: clientId
            };

            await createSaleData(saleToSubmit);
            await refetchData();

            onClose();
            // Reset form
            setNewSale({
                produit: '',
                type: 'F',
                annee: new Date().getFullYear(),
                statut: 'A facturer',
                remuneration: '0,00%',
                prix: '0,00 €',
                caPerso: '0,00 €',
                caGeneral: '0,00 €',
                programme: '',
                promoteur: '',
                dateVente: '',
                parrain: '',
                dispositif: 'PINEL',
                prixPack: '0,00 €',
                fIngenierie: 'SO',
                fIngenierieRPC: '0,00 €',
                montantFacturable: '0,00 €',
                dateFacture: '',
                annulation: '',
                commentaires: '',
            });
            if (!initialClientName) setClientNom('');

        } catch (err) {
            console.error("Error adding client/sale:", err);
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
                        {/* Client Info */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Nom du Client *</label>
                            <input
                                type="text"
                                value={clientNom}
                                onChange={(e) => handleChange('nom', e.target.value)}
                                className={`w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-black transition-all ${initialClientName ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : ''}`}
                                placeholder="ex: DUPONT Jean"
                                required
                                disabled={!!initialClientName}
                            />
                        </div>

                        {/* Section: Product & Origin */}
                        <div className="md:col-span-2 border-b border-zinc-100 pb-2 mt-2">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Produit & Origine</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Produit *</label>
                            <select
                                value={newSale.produit}
                                onChange={(e) => {
                                    handleChange('produit', e.target.value);
                                    if (!newSale.dispositif) handleChange('dispositif', e.target.value);
                                }}
                                className="w-full p-3 border border-zinc-300 rounded-lg bg-white"
                                required
                            >
                                <option value="">Choisir un produit...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.nom}>{p.nom}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Dispositif</label>
                            <input
                                type="text"
                                value={newSale.dispositif}
                                onChange={(e) => handleChange('dispositif', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                                placeholder="ex: PINEL"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Programme / Lot</label>
                            <input
                                type="text"
                                value={newSale.programme}
                                onChange={(e) => handleChange('programme', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Promoteur</label>
                            <input
                                type="text"
                                value={newSale.promoteur}
                                onChange={(e) => handleChange('promoteur', e.target.value)}
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
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Nom Parrain</label>
                            <input
                                type="text"
                                value={newSale.parrain}
                                onChange={(e) => handleChange('parrain', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                                placeholder="Si parrainage"
                            />
                        </div>

                        {/* Section: Financials */}
                        <div className="md:col-span-2 border-b border-zinc-100 pb-2 mt-4">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Finances</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Prix Pack</label>
                            <input
                                type="text"
                                value={newSale.prixPack}
                                onChange={(e) => handleChange('prixPack', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

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
                            <label className="block text-sm font-medium text-zinc-700 mb-1">CA Perso *</label>
                            <input
                                type="text"
                                value={newSale.caPerso}
                                onChange={(e) => {
                                    handleChange('caPerso', e.target.value);
                                    if (!newSale.montantFacturable || newSale.montantFacturable === '0,00 €') {
                                        handleChange('montantFacturable', e.target.value);
                                    }
                                }}
                                className="w-full p-3 border border-zinc-300 rounded-lg font-bold"
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

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Montant Facturable</label>
                            <input
                                type="text"
                                value={newSale.montantFacturable}
                                onChange={(e) => handleChange('montantFacturable', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">F. Ingénierie</label>
                            <input
                                type="text"
                                value={newSale.fIngenierie}
                                onChange={(e) => handleChange('fIngenierie', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">F. Ingénierie RPC</label>
                            <input
                                type="text"
                                value={newSale.fIngenierieRPC}
                                onChange={(e) => handleChange('fIngenierieRPC', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        {/* Section: Admin */}
                        <div className="md:col-span-2 border-b border-zinc-100 pb-2 mt-4">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Suivi & Administratif</h3>
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
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Date Vente</label>
                            <input
                                type="text"
                                value={newSale.dateVente}
                                onChange={(e) => handleChange('dateVente', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg"
                                placeholder="DD/MM/YYYY"
                            />
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
                                <option value="En cours">En cours</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Commentaires / N° Facture</label>
                            <textarea
                                value={newSale.commentaires}
                                onChange={(e) => handleChange('commentaires', e.target.value)}
                                className="w-full p-3 border border-zinc-300 rounded-lg h-24"
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
                            {isSubmitting ? <><Loader className="animate-spin" size={20} /> Ajout en cours...</> : <><Plus size={20} /> Ajouter le Dossier</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
