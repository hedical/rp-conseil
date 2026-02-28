import React, { useState } from 'react';
import { X, Calculator, Loader, FileText, Send, Download, Save } from 'lucide-react';
import { useData } from '../hooks/useData';
import { updateClientSimulation } from '../services/api';
import type { Client } from '../types';

interface FinancialSimulationModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
}

const FinancialSimulationModal: React.FC<FinancialSimulationModalProps> = ({ isOpen, onClose, client }) => {
    const { simulationTypes, refetchData, password } = useData();
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Helper to clean markdown from JSON or literal \n
    const cleanMarkdown = (raw: string | null): string | null => {
        if (!raw) return null;
        if (typeof raw !== 'string') return raw;

        // Skip cleaning if it doesn't look like JSON array or object
        const trimmed = raw.trim();
        if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
            return raw.replace(/\\n/g, '\n');
        }

        try {
            const data = JSON.parse(raw);
            let extracted = "";
            if (Array.isArray(data) && data.length > 0) {
                extracted = data[0].text || data[0].markdown || data[0].output || data[0].message || raw;
            } else if (typeof data === 'object' && data !== null) {
                extracted = data.markdown || data.output || data.message || data.text || raw;
            } else {
                extracted = raw;
            }

            let result = typeof extracted === 'string' ? extracted.replace(/\\n/g, '\n') : String(extracted);
            result = result.replace(/^```[a-z]*\s*\n/i, '').replace(/\n```\s*$/m, '');
            result = result.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/m, '');
            return result;
        } catch {
            let result = raw.replace(/\\n/g, '\n');
            result = result.replace(/^```[a-z]*\s*\n/i, '').replace(/\n```\s*$/m, '');
            result = result.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/m, '');
            return result;
        }
    };

    const [simulationResult, setSimulationResult] = useState<string | null>(cleanMarkdown(client.simulation_1) || null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Helper to detect HTML
    const isHtml = (text: string | null): boolean => {
        if (!text) return false;
        const htmlRegex = /<\/?(html|body|div|span|h[1-6]|p|a|ul|li|table|tr|td|th|strong|em|br|hr)[^>]*>/i;
        return htmlRegex.test(text);
    };

    // View mode state
    const [viewMode, setViewMode] = useState<'preview' | 'edit'>(isHtml(cleanMarkdown(client.simulation_1)) ? 'preview' : 'edit');

    // Restitution specific state
    const [isRestituting, setIsRestituting] = useState(false);
    const [restitutionHtml, setRestitutionHtml] = useState<string | null>(null);
    const [restitutionError, setRestitutionError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleRunSimulation = async () => {
        if (!selectedTemplateId) return;

        const template = simulationTypes.find(t => t.id === selectedTemplateId);
        if (!template) return;

        setIsSimulating(true);
        setStatus('idle');
        setRestitutionHtml(null);

        try {
            const response = await fetch('https://databuildr.app.n8n.cloud/webhook/simulation-rpconseil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-RP-Password': password || ''
                },
                body: JSON.stringify({
                    template: {
                        nom: template.nom,
                        description: template.description,
                        type: template.type
                    },
                    client: {
                        id: client.id,
                        nom: client.nom,
                        identite: client.identite,
                        situation: client.situation_matrimoniale_fiscale,
                        patrimoine: client.patrimoine_brut,
                        objectifs: client.objectifs,
                        immobilier: client.immobilier,
                        epargne: client.epargne,
                        charges: client.autres_charges,
                        observations: client.autres_observations,
                        analyse: client.analyse_profil,
                        capa_epargne: client.capacite_epargne,
                        capa_emprunt: client.capacite_emprunt,
                        infos_complementaires: client.infos_complementaires
                    }
                }),
            });

            if (!response.ok) throw new Error(`Webhook error: ${response.status}`);

            const text = await response.text();
            const markdown = cleanMarkdown(text) || text;

            // Save to Supabase
            await updateClientSimulation(client.id, markdown);

            setSimulationResult(markdown);
            setStatus('success');
            await refetchData();
        } catch (err) {
            console.error("Simulation error:", err);
            setStatus('error');
        } finally {
            setIsSimulating(false);
        }
    };

    const handleRestitution = async () => {
        if (!simulationResult) return;

        // Even if we suspect it's already HTML, we hit the webhook to improve it
        // Or if we need a fresh render.
        // We removed the automatic return here.

        setIsRestituting(true);
        setRestitutionError(null);

        try {
            const response = await fetch('https://databuildr.app.n8n.cloud/webhook/render', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-RP-Password': password || ''
                },
                body: JSON.stringify({
                    message: simulationResult
                }),
            });

            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    let htmlContent = "";
                    if (Array.isArray(data) && data.length > 0) {
                        htmlContent = data[0].html || data[0].content || data[0].text || text;
                    } else if (typeof data === 'object' && data !== null) {
                        htmlContent = data.content || data.message || data.html || text;
                    } else {
                        htmlContent = text;
                    }

                    if (!htmlContent || String(htmlContent).trim() === "") {
                        throw new Error("Le webhook n'a renvoyé aucun contenu.");
                    }

                    setRestitutionHtml(String(htmlContent));
                    setViewMode('preview');
                } catch (e) {
                    if (text && text.trim() !== "") {
                        setRestitutionHtml(text);
                    } else {
                        throw new Error("Réponse vide ou invalide du serveur de rendu.");
                    }
                }
            } else {
                throw new Error(`Erreur serveur (${response.status}) lors du rendu.`);
            }
        } catch (err: any) {
            console.error("Restitution error:", err);
            setRestitutionError(err.message || "Échec du rendu HTML.");
        } finally {
            setIsRestituting(false);
        }
    };

    const handleSaveModifications = async () => {
        if (!simulationResult) return;
        setIsSaving(true);
        setStatus('idle');
        try {
            await updateClientSimulation(client.id, simulationResult);
            setStatus('success');
            await refetchData();
        } catch (err) {
            console.error("Save error:", err);
            setStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 text-white rounded-lg shrink-0">
                            <Calculator size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg md:text-xl font-black text-zinc-900 truncate">Simulation</h2>
                            <p className="text-[10px] md:text-sm text-zinc-500 truncate font-medium uppercase tracking-widest">{client.nom}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors bg-zinc-100 shrink-0">
                        <X size={18} className="text-zinc-600" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-zinc-50/30">
                    {!simulationResult || (status === 'idle' && !client.simulation_1) ? (
                        <div className="max-w-3xl mx-auto space-y-8 py-4">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl md:text-2xl font-black text-zinc-900">Nouvelle simulation</h3>
                                <p className="text-xs md:text-sm text-zinc-500 font-medium px-4">Sélectionnez le profil d'analyse le plus pertinent pour votre client.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {simulationTypes.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplateId(template.id)}
                                        className={`group p-5 rounded-2xl border-2 text-left transition-all ${selectedTemplateId === template.id
                                            ? 'border-zinc-900 bg-white shadow-xl transform md:scale-[1.02]'
                                            : 'border-zinc-100 hover:border-zinc-300 bg-white hover:bg-zinc-50/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2.5">
                                            <span className="font-black text-base text-zinc-900 uppercase tracking-tight">{template.nom}</span>
                                            <span className="text-[9px] px-2 py-0.5 bg-zinc-100 rounded-md font-black uppercase text-zinc-500 tracking-widest group-hover:bg-zinc-900 group-hover:text-white transition-all">
                                                {template.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed font-bold opacity-80">{template.description}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-zinc-100 flex flex-col items-center gap-4">
                                <button
                                    onClick={handleRunSimulation}
                                    disabled={!selectedTemplateId || isSimulating}
                                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black transition-all shadow-xl hover:shadow-2xl text-base md:text-lg ${!selectedTemplateId
                                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                                        : isSimulating
                                            ? 'bg-zinc-800 text-zinc-300'
                                            : 'bg-zinc-900 text-white hover:bg-zinc-800 transform hover:-translate-y-1 active:scale-95'
                                        }`}
                                >
                                    {isSimulating ? (
                                        <><Loader className="animate-spin" size={20} /> Analyse...</>
                                    ) : (
                                        <><Send size={20} /> Générer l'Analyse</>
                                    )}
                                </button>
                                {!selectedTemplateId && <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Sélectionnez un modèle ci-dessus</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
                            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-zinc-100/50">
                                <div className="space-y-1">
                                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 flex items-center gap-3">
                                        <FileText className="text-zinc-300 hidden sm:block" size={28} />
                                        <span>Rapport d'Analyse</span>
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Mis à jour le {new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                                    {viewMode === 'edit' && (
                                        <button
                                            onClick={handleSaveModifications}
                                            disabled={isSaving}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-black transition-all shadow-md hover:shadow-lg text-xs hover:bg-zinc-800"
                                        >
                                            {isSaving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                                            <span>Sauvegarder</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={handleRestitution}
                                        disabled={isRestituting}
                                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black transition-all shadow-md hover:shadow-lg text-xs ${restitutionHtml ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                            restitutionError ? 'bg-red-50 text-red-700 border border-red-200' :
                                                'bg-white text-zinc-900 border border-zinc-200 hover:border-zinc-900'
                                            }`}
                                    >
                                        {isRestituting ? (
                                            <><Loader className="animate-spin" size={16} /> Rendu...</>
                                        ) : (
                                            <><Download size={16} /> Visualiser</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Êtes-vous sûr ? Vos modifications non sauvegardées seront perdues.")) {
                                                const original = cleanMarkdown(client.simulation_1) || null;
                                                setSimulationResult(original);
                                                setRestitutionHtml(null);
                                                setStatus('idle');
                                                setViewMode(isHtml(original) ? 'preview' : 'edit');
                                            }
                                        }}
                                        className="flex-1 md:flex-none px-4 py-3 text-zinc-400 hover:text-zinc-900 text-[10px] font-black uppercase tracking-widest transition-colors text-center"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>

                            {restitutionError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                                    <X size={16} className="shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold leading-relaxed tracking-wide uppercase">{restitutionError}</p>
                                </div>
                            )}

                            {viewMode === 'preview' ? (
                                <div className="bg-white shadow-xl rounded-3xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-500">
                                    <div className="flex justify-between items-center p-4 md:p-6 bg-zinc-50/50 border-b border-zinc-100">
                                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex-1">Visualisation Client</h4>
                                        <div className="flex gap-4 items-center">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch('https://databuildr.app.n8n.cloud/webhook/render', {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'X-RP-Password': password || ''
                                                            },
                                                            body: JSON.stringify({
                                                                message: simulationResult,
                                                                format: 'pdf'
                                                            }),
                                                        });

                                                        if (!response.ok) throw new Error("Erreur lors de la génération du PDF");

                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `Simulation_${client.nom.replace(/\s+/g, '_')}.pdf`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        a.remove();
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error("PDF generation error:", err);
                                                        alert("Erreur lors de la génération du PDF.");
                                                    }
                                                }}
                                                className="text-[10px] font-black text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                            >
                                                <Download size={12} />
                                                Télécharger en PDF
                                            </button>
                                            <span className="text-zinc-300">|</span>
                                            <button
                                                onClick={() => setViewMode('edit')}
                                                className="text-[10px] font-black text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4"
                                            >
                                                Mode Édition
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-12 lg:p-16 overflow-x-auto scrollbar-hide">
                                        <div
                                            className={`min-h-[400px] prose prose-zinc max-w-none ${(restitutionHtml || simulationResult || '').trim().startsWith('<') ? '' : 'whitespace-pre-wrap font-serif text-base md:text-lg leading-relaxed text-zinc-800'}`}
                                            dangerouslySetInnerHTML={{ __html: restitutionHtml || simulationResult || '' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden shadow-inner">
                                    <div className="bg-zinc-100/50 px-5 py-2.5 border-b border-zinc-200 flex justify-between items-center">
                                        <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                            {isHtml(simulationResult) ? 'Éditeur HTML' : 'Éditeur Markdown'}
                                        </h4>
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={simulationResult || ''}
                                        onChange={(e) => setSimulationResult(e.target.value)}
                                        className="w-full min-h-[500px] p-6 md:p-8 font-mono text-xs md:text-sm text-zinc-700 leading-relaxed bg-white border-none focus:ring-0 resize-none outline-none"
                                        placeholder="Saisissez ici les détails de la simulation..."
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 md:px-8 py-4 md:py-6 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-zinc-300'}`}></div>
                        <p className="text-[9px] md:text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                            {status === 'success' ? 'Données sécurisées' : 'En attente d\'analyse'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 md:px-12 py-3 bg-zinc-900 text-white rounded-xl font-black hover:bg-zinc-800 transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-tight"
                    >
                        Quitter la simulation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinancialSimulationModal;
