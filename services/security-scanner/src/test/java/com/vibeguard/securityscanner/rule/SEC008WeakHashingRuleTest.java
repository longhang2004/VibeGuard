package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class SEC008WeakHashingRuleTest {

    private final SEC008WeakHashingRule rule = new SEC008WeakHashingRule();

    @Test
    public void testTruePositives() {
        // TP 1: md5 reference
        String code1 = "import { md5 } from 'crypto-js';";
        List<Finding> findings1 = rule.detect(code1, "javascript", "auth.js");
        assertEquals(1, findings1.size());
        assertEquals("SEC008", findings1.get(0).getRuleId());
        assertEquals("LOW", findings1.get(0).getSeverity());

        // TP 2: sha1 reference
        String code2 = "MessageDigest.getInstance(\"SHA-1\");";
        List<Finding> findings2 = rule.detect(code2, "java", "HashUtils.java");
        assertEquals(1, findings2.size());
    }

    @Test
    public void testFalseNegatives() {
        // FN 1: Secure hashing algorithm
        String code1 = "MessageDigest.getInstance(\"SHA-256\");";
        List<Finding> findings1 = rule.detect(code1, "java", "HashUtils.java");
        assertTrue(findings1.isEmpty());

        // FN 2: Unrelated variable name
        String code2 = "const hash = getSecurePasswordHash(pwd);";
        List<Finding> findings2 = rule.detect(code2, "javascript", "auth.js");
        assertTrue(findings2.isEmpty());
    }
}
