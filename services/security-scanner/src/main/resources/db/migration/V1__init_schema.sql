CREATE TABLE scans (
    id UUID PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    user_id UUID NOT NULL,
    scanned_at TIMESTAMP NOT NULL,
    critical_count INT NOT NULL,
    high_count INT NOT NULL,
    medium_count INT NOT NULL,
    low_count INT NOT NULL,
    score INT NOT NULL
);

CREATE TABLE findings (
    id UUID PRIMARY KEY,
    scan_id UUID NOT NULL,
    rule_id VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    line INT NOT NULL,
    column_num INT NOT NULL,
    snippet TEXT NOT NULL,
    remediation TEXT NOT NULL,
    CONSTRAINT fk_findings_scan FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_findings_scan_id ON findings(scan_id);
