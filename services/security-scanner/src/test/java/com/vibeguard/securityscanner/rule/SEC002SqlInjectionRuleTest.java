package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class SEC002SqlInjectionRuleTest {

    private final SEC002SqlInjectionRule rule = new SEC002SqlInjectionRule();

    @Test
    public void testTruePositives() {
        // TP 1: String concatenation in SQL
        String code1 = "String query = \"SELECT * FROM users WHERE username = '\" + username + \"'\";";
        List<Finding> findings1 = rule.detect(code1, "java", "UserRepository.java");
        assertEquals(1, findings1.size());
        assertEquals("SEC002", findings1.get(0).getRuleId());
        assertEquals("CRITICAL", findings1.get(0).getSeverity());

        // TP 2: String interpolation template in SQL
        String code2 = "const sql = `DELETE FROM templates WHERE id = ${id}`;";
        List<Finding> findings2 = rule.detect(code2, "javascript", "service.js");
        assertEquals(1, findings2.size());
    }

    @Test
    public void testFalseNegatives() {
        // FN 1: Parameterized query (PreparedStatement placeholder)
        String code1 = "String query = \"SELECT * FROM users WHERE username = ?\";";
        List<Finding> findings1 = rule.detect(code1, "java", "UserRepository.java");
        assertTrue(findings1.isEmpty());

        // FN 2: Simple string concat not relating to SQL query structure
        String code2 = "String message = \"Hello, \" + username + \"!\";";
        List<Finding> findings2 = rule.detect(code2, "java", "Hello.java");
        assertTrue(findings2.isEmpty());
    }
}
