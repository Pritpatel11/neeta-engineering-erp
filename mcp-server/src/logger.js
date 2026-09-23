import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = process.env.MCP_AUDIT_LOG 
  ? path.resolve(process.env.MCP_AUDIT_LOG)
  : path.join(__dirname, '../logs/mcp-audit.log');

// Ensure log directory exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Redact sensitive keys from logged objects
const SENSITIVE_KEYS = ['password', 'secret', 'token', 'authorization', 'api_key', 'apikey', 'key'];

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Log audit events to file and stderr
 */
export function logAuditEvent({
  tool,
  params = {},
  endpoint = '',
  status = 'SUCCESS',
  durationMs = 0,
  error = null,
  sessionId = 'claude-desktop',
}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    sessionId,
    tool,
    endpoint,
    status,
    durationMs,
    params: sanitize(params),
    error: error ? (error.message || String(error)) : null,
  };

  const line = JSON.stringify(entry) + '\n';

  // Append to audit log file
  fs.appendFile(logFilePath, line, (err) => {
    if (err) {
      process.stderr.write(`[MCP Log Error] Failed to write audit log: ${err.message}\n`);
    }
  });

  // Stderr output (never pollute stdout which is used for JSON-RPC MCP messages)
  const statusTag = status === 'SUCCESS' ? '\x1b[32m[OK]\x1b[0m' : '\x1b[31m[ERROR]\x1b[0m';
  process.stderr.write(
    `[MCP AUDIT] ${timestamp} | ${statusTag} ${tool} | ${durationMs}ms | ${endpoint || 'local'}\n`
  );
}

export function logInfo(message) {
  process.stderr.write(`[MCP INFO] ${new Date().toISOString()} ${message}\n`);
}

export function logError(message, err = null) {
  process.stderr.write(`[MCP ERROR] ${new Date().toISOString()} ${message} ${err ? err.stack || err : ''}\n`);
}
