package com.vibeguard.securityscanner.repository;

import com.vibeguard.securityscanner.entity.Scan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ScanRepository extends JpaRepository<Scan, UUID> {
    Page<Scan> findByUserIdOrderByScannedAtDesc(UUID userId, Pageable pageable);
}
