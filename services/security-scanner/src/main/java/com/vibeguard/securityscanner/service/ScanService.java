package com.vibeguard.securityscanner.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibeguard.securityscanner.dto.ScanRequestMessage;
import com.vibeguard.securityscanner.dto.ScanResultMessage;
import com.vibeguard.securityscanner.dto.ScanSummary;
import com.vibeguard.securityscanner.entity.Finding;
import com.vibeguard.securityscanner.entity.Scan;
import com.vibeguard.securityscanner.repository.ScanRepository;
import com.vibeguard.securityscanner.rule.RuleEngine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ScanService {

    private final ScanRepository scanRepository;
    private final RuleEngine ruleEngine;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${scanner.topics.requested:vibeguard.scanner.requested}")
    private String requestedTopic;

    @Value("${scanner.topics.completed:vibeguard.scanner.completed}")
    private String completedTopic;

    public ScanService(ScanRepository scanRepository, RuleEngine ruleEngine,
                       KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.scanRepository = scanRepository;
        this.ruleEngine = ruleEngine;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Scan submitScan(String code, String language, UUID userId, String filename) {
        UUID scanId = UUID.randomUUID();
        
        // Truncate code if it exceeds 50k chars and append a flag
        String finalCode = code;
        if (code != null && code.length() >= 50000) {
            finalCode = code.substring(0, 49900) + "\n\n... [TRUNCATED BY SCANNER SERVICE due to size limit]";
        }

        Scan scan = new Scan(scanId, "QUEUED", language, finalCode != null ? finalCode : "", userId, LocalDateTime.now());
        Scan savedScan = scanRepository.save(scan);

        // Publish scan request event to Kafka
        try {
            ScanRequestMessage message = new ScanRequestMessage(scanId, finalCode, language, userId, filename);
            String payload = objectMapper.writeValueAsString(message);
            kafkaTemplate.send(requestedTopic, scanId.toString(), payload);
        } catch (Exception e) {
            System.err.println("Failed to publish scan request event: " + e.getMessage());
            // Update status to FAILED since we couldn't enqueue it
            savedScan.setStatus("FAILED");
            scanRepository.save(savedScan);
        }

        return savedScan;
    }

    @Transactional
    public void executeScan(UUID scanId, String code, String language, String filename) {
        Optional<Scan> scanOpt = scanRepository.findById(scanId);
        if (scanOpt.isEmpty()) {
            System.err.println("Scan ID " + scanId + " not found in database. Skipping scan.");
            return;
        }

        Scan scan = scanOpt.get();
        scan.setStatus("PROCESSING");
        scanRepository.save(scan);

        try {
            // Run vulnerability detection
            List<Finding> findings = ruleEngine.run(code, language, filename);

            int critical = 0;
            int high = 0;
            int medium = 0;
            int low = 0;

            for (Finding finding : findings) {
                scan.addFinding(finding);
                String severity = finding.getSeverity().toUpperCase();
                switch (severity) {
                    case "CRITICAL":
                        critical++;
                        break;
                    case "HIGH":
                        high++;
                        break;
                    case "MEDIUM":
                        medium++;
                        break;
                    case "LOW":
                        low++;
                        break;
                    default:
                        break;
                }
            }

            // Deduct scores: Start at 100
            // CRITICAL: -25 each, HIGH: -10 each, MEDIUM: -5 each, LOW: -2 each. Min: 0
            int deductions = (critical * 25) + (high * 10) + (medium * 5) + (low * 2);
            int score = Math.max(0, 100 - deductions);

            scan.setCriticalCount(critical);
            scan.setHighCount(high);
            scan.setMediumCount(medium);
            scan.setLowCount(low);
            scan.setScore(score);
            scan.setStatus("COMPLETED");
            scan.setScannedAt(LocalDateTime.now());

            Scan completedScan = scanRepository.save(scan);

            ScanSummary summary = new ScanSummary(critical, high, medium, low, score);
            ScanResultMessage resultMessage = new ScanResultMessage(
                scanId, 
                completedScan.getUserId(), 
                summary, 
                completedScan.getLanguage(), 
                completedScan.getScannedAt().toString()
            );
            String payload = objectMapper.writeValueAsString(resultMessage);
            kafkaTemplate.send(completedTopic, scanId.toString(), payload);

        } catch (Exception e) {
            System.err.println("Error executing scan for ID " + scanId + ": " + e.getMessage());
            scan.setStatus("FAILED");
            scanRepository.save(scan);
        }
    }

    public Optional<Scan> getScanResult(UUID scanId) {
        return scanRepository.findById(scanId);
    }

    public Page<Scan> getScanHistory(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return scanRepository.findByUserIdOrderByScannedAtDesc(userId, pageable);
    }
}
