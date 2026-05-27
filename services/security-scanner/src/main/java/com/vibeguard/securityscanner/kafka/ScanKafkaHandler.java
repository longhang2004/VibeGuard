package com.vibeguard.securityscanner.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibeguard.securityscanner.dto.ScanRequestMessage;
import com.vibeguard.securityscanner.service.ScanService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ScanKafkaHandler {

    private final ScanService scanService;
    private final ObjectMapper objectMapper;

    public ScanKafkaHandler(ScanService scanService, ObjectMapper objectMapper) {
        this.scanService = scanService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "${scanner.topics.requested:vibeguard.scanner.requested}", groupId = "${spring.kafka.consumer.group-id:security-scanner-group}")
    public void handleScanRequest(String payload) {
        try {
            ScanRequestMessage message = objectMapper.readValue(payload, ScanRequestMessage.class);
            System.out.println("Received scan request for ID: " + message.getScanId());
            
            scanService.executeScan(
                message.getScanId(),
                message.getCode(),
                message.getLanguage(),
                message.getFilename()
            );
            
        } catch (Exception e) {
            System.err.println("Error processing Kafka scan request event: " + e.getMessage());
        }
    }
}
