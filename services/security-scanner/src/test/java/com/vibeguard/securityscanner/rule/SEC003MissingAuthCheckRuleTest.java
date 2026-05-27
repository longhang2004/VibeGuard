package com.vibeguard.securityscanner.rule;

import com.vibeguard.securityscanner.entity.Finding;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class SEC003MissingAuthCheckRuleTest {

    private final SEC003MissingAuthCheckRule rule = new SEC003MissingAuthCheckRule();

    @Test
    public void testTruePositives() {
        // TP 1: NestJS Get mapping with no guard
        String code1 = "@Controller('items')\nexport class ItemsController {\n  @Get()\n  findAll() {}\n}";
        List<Finding> findings1 = rule.detect(code1, "typescript", "items.controller.ts");
        assertEquals(1, findings1.size());
        assertEquals("SEC003", findings1.get(0).getRuleId());
        assertEquals("HIGH", findings1.get(0).getSeverity());

        // TP 2: Spring Boot Post Mapping with no security
        String code2 = "@RestController\npublic class UsersController {\n  @PostMapping(\"/create\")\n  public void create() {}\n}";
        List<Finding> findings2 = rule.detect(code2, "java", "UsersController.java");
        assertEquals(1, findings2.size());
    }

    @Test
    public void testFalseNegatives() {
        // FN 1: Guarded NestJS endpoint (contains UseGuards)
        String code1 = "@UseGuards(JwtAuthGuard)\n@Get()\nfindAll() {}";
        List<Finding> findings1 = rule.detect(code1, "typescript", "items.controller.ts");
        assertTrue(findings1.isEmpty());

        // FN 2: Spring Boot PreAuthorize annotated mapping (contains PreAuthorize)
        String code2 = "@PreAuthorize(\"hasRole('ADMIN')\")\n@GetMapping(\"/admin\")\npublic void admin() {}";
        List<Finding> findings2 = rule.detect(code2, "java", "AdminController.java");
        assertTrue(findings2.isEmpty());
    }
}
