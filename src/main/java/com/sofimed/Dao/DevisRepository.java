package com.Sofimed.Dao;

import com.Sofimed.Model.Devis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;

@Repository
public interface DevisRepository extends JpaRepository<Devis, Long> {
    List<Devis> findByCartId(Long cartId);
    List<Devis> findByCommercialId(Long commercialId);
    List<Devis> findByCartClientId(Long clientId);

    @Query("SELECT d.reference FROM Devis d WHERE d.reference LIKE CONCAT('DEV-', :year, '-%') ORDER BY d.reference DESC")
    List<String> findAllReferencesByYear(@Param("year") String year);

    @Query("SELECT CAST(SUBSTRING(d.reference, 9) AS long) FROM Devis d WHERE d.reference LIKE CONCAT('DEV-', :year, '-%')")
    Long findMaxSequenceForYear(@Param("year") String year);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT CAST(SUBSTRING(d.reference, 9) AS long) FROM Devis d WHERE d.reference LIKE CONCAT('DEV-', :year, '-%')")
    Long findMaxSequenceForYearWithLock(@Param("year") String year);

    boolean existsByReference(String reference);
} 