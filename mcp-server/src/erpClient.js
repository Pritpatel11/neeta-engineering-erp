import axios from 'axios';
import dotenv from 'dotenv';
import { logAuditEvent, logError } from './logger.js';

dotenv.config();

const BASE_URL = process.env.ERP_API_BASE_URL || 'http://127.0.0.1:5000/api';
const API_KEY = process.env.ERP_MCP_API_KEY || 'neeta_erp_mcp_secure_key_2026';
const FINANCIAL_YEAR = process.env.ERP_FINANCIAL_YEAR || '2025-26';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'x-mcp-api-key': API_KEY,
    'x-financial-year': FINANCIAL_YEAR,
    'Content-Type': 'application/json',
  },
});

/**
 * Execute an API GET request with timing and audit logging
 */
export async function erpGet(endpoint, params = {}, toolName = 'erp_api_call') {
  const startTime = Date.now();
  try {
    const response = await apiClient.get(endpoint, { params });
    const durationMs = Date.now() - startTime;
    logAuditEvent({
      tool: toolName,
      params,
      endpoint,
      status: 'SUCCESS',
      durationMs,
    });
    return response.data;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logAuditEvent({
      tool: toolName,
      params,
      endpoint,
      status: 'FAILURE',
      durationMs,
      error,
    });

    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to ERP Backend at ${BASE_URL}. Ensure the ERP backend is running on port 5000.`);
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      if (status === 404) {
        throw new Error(message || 'Resource not found in ERP.');
      }
      if (status === 401 || status === 403) {
        throw new Error(`Authentication failed (${status}): ${message}. Check ERP_MCP_API_KEY.`);
      }
      if (status === 503) {
        throw new Error(`ERP Database is offline: ${message}`);
      }
      throw new Error(`ERP API error (${status}): ${message}`);
    }

    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Download binary stream (e.g. PDF) with timing and audit logging
 */
export async function erpGetBinary(endpoint, params = {}, toolName = 'erp_binary_call') {
  const startTime = Date.now();
  try {
    const response = await apiClient.get(endpoint, {
      params,
      responseType: 'arraybuffer',
    });
    const durationMs = Date.now() - startTime;
    logAuditEvent({
      tool: toolName,
      params,
      endpoint,
      status: 'SUCCESS',
      durationMs,
    });
    return {
      data: Buffer.from(response.data),
      contentType: response.headers['content-type'] || 'application/pdf',
      contentLength: response.data.byteLength,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logAuditEvent({
      tool: toolName,
      params,
      endpoint,
      status: 'FAILURE',
      durationMs,
      error,
    });

    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to ERP Backend at ${BASE_URL}.`);
    }
    if (error.response) {
      let errMsg = `ERP returned status ${error.response.status}`;
      try {
        const text = Buffer.from(error.response.data).toString('utf8');
        const json = JSON.parse(text);
        if (json.message) errMsg = json.message;
      } catch (_) {}
      throw new Error(errMsg);
    }
    throw error;
  }
}
