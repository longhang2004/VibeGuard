package com.vibeguard.securityscanner.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibeguard.securityscanner.dto.ApiResponse;
import com.vibeguard.securityscanner.dto.ScanSubmitRequest;
import com.vibeguard.securityscanner.entity.Scan;
import com.vibeguard.securityscanner.service.ScanService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=" +
    "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
    "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
    "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration," +
    "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@AutoConfigureMockMvc
public class ScanControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ScanService scanService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testSubmitScanSuccess() throws Exception {
        UUID scanId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Scan mockScan = new Scan(scanId, "QUEUED", "javascript", "console.log('test');", userId, LocalDateTime.now());

        Mockito.when(scanService.submitScan(anyString(), anyString(), any(UUID.class), anyString()))
                .thenReturn(mockScan);

        ScanSubmitRequest request = new ScanSubmitRequest();
        request.setCode("console.log('test');");
        request.setLanguage("javascript");
        request.setFilename("index.js");

        mockMvc.perform(post("/scanner/scan")
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.scanId").value(scanId.toString()))
                .andExpect(jsonPath("$.data.status").value("QUEUED"));
    }

    @Test
    public void testSubmitScanUnauthorized() throws Exception {
        ScanSubmitRequest request = new ScanSubmitRequest();
        request.setCode("console.log('test');");
        request.setLanguage("javascript");

        mockMvc.perform(post("/scanner/scan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    public void testGetScanResultSuccess() throws Exception {
        UUID scanId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Scan mockScan = new Scan(scanId, "COMPLETED", "javascript", "console.log('test');", userId, LocalDateTime.now());
        mockScan.setScore(100);

        Mockito.when(scanService.getScanResult(scanId)).thenReturn(Optional.of(mockScan));

        mockMvc.perform(get("/scanner/scan/" + scanId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(scanId.toString()))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.score").value(100));
    }

    @Test
    public void testGetScanResultNotFound() throws Exception {
        UUID scanId = UUID.randomUUID();
        Mockito.when(scanService.getScanResult(scanId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/scanner/scan/" + scanId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    public void testGetScanHistorySuccess() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID scanId = UUID.randomUUID();
        Scan mockScan = new Scan(scanId, "COMPLETED", "javascript", "console.log('test');", userId, LocalDateTime.now());
        Page<Scan> page = new PageImpl<>(Collections.singletonList(mockScan));

        Mockito.when(scanService.getScanHistory(eq(userId), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/scanner/scan/history")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").value(scanId.toString()));
    }
}
