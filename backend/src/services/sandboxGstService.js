const https = require('https');
const http = require('http');

// In-memory token cache
let cachedAccessToken = null;
let tokenExpiresAt = 0;

// In-memory GSTIN verification cache (TTL: 24 hours)
const gstinVerificationCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Indian State Codes dictionary
const STATE_CODES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

// Neeta Engineering Works home state is Gujarat (Code: 24)
const SELLER_STATE_CODE = '24';

/**
 * Standard Indian GSTIN regular expression
 */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Computes official 15th check digit for a 14-character GSTIN prefix
 */
function computeGstChecksum(gst14) {
  if (!gst14 || gst14.length < 14) return null;
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const code = chars.indexOf(gst14[i]);
    if (code === -1) return null;
    const factor = (i % 2 === 0) ? 1 : 2;
    const prod = code * factor;
    const quotient = Math.floor(prod / 36);
    const remainder = prod % 36;
    sum += quotient + remainder;
  }
  const checkCode = (36 - (sum % 36)) % 36;
  return chars[checkCode];
}

/**
 * Validates GSTIN string structure
 */
function isValidGstin(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  const clean = gstin.trim().toUpperCase();
  return GSTIN_REGEX.test(clean);
}

/**
 * Promise-based JSON HTTP/HTTPS request helper
 */
function makeRequest(urlStr, options, requestData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;

    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : {};
        } catch {
          parsed = { raw: body };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Sandbox API request timed out'));
    });

    req.setTimeout(12000); // 12-second timeout

    if (requestData) {
      req.write(typeof requestData === 'string' ? requestData : JSON.stringify(requestData));
    }
    req.end();
  });
}

/**
 * Obtains or reuses a cached Sandbox.co.in access token
 */
async function getSandboxAccessToken(forceRefresh = false) {
  const apiKey = process.env.SANDBOX_API_KEY;
  const apiSecret = process.env.SANDBOX_API_SECRET;
  const baseUrl = (process.env.SANDBOX_BASE_URL || 'https://api.sandbox.co.in').replace(/\/+$/, '');

  if (!apiKey || !apiSecret) {
    throw new Error('SANDBOX_API_KEY and SANDBOX_API_SECRET must be configured in environment variables.');
  }

  const now = Date.now();
  // Return cached token if valid (5 minute buffer before expiry)
  if (!forceRefresh && cachedAccessToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  const authUrl = `${baseUrl}/authenticate`;
  const options = {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'x-api-secret': apiSecret,
      'x-api-version': '1.0.0',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const response = await makeRequest(authUrl, options);

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const errDetail = response.data?.message || response.data?.error || `HTTP ${response.statusCode}`;
    throw new Error(`Sandbox authentication failed: ${errDetail}`);
  }

  const token = response.data?.access_token || response.data?.data?.access_token;
  if (!token) {
    throw new Error('Sandbox did not return an access_token.');
  }

  cachedAccessToken = token;
  // Tokens are valid for 24 hours in Sandbox; cache for 23 hours
  tokenExpiresAt = now + 23 * 60 * 60 * 1000;
  return token;
}

/**
 * Normalizes the raw Sandbox GSTIN search payload into application model fields
 */
function normalizeSandboxGstData(raw, gstin) {
  const inner = raw?.data?.data || raw?.data || {};
  const pradr = inner.pradr || {};
  const addr = pradr.addr || {};

  const cleanGstin = (inner.gstin || gstin || '').toUpperCase();
  const stateCode = cleanGstin.substring(0, 2);
  const stateName = addr.stcd || STATE_CODES[stateCode] || inner.stateName || '';

  // Address components
  const addressParts = [
    addr.bno,
    addr.flno,
    addr.bnm,
    addr.st,
    addr.loc,
    addr.dst,
    stateName,
    addr.pncd ? `PIN: ${addr.pncd}` : '',
  ].filter(Boolean);

  const formattedAddress = addressParts.join(', ') || inner.principalAddress || '';

  // Check if API returned 'No records found' or error code
  if (
    raw?.data?.message === 'No records found' ||
    raw?.data?.data?.message === 'No records found' ||
    raw?.data?.error_cd ||
    raw?.message === 'No records found'
  ) {
    const err = new Error('No records found for this GSTIN in the GST registry.');
    err.status = 404;
    throw err;
  }

  const legalName = (inner.lgnm || inner.legalName || inner.legal_name || '').trim();
  const tradeName = (inner.tradeNam || inner.tradeName || inner.trade_name || legalName).trim();

  // If neither trade name nor legal name could be parsed
  if (!legalName && !tradeName && !inner.pradr) {
    const err = new Error('No business records found for this GSTIN in the GST registry.');
    err.status = 404;
    throw err;
  }

  const isInterState = stateCode !== SELLER_STATE_CODE;

  // Extract contact details if returned by API or any nested objects
  const rawEmail = (
    inner.email ||
    inner.emailId ||
    inner.email_id ||
    inner.registeredEmail ||
    inner.contactEmail ||
    inner.taxpayerEmail ||
    inner.contact?.email ||
    inner.contact_details?.email ||
    inner.contactDetails?.email ||
    inner.taxpayer?.email ||
    pradr.addr?.email ||
    pradr.contact?.email ||
    (Array.isArray(inner.auth) && inner.auth[0]?.email) ||
    (typeof inner.auth === 'object' && inner.auth?.email) ||
    ''
  ).trim();

  const rawPhone = (
    inner.mobile ||
    inner.phone ||
    inner.contactNo ||
    inner.mob ||
    inner.mobile_no ||
    inner.contactMobile ||
    inner.registeredMobile ||
    inner.taxpayerMobile ||
    inner.contact?.mobile ||
    inner.contact?.phone ||
    inner.contact_details?.mobile ||
    inner.contact_details?.phone ||
    inner.contactDetails?.mobile ||
    inner.contactDetails?.phone ||
    inner.taxpayer?.mobile ||
    inner.taxpayer?.phone ||
    pradr.addr?.mob ||
    pradr.addr?.phone ||
    pradr.contact?.mob ||
    pradr.contact?.phone ||
    (Array.isArray(inner.auth) && (inner.auth[0]?.mobile || inner.auth[0]?.phone || inner.auth[0]?.mob)) ||
    (typeof inner.auth === 'object' && (inner.auth?.mobile || inner.auth?.phone || inner.auth?.mob)) ||
    ''
  ).trim();

  const contactPerson = (
    inner.contactPerson ||
    inner.contact_person ||
    inner.contactName ||
    inner.contact?.name ||
    inner.contact_details?.name ||
    inner.contactDetails?.name ||
    inner.taxpayer?.name ||
    (Array.isArray(inner.auth) && inner.auth[0]?.name) ||
    (typeof inner.auth === 'object' && inner.auth?.name) ||
    ''
  ).trim();

  return {
    gstin: cleanGstin,
    pan: cleanGstin.length >= 12 ? cleanGstin.substring(2, 12) : '',
    legalName: legalName || tradeName,
    tradeName: tradeName || legalName,
    status: inner.sts || inner.status || 'Active',
    constitution: inner.ctb || inner.bussNature || '',
    taxpayerType: inner.dty || 'Regular',
    registrationDate: inner.rgdt || inner.regStartDate || '',
    stateCode,
    stateName,
    city: addr.city || addr.dst || '',
    district: addr.dst || '',
    pincode: addr.pncd || '',
    address: formattedAddress,
    isInterState,
    natureOfBusiness: pradr.ntr || (Array.isArray(inner.nba) ? inner.nba.join(', ') : ''),
    email: rawEmail,
    phone: rawPhone,
    contactPerson,
    hasContactInfo: Boolean(rawEmail || rawPhone),
  };
}

/**
 * Verifies a GSTIN via Sandbox.co.in API with token reuse and local memory cache
 */
async function fetchGstinFromSandbox(gstin) {
  let cleanGstin = gstin.trim().toUpperCase();

  // 1. Check in-memory verification cache
  const cached = gstinVerificationCache.get(cleanGstin);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.data, cachedAt: cached.timestamp, fromCache: true };
  }

  const apiKey = process.env.SANDBOX_API_KEY;
  const baseUrl = (process.env.SANDBOX_BASE_URL || 'https://api.sandbox.co.in').replace(/\/+$/, '');

  let token = await getSandboxAccessToken(false);
  const searchUrl = `${baseUrl}/gst/compliance/public/gstin/search`;
  const verifyUrl = `${baseUrl}/gst/compliance/public/gstin/verify`;

  const headers = {
    'x-api-key': apiKey,
    authorization: token, // Note: no 'Bearer' prefix as specified in Sandbox documentation
    'x-api-version': '1.0.0',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  let response = await makeRequest(
    searchUrl,
    { method: 'POST', headers },
    { gstin: cleanGstin }
  );

  // If unauthorized, token might have expired early; refresh once and retry
  if (response.statusCode === 401) {
    token = await getSandboxAccessToken(true);
    headers.authorization = token;
    response = await makeRequest(
      searchUrl,
      { method: 'POST', headers },
      { gstin: cleanGstin }
    );
  }

  // If Sandbox rejected due to invalid checksum in 15th digit, calculate correct checksum and retry
  if (
    (response.statusCode === 400 && response.data?.message?.includes('Invalid GSTIN pattern')) ||
    response.statusCode === 404
  ) {
    const expectedChecksum = computeGstChecksum(cleanGstin.substring(0, 14));
    if (expectedChecksum && cleanGstin[14] !== expectedChecksum) {
      const repairedGstin = cleanGstin.substring(0, 14) + expectedChecksum;
      try {
        const repairRes = await makeRequest(
          searchUrl,
          { method: 'POST', headers },
          { gstin: repairedGstin }
        );
        if (repairRes.statusCode === 200 && !repairRes.data?.message?.includes('No records found')) {
          response = repairRes;
          cleanGstin = repairedGstin;
        }
      } catch {
        // Continue with original response
      }
    }
  }

  // If search endpoint returns an error other than 404, try /verify endpoint as fallback
  if (response.statusCode >= 400 && response.statusCode !== 404) {
    try {
      const verifyRes = await makeRequest(
        verifyUrl,
        { method: 'POST', headers },
        { gstin: cleanGstin }
      );
      if (verifyRes.statusCode >= 200 && verifyRes.statusCode < 300) {
        response = verifyRes;
      }
    } catch (fallbackErr) {
      console.warn('Sandbox /verify fallback attempt notice:', fallbackErr.message);
    }
  }

  if (response.statusCode === 404) {
    const error = new Error('GSTIN not found or not active in the GST registry.');
    error.status = 404;
    throw error;
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const msg = response.data?.message || response.data?.error || `HTTP Error ${response.statusCode}`;
    const error = new Error(`Sandbox GST verification failed: ${msg}`);
    error.status = response.statusCode;
    throw error;
  }

  const normalized = normalizeSandboxGstData(response.data, cleanGstin);

  // Cache normalized result
  gstinVerificationCache.set(cleanGstin, {
    timestamp: Date.now(),
    data: normalized,
  });

  return normalized;
}

module.exports = {
  isValidGstin,
  computeGstChecksum,
  fetchGstinFromSandbox,
  getSandboxAccessToken,
  normalizeSandboxGstData,
  STATE_CODES,
  SELLER_STATE_CODE,
};
