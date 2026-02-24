import React, { useState, useEffect } from 'react';
import { X, Users, Info, FileText, ChevronRight, Download, Loader, CheckCircle2, ArrowLeft, Edit2, Save } from 'lucide-react';
import { useData } from '../hooks/useData';
import { updateClientData } from '../services/api';
import type { Client } from '../types';

interface ClientAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
}

const ClientAnalysisModal: React.FC<ClientAnalysisModalProps> = ({ isOpen, onClose, client }) => {
    const { password, refetchData } = useData();
    const [isRestituting, setIsRestituting] = useState(false);
    const [restitutionStatus, setRestitutionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [restitutionHtml, setRestitutionHtml] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Local state for client fields to enable editing
    const [editedClient, setEditedClient] = useState<Client>({ ...client });

    // Update local state if client prop changes
    useEffect(() => {
        setEditedClient({ ...client });
    }, [client]);

    if (!isOpen) return null;

    const handleFieldChange = (field: keyof Client, value: any) => {
        setEditedClient(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveClient = async () => {
        setIsSaving(true);
        try {
            await updateClientData(editedClient);
            await refetchData();
            setIsEditing(false);
            setRestitutionStatus('idle'); // Back to "Restitution du bilan"
        } catch (err) {
            console.error("Error saving client technical data:", err);
            alert("Erreur lors de la sauvegarde des modifications.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartEditing = () => {
        setIsEditing(true);
        setRestitutionHtml(null); // Return to diagnostic view to see the fields being edited
        setRestitutionStatus('idle'); // Reset button status
    };

    const handleRestitution = async () => {
        setIsRestituting(true);
        setRestitutionStatus('idle');

        // Filter only the fields displayed in the modal
        const filteredClient = {
            nom: editedClient.nom,
            identite: editedClient.identite,
            situation_matrimoniale_fiscale: editedClient.situation_matrimoniale_fiscale,
            capacite_epargne: editedClient.capacite_epargne,
            capacite_emprunt: editedClient.capacite_emprunt,
            patrimoine_brut: editedClient.patrimoine_brut,
            objectifs: editedClient.objectifs,
            immobilier: editedClient.immobilier,
            autres_charges: editedClient.autres_charges,
            epargne: editedClient.epargne,
            autres_observations: editedClient.autres_observations,
            analyse_profil: editedClient.analyse_profil
        };

        try {
            const response = await fetch('https://databuildr.app.n8n.cloud/webhook/render', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-RP-Password': password || ''
                },
                body: JSON.stringify({
                    message: filteredClient
                }),
            });

            if (response.ok) {
                const text = await response.text();
                try {
                    // Try parsing as JSON first in case it's wrapped
                    const data = JSON.parse(text);
                    setRestitutionHtml(data.content || data.message || data.html || text);
                } catch {
                    // It's raw HTML
                    setRestitutionHtml(text);
                }
                setRestitutionStatus('success');
            } else {
                const text = await response.text();
                if (text.includes('Wrong password')) {
                    throw new Error("Mot de passe incorrect pour le webhook.");
                }
                throw new Error(`Erreur: ${response.status}`);
            }
        } catch (err) {
            console.error("Restitution error:", err);
            setRestitutionStatus('error');
            setTimeout(() => setRestitutionStatus('idle'), 4000);
        } finally {
            setIsRestituting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 border-b border-zinc-100 bg-zinc-50/50 gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <Info className="text-zinc-400 shrink-0 hidden sm:block" size={24} />
                            <h2 className="text-lg md:text-2xl font-black text-zinc-900 truncate">
                                {isEditing ? (
                                    <input
                                        value={editedClient.nom}
                                        onChange={(e) => handleFieldChange('nom', e.target.value)}
                                        className="bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-zinc-900 w-full max-w-md"
                                        placeholder="Nom du client"
                                    />
                                ) : (
                                    <span>Analyse : {editedClient.nom}</span>
                                )}
                            </h2>
                        </div>
                        <p className="text-[10px] md:text-sm text-zinc-500 mt-1 font-medium uppercase tracking-widest hidden sm:block">Fiche technique et patrimoniale</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => isEditing ? handleSaveClient() : handleStartEditing()}
                            disabled={isSaving}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black transition-all shadow-md hover:shadow-lg text-[11px] md:text-sm ${isEditing ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white text-zinc-900 border border-zinc-200 hover:border-zinc-900'
                                }`}
                        >
                            {isSaving ? (
                                <><Loader className="animate-spin" size={16} /></>
                            ) : isEditing ? (
                                <><Save size={16} /> <span className="hidden sm:inline">Enregistrer</span></>
                            ) : (
                                <><Edit2 size={16} /> <span className="hidden sm:inline">Modifier</span></>
                            )}
                        </button>

                        {!isEditing && (
                            <button
                                onClick={handleRestitution}
                                disabled={isRestituting}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black transition-all shadow-md hover:shadow-lg text-[11px] md:text-sm ${restitutionStatus === 'success' ? 'bg-emerald-500 text-white' :
                                    restitutionStatus === 'error' ? 'bg-red-500 text-white' :
                                        'bg-zinc-900 text-white hover:bg-zinc-800'
                                    }`}
                            >
                                {isRestituting ? (
                                    <><Loader className="animate-spin" size={16} /></>
                                ) : restitutionStatus === 'success' ? (
                                    <><CheckCircle2 size={16} /> <span className="hidden sm:inline">Envoyé</span></>
                                ) : (
                                    <><Download size={16} /> <span className="hidden sm:inline">Restitution</span><span className="sm:hidden">PDF</span></>
                                )}
                            </button>
                        )}

                        <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors bg-zinc-100 shrink-0">
                            <X size={20} className="text-zinc-600" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    {restitutionHtml ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-zinc-900">Aperçu du Bilan Généré</h3>
                                <button
                                    onClick={() => setRestitutionHtml(null)}
                                    className="text-sm font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                                >
                                    <ArrowLeft size={14} /> Retour au diagnostic
                                </button>
                            </div>
                            <div
                                className={`bg-white shadow-xl rounded-2xl border border-zinc-200 p-8 mx-auto max-w-4xl min-h-[600px] overflow-hidden ${restitutionHtml.trim().startsWith('<') ? '' : 'whitespace-pre-wrap font-serif text-lg leading-relaxed text-zinc-800'}`}
                                dangerouslySetInnerHTML={{ __html: restitutionHtml }}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Sidebar: Situation & Objectifs */}
                            <div className="space-y-6">
                                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Users size={14} /> Profil & Situation
                                    </h3>
                                    <ul className="space-y-6">
                                        <li>
                                            <p className="text-[10px] text-zinc-400 uppercase font-black mb-1.5">Identité / Composition</p>
                                            {isEditing ? (
                                                <input
                                                    value={editedClient.identite || ''}
                                                    onChange={(e) => handleFieldChange('identite', e.target.value)}
                                                    className="w-full text-sm font-semibold text-zinc-900 p-2 bg-white border border-zinc-200 rounded outline-none focus:ring-1 focus:ring-zinc-900"
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-zinc-900 leading-relaxed">{editedClient.identite || "-"}</p>
                                            )}
                                        </li>
                                        <li>
                                            <p className="text-[10px] text-zinc-400 uppercase font-black mb-1.5">Situation Matrimoniale / Fiscale</p>
                                            {isEditing ? (
                                                <textarea
                                                    value={editedClient.situation_matrimoniale_fiscale || ''}
                                                    onChange={(e) => handleFieldChange('situation_matrimoniale_fiscale', e.target.value)}
                                                    className="w-full text-sm font-semibold text-zinc-900 p-2 bg-white border border-zinc-200 rounded outline-none focus:ring-1 focus:ring-zinc-900 min-h-[60px] resize-none"
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-zinc-900 leading-relaxed">{editedClient.situation_matrimoniale_fiscale || "-"}</p>
                                            )}
                                        </li>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200">
                                            <li>
                                                <p className="text-[10px] text-zinc-400 uppercase font-black mb-1.5">Capa. Épargne</p>
                                                {isEditing ? (
                                                    <input
                                                        value={editedClient.capacite_epargne || ''}
                                                        onChange={(e) => handleFieldChange('capacite_epargne', e.target.value)}
                                                        className="w-full text-lg font-black text-zinc-900 p-1 bg-white border border-zinc-200 rounded outline-none focus:ring-1 focus:ring-zinc-900"
                                                    />
                                                ) : (
                                                    <p className="text-lg font-black text-zinc-900">{editedClient.capacite_epargne || "-"}</p>
                                                )}
                                            </li>
                                            <li>
                                                <p className="text-[10px] text-zinc-400 uppercase font-black mb-1.5">Capa. Emprunt</p>
                                                {isEditing ? (
                                                    <input
                                                        value={editedClient.capacite_emprunt || ''}
                                                        onChange={(e) => handleFieldChange('capacite_emprunt', e.target.value)}
                                                        className="w-full text-lg font-black text-zinc-900 p-1 bg-white border border-zinc-200 rounded outline-none focus:ring-1 focus:ring-zinc-900"
                                                    />
                                                ) : (
                                                    <p className="text-lg font-black text-zinc-900">{editedClient.capacite_emprunt || "-"}</p>
                                                )}
                                            </li>
                                        </div>

                                        <li className="pt-4 border-t border-zinc-200">
                                            <p className="text-[10px] text-zinc-400 uppercase font-black mb-1.5">Patrimoine Brut (€)</p>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editedClient.patrimoine_brut || 0}
                                                    onChange={(e) => handleFieldChange('patrimoine_brut', parseFloat(e.target.value) || 0)}
                                                    className="w-full text-2xl font-black text-zinc-900 p-2 bg-white border border-zinc-200 rounded outline-none focus:ring-1 focus:ring-zinc-900"
                                                />
                                            ) : (
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-2xl font-black text-zinc-900">
                                                        {editedClient.patrimoine_brut ? editedClient.patrimoine_brut.toLocaleString('fr-FR') : "0"}
                                                    </p>
                                                    <span className="text-sm font-bold text-zinc-400">€</span>
                                                </div>
                                            )}
                                        </li>
                                    </ul>
                                </div>

                                {/* Objectifs moved to sidebar */}
                                <div className="p-6 bg-white rounded-2xl border-2 border-zinc-900 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 bg-zinc-900 text-white rounded-bl-xl">
                                        <FileText size={14} />
                                    </div>
                                    <p className="text-[10px] text-zinc-900 uppercase font-black mb-3">Objectifs Client</p>
                                    {isEditing ? (
                                        <textarea
                                            value={editedClient.objectifs || ''}
                                            onChange={(e) => handleFieldChange('objectifs', e.target.value)}
                                            className="w-full text-sm text-zinc-900 font-bold p-2 bg-zinc-50 border border-zinc-200 rounded min-h-[100px] outline-none"
                                        />
                                    ) : (
                                        <p className="text-sm text-zinc-900 font-bold leading-relaxed whitespace-pre-wrap">{editedClient.objectifs || "Objectifs non définis"}</p>
                                    )}
                                </div>
                            </div>

                            {/* Main Technical Area */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                        <p className="text-[10px] text-zinc-400 uppercase font-black mb-3 flex items-center gap-2">
                                            <ChevronRight size={10} className="text-zinc-900" /> Immobilier
                                        </p>
                                        {isEditing ? (
                                            <textarea
                                                value={editedClient.immobilier || ''}
                                                onChange={(e) => handleFieldChange('immobilier', e.target.value)}
                                                className="w-full text-sm text-zinc-700 p-2 bg-zinc-50/50 border border-zinc-100 rounded min-h-[80px] outline-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{editedClient.immobilier || "Aucun détail immobilier"}</p>
                                        )}
                                    </div>
                                    <div className="p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                        <p className="text-[10px] text-zinc-400 uppercase font-black mb-3 flex items-center gap-2">
                                            <ChevronRight size={10} className="text-zinc-900" /> Autres Charges
                                        </p>
                                        {isEditing ? (
                                            <textarea
                                                value={editedClient.autres_charges || ''}
                                                onChange={(e) => handleFieldChange('autres_charges', e.target.value)}
                                                className="w-full text-sm text-zinc-700 p-2 bg-zinc-50/50 border border-zinc-100 rounded min-h-[80px] outline-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{editedClient.autres_charges || "Aucune autre charge"}</p>
                                        )}
                                    </div>
                                    <div className="p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                        <p className="text-[10px] text-zinc-400 uppercase font-black mb-3 flex items-center gap-2">
                                            <ChevronRight size={10} className="text-zinc-900" /> Épargne & Placements
                                        </p>
                                        {isEditing ? (
                                            <textarea
                                                value={editedClient.epargne || ''}
                                                onChange={(e) => handleFieldChange('epargne', e.target.value)}
                                                className="w-full text-sm text-zinc-700 p-2 bg-zinc-50/50 border border-zinc-100 rounded min-h-[80px] outline-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{editedClient.epargne || "Aucun placement renseigné"}</p>
                                        )}
                                    </div>
                                    <div className="p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                        <p className="text-[10px] text-zinc-400 uppercase font-black mb-3 flex items-center gap-2">
                                            <ChevronRight size={10} className="text-zinc-900" /> Autres Observations
                                        </p>
                                        {isEditing ? (
                                            <textarea
                                                value={editedClient.autres_observations || ''}
                                                onChange={(e) => handleFieldChange('autres_observations', e.target.value)}
                                                className="w-full text-sm text-zinc-700 p-2 bg-zinc-50/50 border border-zinc-100 rounded min-h-[80px] outline-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{editedClient.autres_observations || "Pas d'observations particulières"}</p>
                                        )}
                                    </div>

                                    {/* Full width Synthesis Analysis (spanning 2 columns) */}
                                    <div className="md:col-span-2 p-8 bg-blue-50/50 rounded-2xl border border-blue-100 border-l-8 border-l-blue-600 shadow-sm">
                                        <p className="text-[10px] text-blue-700 uppercase font-black mb-4 flex items-center gap-2">
                                            <Info size={16} /> Analyse Synthétique du Profil
                                        </p>
                                        {isEditing ? (
                                            <textarea
                                                value={editedClient.analyse_profil || ''}
                                                onChange={(e) => handleFieldChange('analyse_profil', e.target.value)}
                                                className="w-full text-base text-blue-900 font-semibold leading-relaxed p-2 bg-white/50 border border-blue-200 rounded min-h-[100px] outline-none italic"
                                                placeholder="Saisir l'analyse synthétique..."
                                            />
                                        ) : (
                                            <p className="text-base text-blue-900 font-semibold leading-relaxed whitespace-pre-wrap italic">
                                                {editedClient.analyse_profil ? `"${editedClient.analyse_profil}"` : "Analyse en attente..."}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-10 py-3 bg-white text-zinc-900 border border-zinc-200 rounded-xl font-black hover:bg-zinc-50 transition-all text-xs md:text-sm uppercase tracking-widest shadow-sm"
                    >
                        Fermer le diagnostic
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientAnalysisModal;
