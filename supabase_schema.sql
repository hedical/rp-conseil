-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: clients
create table if not exists clients (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    prenom text,
    patrimoine_brut numeric default 0,
    date_entree date default current_date,
    statut text,
    identite text,
    situation_matrimoniale_fiscale text,
    immobilier text,
    autres_charges text,
    epargne text,
    objectifs text,
    autres_observations text,
    simulation_1 text,
    simulation_2 text,
    simulation_3 text,
    capacite_epargne text,
    capacite_emprunt text,
    analyse_profil text,
    created_at timestamptz default now()
);

-- Table: liste_produits
create table if not exists liste_produits (
    id uuid primary key default uuid_generate_v4(),
    nom text not null unique,
    description text,
    created_at timestamptz default now()
);

-- Table: suivi_produits
create table if not exists suivi_produits (
    id bigserial primary key,
    client_id uuid references clients(id) on delete cascade,
    produit_id uuid references liste_produits(id) on delete set null,
    type text, -- F / P
    nom_parrain text,
    date_vente text,
    programme text,
    promoteur text,
    prix_pack numeric default 0,
    prix numeric default 0,
    dispositif text,
    remuneration_taux numeric default 0,
    ca_general numeric default 0,
    ca_perso numeric default 0,
    f_ingenierie text,
    f_ingenierie_rpc numeric default 0,
    montant_facturable numeric default 0,
    date_facture text,
    annulation numeric default 0,
    statut text,
    annulation_boolean boolean default false,
    commentaires text,
    annee int4,
    created_at timestamptz default now()
);

-- Enable RLS
alter table clients enable row level security;
alter table liste_produits enable row level security;
alter table suivi_produits enable row level security;

-- Create basic policies for anon access
create policy "Allow all for anon on clients" on clients for all using (true) with check (true);
create policy "Allow all for anon on liste_produits" on liste_produits for all using (true) with check (true);
create policy "Allow all for anon on suivi_produits" on suivi_produits for all using (true) with check (true);
