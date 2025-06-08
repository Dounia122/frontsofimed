package com.Sofimed.Model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
@Data
@NoArgsConstructor
public class Cart {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CartStatus status = CartStatus.ACTIVE;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    public enum CartStatus {
        ACTIVE,
        COMPLETED,
        CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = CartStatus.ACTIVE;
        }
    }

    public void setStatus(CartStatus newStatus) {
        if (this.status != newStatus) {
            this.status = newStatus;
            if (newStatus == CartStatus.COMPLETED) {
                this.completedAt = LocalDateTime.now();
            }
        }
    }

    public CartStatus getStatus() {
        return status != null ? status : CartStatus.ACTIVE;
    }
} 