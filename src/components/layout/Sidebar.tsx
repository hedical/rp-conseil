import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, PieChart, Calculator, Megaphone } from 'lucide-react';

const Sidebar: React.FC = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
        { icon: Users, label: 'Clients', path: '/clients' },
        { icon: PieChart, label: 'Analyses', path: '/analysis' },
        { icon: Megaphone, label: 'Campagnes', path: '/campaigns' },
        { icon: Calculator, label: 'Simulateur N+1', path: '/simulator' },
        { icon: Settings, label: 'Paramètres', path: '/settings' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-zinc-200 flex flex-col z-10 transition-all duration-300">
            <div className="p-6 border-b border-zinc-100">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    RP Conseil
                </h1>
                <p className="text-sm text-zinc-500 mt-1">Gestion de Patrimoine</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 font-medium ${isActive
                                ? 'bg-zinc-900 text-white shadow-sm'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                            }`
                        }
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-zinc-100">
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-xs">
                        LX
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900">Utilisateur</span>
                        <span className="text-xs text-zinc-500">Admin</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
