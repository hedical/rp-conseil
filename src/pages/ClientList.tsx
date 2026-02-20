import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Plus } from 'lucide-react';
import AddClientModal from '../components/AddClientModal';

const ClientList: React.FC = () => {
    const { clients, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-zinc-500">Chargement...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">
                        Liste des Clients
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">{clients.length} clients actifs</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg"
                    >
                        <Plus size={18} />
                        Nouveau Dossier
                    </button>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher un client..."
                            className="pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50 w-64 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...filteredClients].sort((a, b) => b.id - a.id).map(client => (
                    <Link key={client.id} to={`/clients/${client.id}`} className="block group">
                        <div className="bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-900 transition-all duration-200 shadow-sm hover:shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 font-bold text-lg">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-zinc-900 group-hover:underline decoration-zinc-900 underline-offset-2 transition-all">{client.name}</h3>
                                        <p className="text-sm text-zinc-500">{client.sales.length} dossiers</p>
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
        </div>
    );
};

export default ClientList;
