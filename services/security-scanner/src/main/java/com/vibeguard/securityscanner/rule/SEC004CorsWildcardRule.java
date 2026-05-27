package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SEC004CorsWildcardRule implements Rule {

    private static final String RULE_ID = "SEC004";
    private static final String SEVERITY = "HIGH";
    private static final String TITLE = "CORS Wildcard";
    private static final String DESCRIPTION = "Overly permissive CORS origin configuration utilizing wildcard (*).";
    private static final String REMEDIATION = "Avoid wildcard settings for authenticated routes. Use explicit allowed origin domains.";

    private static final Pattern CORS_WILDCARD_PATTERN = Pattern.compile(
        "(?i)(origin\\s*:\\s*['\"][*]['\"]|allowedOrigins?\\s*\\(\\s*['\"][*]['\"]\\s*\\))"
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
        Matcher matcher = CORS_WILDCARD_PATTERN.matcher(code);
        while (matcher.find()) {
            findings.add(RuleUtils.createFinding(this, code, matcher.start()));
        }
        return findings;
    }
}
