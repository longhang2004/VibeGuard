package com.vibeguard.securityscanner.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> getHealth() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "ok");
        health.put("service", "security-scanner");
        return health;
    }
}
