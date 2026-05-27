package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SEC002SqlInjectionRule implements Rule {

    private static final String RULE_ID = "SEC002";
    private static final String SEVERITY = "CRITICAL";
    private static final String TITLE = "SQL Injection Risk";
    private static final String DESCRIPTION = "SQL query construction via string concatenation or interpolation detected.";
    private static final String REMEDIATION = "Use parameterized queries, PreparedStatement, or TypeORM/JPA built-in query builders instead.";

    // Match SQL statement patterns containing dynamic concatenation or string interpolation
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(?i)\\b(SELECT|INSERT|UPDATE|DELETE)\\b.*?\\b(FROM|INTO|SET|WHERE)\\b.*?(\\+\\s*\\w|\\$\\{\\s*\\w|%s|String\\.format)"
    );

    @Override
    public String getRuleId() {
        return RULE_ID;
    }

    @Override
    public String getSeverity() {
        return SEVERITY;
    }

    @Override
    public String getTitle() {
        return TITLE;
    }

    @Override
    public String getDescription() {
        return DESCRIPTION;
    }

    @Override
    public String getRemediation() {
        return REMEDIATION;
    }

    @Override
    public List<Finding> detect(String code, String language, String filename) {
        List<Finding> findings = new ArrayList<>();
        
        // Scan line-by-line to prevent false matches across multiple lines
        String[] lines = code.split("\\r?\\n");
        int offset = 0;
        for (String line : lines) {
            Matcher matcher = SQL_INJECTION_PATTERN.matcher(line);
            if (matcher.find()) {
                findings.add(RuleUtils.createFinding(this, code, offset + matcher.start()));
            }
            offset += line.length() + 1; // +1 to account for newline character
        }
        
        return findings;
    }
}
