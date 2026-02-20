export interface Sale {
    id: number;
    row_number: number; // For safe deletion
    produit: string;
    nom: string;
    type: 'F' | 'P' | string; // F / P
    parrain: string;
    dateVente: string;
    programme: string;
    promoteur: string;
    prixPack: string;
    prix: string;
    dispositif: string;
    remuneration: string; // "9,00%"
    caGeneral: string;
    caPerso: string;
    fIngenierie: string;
    fIngenierieRPC: string;
    montantFacturable: string;
    dateFacture: string;
    annulation: string;
    statut: string;
    annulationBoolean: string; // "X" or empty
    commentaires: string;
    annee: number;
}

export interface Client {
    id: number;
    name: string; // Derived from 'Nom'
    sales: Sale[];
    totalCA: number;
    totalCAPerso: number;
}
