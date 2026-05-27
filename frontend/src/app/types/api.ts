// VibeGuard API Type Definitions

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta: Record<string, unknown>;
}

/** User */
export interface User {
  id: string;
  email: string;
}

/** Auth tokens response */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/** Security scan finding */
export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  line: number;
  columnNum: number;
  snippet: string;
  remediation: string;
}

/** Security scan result */
export interface ScanResult {
  id: string;
  scanId?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  language: string;
  code: string;
  score: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  scannedAt: string;
  findings: Finding[];
}

/** Scan submit response */
export interface ScanSubmitResponse {
  scanId: string;
  status: string;
}

/** Template */
export interface Template {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  projectType: string;
  content: string;
  isPublic: boolean;
  starCount: number;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Template version */
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  content: string;
  changelog: string;
  createdAt: string;
}

/** In-app notification */
export interface Notification {
  id: string;
  userId: string;
  type: 'ALERT' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/** Global stats (landing page) */
export interface GlobalStats {
  totalScans: number;
  totalTemplates: number;
  avgSecurityScore: number;
}

/** User scan summary */
export interface ScanSummary {
  totalScans: number;
  avgScore: number;
  mostCommonVulnerability: string | null;
}

/** Scan trend data point */
export interface ScanTrend {
  date: string;
  avgScore: number;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasNextPage: boolean;
}

/** Severity type for type narrowing */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Findings grouped by severity */
export type FindingsGrouped = Partial<Record<Severity, Finding[]>>;
