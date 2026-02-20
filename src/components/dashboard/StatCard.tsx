import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string; // Kept for prop compatibility but unused in styles
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
    return (
        <div className="bg-white border border-zinc-200 rounded-lg p-6 hover:border-zinc-400 transition-all duration-200 relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-500">{title}</p>
                    <h3 className="text-3xl font-bold text-zinc-900 tracking-tight mt-2">{value}</h3>
                </div>
                <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors duration-200">
                    <Icon size={24} strokeWidth={1.5} />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${trendUp ? 'text-zinc-900' : 'text-zinc-500'}`}>
                        {trend}
                    </span>
                    <span className="text-zinc-400 ml-2">vs dernier mois</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
