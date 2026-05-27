package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SEC003MissingAuthCheckRule implements Rule {

    private static final String RULE_ID = "SEC003";
    private static final String SEVERITY = "HIGH";
    private static final String TITLE = "Missing Auth Check";
    private static final String DESCRIPTION = "Endpoint mapped without authorization guard or security configuration.";
    private static final String REMEDIATION = "Apply authentication/authorization guard (e.g. JwtAuthGuard or Spring PreAuthorize) to this controller or endpoint.";

    // Pattern to match NestJS or Spring Boot endpoint routing annotations
    private static final Pattern ENDPOINT_PATTERN = Pattern.compile(
        "@(?i)(Get|Post|Put|Delete|Patch)(Mapping)?\\s*\\("
    );

    // Pattern to look for security keywords in the entire file
    private static final Pattern SECURITY_KEYWORDS_PATTERN = Pattern.compile(
        "(?i)(UseGuards|PreAuthorize|Secured|RolesAllowed|WebSecurity|SecurityFilterChain|JwtAuthGuard|AuthGuard|CurrentUser|Principal)"
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
        
        // If the file contains security guards/annotations, skip scanning as security is present
        if (SECURITY_KEYWORDS_PATTERN.matcher(code).find()) {
            return findings;
        }

        Matcher matcher = ENDPOINT_PATTERN.matcher(code);
        while (matcher.find()) {
            findings.add(RuleUtils.createFinding(this, code, matcher.start()));
        }

        return findings;
    }
}
