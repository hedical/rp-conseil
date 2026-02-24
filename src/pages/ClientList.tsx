import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Plus, Upload } from 'lucide-react';
import AddClientModal from '../components/AddClientModal';
import ImportClientModal from '../components/ImportClientModal';

const ClientList: React.FC = () => {
    const { clients, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const filteredClients = clients.filter(client =>
        client.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-zinc-500">Chargement...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm transition-all">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                        Clients
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{clients.length} dossiers actifs</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full sm:w-auto">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-zinc-600 px-4 py-2.5 rounded-xl font-bold text-xs border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all shadow-sm"
                        >
                            <Upload size={16} />
                            <span>Importer</span>
                        </button>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-md shadow-zinc-200"
                        >
                            <Plus size={16} />
                            <span>Nouveau Dossier</span>
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher un client..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 bg-zinc-50 transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...filteredClients].map(client => (
                    <Link key={client.id} to={`/clients/${client.id}`} className="block group">
                        <div className="bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-900 transition-all duration-200 shadow-sm hover:shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 font-bold text-lg">
                                        {client.nom.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-zinc-900 group-hover:underline decoration-zinc-900 underline-offset-2 transition-all">{client.nom}</h3>
                                        <p className="text-sm text-zinc-500">{client.sales?.length || 0} dossiers</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-zinc-300 group-hover:text-zinc-900 transition-colors" size={20} />
                            </div>

                            <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">CA Total</p>
                                    <p className="text-xl font-bold text-zinc-900">{client.totalCA.toLocaleString('fr-FR')} €</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {filteredClients.length === 0 && (
                    <div className="col-span-full text-center py-10 text-zinc-400 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                        Aucun client trouvé pour "{searchTerm}"
                    </div>
                )}
            </div>

            <AddClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <ImportClientModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
        </div>
    );
};

export default ClientList;
