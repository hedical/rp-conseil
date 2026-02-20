import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { updateSaleData, deleteSaleData } from '../services/api';
import { ArrowLeft, Edit, Save, FileText, CheckCircle, Trash2, Plus, Calculator, Upload } from 'lucide-react';
import AddClientModal from '../components/AddClientModal';

const ClientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { clients, password, refetchData } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [editedSales, setEditedSales] = useState<any[]>([]);

    // Modal state for adding product
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

    // Find client
    const client = clients.find(c => c.id === Number(id));

    if (!client) {
        return <div className="p-8 text-center text-zinc-500">Client introuvable</div>;
    }

    const startEditing = () => {
        if (client) {
            setEditedSales(JSON.parse(JSON.stringify(client.sales))); // Deep copy
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
        if (!password) {
            alert("Erreur: Mot de passe non disponible");
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            // Update all modified sales
            for (const sale of editedSales) {
                await updateSaleData(sale, password);
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

    const handleDeleteSale = async (saleId: number, rowNumber: number) => {
        if (!password) return;
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.")) return;

        setIsDeleting(true);
        try {
            await deleteSaleData(saleId, rowNumber, password);
            await refetchData();
            // If it was the last sale, redirect to list
            if (client.sales.length <= 1) {
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
        if (!password) return;
        if (!window.confirm(`ATTENTION : Vous allez supprimer TOUS les dossiers de ${client.name}. Êtes-vous sûr ?`)) return;

        setIsDeleting(true);
        try {
            // Delete all sales sequentially AND in reverse order of Row Number
            // This prevents index shifting from affecting subsequent deletions if n8n uses row numbers
            const sortedSales = [...client.sales].sort((a, b) => b.row_number - a.row_number);

            for (const sale of sortedSales) {
                await deleteSaleData(sale.id, sale.row_number, password);
            }
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

            <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
                            {client.name}
                            <span className="px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">Actif</span>
                        </h1>
                        <p className="text-zinc-500 mt-2 font-mono text-sm">ID: {client.id} • {client.sales.length} dossiers actifs</p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            disabled
                            className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-400 rounded-lg border border-zinc-200 cursor-not-allowed text-sm font-medium relative group"
                        >
                            <Upload size={16} />
                            Importer fiches
                            <span className="absolute -top-2 -right-2 bg-zinc-100 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 font-bold">À VENIR</span>
                        </button>

                        <button
                            disabled
                            className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-400 rounded-lg border border-zinc-200 cursor-not-allowed text-sm font-medium relative group"
                        >
                            <Calculator size={16} />
                            Simulation financière
                            <span className="absolute -top-2 -right-2 bg-zinc-100 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 font-bold">À VENIR</span>
                        </button>

                        <button
                            onClick={() => setIsAddProductModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors text-sm font-medium"
                        >
                            <Plus size={16} /> Nouveau Produit
                        </button>

                        <button
                            onClick={handleDeleteClient}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-100"
                        >
                            <Trash2 size={16} /> Supprimer Client
                        </button>

                        {isEditing && (
                            <button
                                onClick={cancelEditing}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border border-zinc-200 hover:border-zinc-900 text-zinc-600 hover:text-zinc-900 bg-white"
                            >
                                Annuler
                            </button>
                        )}
                        <button
                            onClick={() => isEditing ? handleSave() : startEditing()}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${isEditing
                                ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                                : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50'
                                }`}
                        >
                            {isEditing ? <><Save size={16} /> {isSaving ? 'Enregistrement...' : 'Enregistrer'}</> : <><Edit size={16} /> Modifier</>}
                        </button>
                    </div>
                </div>

                {saveError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {saveError}
                    </div>
                )}


                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
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
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3 pb-4 border-b border-zinc-100">
                            <FileText size={20} className="text-zinc-400" />
                            Historique des Dossiers
                        </h3>

                        <div className="grid gap-4">
                            <div className="grid gap-4">
                                {(isEditing ? editedSales : client.sales).map((sale, idx) => (
                                    <div key={idx} className="bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-400 transition-all duration-200 relative group">
                                        {/* Delete Button for individual sale */}
                                        {!isEditing && (
                                            <button
                                                onClick={() => handleDeleteSale(sale.id, sale.row_number)}
                                                className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Supprimer ce dossier"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}

                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Produit</label>
                                                        <input
                                                            type="text"
                                                            value={sale.produit}
                                                            onChange={(e) => handleSaleChange(idx, 'produit', e.target.value)}
                                                            className="w-full p-2 border border-zinc-300 rounded text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Année</label>
                                                        <input
                                                            type="number"
                                                            value={sale.annee}
                                                            onChange={(e) => handleSaleChange(idx, 'annee', parseInt(e.target.value))}
                                                            className="w-full p-2 border border-zinc-300 rounded text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Programme</label>
                                                    <input
                                                        type="text"
                                                        value={sale.programme}
                                                        onChange={(e) => handleSaleChange(idx, 'programme', e.target.value)}
                                                        className="w-full p-2 border border-zinc-300 rounded text-sm"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Prix</label>
                                                        <input
                                                            type="text"
                                                            value={sale.prix}
                                                            onChange={(e) => handleSaleChange(idx, 'prix', e.target.value)}
                                                            className="w-full p-2 border border-zinc-300 rounded text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Commission</label>
                                                        <input
                                                            type="text"
                                                            value={sale.remuneration}
                                                            onChange={(e) => handleSaleChange(idx, 'remuneration', e.target.value)}
                                                            className="w-full p-2 border border-zinc-300 rounded text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Statut</label>
                                                        <select
                                                            value={sale.statut}
                                                            onChange={(e) => handleSaleChange(idx, 'statut', e.target.value)}
                                                            className="w-full p-2 border border-zinc-300 rounded text-sm bg-white"
                                                        >
                                                            <option value="A facturer">A facturer</option>
                                                            <option value="Facturé">Facturé</option>
                                                            <option value="Réglé">Réglé</option>
                                                            <option value="Annulé">Annulé</option>
                                                            <option value="Litige">Litige</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">CA Perso</label>
                                                        <input
                                                            type="text"
                                                            value={sale.caPerso}
                                                            onChange={(e) => handleSaleChange(idx, 'caPerso', e.target.value)}
                                                            className="w-full p-2 border border-zinc-300 rounded text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">CA Général</label>
                                                        <input
                                                            type="text"
                                                            value={sale.caGeneral}
                                                            onChange={(e) => handleSaleChange(idx, 'caGeneral', e.target.value)}
                                                            className="w-full p-2 border border-zinc-300 rounded text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="font-bold text-lg text-zinc-900">{sale.produit}</h4>
                                                            <span className="text-xs px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded font-medium text-zinc-600">{sale.annee}</span>
                                                        </div>
                                                        <p className="text-sm text-zinc-700 font-medium">{sale.programme}</p>
                                                        <p className="text-xs text-zinc-500 mt-1">Promoteur: {sale.promoteur}</p>
                                                    </div>
                                                    <div className="text-right mr-8">
                                                        <p className="font-bold text-zinc-900 text-lg">{sale.prix}</p>
                                                        <p className="text-xs text-zinc-500 font-medium bg-zinc-50 px-2 py-1 rounded inline-block mt-1">Com: {sale.remuneration}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-zinc-100 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-zinc-500">
                                                    <div>
                                                        <span className="block text-zinc-400 mb-1">Date Vente</span>
                                                        <span className="font-medium text-zinc-700">{sale.dateVente || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-zinc-400 mb-1">Statut</span>
                                                        <span className={`inline-flex items-center gap-1 font-medium ${sale.statut === 'Annulé' ? 'text-red-600' : 'text-zinc-900'}`}>
                                                            {sale.statut === 'Réglé' && <CheckCircle size={12} />}
                                                            {sale.statut}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-zinc-400 mb-1">CA Perso</span>
                                                        <span className="font-medium text-zinc-700">{sale.caPerso}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-zinc-400 mb-1">CA Général</span>
                                                        <span className="font-medium text-zinc-700">{sale.caGeneral}</span>
                                                    </div>
                                                </div>
                                            </>
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
                initialClientName={client.name}
            />
        </div>
    );
};

export default ClientDetail;
