package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class RuleEngineTest {

    @Test
    public void testRuleEngineRunsAllRules() {
        Rule rule1 = new SEC001HardcodedSecretRule();
        Rule rule2 = new SEC008WeakHashingRule();
        RuleEngine engine = new RuleEngine(Arrays.asList(rule1, rule2));

        String code = "const apiKey = 'secret_key_123456';\nString md5Hash = md5(pass);";
        List<Finding> findings = engine.run(code, "javascript", "index.js");

        // Should find hardcoded secret (SEC001) and weak hash (SEC008)
        assertEquals(2, findings.size());
        
        boolean foundSecret = findings.stream().anyMatch(f -> f.getRuleId().equals("SEC001"));
        boolean foundHash = findings.stream().anyMatch(f -> f.getRuleId().equals("SEC008"));

        assertTrue(foundSecret);
        assertTrue(foundHash);
    }
}
