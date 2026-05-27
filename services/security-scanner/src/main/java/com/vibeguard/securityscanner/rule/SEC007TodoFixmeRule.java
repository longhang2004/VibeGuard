package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SEC007TodoFixmeRule implements Rule {

    private static final String RULE_ID = "SEC007";
    private static final String SEVERITY = "MEDIUM";
    private static final String TITLE = "TODO/FIXME Security";
    private static final String DESCRIPTION = "Security-related TODO or FIXME markers found in code comments.";
    private static final String REMEDIATION = "Resolve the security item or track it formally in a project management system instead of leaving open comments in code.";

    private static final Pattern TODO_FIXME_PATTERN = Pattern.compile(
        "(?i)\\b(TODO|FIXME)\\b.*?\\b(auth|security|login|password|permission)\\b"
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
        Matcher matcher = TODO_FIXME_PATTERN.matcher(code);
        while (matcher.find()) {
            findings.add(RuleUtils.createFinding(this, code, matcher.start()));
        }
        return findings;
    }
}
