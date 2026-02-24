import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { Settings as SettingsIcon, Plus, Edit2, Trash2, Save, Calculator, Briefcase } from 'lucide-react';
import {
    createSimulationType, updateSimulationType, deleteSimulationType,
    createProduct, updateProduct, deleteProduct
} from '../services/api';
import type { SimulationType, Product } from '../types';

const Settings: React.FC = () => {
    const { products, simulationTypes, refetchData } = useData();

    // Simulation Template State
    const [isAddingSim, setIsAddingSim] = useState(false);
    const [editingSimId, setEditingSimId] = useState<number | null>(null);
    const [simFormData, setSimFormData] = useState<Partial<SimulationType>>({
        nom: '',
        type: '',
        description: ''
    });

    // Product State
    const [isAddingProd, setIsAddingProd] = useState(false);
    const [editingProdId, setEditingProdId] = useState<string | null>(null);
    const [prodFormData, setProdFormData] = useState<Partial<Product>>({
        nom: '',
        description: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    // Simulation Handlers
    const handleSaveSim = async () => {
        if (!simFormData.nom || !simFormData.type) {
            alert("Le nom et le type sont obligatoires.");
            return;
        }

        setIsSaving(true);
        try {
            if (editingSimId) {
                await updateSimulationType({ ...simFormData, id: editingSimId });
            } else {
                await createSimulationType(simFormData);
            }
            await refetchData();
            resetSimForm();
        } catch (err) {
            console.error("Error saving simulation template:", err);
            alert("Erreur lors de l'enregistrement.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSim = async (id: number) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return;

        try {
            await deleteSimulationType(id);
            await refetchData();
        } catch (err) {
            console.error("Error deleting simulation template:", err);
            alert("Erreur lors de la suppression.");
        }
    };

    const startEditSim = (template: SimulationType) => {
        setEditingSimId(template.id);
        setSimFormData({
            nom: template.nom,
            type: template.type,
            description: template.description
        });
        setIsAddingSim(true);
    };

    const resetSimForm = () => {
        setIsAddingSim(false);
        setEditingSimId(null);
        setSimFormData({ nom: '', type: '', description: '' });
    };

    // Product Handlers
    const handleSaveProd = async () => {
        if (!prodFormData.nom) {
            alert("Le nom du produit est obligatoire.");
            return;
        }

        setIsSaving(true);
        try {
            if (editingProdId) {
                await updateProduct({ ...prodFormData, id: editingProdId });
            } else {
                await createProduct(prodFormData);
            }
            await refetchData();
            resetProdForm();
        } catch (err) {
            console.error("Error saving product:", err);
            alert("Erreur lors de l'enregistrement.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProd = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

        try {
            await deleteProduct(id);
            await refetchData();
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Erreur lors de la suppression.");
        }
    };

    const startEditProd = (product: Product) => {
        setEditingProdId(product.id);
        setProdFormData({
            nom: product.nom,
            description: product.description || ''
        });
        setIsAddingProd(true);
    };

    const resetProdForm = () => {
        setIsAddingProd(false);
        setEditingProdId(null);
        setProdFormData({ nom: '', description: '' });
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
                    <SettingsIcon size={32} />
                    Paramètres
                </h1>
                <p className="text-zinc-500 mt-2">Configurez les options globales, les produits et les modèles de simulation.</p>
            </header>

            <div className="space-y-12">
                {/* Simulation Templates Management */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                                <Calculator size={20} className="text-zinc-400" />
                                Modèles de Simulation
                            </h2>
                            <p className="text-sm text-zinc-500">Gérez les types de simulations disponibles dans l'outil.</p>
                        </div>
                        {!isAddingSim && (
                            <button
                                onClick={() => setIsAddingSim(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm shadow-sm"
                            >
                                <Plus size={18} /> Nouveau modèle
                            </button>
                        )}
                    </div>

                    {isAddingSim && (
                        <div className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-200 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-zinc-900">{editingSimId ? 'Modifier le modèle' : 'Ajouter un modèle de simulation'}</h3>
                                <button onClick={resetSimForm} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                    <Calculator size={18} className="text-zinc-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Nom du modèle</label>
                                    <input
                                        value={simFormData.nom}
                                        onChange={(e) => setSimFormData({ ...simFormData, nom: e.target.value })}
                                        placeholder="Ex: Simulation Profil Prudent"
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-semibold transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Type de profil</label>
                                    <input
                                        value={simFormData.type}
                                        onChange={(e) => setSimFormData({ ...simFormData, type: e.target.value })}
                                        placeholder="Ex: Prudent, Agressif, Équilibré..."
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-semibold transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Description détaillée</label>
                                    <textarea
                                        value={simFormData.description || ''}
                                        onChange={(e) => setSimFormData({ ...simFormData, description: e.target.value })}
                                        placeholder="Décrivez les spécificités de ce modèle de simulation..."
                                        rows={6}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-semibold resize-y min-h-[120px] transition-all"
                                    />
                                    <p className="text-[10px] text-zinc-400 mt-1 italic">Le champ description est extensible en tirant sur le coin inférieur droit.</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-200">
                                <button
                                    onClick={resetSimForm}
                                    className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveSim}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm disabled:opacity-50 shadow-md hover:shadow-lg"
                                >
                                    {isSaving ? 'Enregistrement...' : <><Save size={18} /> Enregistrer le modèle</>}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Nom</th>
                                    <th className="px-6 py-4">Profil</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {simulationTypes.map((template) => (
                                    <tr key={template.id} className="hover:bg-zinc-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-zinc-900">{template.nom}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md text-[11px] font-black uppercase">
                                                {template.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 max-w-sm">
                                            <p className="line-clamp-2">{template.description || "-"}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditSim(template)}
                                                    className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSim(template.id)}
                                                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {simulationTypes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic">
                                            Aucun modèle de simulation configuré.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <hr className="border-zinc-100" />

                {/* Product Management Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                                <Briefcase size={20} className="text-zinc-400" />
                                Gestion des Produits
                            </h2>
                            <p className="text-sm text-zinc-500">Ajoutez, modifiez ou supprimez les produits de la liste.</p>
                        </div>
                        {!isAddingProd && (
                            <button
                                onClick={() => setIsAddingProd(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm shadow-sm"
                            >
                                <Plus size={18} /> Nouveau produit
                            </button>
                        )}
                    </div>

                    {isAddingProd && (
                        <div className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-200 shadow-xl">
                            <h3 className="font-black text-zinc-900 mb-6">{editingProdId ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Nom du produit</label>
                                    <input
                                        value={prodFormData.nom}
                                        onChange={(e) => setProdFormData({ ...prodFormData, nom: e.target.value })}
                                        placeholder="Ex: Assurance Vie, PER, SCPI..."
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-semibold transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Description (optionnelle)</label>
                                    <textarea
                                        value={prodFormData.description || ''}
                                        onChange={(e) => setProdFormData({ ...prodFormData, description: e.target.value })}
                                        placeholder="Brève description du produit..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-semibold resize-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-200">
                                <button
                                    onClick={resetProdForm}
                                    className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveProd}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm disabled:opacity-50 shadow-md hover:shadow-lg"
                                >
                                    {isSaving ? 'Enregistrement...' : <><Save size={18} /> Enregistrer le produit</>}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="group relative p-5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-zinc-900 hover:bg-white transition-all shadow-sm hover:shadow-md"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-sm font-black text-zinc-900">{product.nom}</h4>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                            <button
                                                onClick={() => startEditProd(product)}
                                                className="p-1 text-zinc-400 hover:text-zinc-900 rounded transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProd(product.id)}
                                                className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-500 line-clamp-2">
                                        {product.description || "Aucune description"}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {products.length === 0 && (
                            <p className="text-center py-12 text-zinc-400 italic bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                                Aucun produit configuré.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
