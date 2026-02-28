export interface Sale {
    id: number;
    client_id: string; // UUID
    produit_id?: string; // UUID
    produit: string; // Keep for legacy/convenience
    client_nom: string; // Keep for legacy/convenience
    type: 'F' | 'P' | string;
    parrain: string;
    dateVente: string;
    programme: string;
    promoteur: string;
    prixPack: string;
    prix: string;
    dispositif: string;
    remuneration: string;
    caGeneral: string;
    caPerso: string;
    fIngenierie: string;
    fIngenierieRPC: string;
    montantFacturable: string;
    dateFacture: string;
    annulation: string;
    statut: string;
    annulationBoolean: string;
    commentaires: string;
    annee: number;
}

export interface Client {
    id: string; // UUID
    nom: string;
    prenom: string | null;
    patrimoine_brut: number;
    date_entree: string;
    statut: string | null;
    identite: string | null;
    situation_matrimoniale_fiscale: string | null;
    immobilier: string | null;
    autres_charges: string | null;
    epargne: string | null;
    objectifs: string | null;
    autres_observations: string | null;
    simulation_1: string | null;
    simulation_2: string | null;
    simulation_3: string | null;
    capacite_epargne: string | null;
    capacite_emprunt: string | null;
    analyse_profil: string | null;
    infos_complementaires?: string | null;
    sales?: Sale[];
    totalCA: number;
    totalCAPerso: number;
}

export interface Product {
    id: string;
    nom: string;
    description: string | null;
}

export interface SimulationType {
    id: number;
    created_at: string;
    type: string;
    description: string;
    nom: string;
}
