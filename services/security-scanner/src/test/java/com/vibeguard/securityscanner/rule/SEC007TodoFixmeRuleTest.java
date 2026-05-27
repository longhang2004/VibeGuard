package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class SEC007TodoFixmeRuleTest {

    private final SEC007TodoFixmeRule rule = new SEC007TodoFixmeRule();

    @Test
    public void testTruePositives() {
        // TP 1: TODO containing auth keyword
        String code1 = "// TODO: add auth authorization guard to routes";
        List<Finding> findings1 = rule.detect(code1, "javascript", "routes.js");
        assertEquals(1, findings1.size());
        assertEquals("SEC007", findings1.get(0).getRuleId());
        assertEquals("MEDIUM", findings1.get(0).getSeverity());

        // TP 2: FIXME containing password keyword
        String code2 = "/* FIXME: security leak, hardcoded password check */";
        List<Finding> findings2 = rule.detect(code2, "java", "Login.java");
        assertEquals(1, findings2.size());
    }

    @Test
    public void testFalseNegatives() {
        // FN 1: TODO without security keywords
        String code1 = "// TODO: refactor directory structure and clean up files";
        List<Finding> findings1 = rule.detect(code1, "javascript", "routes.js");
        assertTrue(findings1.isEmpty());

        // FN 2: Standard comments without tags
        String code2 = "// This service handles login logic and queries DB";
        List<Finding> findings2 = rule.detect(code2, "java", "Login.java");
        assertTrue(findings2.isEmpty());
    }
}
