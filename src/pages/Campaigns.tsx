import React from 'react';
import { Megaphone, Calendar, ArrowRight } from 'lucide-react';

const Campaigns: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg border border-zinc-200">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2 font-display">Campagnes</h2>
                <p className="text-zinc-500">Gérez vos campagnes de communication et de collecte de documents</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Girardin Campaign Card */}
                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden group hover:border-zinc-300 hover:shadow-lg transition-all duration-300">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-zinc-50 rounded-lg group-hover:bg-zinc-100 transition-colors">
                                <Megaphone className="text-zinc-900" size={24} />
                            </div>
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-100">
                                A venir
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Girardin</h3>
                        <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                            Lancer une campagne auprès des clients pour récupérer les documents nécessaires à la déclaration Girardin.
                        </p>

                        <div className="flex items-center gap-4 py-4 border-t border-zinc-50 text-zinc-500">
                            <div className="flex items-center gap-1.5 text-xs font-medium">
                                <Calendar size={14} />
                                <span>Prévu: Mars 2026</span>
                            </div>
                        </div>

                        <button
                            disabled
                            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-zinc-50 text-zinc-400 font-bold text-sm cursor-not-allowed transition-all"
                        >
                            Bientôt disponible
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Campaigns;
