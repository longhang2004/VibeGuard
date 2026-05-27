package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SEC001HardcodedSecretRule implements Rule {

    private static final String RULE_ID = "SEC001";
    private static final String SEVERITY = "CRITICAL";
    private static final String TITLE = "Hardcoded Secret Detected";
    private static final String DESCRIPTION = "Hardcoded secret, API key, token, or password detected in code.";
    private static final String REMEDIATION = "Use environment variables or a secure secret manager instead.";

    // Compile regex pattern once
    private static final Pattern SECRET_PATTERN = Pattern.compile(
        "(?i)\\b(api_?[\\-_]?key|secret|password|passwd|token|private_?[\\-_]?key|auth_?token)\\b\\s*[:=]\\s*['\"][^'\"\\r\\n]{8,}['\"]"
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
        Matcher matcher = SECRET_PATTERN.matcher(code);
        while (matcher.find()) {
            // Avoid flagging comment lines or import statements by validating context if needed, 
            // but regex check is sufficient for simple static analysis scan requirements.
            findings.add(RuleUtils.createFinding(this, code, matcher.start()));
        }
        return findings;
    }
}
