import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, PieChart, Calculator, Megaphone, X } from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
        { icon: Users, label: 'Clients', path: '/clients' },
        { icon: PieChart, label: 'Analyses', path: '/analysis' },
        { icon: Megaphone, label: 'Campagnes', path: '/campaigns' },
        { icon: Calculator, label: 'Simulateur N+1', path: '/simulator' },
        { icon: Settings, label: 'Paramètres', path: '/settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-zinc-200 flex flex-col z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight leading-none">
                            RP Conseil
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1.5 font-medium">Gestion de Patrimoine</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 rounded-full lg:hidden text-zinc-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (window.innerWidth < 1024 && onClose) onClose();
                            }}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm ${isActive
                                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={18} className={isActive ? 'text-white' : 'text-zinc-400'} />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-xs">
                            LX
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-zinc-900 truncate">Utilisateur</span>
                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Admin</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
