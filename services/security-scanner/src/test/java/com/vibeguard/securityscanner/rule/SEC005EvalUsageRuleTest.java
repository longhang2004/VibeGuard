package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class SEC005EvalUsageRuleTest {

    private final SEC005EvalUsageRule rule = new SEC005EvalUsageRule();

    @Test
    public void testTruePositives() {
        // TP 1: eval(...) usage
        String code1 = "eval('const value = ' + input);";
        List<Finding> findings1 = rule.detect(code1, "javascript", "index.js");
        assertEquals(1, findings1.size());
        assertEquals("SEC005", findings1.get(0).getRuleId());
        assertEquals("HIGH", findings1.get(0).getSeverity());

        // TP 2: new Function(...) usage
        String code2 = "const exec = new Function('a', 'b', 'return a + b');";
        List<Finding> findings2 = rule.detect(code2, "javascript", "utils.js");
        assertEquals(1, findings2.size());
    }

    @Test
    public void testFalseNegatives() {
        // FN 1: Variable name containing eval (no call pattern)
        String code1 = "const evalName = 'evaluation';";
        List<Finding> findings1 = rule.detect(code1, "javascript", "index.js");
        assertTrue(findings1.isEmpty());

        // FN 2: Simple class or method definition not using the keyword
        String code2 = "function calculate(a, b) { return a + b; }";
        List<Finding> findings2 = rule.detect(code2, "javascript", "utils.js");
        assertTrue(findings2.isEmpty());
    }
}
