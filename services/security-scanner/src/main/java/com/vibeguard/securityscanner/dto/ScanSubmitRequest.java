package com.vibeguard.securityscanner.dto;

public class ScanSubmitRequest {
    private String code;
    private String language;
    private String filename;

    // Constructors
    public ScanSubmitRequest() {}

    public ScanSubmitRequest(String code, String language, String filename) {
        this.code = code;
        this.language = language;
        this.filename = filename;
    }

    // Getters and Setters
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

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }
}
