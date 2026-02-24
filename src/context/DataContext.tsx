import React, { createContext, useState, useEffect } from 'react';
import type { Sale, Client, Product, SimulationType } from '../types';
import { fetchSalesData, fetchClientsData, fetchProductsData, fetchSimulationTypes } from '../services/api';

interface DataContextType {
    sales: Sale[];
    clients: Client[];
    products: Product[];
    simulationTypes: SimulationType[];
    loading: boolean;
    error: string | null;
    password: string | null;
    setPassword: (password: string | null) => void;
    refetchData: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [clientsState, setClientsState] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [simulationTypes, setSimulationTypes] = useState<SimulationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState<string | null>(() => localStorage.getItem('rp_password'));

    const setPasswordAndSave = (pass: string | null) => {
        setPassword(pass);
        if (pass) localStorage.setItem('rp_password', pass);
        else localStorage.removeItem('rp_password');
    };

    const refetchData = async () => {
        if (!password) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [salesData, clientsData, productsData, simulationTypesData] = await Promise.all([
                fetchSalesData(),
                fetchClientsData(),
                fetchProductsData(),
                fetchSimulationTypes()
            ]);
            setSales(salesData);
            setClientsState(clientsData);
            setProducts(productsData);
            setSimulationTypes(simulationTypesData);
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
        } else {
            setLoading(false);
        }
    }, [password]);

    // Enhance clients with their sales and calculated totals
    const clients: Client[] = React.useMemo(() => {
        const parseDate = (dateStr: string): Date | null => {
            if (!dateStr) return null;
            if (dateStr.match(/^\d{4}$/)) return new Date(parseInt(dateStr), 0, 1);
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            return null;
        };

        const enhancedClients = clientsState.map(client => {
            const clientSales = sales.filter(s => s.client_id === client.id);

            const parseCurrency = (val: any): number => {
                if (val === undefined || val === null || val === 'SO' || val === '') return 0;
                if (typeof val === 'number') return isNaN(val) ? 0 : val;
                try {
                    const str = String(val).replace(/\s/g, '').replace(/[^0-9,.-]+/g, '').replace(',', '.');
                    const parsed = parseFloat(str);
                    return isNaN(parsed) ? 0 : parsed;
                } catch {
                    return 0;
                }
            };

            let totalCA = 0;
            let totalCAPerso = 0;
            let latestSaleDate: Date | null = null;

            clientSales.forEach(sale => {
                const normalizedStatus = (sale.statut || '').toLowerCase();
                if (!normalizedStatus.includes('annul')) {
                    totalCA += parseCurrency(sale.caGeneral);
                    totalCAPerso += parseCurrency(sale.caPerso);
                }

                const saleDate = parseDate(sale.dateVente);
                if (saleDate && (!latestSaleDate || saleDate > latestSaleDate)) {
                    latestSaleDate = saleDate;
                }
            });

            return {
                ...client,
                sales: clientSales,
                totalCA,
                totalCAPerso,
                _latestSaleDate: latestSaleDate // Temporary for sorting
            } as Client & { _latestSaleDate: Date | null };
        });

        // Sort by latest sale date (descending)
        return enhancedClients.sort((a, b) => {
            const dateA = a._latestSaleDate?.getTime() || 0;
            const dateB = b._latestSaleDate?.getTime() || 0;

            if (dateB !== dateA) return dateB - dateA;

            // Fallback to entry date or created_at
            const entryA = a.date_entree ? new Date(a.date_entree).getTime() : 0;
            const entryB = b.date_entree ? new Date(b.date_entree).getTime() : 0;
            return entryB - entryA;
        });
    }, [sales, clientsState]);

    return (
        <DataContext.Provider value={{
            sales, clients, products, simulationTypes, loading, error,
            password, setPassword: setPasswordAndSave, refetchData
        }}>
            {children}
        </DataContext.Provider>
    );
};


