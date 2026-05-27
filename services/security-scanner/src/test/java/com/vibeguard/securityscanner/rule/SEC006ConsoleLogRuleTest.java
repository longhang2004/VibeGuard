package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class SEC006ConsoleLogRuleTest {

    private final SEC006ConsoleLogRule rule = new SEC006ConsoleLogRule();

    @Test
    public void testTruePositives() {
        // TP 1: console.log call in production file
        String code1 = "console.log('Successfully loaded template');";
        List<Finding> findings1 = rule.detect(code1, "javascript", "app.js");
        assertEquals(1, findings1.size());
        assertEquals("SEC006", findings1.get(0).getRuleId());
        assertEquals("MEDIUM", findings1.get(0).getSeverity());

        // TP 2: console.log inside nested blocks
        String code2 = "if (error) { console.log(error); }";
        List<Finding> findings2 = rule.detect(code2, "javascript", "main.ts");
        assertEquals(1, findings2.size());
    }

    @Test
    public void testFalseNegatives() {
        // FN 1: console.log in test file (should be ignored)
        String code1 = "describe('App', () => { it('works', () => { console.log('test log'); }); });";
        List<Finding> findings1 = rule.detect(code1, "javascript", "app.spec.js");
        assertTrue(findings1.isEmpty());

        // FN 2: Other console methods
        String code2 = "console.error('Fatal database error!');";
        List<Finding> findings2 = rule.detect(code2, "javascript", "app.js");
        assertTrue(findings2.isEmpty());
    }
}
