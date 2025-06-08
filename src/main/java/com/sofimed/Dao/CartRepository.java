package com.Sofimed.Dao;

import com.Sofimed.Model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Cart findByClientIdAndStatus(Long clientId, Cart.CartStatus status);
} 