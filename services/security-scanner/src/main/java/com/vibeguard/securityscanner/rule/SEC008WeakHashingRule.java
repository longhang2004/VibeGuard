package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SEC008WeakHashingRule implements Rule {

    private static final String RULE_ID = "SEC008";
    private static final String SEVERITY = "LOW";
    private static final String TITLE = "Weak Hashing";
    private static final String DESCRIPTION = "Use of a deprecated, cryptographically weak hashing algorithm (MD5 or SHA-1).";
    private static final String REMEDIATION = "Upgrade to cryptographically secure hashing functions such as SHA-256, SHA-3, or bcrypt.";

    private static final Pattern WEAK_HASH_PATTERN = Pattern.compile(
        "(?i)\\b(md5|sha1|sha-1)\\b"
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
        Matcher matcher = WEAK_HASH_PATTERN.matcher(code);
        while (matcher.find()) {
            findings.add(RuleUtils.createFinding(this, code, matcher.start()));
        }
        return findings;
    }
}
