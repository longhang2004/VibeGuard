package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import java.util.UUID;

public class RuleUtils {

    public static int[] getLineAndColumn(String code, int offset) {
        int line = 1;
        int col = 1;
        for (int i = 0; i < offset && i < code.length(); i++) {
            if (code.charAt(i) == '\n') {
                line++;
                col = 1;
            } else if (code.charAt(i) != '\r') {
                col++;
            }
        }
        return new int[]{line, col};
    }

    public static String getSnippet(String code, int offset) {
        if (code == null || offset < 0 || offset >= code.length()) {
            return "";
        }
        int start = offset;
        while (start > 0 && code.charAt(start - 1) != '\n' && code.charAt(start - 1) != '\r') {
            start--;
        }
        int end = offset;
        while (end < code.length() && code.charAt(end) != '\n' && code.charAt(end) != '\r') {
            end++;
        }
        return code.substring(start, end).trim();
    }

    public static Finding createFinding(Rule rule, String code, int offset) {
        int[] lineCol = getLineAndColumn(code, offset);
        String snippet = getSnippet(code, offset);
        
        Finding finding = new Finding();
        finding.setId(UUID.randomUUID());
        finding.setRuleId(rule.getRuleId());
        finding.setSeverity(rule.getSeverity());
        finding.setTitle(rule.getTitle());
        finding.setDescription(rule.getDescription());
        finding.setLine(lineCol[0]);
        finding.setColumnNum(lineCol[1]);
        finding.setSnippet(snippet);
        finding.setRemediation(rule.getRemediation());
        
        return finding;
    }
}
