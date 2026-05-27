package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class SEC004CorsWildcardRuleTest {

    private final SEC004CorsWildcardRule rule = new SEC004CorsWildcardRule();

    @Test
    public void testTruePositives() {
        // TP 1: origin: '*' in JS/TS config
        String code1 = "cors: { origin: '*' }";
        List<Finding> findings1 = rule.detect(code1, "javascript", "main.js");
        assertEquals(1, findings1.size());
        assertEquals("SEC004", findings1.get(0).getRuleId());
        assertEquals("HIGH", findings1.get(0).getSeverity());

        // TP 2: allowedOrigins("*") in Java Spring config
        String code2 = "registry.addMapping(\"/**\").allowedOrigins(\"*\");";
        List<Finding> findings2 = rule.detect(code2, "java", "CorsConfig.java");
        assertEquals(1, findings2.size());
    }

    @Test
    public void testFalseNegatives() {
        // FN 1: Explicit origin specified
        String code1 = "cors: { origin: 'https://vibeguard.com' }";
        List<Finding> findings1 = rule.detect(code1, "javascript", "main.js");
        assertTrue(findings1.isEmpty());

        // FN 2: Allowed origin method with dynamic domain (non-wildcard string)
        String code2 = "allowedOrigins(\"https://trusteddomain.org\")";
        List<Finding> findings2 = rule.detect(code2, "java", "CorsConfig.java");
        assertTrue(findings2.isEmpty());
    }
}
