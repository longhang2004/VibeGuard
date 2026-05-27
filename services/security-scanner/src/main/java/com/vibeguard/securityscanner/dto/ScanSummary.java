package com.vibeguard.securityscanner.dto;

public class ScanSummary {
    private int critical;
    private int high;
    private int medium;
    private int low;
    private int score;

    // Constructors
    public ScanSummary() {}

    public ScanSummary(int critical, int high, int medium, int low, int score) {
        this.critical = critical;
        this.high = high;
        this.medium = medium;
        this.low = low;
        this.score = score;
    }

    // Getters and Setters
    public int getCritical() {
        return critical;
    }

    public void setCritical(int critical) {
        this.critical = critical;
    }

    public int getHigh() {
        return high;
    }

    public void setHigh(int high) {
        this.high = high;
    }

    public int getMedium() {
        return medium;
    }

    public void setMedium(int medium) {
        this.medium = medium;
    }

    public int getLow() {
        return low;
    }

    public void setLow(int low) {
        this.low = low;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }
}
