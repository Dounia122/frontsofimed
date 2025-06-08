package com.Sofimed.Service;

import com.Sofimed.Dao.CartRepository;
import com.Sofimed.Model.Cart;
import com.Sofimed.Model.CartItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@Transactional
public class CartService {
    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    @Autowired
    private CartRepository cartRepository;

    public Cart getCart(Long cartId) {
        return cartRepository.findById(cartId).orElse(null);
    }

    @Transactional
    public Cart getOrCreateActiveCart(Long clientId) {
        logger.info("Recherche ou création d'un panier actif pour le client: {}", clientId);
        
        // Chercher un panier actif existant
        Cart activeCart = cartRepository.findByClientIdAndStatus(clientId, Cart.CartStatus.ACTIVE);
        
        // Si aucun panier actif n'existe, en créer un nouveau
        if (activeCart == null) {
            logger.info("Aucun panier actif trouvé, création d'un nouveau panier pour le client: {}", clientId);
            activeCart = new Cart();
            activeCart.setClientId(clientId);
            activeCart.setStatus(Cart.CartStatus.ACTIVE);
            activeCart.setCreatedAt(LocalDateTime.now());
            activeCart = cartRepository.save(activeCart);
            logger.info("Nouveau panier créé avec ID: {}", activeCart.getId());
        } else {
            logger.info("Panier actif existant trouvé avec ID: {}", activeCart.getId());
        }
        
        return activeCart;
    }

    @Transactional
    public Cart completeCart(Long cartId) {
        logger.info("Tentative de complétion du panier: {}", cartId);
        Cart cart = getCart(cartId);
        if (cart != null && cart.getStatus() == Cart.CartStatus.ACTIVE) {
            logger.info("Changement du statut du panier {} à COMPLETED", cartId);
            cart.setStatus(Cart.CartStatus.COMPLETED);
            cart.setCompletedAt(LocalDateTime.now());
            cart = cartRepository.save(cart);
            
            // Créer automatiquement un nouveau panier actif
            logger.info("Création d'un nouveau panier actif pour le client: {}", cart.getClientId());
            Cart newCart = getOrCreateActiveCart(cart.getClientId());
            logger.info("Nouveau panier actif créé avec ID: {}", newCart.getId());
        } else {
            logger.warn("Impossible de compléter le panier {}: panier null ou non actif", cartId);
        }
        return cart;
    }

    public List<CartItem> getCartItems(Long cartId) {
        Cart cart = getCart(cartId);
        return cart != null ? cart.getItems() : Collections.emptyList();
    }
} 