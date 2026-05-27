package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SEC005EvalUsageRule implements Rule {

    private static final String RULE_ID = "SEC005";
    private static final String SEVERITY = "HIGH";
    private static final String TITLE = "Eval Usage";
    private static final String DESCRIPTION = "Execution of arbitrary code strings via eval() or dynamic Function creation.";
    private static final String REMEDIATION = "Avoid eval() and dynamic code evaluation. Use safe equivalents like JSON.parse() or standard code structure.";

    private static final Pattern EVAL_PATTERN = Pattern.compile(
        "\\beval\\s*\\(|new\\s+Function\\s*\\("
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
        Matcher matcher = EVAL_PATTERN.matcher(code);
        while (matcher.find()) {
            findings.add(RuleUtils.createFinding(this, code, matcher.start()));
        }
        return findings;
    }
}
