package com.Sofimed.Service;

import com.Sofimed.Dao.DevisRepository;
import com.Sofimed.Dao.CartRepository;
import com.Sofimed.Model.Cart;
import com.Sofimed.Model.Devis;
import com.Sofimed.DTO.DevisDTO;
import com.Sofimed.DTO.DevisStatus;
import com.Sofimed.Model.Commercial;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class DevisService {
    private static final Logger logger = LoggerFactory.getLogger(DevisService.class);

    @Autowired
    private DevisRepository devisRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private CommercialService commercialService;

    @Transactional
    public Devis createDevis(Cart cart, String paymentMethod, String commentaire) {
        // Vérifier si le panier existe et est actif
        if (cart == null) {
            logger.error("Tentative de création de devis avec un panier null");
            throw new IllegalStateException("Le panier n'existe pas");
        }
        
        logger.info("Création de devis pour le panier {} avec statut {}", cart.getId(), cart.getStatus());
        
        if (cart.getStatus() != Cart.CartStatus.ACTIVE) {
            logger.error("Tentative de création de devis avec un panier non actif: {}", cart.getStatus());
            throw new IllegalStateException("Le panier doit être actif pour créer un devis");
        }

        try {
            // Trouver le commercial approprié
            Commercial commercial = commercialService.findCommercialByCartProducts(cart);
            logger.info("Commercial assigné au devis: {}", commercial.getId());
            
            // Créer le devis
            Devis devis = new Devis();
            devis.setCart(cart);
            devis.setCommercial(commercial);
            devis.setPaymentMethod(paymentMethod);
            devis.setCommentaire(commentaire != null ? commentaire : "");
            devis.setCreatedAt(LocalDateTime.now());
            devis.setStatus(DevisStatus.EN_ATTENTE);
            devis.setReference(generateDevisReference());

            // Sauvegarder d'abord le devis
            logger.info("Sauvegarde du devis avec référence: {}", devis.getReference());
            devis = devisRepository.save(devis);

            // Changer le statut du panier à COMPLETED
            logger.info("Changement du statut du panier {} de {} à COMPLETED", cart.getId(), cart.getStatus());
            cart.setStatus(Cart.CartStatus.COMPLETED);
            cart.setCompletedAt(LocalDateTime.now());
            cartRepository.save(cart);

            // Créer un nouveau panier actif pour le client
            logger.info("Création d'un nouveau panier actif pour le client: {}", cart.getClientId());
            Cart newCart = cartService.getOrCreateActiveCart(cart.getClientId());
            logger.info("Nouveau panier actif créé avec ID: {}", newCart.getId());

            return devis;
        } catch (Exception e) {
            logger.error("Erreur lors de la création du devis: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la création du devis: " + e.getMessage(), e);
        }
    }

    @Transactional
    private String generateDevisReference() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        
        synchronized(this) {
            // Récupérer toutes les références existantes pour l'année en cours
            List<String> existingRefs = devisRepository.findAllReferencesByYear(year);
            
            // Si aucune référence n'existe pour cette année, commencer à 001
            if (existingRefs.isEmpty()) {
                return String.format("DEV-%s-001", year);
            }
            
            // Trouver le dernier numéro utilisé
            String lastRef = existingRefs.get(0); // La liste est déjà triée par ordre décroissant
            int lastNumber = Integer.parseInt(lastRef.substring(lastRef.lastIndexOf("-") + 1));
            
            // Générer la nouvelle référence
            String newRef;
            do {
                lastNumber++;
                newRef = String.format("DEV-%s-%03d", year, lastNumber);
            } while (devisRepository.existsByReference(newRef));
            
            return newRef;
        }
    }

    // ... autres méthodes existantes ...
} 