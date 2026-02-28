import React, { useState, useRef } from 'react';
import { X, Upload, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { useData } from '../hooks/useData';

interface ImportClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId?: string;
    initialNom?: string;
    initialPrenom?: string;
}

const ImportClientModal: React.FC<ImportClientModalProps> = ({ isOpen, onClose, clientId, initialNom, initialPrenom }) => {
    const { password } = useData();
    const [nom, setNom] = useState(initialNom || '');
    const [prenom, setPrenom] = useState(initialPrenom || '');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
    const [commentaires, setCommentaires] = useState('');
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Sync state if props change
    React.useEffect(() => {
        if (initialNom) setNom(initialNom);
        if (initialPrenom) setPrenom(initialPrenom);
    }, [initialNom, initialPrenom]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...filesArray]);

            // Create previews
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedDocs(prev => [...prev, ...filesArray]);
        }
    };

    const removeDoc = (index: number) => {
        setSelectedDocs(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nom || !prenom || (selectedFiles.length === 0 && selectedDocs.length === 0 && !commentaires.trim())) {
            setErrorMessage("Veuillez remplir le nom, le prénom et ajouter au moins un élément (photo, document ou commentaire).");
            setStatus('error');
            return;
        }

        setIsSubmitting(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            // 1. Send Comment
            if (commentaires.trim()) {
                const commentData = new FormData();
                commentData.append('id', clientId || '');
                commentData.append('nom', nom);
                commentData.append('prenom', prenom);
                commentData.append('type', 'commentaire');
                commentData.append('content', commentaires);

                const commentRes = await fetch('https://databuildr.app.n8n.cloud/webhook/clients-info-upload', {
                    method: 'POST',
                    headers: { 'X-RP-Password': password || '' },
                    body: commentData
                });

                const responseText = await commentRes.text();
                if (!commentRes.ok) {
                    if (responseText.includes('Wrong password')) throw new Error("Mot de passe incorrect pour le webhook infos.");
                    throw new Error(`Erreur serveur infos: ${commentRes.status}`);
                }
            }

            // 2. Send PDFs (One by One)
            for (const doc of selectedDocs) {
                const docData = new FormData();
                docData.append('id', clientId || '');
                docData.append('nom', nom);
                docData.append('prenom', prenom);
                docData.append('type', 'pdf');
                docData.append('data', doc);

                const docRes = await fetch('https://databuildr.app.n8n.cloud/webhook/clients-info-upload', {
                    method: 'POST',
                    headers: { 'X-RP-Password': password || '' },
                    body: docData
                });

                const responseText = await docRes.text();
                if (!docRes.ok) {
                    if (responseText.includes('Wrong password')) throw new Error("Mot de passe incorrect pour le webhook PDF.");
                    throw new Error(`Erreur serveur PDF: ${docRes.status}`);
                }
            }

            // 3. Send Images (Together) to existing webhook
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                formData.append('id', clientId || '');
                formData.append('nom', nom);
                formData.append('prenom', prenom);

                selectedFiles.forEach(file => {
                    formData.append('data', file);
                });

                if (commentaires.trim()) {
                    formData.append('infos_complementaires', commentaires);
                }

                const response = await fetch('https://databuildr.app.n8n.cloud/webhook/clients-picture-upload', {
                    method: 'POST',
                    headers: { 'X-RP-Password': password || '' },
                    body: formData,
                });

                const responseText = await response.text();
                if (!response.ok) {
                    if (responseText.includes('Wrong password')) throw new Error("Mot de passe incorrect pour le webhook d'images.");
                    throw new Error(`Erreur serveur images: ${response.status}`);
                }
            }

            setStatus('success');
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (err: any) {
            console.error("Upload error:", err);
            setStatus('error');
            setErrorMessage(err.message || "Impossible d'envoyer les fichiers. Vérifiez votre connexion.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Cleanup previews
        previews.forEach(url => URL.revokeObjectURL(url));
        setNom('');
        setPrenom('');
        setCommentaires('');
        setSelectedFiles([]);
        setSelectedDocs([]);
        setPreviews([]);
        setStatus('idle');
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-zinc-200">
                <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 rounded-lg text-white">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Importer une fiche</h2>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Webhook n8n</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-400 hover:text-zinc-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {status === 'success' && (
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-3 border border-emerald-100 animate-in zoom-in-95 duration-300">
                            <CheckCircle2 size={24} className="text-emerald-500" />
                            <div className="font-medium">Importation réussie !</div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 animate-in shake duration-300">
                            <AlertCircle size={24} className="text-red-500" />
                            <div className="text-sm font-medium">{errorMessage}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-zinc-700 ml-1">Prénom</label>
                            <input
                                type="text"
                                value={prenom}
                                onChange={(e) => setPrenom(e.target.value)}
                                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-black transition-all outline-none text-zinc-900"
                                placeholder="ex: Jean"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-zinc-700 ml-1">Nom</label>
                            <input
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-black transition-all outline-none text-zinc-900"
                                placeholder="ex: DUPONT"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 ml-1">Photos des fiches R1 (Images)</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-zinc-900 hover:bg-zinc-50 transition-all cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 group-hover:scale-110 transition-all">
                                <Upload size={24} />
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-bold text-zinc-900">Cliquez pour ajouter</span>
                                <p className="text-xs text-zinc-500 mt-1">Glissez vos fichiers ici ou parcourez</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                                accept="image/*"
                            />
                        </div>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                                            <img src={previews[index]} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-zinc-900 truncate">{file.name}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700 ml-1">Commentaires</label>
                        <textarea
                            value={commentaires}
                            onChange={(e) => setCommentaires(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-black transition-all outline-none text-zinc-900 resize-none"
                            placeholder="Saisissez vos commentaires ici..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 ml-1">Documents complémentaires (PDF)</label>
                        <div
                            onClick={() => docInputRef.current?.click()}
                            className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-zinc-900 hover:bg-zinc-50 transition-all cursor-pointer group"
                        >
                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 group-hover:scale-110 transition-all">
                                <Upload size={20} />
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-bold text-zinc-900">Cliquez pour ajouter des PDF</span>
                            </div>
                            <input
                                type="file"
                                ref={docInputRef}
                                onChange={handleDocChange}
                                className="hidden"
                                multiple
                                accept="application/pdf"
                            />
                        </div>
                    </div>

                    {selectedDocs.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {selectedDocs.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 shrink-0 font-bold text-xs uppercase">
                                            PDF
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-zinc-900 truncate">{doc.name}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">{(doc.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeDoc(index)}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-4 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
                            disabled={isSubmitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (selectedFiles.length === 0 && selectedDocs.length === 0 && !commentaires.trim())}
                            className="flex-[2] py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-xl hover:shadow-zinc-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <><Loader className="animate-spin" size={20} /> Transfert en cours...</>
                            ) : (
                                <><CheckCircle2 size={20} /> Lancer l'importation</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportClientModal;
