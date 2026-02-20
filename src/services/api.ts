
import type { Sale } from '../types';

const MOCK_DATA: Sale[] = [
    {
        id: 1,
        row_number: 1,
        produit: "PINEL",
        nom: "MEIROSU",
        type: "F",
        parrain: "",
        dateVente: "2020",
        programme: "Domaine du Val / C404 / Cagnes sur Mer",
        promoteur: "PICHET",
        prixPack: "274 889 €",
        prix: "247 000,00 €",
        dispositif: "PINEL",
        remuneration: "9,00%",
        caGeneral: "22 230 €",
        caPerso: "8 892,00 €",
        fIngenierie: "SO",
        fIngenierieRPC: "0,00 €",
        montantFacturable: "8 892,00 €",
        dateFacture: "18/8/2020",
        annulation: "",
        statut: "Réglé",
        annulationBoolean: "",
        commentaires: "",
        annee: 2020
    },
    {
        id: 2,
        row_number: 2,
        produit: "PINEL",
        nom: "GNOSSIKE",
        type: "F",
        parrain: "",
        dateVente: "17/12/2019",
        programme: "Atelier PICAS'O / E 609 / Bobigny",
        promoteur: "PICHET",
        prixPack: "151 779 €",
        prix: "136 500,00 €",
        dispositif: "PINEL",
        remuneration: "10,00%",
        caGeneral: "13 650 €",
        caPerso: "5 460,00 €",
        fIngenierie: "SO",
        fIngenierieRPC: "0,00 €",
        montantFacturable: "5 460,00 €",
        dateFacture: "",
        annulation: "5 460,00 €",
        statut: "Annulé",
        annulationBoolean: "X",
        commentaires: "Défaut de financement",
        annee: 2019
    }
];

const WEBHOOK_URL = 'https://databuildr.app.n8n.cloud/webhook/rp-data';
const UPDATE_WEBHOOK_URL = 'https://databuildr.app.n8n.cloud/webhook/rp-update-data';
const DELETE_WEBHOOK_URL = 'https://databuildr.app.n8n.cloud/webhook/rp-delete-data';

// Raw data interface matching the webhook JSON structure exactly
interface RawSale {
    "row_number": number;
    "ID": number;
    "Produit": string;
    "Nom ": string;
    "F / P": string;
    "Nom Parrain": string;
    "Date de la vente": string;
    "Programme / lot / localisation ": string;
    "Promoteur": string;
    "Prix pack": number;
    "Prix": number;
    "Dispositif": string;
    "T. Rem": number;
    "CA général ": number;
    "CA perso": number;
    "F. Ingénierie": string;
    "F. Ingénierie RPC": number;
    "Montant facturable": number;
    "Date Facture": string;
    "Annulation": string | number;
    "Statut": string;
    "AnnulationBoolean": string;
    "Commentaires / N° facture": string;
    "Année": string | number;
}

const formatCurrency = (value: number | string): string => {
    if (typeof value === 'string') return value;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatPercent = (value: number | string): string => {
    if (typeof value === 'string') return value;
    return new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 2 }).format(value);
};

const mapRawSaleToSale = (raw: RawSale): Sale => {
    // Robust ID parsing
    const parsedId = typeof raw.ID === 'number' ? raw.ID : parseInt(String(raw.ID || '0'));

    return {
        id: isNaN(parsedId) ? 0 : parsedId,
        row_number: raw.row_number,
        produit: raw.Produit,
        nom: raw["Nom "].trim(), // Remove trailing space found in key "Nom "
        type: raw["F / P"],
        parrain: raw["Nom Parrain"],
        dateVente: raw["Date de la vente"],
        programme: raw["Programme / lot / localisation "],
        promoteur: raw.Promoteur,
        prixPack: formatCurrency(raw["Prix pack"]),
        prix: formatCurrency(raw.Prix),
        dispositif: raw.Dispositif,
        remuneration: formatPercent(raw["T. Rem"]),
        caGeneral: formatCurrency(raw["CA général "]),
        caPerso: formatCurrency(raw["CA perso"]),
        fIngenierie: raw["F. Ingénierie"],
        fIngenierieRPC: formatCurrency(raw["F. Ingénierie RPC"]),
        montantFacturable: formatCurrency(raw["Montant facturable"]),
        dateFacture: raw["Date Facture"],
        annulation: raw.Annulation ? formatCurrency(Number(raw.Annulation)) : "", // Handle potentially empty string or number
        statut: raw.Statut,
        annulationBoolean: raw.AnnulationBoolean,
        commentaires: raw["Commentaires / N° facture"],
        annee: parseInt(String(raw["Année"] || raw["Date de la vente"] || new Date().getFullYear()))
    };
};

export const fetchSalesData = async (password: string): Promise<Sale[]> => {
    try {
        // Add cache busting timestamp
        const cacheBuster = new Date().getTime();
        const response = await fetch(`${WEBHOOK_URL}?t=${cacheBuster}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: password
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("🔍 API Response Received:", data);

        // Validation: Ensure data is an array or single object
        let rawData: RawSale[] = [];

        if (Array.isArray(data)) {
            rawData = data;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
            // Handle { data: [...] } format if applicable
            rawData = data.data;
        } else if (data && typeof data === 'object') {
            // Handle single object response (row)
            rawData = [data as RawSale];
        } else {
            throw new Error("Fetched data is not an array or valid object");
        }

        // Map raw data to application internal structure
        const mappedData = rawData.map(mapRawSaleToSale);

        console.log(`📊 Validated Data: ${mappedData.length} items`);
        const maxId = Math.max(...mappedData.map(s => s.id));
        console.log(`🔢 Max ID found: ${maxId}`);

        return mappedData;

    } catch (error) {
        console.warn("Failed to fetch from webhook, using mock data:", error);
        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_DATA), 500);
        });
    }
};

// Function to convert Sale back to RawSale format for update
const mapSaleToRawSale = (sale: Sale): RawSale => {
    const parseToNumber = (str: string): number => {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9,-]+/g, "").replace(',', '.'));
    };

    const parsePercent = (str: string): number => {
        if (!str) return 0;
        const num = parseFloat(str.replace(/[^0-9,-]+/g, "").replace(',', '.'));
        return num / 100; // Convert "9,00%" to 0.09
    };

    return {
        "row_number": sale.row_number || sale.id, // Use actual row_number if available, else fallback to ID
        "ID": sale.id,
        "Produit": sale.produit,
        "Nom ": sale.nom,
        "F / P": sale.type,
        "Nom Parrain": sale.parrain,
        "Date de la vente": sale.dateVente,
        "Programme / lot / localisation ": sale.programme,
        "Promoteur": sale.promoteur,
        "Prix pack": parseToNumber(sale.prixPack),
        "Prix": parseToNumber(sale.prix),
        "Dispositif": sale.dispositif,
        "T. Rem": parsePercent(sale.remuneration),
        "CA général ": parseToNumber(sale.caGeneral),
        "CA perso": parseToNumber(sale.caPerso),
        "F. Ingénierie": sale.fIngenierie,
        "F. Ingénierie RPC": parseToNumber(sale.fIngenierieRPC),
        "Montant facturable": parseToNumber(sale.montantFacturable),
        "Date Facture": sale.dateFacture,
        "Annulation": sale.annulation ? parseToNumber(sale.annulation) : "",
        "Statut": sale.statut,
        "AnnulationBoolean": sale.annulationBoolean,
        "Commentaires / N° facture": sale.commentaires,
        "Année": sale.annee.toString()
    };
};

export const updateSaleData = async (sale: Sale, password: string): Promise<void> => {
    try {
        const rawSale = mapSaleToRawSale(sale);

        const response = await fetch(UPDATE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: password,
                data: rawSale
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("✅ Data updated successfully");
    } catch (error) {
        console.error("Failed to update data:", error);
        throw error;
    }
};

export const deleteSaleData = async (saleId: number, rowNumber: number, password: string): Promise<void> => {
    try {
        const response = await fetch(DELETE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: password,
                data: {
                    "ID": saleId,
                    "row_number": rowNumber
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(`✅ Data with ID ${saleId} deleted successfully`);
    } catch (error) {
        console.error("Failed to delete data:", error);
        throw error;
    }
};
