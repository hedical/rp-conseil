import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ActivityChartProps {
    data: any[];
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
    return (
        <div className="bg-white border border-zinc-200 rounded-lg p-6 h-[400px] w-full">
            <h3 className="text-lg font-semibold mb-6 text-zinc-900 border-b border-zinc-100 pb-2">Activité des Ventes (CA)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 12 }}
                        dx={-10}
                    />
                    <Tooltip
                        cursor={{ fill: '#f4f4f5' }}
                        contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: 'white', color: '#18181b' }}
                        formatter={(value: any) => `${value?.toLocaleString() ?? 0} €`}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="rect"
                        formatter={(value) => <span style={{ color: '#52525b', fontSize: '12px' }}>{value}</span>}
                    />
                    <Bar dataKey="CA Général" stackId="a" fill="#18181b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="CA Perso" stackId="a" fill="#71717a" radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActivityChart;
