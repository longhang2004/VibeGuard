package com.vibeguard.securityscanner.controller;

import com.vibeguard.securityscanner.dto.ApiResponse;
import com.vibeguard.securityscanner.dto.ScanSubmitRequest;
import com.vibeguard.securityscanner.entity.Scan;
import com.vibeguard.securityscanner.service.ScanService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/scanner")
public class ScanController {

    private final ScanService scanService;

    public ScanController(ScanService scanService) {
        this.scanService = scanService;
    }

    @PostMapping("/scan")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitScan(
            @RequestBody ScanSubmitRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdString) {

        if (userIdString == null || userIdString.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Missing X-User-Id header"));
        }

        if (request.getCode() == null || request.getCode().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Code is required"));
        }

        if (request.getLanguage() == null || request.getLanguage().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Language is required"));
        }

        try {
            UUID userId = UUID.fromString(userIdString);
            Scan scan = scanService.submitScan(
                    request.getCode(),
                    request.getLanguage(),
                    userId,
                    request.getFilename()
            );

            Map<String, Object> data = new HashMap<>();
            data.put("scanId", scan.getId());
            data.put("status", scan.getStatus());

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Invalid UUID format for X-User-Id"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("INTERNAL_SERVER_ERROR", e.getMessage()));
        }
    }

    @GetMapping("/scan/{scanId}")
    public ResponseEntity<ApiResponse<Scan>> getScanResult(@PathVariable("scanId") String scanIdString) {
        try {
            UUID scanId = UUID.fromString(scanIdString);
            Optional<Scan> scanOpt = scanService.getScanResult(scanId);

            if (scanOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("NOT_FOUND", "Scan not found"));
            }

            return ResponseEntity.ok(ApiResponse.success(scanOpt.get()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Invalid UUID format for scanId"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("INTERNAL_SERVER_ERROR", e.getMessage()));
        }
    }

    @GetMapping("/scan/history")
    public ResponseEntity<ApiResponse<Object>> getScanHistory(
            @RequestHeader(value = "X-User-Id", required = false) String userIdString,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        if (userIdString == null || userIdString.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Missing X-User-Id header"));
        }

        try {
            UUID userId = UUID.fromString(userIdString);
            Page<Scan> scanPage = scanService.getScanHistory(userId, page, size);

            Map<String, Object> meta = new HashMap<>();
            meta.put("page", scanPage.getNumber());
            meta.put("size", scanPage.getSize());
            meta.put("totalElements", scanPage.getTotalElements());
            meta.put("totalPages", scanPage.getTotalPages());
            meta.put("hasNext", scanPage.hasNext());

            return ResponseEntity.ok(ApiResponse.success(scanPage.getContent(), meta));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Invalid UUID format for X-User-Id"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("INTERNAL_SERVER_ERROR", e.getMessage()));
        }
    }
}
