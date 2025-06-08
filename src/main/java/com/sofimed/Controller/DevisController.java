package com.Sofimed.Controller;

import com.Sofimed.Service.DevisService;
import com.Sofimed.Service.CartService;
import com.Sofimed.Model.Cart;
import com.Sofimed.Model.Devis;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;

@RestController
@RequestMapping("/api/devis")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class DevisController {

    private static final Logger logger = LoggerFactory.getLogger(DevisController.class);

    @Autowired
    private DevisService devisService;

    @Autowired
    private CartService cartService;

    // Créer un nouveau devis
    @PostMapping("/create")
    public ResponseEntity<?> createDevis(@RequestBody Map<String, Object> requestBody) {
        try {
            logger.info("Création d'un devis avec les données: {}", requestBody);

            // Validation des champs requis
            if (!requestBody.containsKey("cartId")) {
                logger.error("CartId manquant dans la requête");
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le cartId est requis"));
            }

            if (!requestBody.containsKey("paymentMethod")) {
                logger.error("Mode de paiement manquant dans la requête");
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le mode de paiement est requis"));
            }

            // Conversion et validation du cartId
            Long cartId;
            try {
                cartId = Long.parseLong(requestBody.get("cartId").toString());
            } catch (NumberFormatException e) {
                logger.error("CartId invalide: {}", requestBody.get("cartId"));
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le cartId doit être un nombre valide"));
            }

            String paymentMethod = (String) requestBody.get("paymentMethod");
            String commentaire = (String) requestBody.getOrDefault("commentaire", "");

            // Récupération du panier
            Cart cart = cartService.getCart(cartId);
            if (cart == null) {
                logger.error("Panier non trouvé avec l'ID: {}", cartId);
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le panier n'existe pas"));
            }

            // Vérification du statut du panier
            if (cart.getStatus() != Cart.CartStatus.ACTIVE) {
                logger.error("Statut du panier invalide: {}", cart.getStatus());
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le panier doit être actif pour créer un devis"));
            }

            // Création du devis
            Devis newDevis = devisService.createDevis(cart, paymentMethod, commentaire);
            logger.info("Devis créé avec succès: {}", newDevis.getId());
            
            return ResponseEntity.ok(newDevis);

        } catch (Exception e) {
            logger.error("Erreur lors de la création du devis", e);
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Une erreur est survenue lors de la création du devis: " + e.getMessage()));
        }
    }
} 