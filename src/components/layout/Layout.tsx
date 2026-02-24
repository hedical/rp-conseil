import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-zinc-50">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between z-30">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">RP Conseil</h1>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600"
                >
                    <Menu size={24} />
                </button>
            </header>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className={`flex-1 transition-all duration-300 min-w-0 pt-16 lg:pt-0 lg:ml-64`}>
                <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 space-y-8 fade-in">
                    <header className="hidden lg:flex justify-between items-end mb-12 border-b border-zinc-100 pb-6">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Vue d'ensemble</h2>
                            <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest mt-1">
                                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </header>
                    <div className="bg-white rounded-3xl min-h-[calc(100vh-8rem)] lg:min-h-0">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
