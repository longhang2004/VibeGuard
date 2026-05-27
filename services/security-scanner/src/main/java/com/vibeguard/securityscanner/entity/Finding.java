package com.vibeguard.securityscanner.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "findings")
public class Finding {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_id", nullable = false)
    @JsonIgnore
    private Scan scan;

    @Column(name = "rule_id", nullable = false)
    private String ruleId;

    @Column(name = "severity", nullable = false)
    private String severity;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "line", nullable = false)
    private int line;

    @Column(name = "column_num", nullable = false)
    private int columnNum;

    @Column(name = "snippet", nullable = false, columnDefinition = "TEXT")
    private String snippet;

    @Column(name = "remediation", nullable = false, columnDefinition = "TEXT")
    private String remediation;

    // Constructors
    public Finding() {}

    public Finding(UUID id, Scan scan, String ruleId, String severity, String title, 
                   String description, int line, int columnNum, String snippet, String remediation) {
        this.id = id;
        this.scan = scan;
        this.ruleId = ruleId;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.line = line;
        this.columnNum = columnNum;
        this.snippet = snippet;
        this.remediation = remediation;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Scan getScan() {
        return scan;
    }

    public void setScan(Scan scan) {
        this.scan = scan;
    }

    public String getRuleId() {
        return ruleId;
    }

    public void setRuleId(String ruleId) {
        this.ruleId = ruleId;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getLine() {
        return line;
    }

    public void setLine(int line) {
        this.line = line;
    }

    public int getColumnNum() {
        return columnNum;
    }

    public void setColumnNum(int columnNum) {
        this.columnNum = columnNum;
    }

    public String getSnippet() {
        return snippet;
    }

    public void setSnippet(String snippet) {
        this.snippet = snippet;
    }

    public String getRemediation() {
        return remediation;
    }

    public void setRemediation(String remediation) {
        this.remediation = remediation;
    }
}
