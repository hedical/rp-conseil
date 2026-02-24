-- DATA MIGRATION SCRIPT
-- RUN THIS ONLY AFTER IMPORTING YOUR CSV INTO 'temp_migration'

-- 1. Populate 'liste_produits' with unique product names
INSERT INTO liste_produits (nom)
SELECT DISTINCT "Produit"
FROM temp_migration
WHERE "Produit" IS NOT NULL
ON CONFLICT (nom) DO NOTHING;

-- 2. Populate 'clients' with unique client names
INSERT INTO clients (nom)
SELECT DISTINCT "Nom "
FROM temp_migration
WHERE "Nom " IS NOT NULL;

-- 3. Populate 'suivi_produits' by mapping names to UUIDs
INSERT INTO suivi_produits (
    client_id, 
    produit_id, 
    type, 
    nom_parrain, 
    date_vente, 
    programme, 
    promoteur, 
    prix_pack, 
    prix, 
    dispositif, 
    remuneration_taux, 
    ca_general, 
    ca_perso, 
    f_ingenierie, 
    f_ingenierie_rpc, 
    montant_facturable, 
    date_facture, 
    annulation, 
    statut, 
    annulation_boolean,
    commentaires, 
    annee
)
SELECT 
    c.id as client_id,
    p.id as produit_id,
    t."F / P" as type,
    t."Nom Parrain",
    t."Date de la vente",
    t."Programme / lot / localisation ",
    t."Promoteur",
    NULLIF(REPLACE(REGEXP_REPLACE(t."Prix pack", '[^0-9,]', '', 'g'), ',', '.'), '')::numeric,
    NULLIF(REPLACE(REGEXP_REPLACE(t."Prix", '[^0-9,]', '', 'g'), ',', '.'), '')::numeric,
    t."Dispositif",
    NULLIF(REPLACE(REGEXP_REPLACE(t."T. Rem", '[^0-9,]', '', 'g'), ',', '.'), '')::numeric / 100,
    NULLIF(REPLACE(REGEXP_REPLACE(t."CA général ", '[^0-9,]', '', 'g'), ',', '.'), '')::numeric,
    NULLIF(REPLACE(REGEXP_REPLACE(t."CA perso", '[^0-9,]', '', 'g'), ',', '.'), '')::numeric,
    t."F. Ingénierie",
    NULLIF(REPLACE(REGEXP_REPLACE(t."F. Ingénierie RPC", '[^0-9,]', '', 'g'), ',', '.'), '')::numeric,
    NULLIF(REPLACE(REGEXP_REPLACE(t."Montant facturable", '[^0-9,]', '', 'g'), ',', '.'), '')::numeric,
    t."Date Facture",
    NULLIF(REPLACE(REGEXP_REPLACE(t."Annulation", '[^0-9,]', '', 'g'), ',', '.'), '')::numeric,
    t."Statut",
    t."AnnulationBoolean" = 'X',
    t."Commentaires / N° facture",
    NULLIF(t."Année", '')::int4
FROM temp_migration t
JOIN clients c ON t."Nom " = c.nom
JOIN liste_produits p ON t."Produit" = p.nom;

-- 4. Verification (Optional)
-- SELECT count(*) FROM suivi_produits;

-- 5. Cleanup (Uncomment when done)
-- DROP TABLE temp_migration;
