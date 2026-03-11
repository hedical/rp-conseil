import React, { useState, useRef } from 'react';
import { X, Upload, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { useData } from '../hooks/useData';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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



// Inside ImportClientModal component
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

        // 1. Create a loading toast that will persist
        const toastId = toast.loading(`Analyse en cours pour ${prenom} ${nom}...`);

        try {
            // Close modal early to avoid blocking UI
            handleClose();

            // 2. Run Picture Upload FIRST if there are images, to get the ID for a new client
            let finalClientId = clientId;
            
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                if (finalClientId) formData.append('id', finalClientId);
                formData.append('nom', nom);
                formData.append('prenom', prenom);

                selectedFiles.forEach(file => {
                    formData.append('data', file);
                });

                if (commentaires.trim()) {
                    formData.append('infos_complementaires', commentaires);
                }

                const picRes = await fetch('/webhook/clients-picture-upload', {
                    method: 'POST',
                    headers: { 'X-RP-Password': password || '' },
                    body: formData,
                });

                if (!picRes.ok) {
                    const text = await picRes.text();
                    if (text.includes('Wrong password')) throw new Error("Mot de passe incorrect pour le webhook d'images.");
                    throw new Error(`Erreur serveur images: ${picRes.status}`);
                }

                // If it's a new client, the webhook should return the new ID
                if (!finalClientId) {
                    try {
                        const responseData = await picRes.json();
                        // Assuming the webhook returns { id: "..." } or similar
                        // You might need to adjust this depending on the exact response structure of the N8N webhook
                        if (responseData.id) {
                            finalClientId = responseData.id;
                        } else if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].id) {
                            finalClientId = responseData[0].id;
                        }
                    } catch (e) {
                        console.warn("Could not parse JSON from picture-upload response to get new client ID", e);
                    }
                }
            }

            // 3. Now run Info Uploads (Comments and PDFs) concurrently
            const infoUploadPromises = [];

            // Send Comment (if we didn't send it with the picture, or if we want to send it here specifically)
            // Note: The previous logic sent comments with pictures IF there were pictures. 
            // If there were NO pictures, it sent them here. We maintain that logic, OR send it if we just want to be sure.
            // Let's send it only if there are NO pictures, to avoid duplicating the comment, since we appended it to the picture upload above.
            if (commentaires.trim() && selectedFiles.length === 0) {
                const commentData = new FormData();
                if (finalClientId) commentData.append('id', finalClientId);
                commentData.append('nom', nom);
                commentData.append('prenom', prenom);
                commentData.append('type', 'commentaire');
                commentData.append('content', commentaires);

                infoUploadPromises.push(
                    fetch('/webhook/clients-info-upload', {
                        method: 'POST',
                        headers: { 'X-RP-Password': password || '' },
                        body: commentData
                    }).then(async res => {
                        if (!res.ok) {
                            const text = await res.text();
                            if (text.includes('Wrong password')) throw new Error("Mot de passe incorrect pour le webhook infos.");
                            throw new Error(`Erreur serveur infos: ${res.status}`);
                        }
                    })
                );
            }

            // Send PDFs (One by One)
            for (const doc of selectedDocs) {
                const docData = new FormData();
                if (finalClientId) docData.append('id', finalClientId);
                docData.append('nom', nom);
                docData.append('prenom', prenom);
                docData.append('type', 'pdf');
                docData.append('data', doc);

                infoUploadPromises.push(
                    fetch('/webhook/clients-info-upload', {
                        method: 'POST',
                        headers: { 'X-RP-Password': password || '' },
                        body: docData
                    }).then(async res => {
                        if (!res.ok) {
                            const text = await res.text();
                            if (text.includes('Wrong password')) throw new Error("Mot de passe incorrect pour le webhook PDF.");
                            throw new Error(`Erreur serveur PDF: ${res.status}`);
                        }
                    })
                );
            }

            // Wait for all info uploads to finish
            if (infoUploadPromises.length > 0) {
                await Promise.all(infoUploadPromises);
            }

            // If we STILL don't have an ID (e.g. no picture was uploaded, only PDFs for a new client)
            // The user's flow implied info-upload *could* run first if there are no pictures.
            // But if picture upload is the ONLY thing determining ID, then creating a new client with ONLY PDF might be an issue.
            // Assuming the existing logic where info-webhook also handles it, or that we just search by name later.

            // Fetch the newly created/updated client from Supabase
            // Since we don't have the ID if it's a new client, we query by name.
            // For a robust system, the webhook should ideally return the ID, 
            // but we'll try to find the most recent matching client.
            const { supabase } = await import('../lib/supabase');
            let updatedClientQuery = supabase
                .from('clients')
                .select('*');
            
            if (finalClientId) {
                updatedClientQuery = updatedClientQuery.eq('id', finalClientId);
            } else {
                 updatedClientQuery = updatedClientQuery
                    .eq('nom', nom)
                    .eq('prenom', prenom)
                    .order('created_at', { ascending: false })
                    .limit(1);
            }

            const { data: updatedClients, error } = await updatedClientQuery;

            if (error || !updatedClients || updatedClients.length === 0) {
                console.warn("Could not fetch the updated client for risks-eval webhook.", error);
                // Optional fallback, but we should probably still try to notify success of the first step.
                toast.success('Documents importés. Analyse N8N lancée !', { id: toastId });
                return;
            }

            const clientForWebhook = updatedClients[0];

            // Send to risks-eval webhook
            const risksEvalRes = await fetch('/webhook/clients-risks-eval', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-RP-Password': password || '' 
                },
                body: JSON.stringify([clientForWebhook])
            });

            if (!risksEvalRes.ok) {
                throw new Error(`Erreur lors de l'évaluation des risques: ${risksEvalRes.status}`);
            }

            // Update toast to success with a link
            toast.success(
                (t) => (
                    <div className="flex flex-col gap-2">
                        <span className="font-bold">Analyse terminée pour {prenom} {nom} !</span>
                        {clientForWebhook.id && (
                            <Link 
                                to={`/clients/${clientForWebhook.id}`} 
                                onClick={() => toast.dismiss(t.id)}
                                className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-center hover:bg-zinc-800 transition-colors"
                            >
                                Voir la fiche client
                            </Link>
                        )}
                    </div>
                ),
                { id: toastId, duration: 8000 }
            );

        } catch (err: any) {
            console.error("Upload error:", err);
            toast.error(err.message || "Erreur lors de l'envoi des fichiers à N8N.", { id: toastId, duration: 5000 });
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
