package com.vibeguard.securityscanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "scans")
public class Scan {

    @Id
    private UUID id;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "language", nullable = false)
    private String language;

    @Column(name = "code", nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "scanned_at", nullable = false)
    private LocalDateTime scannedAt;

    @Column(name = "critical_count", nullable = false)
    private int criticalCount;

    @Column(name = "high_count", nullable = false)
    private int highCount;

    @Column(name = "medium_count", nullable = false)
    private int mediumCount;

    @Column(name = "low_count", nullable = false)
    private int lowCount;

    @Column(name = "score", nullable = false)
    private int score;

    @OneToMany(mappedBy = "scan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Finding> findings = new ArrayList<>();

    // Constructors
    public Scan() {}

    public Scan(UUID id, String status, String language, String code, UUID userId, LocalDateTime scannedAt) {
        this.id = id;
        this.status = status;
        this.language = language;
        this.code = code;
        this.userId = userId;
        this.scannedAt = scannedAt;
        this.criticalCount = 0;
        this.highCount = 0;
        this.mediumCount = 0;
        this.lowCount = 0;
        this.score = 100;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public LocalDateTime getScannedAt() {
        return scannedAt;
    }

    public void setScannedAt(LocalDateTime scannedAt) {
        this.scannedAt = scannedAt;
    }

    public int getCriticalCount() {
        return criticalCount;
    }

    public void setCriticalCount(int criticalCount) {
        this.criticalCount = criticalCount;
    }

    public int getHighCount() {
        return highCount;
    }

    public void setHighCount(int highCount) {
        this.highCount = highCount;
    }

    public int getMediumCount() {
        return mediumCount;
    }

    public void setMediumCount(int mediumCount) {
        this.mediumCount = mediumCount;
    }

    public int getLowCount() {
        return lowCount;
    }

    public void setLowCount(int lowCount) {
        this.lowCount = lowCount;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public List<Finding> getFindings() {
        return findings;
    }

    public void setFindings(List<Finding> findings) {
        this.findings = findings;
        if (findings != null) {
            for (Finding f : findings) {
                f.setScan(this);
            }
        }
    }

    public void addFinding(Finding finding) {
        findings.add(finding);
        finding.setScan(this);
    }
}
