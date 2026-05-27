package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import java.util.List;

public interface Rule {
    String getRuleId();
    String getSeverity();
    String getTitle();
    String getDescription();
    String getRemediation();
    List<Finding> detect(String code, String language, String filename);
}
