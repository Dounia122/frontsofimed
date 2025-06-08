-- Suppression de la contrainte unique sur client_id et status
ALTER TABLE carts DROP CONSTRAINT IF EXISTS uk_client_active_cart; 