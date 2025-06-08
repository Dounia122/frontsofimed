package main.java.com.sofimed.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import main.java.com.sofimed.DTO.CartItemRequest;
import main.java.com.sofimed.Dao.CartRepository;
import main.java.com.sofimed.Dao.ClientRepository;
import main.java.com.sofimed.Model.Cart;
import main.java.com.sofimed.Model.CartItem;
import main.java.com.sofimed.Model.Client;
import main.java.com.sofimed.Service.CartService;
import main.java.com.sofimed.Service.ClientService;
import main.java.com.sofimed.Service.UserService;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/carts")
@CrossOrigin(
    origins = {"http://localhost:3000"},
    allowedHeaders = {"Authorization", "Content-Type"},
    exposedHeaders = {"Authorization"},
    allowCredentials = "true",
    methods = {
        RequestMethod.GET,
        RequestMethod.POST,
        RequestMethod.PUT,
        RequestMethod.DELETE,
        RequestMethod.OPTIONS
    }
)
public class CartController {
    @Autowired
    private CartService cartService;
    
    @Autowired
    private ClientService clientService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private ClientRepository clientRepository;
    
    @Autowired
    private CartRepository cartRepository;

    @GetMapping("/current/{userId}")
    public ResponseEntity<Long> getCurrentCart(@PathVariable Long userId) {
        try {
            Client client = clientRepository.findByUserId(userId);
            if (client == null) {
                return ResponseEntity.status(404).body(null);
            }

            Cart activeCart = cartService.getOrCreateActiveCart(client.getId());
            if (activeCart == null) {
                return ResponseEntity.status(500).build();
            }

            return ResponseEntity.ok(activeCart.getId());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{cartId}/items")
    public ResponseEntity<List<Map<String, Object>>> getCartItems(@PathVariable Long cartId) {
        try {
            Cart cart = cartService.getCart(cartId);
            if (cart == null) {
                return ResponseEntity.notFound().build();
            }

            List<CartItem> items = cartService.getCartItems(cartId);
            if (items == null) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<Map<String, Object>> itemsWithDetails = items.stream()
                .map(item -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", item.getProduit().getId());
                    details.put("nom", item.getProduit().getNom());
                    details.put("reference", item.getProduit().getReference());
                    details.put("imageUrl", item.getProduit().getImageUrl());
                    details.put("categorie", item.getProduit().getCategorie());
                    details.put("quantity", item.getQuantity());
                    return details;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(itemsWithDetails);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
} 