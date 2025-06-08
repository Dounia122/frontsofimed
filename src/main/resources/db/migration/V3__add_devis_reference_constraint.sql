-- Ajouter une contrainte unique sur la colonne reference de la table devis
ALTER TABLE devis ADD CONSTRAINT uk_devis_reference UNIQUE (reference); 