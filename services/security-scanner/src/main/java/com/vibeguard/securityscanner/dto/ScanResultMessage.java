package com.vibeguard.securityscanner.dto;

import java.util.UUID;

public class ScanResultMessage {
    private UUID scanId;
    private UUID userId;
    private ScanSummary summary;
    private String language;
    private String timestamp;

    // Constructors
    public ScanResultMessage() {}

    public ScanResultMessage(UUID scanId, UUID userId, ScanSummary summary, String language, String timestamp) {
        this.scanId = scanId;
        this.userId = userId;
        this.summary = summary;
        this.language = language;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public UUID getScanId() {
        return scanId;
    }

    public void setScanId(UUID scanId) {
        this.scanId = scanId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public ScanSummary getSummary() {
        return summary;
    }

    public void setSummary(ScanSummary summary) {
        this.summary = summary;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
