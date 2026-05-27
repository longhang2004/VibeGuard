package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class RuleEngine {

    private final List<Rule> rules;

    public RuleEngine(List<Rule> rules) {
        this.rules = rules;
    }

    public List<Finding> run(String code, String language, String filename) {
        List<Finding> findings = new ArrayList<>();
        if (code == null || code.isBlank()) {
            return findings;
        }

        for (Rule rule : rules) {
            try {
                findings.addAll(rule.detect(code, language, filename));
            } catch (Exception e) {
                // Log and continue, ensuring one failing rule does not crash the entire scan
                System.err.println("Error running rule " + rule.getRuleId() + ": " + e.getMessage());
            }
        }

        return findings;
    }

    public List<Rule> getRules() {
        return rules;
    }
}
