import { supabase } from '../lib/supabase';
import type { Sale, Client, Product, SimulationType } from '../types';

// Helper to format currency for the UI
const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9,-]+/g, "").replace(',', '.')) : value;
    if (isNaN(num)) return "0,00 €";
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num);
};

// Helper to format percent for the UI
const formatPercent = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9,-]+/g, "").replace(',', '.')) : value;
    if (isNaN(num)) return "0,00%";
    return new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 2 }).format(num / 100);
};

export const fetchSalesData = async (): Promise<Sale[]> => {
    const { data, error } = await supabase
        .from('suivi_produits')
        .select(`
            *,
            clients (nom),
            liste_produits (nom)
        `)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching sales:', error);
        throw error;
    }

    return data.map((item: any) => ({
        id: item.id,
        client_id: item.client_id,
        produit_id: item.produit_id,
        produit: item.liste_produits?.nom || 'Inconnu',
        client_nom: item.clients?.nom || 'Inconnu',
        type: item.type,
        parrain: item.nom_parrain || '',
        dateVente: item.date_vente || '',
        programme: item.programme || '',
        promoteur: item.promoteur || '',
        prixPack: formatCurrency(item.prix_pack),
        prix: formatCurrency(item.prix),
        dispositif: item.dispositif || '',
        remuneration: formatPercent(item.remuneration_taux * 100),
        caGeneral: formatCurrency(item.ca_general),
        caPerso: formatCurrency(item.ca_perso),
        fIngenierie: item.f_ingenierie || '',
        fIngenierieRPC: formatCurrency(item.f_ingenierie_rpc),
        montantFacturable: formatCurrency(item.montant_facturable),
        dateFacture: item.date_facture || '',
        annulation: formatCurrency(item.annulation),
        statut: item.statut || '',
        annulationBoolean: item.annulation_boolean ? 'X' : '',
        commentaires: item.commentaires || '',
        annee: item.annee || new Date().getFullYear()
    }));
};

export const fetchClientsData = async (): Promise<Client[]> => {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        throw error;
    }

    return data.map((item: any) => ({
        ...item,
        totalCA: 0, // Calculated in context
        totalCAPerso: 0 // Calculated in context
    }));
};

export const fetchProductsData = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('liste_produits')
        .select('*')
        .order('nom');

    if (error) {
        console.error('Error fetching products:', error);
        throw error;
    }

    return data;
};

export const updateSaleData = async (sale: Partial<Sale>): Promise<void> => {
    const { error } = await supabase
        .from('suivi_produits')
        .update({
            // Map camelCase to snake_case
            type: sale.type,
            nom_parrain: sale.parrain,
            date_vente: sale.dateVente,
            programme: sale.programme,
            promoteur: sale.promoteur,
            prix_pack: sale.prixPack ? parseFloat(sale.prixPack.replace(/[^0-9,-]+/g, "").replace(',', '.')) : undefined,
            prix: sale.prix ? parseFloat(sale.prix.replace(/[^0-9,-]+/g, "").replace(',', '.')) : undefined,
            dispositif: sale.dispositif,
            remuneration_taux: sale.remuneration ? parseFloat(sale.remuneration.replace(/[^0-9,-]+/g, "").replace(',', '.')) / 100 : undefined,
            ca_general: sale.caGeneral ? parseFloat(sale.caGeneral.replace(/[^0-9,-]+/g, "").replace(',', '.')) : undefined,
            ca_perso: sale.caPerso ? parseFloat(sale.caPerso.replace(/[^0-9,-]+/g, "").replace(',', '.')) : undefined,
            f_ingenierie: sale.fIngenierie,
            f_ingenierie_rpc: sale.fIngenierieRPC ? parseFloat(sale.fIngenierieRPC.replace(/[^0-9,-]+/g, "").replace(',', '.')) : undefined,
            montant_facturable: sale.montantFacturable ? parseFloat(sale.montantFacturable.replace(/[^0-9,-]+/g, "").replace(',', '.')) : undefined,
            date_facture: sale.dateFacture,
            annulation: sale.annulation ? parseFloat(sale.annulation.replace(/[^0-9,-]+/g, "").replace(',', '.')) : undefined,
            statut: sale.statut,
            annulation_boolean: sale.annulationBoolean === 'X',
            commentaires: sale.commentaires,
            annee: sale.annee
        })
        .eq('id', sale.id);

    if (error) {
        console.error('Error updating sale:', error);
        throw error;
    }
};

export const createSaleData = async (sale: Partial<Sale>): Promise<void> => {
    // Helper to find product_id from product name
    const { data: products } = await supabase.from('liste_produits').select('id').eq('nom', sale.produit).single();

    const { error } = await supabase
        .from('suivi_produits')
        .insert([{
            client_id: sale.client_id,
            produit_id: products?.id,
            type: sale.type,
            nom_parrain: sale.parrain,
            date_vente: sale.dateVente,
            programme: sale.programme,
            promoteur: sale.promoteur,
            prix_pack: sale.prixPack ? parseFloat(sale.prixPack.replace(/[^0-9,-]+/g, "").replace(',', '.')) : 0,
            prix: sale.prix ? parseFloat(sale.prix.replace(/[^0-9,-]+/g, "").replace(',', '.')) : 0,
            dispositif: sale.dispositif,
            remuneration_taux: sale.remuneration ? parseFloat(sale.remuneration.replace(/[^0-9,-]+/g, "").replace(',', '.')) / 100 : 0,
            ca_general: sale.caGeneral ? parseFloat(sale.caGeneral.replace(/[^0-9,-]+/g, "").replace(',', '.')) : 0,
            ca_perso: sale.caPerso ? parseFloat(sale.caPerso.replace(/[^0-9,-]+/g, "").replace(',', '.')) : 0,
            f_ingenierie: sale.fIngenierie,
            f_ingenierie_rpc: sale.fIngenierieRPC ? parseFloat(sale.fIngenierieRPC.replace(/[^0-9,-]+/g, "").replace(',', '.')) : 0,
            montant_facturable: sale.montantFacturable ? parseFloat(sale.montantFacturable.replace(/[^0-9,-]+/g, "").replace(',', '.')) : 0,
            date_facture: sale.dateFacture,
            annulation: sale.annulation ? parseFloat(sale.annulation.replace(/[^0-9,-]+/g, "").replace(',', '.')) : 0,
            statut: sale.statut,
            annulation_boolean: sale.annulationBoolean === 'X',
            commentaires: sale.commentaires,
            annee: sale.annee
        }]);

    if (error) {
        console.error('Error creating sale:', error);
        throw error;
    }
};

export const deleteSaleData = async (saleId: number): Promise<void> => {
    const { error } = await supabase
        .from('suivi_produits')
        .delete()
        .eq('id', saleId);

    if (error) {
        console.error('Error deleting sale:', error);
        throw error;
    }
};

export const createClient = async (client: Partial<Client>): Promise<string> => {
    const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select('id')
        .single();

    if (error) {
        console.error('Error creating client:', error);
        throw error;
    }

    return data.id;
};
export const updateClientData = async (client: Partial<Client>): Promise<void> => {
    const { id, ...updateFields } = client;

    // Remove transient/calculated fields before updating
    const { totalCA, totalCAPerso, sales, ...cleanFields } = updateFields as any;

    const { error } = await supabase
        .from('clients')
        .update(cleanFields)
        .eq('id', id);

    if (error) {
        console.error('Error updating client:', error);
        throw error;
    }
};

export const fetchSimulationTypes = async (): Promise<SimulationType[]> => {
    const { data, error } = await supabase
        .from('simulations_type')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching simulation types:', error);
        throw error;
    }

    return data;
};

export const createSimulationType = async (template: Partial<SimulationType>): Promise<void> => {
    const { error } = await supabase
        .from('simulations_type')
        .insert([template]);

    if (error) {
        console.error('Error creating simulation type:', error);
        throw error;
    }
};

export const updateSimulationType = async (template: Partial<SimulationType>): Promise<void> => {
    const { id, ...updateFields } = template;
    const { error } = await supabase
        .from('simulations_type')
        .update(updateFields)
        .eq('id', id);

    if (error) {
        console.error('Error updating simulation type:', error);
        throw error;
    }
};

export const deleteSimulationType = async (id: number): Promise<void> => {
    const { error } = await supabase
        .from('simulations_type')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting simulation type:', error);
        throw error;
    }
};

export const createProduct = async (product: Partial<Product>): Promise<void> => {
    const { error } = await supabase
        .from('liste_produits')
        .insert([product]);

    if (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

export const updateProduct = async (product: Partial<Product>): Promise<void> => {
    const { id, ...updateFields } = product;
    const { error } = await supabase
        .from('liste_produits')
        .update(updateFields)
        .eq('id', id);

    if (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

export const deleteProduct = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('liste_produits')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

export const updateClientSimulation = async (clientId: string, simulationMarkdown: string): Promise<void> => {
    const { error } = await supabase
        .from('clients')
        .update({ simulation_1: simulationMarkdown })
        .eq('id', clientId);

    if (error) {
        console.error('Error updating client simulation:', error);
        throw error;
    }
};
