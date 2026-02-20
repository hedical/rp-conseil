import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-[16rem] p-8 transition-all duration-300 bg-white">
                <div className="max-w-7xl mx-auto space-y-8 fade-in">
                    <header className="flex justify-between items-end mb-12 border-b border-zinc-100 pb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-zinc-900">Vue d'ensemble</h2>
                            <p className="text-zinc-500 mt-1">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </header>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
