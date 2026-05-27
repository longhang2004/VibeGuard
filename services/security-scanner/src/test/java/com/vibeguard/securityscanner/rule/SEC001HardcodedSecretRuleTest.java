package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class SEC001HardcodedSecretRuleTest {

    private final SEC001HardcodedSecretRule rule = new SEC001HardcodedSecretRule();

    @Test
    public void testTruePositives() {
        // TP 1: Assignment of apiKey string literal >= 8 characters
        String code1 = "const apiKey = 'secret_key_value_123456';";
        List<Finding> findings1 = rule.detect(code1, "javascript", "index.js");
        assertEquals(1, findings1.size());
        assertEquals("SEC001", findings1.get(0).getRuleId());
        assertEquals("CRITICAL", findings1.get(0).getSeverity());

        // TP 2: Password assignment
        String code2 = "String password = \"super_secret_password\";";
        List<Finding> findings2 = rule.detect(code2, "java", "App.java");
        assertEquals(1, findings2.size());
    }

    @Test
    public void testFalseNegatives() {
        // FN 1: Value too short (< 8 chars)
        String code1 = "const password = 'short';";
        List<Finding> findings1 = rule.detect(code1, "javascript", "index.js");
        assertTrue(findings1.isEmpty());

        // FN 2: Simple assignment without secret keyword
        String code2 = "const name = 'vibeguard';";
        List<Finding> findings2 = rule.detect(code2, "javascript", "index.js");
        assertTrue(findings2.isEmpty());
    }
}
