import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subtitle?: string;
    percentage?: string;
    color?: string; // Kept for prop compatibility but unused in styles
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, subtitle, percentage }) => {
    return (
        <div className="bg-white border border-zinc-200 rounded-lg p-6 hover:border-zinc-400 transition-all duration-200 relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-500">{title}</p>
                    <div className="flex flex-col">
                        <h3 className="text-3xl font-bold text-zinc-900 tracking-tight mt-2">{value}</h3>
                        {(subtitle || percentage) && (
                            <p className="text-sm text-zinc-500 mt-1 font-medium">
                                {subtitle} {percentage && <span className="text-zinc-400">({percentage})</span>}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors duration-200">
                    <Icon size={24} strokeWidth={1.5} />
                </div>
            </div>

        </div>
    );
};

export default StatCard;
