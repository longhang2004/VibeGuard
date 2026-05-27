import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

describe('VibeGuard E2E Happy Path Flow', () => {
  let accessToken: string;
  let userId: string;
  let templateId: string;
  let scanId: string;
  
  const uniqueEmail = `testuser-${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  // 1. Register a new user
  it('should successfully register a new user', async () => {
    const res = await axios.post(`${GATEWAY_URL}/auth/register`, {
      email: uniqueEmail,
      password,
    });
    
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.user).toBeDefined();
    expect(res.data.data.accessToken).toBeDefined();
    expect(res.data.data.refreshToken).toBeDefined();
    
    userId = res.data.data.user.id;
    accessToken = res.data.data.accessToken;
  });

  // 2. Log in with registered credentials
  it('should successfully login user', async () => {
    const res = await axios.post(`${GATEWAY_URL}/auth/login`, {
      email: uniqueEmail,
      password,
    });

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.accessToken).toBeDefined();
    
    // Update access token
    accessToken = res.data.data.accessToken;
  });

  let generatedContent = '';

  // 3. Generate a context template (proxied to context-service)
  it('should generate a context template', async () => {
    const res = await axios.post(
      `${GATEWAY_URL}/api/context/templates/generate`,
      {
        projectName: 'E2E NestJS Project',
        projectType: 'NESTJS_MONOLITH',
        techStack: ['NestJS', 'PostgreSQL', 'TypeScript'],
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.content).toBeDefined();
    expect(res.data.data.content).toContain('# E2E NestJS Project');
    generatedContent = res.data.data.content;
  });

  // 4. Save the template (proxied to context-service)
  it('should save the generated template', async () => {
    const res = await axios.post(
      `${GATEWAY_URL}/api/context/templates`,
      {
        name: 'E2E NestJS Project CLAUDE.md',
        description: 'Context standard guidelines for project E2E NestJS Project',
        projectType: 'NESTJS_MONOLITH',
        techStack: ['NestJS', 'PostgreSQL', 'TypeScript'],
        content: generatedContent,
        isPublic: true,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.id).toBeDefined();
    templateId = res.data.data.id;
  });

  // 5. Star the template (proxied to context-service)
  it('should star the template and verify success', async () => {
    const res = await axios.post(
      `${GATEWAY_URL}/api/context/templates/${templateId}/star`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
  });

  // 6. Submit code for security scanning (proxied to security-scanner)
  it('should submit code for static scan and receive a scan job ID', async () => {
    const res = await axios.post(
      `${GATEWAY_URL}/api/scanner/scan`,
      {
        code: 'const password = "hardcoded_admin_password_123";',
        language: 'typescript',
        filename: 'config.ts',
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.scanId).toBeDefined();
    scanId = res.data.data.scanId;
  });

  // 7. Poll for scanner results (wait for scan status = COMPLETED)
  it('should poll scan status until completed and inspect security score & findings', async () => {
    let scanCompleted = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!scanCompleted && attempts < maxAttempts) {
      attempts++;
      // Wait 1 second between polls
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await axios.get(
        `${GATEWAY_URL}/api/scanner/scan/${scanId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      const scan = res.data.data;
      
      if (scan.status === 'COMPLETED') {
        scanCompleted = true;
        expect(scan.score).toBeLessThan(100); // Deduct points for hardcoded password
        expect(scan.findings.length).toBeGreaterThan(0);
        expect(scan.findings[0].severity).toBe('CRITICAL');
      } else if (scan.status === 'FAILED') {
        throw new Error('E2E Scan job failed on the runner.');
      }
    }

    expect(scanCompleted).toBe(true);
  });

  // 8. Verify security scan triggers notification creation
  it('should verify notifications are pushed for security vulnerabilities', async () => {
    const res = await axios.get(
      `${GATEWAY_URL}/api/notifications`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.length).toBeGreaterThan(0);
    expect(res.data.data[0].type).toBe('ALERT'); // Hardcoded password triggers ALERT type
  });

  // 9. Fetch analytics scans summary
  it('should fetch aggregated scan analytics', async () => {
    const res = await axios.get(
      `${GATEWAY_URL}/api/analytics/scans/summary`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.totalScans).toBeGreaterThan(0);
  });
});
