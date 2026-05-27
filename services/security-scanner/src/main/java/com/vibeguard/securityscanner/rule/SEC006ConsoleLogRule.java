package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SEC006ConsoleLogRule implements Rule {

    private static final String RULE_ID = "SEC006";
    private static final String SEVERITY = "MEDIUM";
    private static final String TITLE = "Console Log in Code";
    private static final String DESCRIPTION = "console.log() statements left in production-level code may leak sensitive information.";
    private static final String REMEDIATION = "Remove console.log() statements or replace them with a structured logging framework.";

    private static final Pattern CONSOLE_LOG_PATTERN = Pattern.compile(
        "\\bconsole\\.log\\s*\\("
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
        
        // Ignore test files
        if (filename != null && (filename.contains("test") || filename.contains("spec"))) {
            return findings;
        }

        Matcher matcher = CONSOLE_LOG_PATTERN.matcher(code);
        while (matcher.find()) {
            findings.add(RuleUtils.createFinding(this, code, matcher.start()));
        }
        return findings;
    }
}
