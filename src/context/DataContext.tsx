import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Sale, Client } from '../types';
import { fetchSalesData } from '../services/api';

interface DataContextType {
    sales: Sale[];
    clients: Client[];
    loading: boolean;
    error: string | null;
    password: string | null;
    setPassword: (password: string | null) => void;
    refetchData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState<string | null>(null);

    const refetchData = async () => {
        if (!password) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await fetchSalesData(password);
            setSales(data);
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (password) {
            refetchData();
        }
    }, [password]);

    // Derive clients from sales
    const clients: Client[] = React.useMemo(() => {
        const clientMap = new Map<string, Client>();

        sales.forEach(sale => {
            const name = sale.nom; // 'Nom' in sample data
            if (!clientMap.has(name)) {
                clientMap.set(name, {
                    id: clientMap.size + 1, // Simple ID generation
                    name: name,
                    sales: [],
                    totalCA: 0,
                    totalCAPerso: 0
                });
            }

            const client = clientMap.get(name)!;
            client.sales.push(sale);

            // Parse "CA général" string to number (e.g. "22 230 €" -> 22230)
            const parseCurrency = (str: string) => {
                if (!str) return 0;
                return parseFloat(str.replace(/[^0-9,-]+/g, "").replace(',', '.'));
            };

            // Only add to Total CA if status does NOT contain 'Annulé' (case insensitive)
            const normalizedStatus = (sale.statut || '').toLowerCase();
            if (!normalizedStatus.includes('annul')) {
                client.totalCA += parseCurrency(sale.caGeneral);
                client.totalCAPerso += parseCurrency(sale.caPerso);
            }
        });

        return Array.from(clientMap.values());
    }, [sales]);

    return (
        <DataContext.Provider value={{ sales, clients, loading, error, password, setPassword, refetchData }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
