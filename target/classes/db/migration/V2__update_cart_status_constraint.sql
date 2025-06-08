-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE carts DROP CONSTRAINT IF EXISTS carts_status_check;

-- Ajouter la nouvelle contrainte
ALTER TABLE carts ADD CONSTRAINT carts_status_check 
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')); 