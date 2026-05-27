package com.vibeguard.securityscanner.dto;

import java.util.UUID;

public class ScanRequestMessage {
    private UUID scanId;
    private String code;
    private String language;
    private UUID userId;
    private String filename;

    // Constructors
    public ScanRequestMessage() {}

    public ScanRequestMessage(UUID scanId, String code, String language, UUID userId, String filename) {
        this.scanId = scanId;
        this.code = code;
        this.language = language;
        this.userId = userId;
        this.filename = filename;
    }

    // Getters and Setters
    public UUID getScanId() {
        return scanId;
    }

    public void setScanId(UUID scanId) {
        this.scanId = scanId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }
}
