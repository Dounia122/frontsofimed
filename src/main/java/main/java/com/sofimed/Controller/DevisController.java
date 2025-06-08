package main.java.com.sofimed.Controller;

import main.java.com.sofimed.Service.DevisService;
import main.java.com.sofimed.Service.CartService;
import main.java.com.sofimed.Model.Cart;
import main.java.com.sofimed.Model.Devis;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/devis")
@CrossOrigin(origins = "*")
public class DevisController {

    @Autowired
    private DevisService devisService;

    @Autowired
    private CartService cartService;

    // Créer un nouveau devis
    @PostMapping("/create")
    public ResponseEntity<Devis> createDevis(
            @RequestBody Map<String, Object> requestBody) {
        try {
            Long cartId = Long.parseLong(requestBody.get("cartId").toString());
            String paymentMethod = (String) requestBody.get("paymentMethod");
            String commentaire = (String) requestBody.get("commentaire");

            Cart cart = cartService.getCart(cartId);
            if (cart == null) {
                return ResponseEntity.notFound().build();
            }
            
            Devis newDevis = devisService.createDevis(cart, paymentMethod, commentaire);
            return ResponseEntity.ok(newDevis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 