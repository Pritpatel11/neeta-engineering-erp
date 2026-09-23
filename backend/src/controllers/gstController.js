const { isValidGstin, fetchGstinFromSandbox, STATE_CODES, SELLER_STATE_CODE } = require('../services/sandboxGstService');
const PrivateParty = require('../models/PrivateParty');
const Quotation = require('../models/Quotation');
const GstAuditLog = require('../models/GstAuditLog');

/**
 * @desc    Verify GSTIN, check existing customers, and auto-fetch registration details
 * @route   POST /api/gst/verify
 * @access  Private (Authenticated users)
 */
const verifyGstin = async (req, res) => {
  const { gstin } = req.body;

  if (!gstin || typeof gstin !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'GSTIN is required.',
    });
  }

  const cleanGstin = gstin.trim().toUpperCase();

  // 1. Format validation
  if (!isValidGstin(cleanGstin)) {
    // Record failed validation attempt
    if (req.user?._id) {
      GstAuditLog.create({
        gstin: cleanGstin,
        verifiedBy: req.user._id,
        status: 'invalid_format',
        errorMessage: 'Invalid GSTIN format. Expected 15-character alphanumeric format.',
      }).catch(() => {});
    }

    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 15-character GSTIN (e.g. 24ABHPP5386L1Z3).',
    });
  }

  const stateCode = cleanGstin.substring(0, 2);
  const stateName = STATE_CODES[stateCode] || 'Unknown State';
  const isInterState = stateCode !== SELLER_STATE_CODE;

  try {
    // 2. Check if this GSTIN already exists in the application's Customer / Party database
    const existingParty = await PrivateParty.findOne({
      gst: { $regex: new RegExp(`^${cleanGstin}$`, 'i') },
    });

    if (existingParty) {
      // Record audit
      if (req.user?._id) {
        GstAuditLog.create({
          gstin: cleanGstin,
          verifiedBy: req.user._id,
          status: 'success',
          source: 'database',
          legalName: existingParty.name,
          tradeName: existingParty.name,
          stateCode,
          isInterState,
        }).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        source: 'database',
        isExistingParty: true,
        message: `Existing customer identified: "${existingParty.name}".`,
        party: existingParty,
        data: {
          gstin: cleanGstin,
          legalName: existingParty.name,
          tradeName: existingParty.name,
          status: 'Active',
          constitution: '',
          taxpayerType: 'Regular',
          stateCode,
          stateName,
          address: existingParty.address || '',
          phone: existingParty.phone || '',
          email: existingParty.email || '',
          isInterState,
          hasContactInfo: Boolean(existingParty.phone || existingParty.email),
          contactSource: 'database',
        },
      });
    }

    // 3. Check Sandbox credentials
    const apiKey = process.env.SANDBOX_API_KEY;
    const apiSecret = process.env.SANDBOX_API_SECRET;

    if (!apiKey || !apiSecret) {
      // If credentials not configured yet, provide basic validated state information
      return res.status(200).json({
        success: true,
        source: 'unconfigured_fallback',
        isExistingParty: false,
        message: 'GSTIN format is valid. Sandbox API key/secret not configured in backend .env.',
        data: {
          gstin: cleanGstin,
          legalName: '',
          tradeName: '',
          status: 'Format Valid (Live verification requires Sandbox API credentials)',
          stateCode,
          stateName,
          address: '',
          phone: '',
          email: '',
          isInterState,
          hasContactInfo: false,
          contactNote: 'Sandbox API keys not configured. Enter details manually.',
        },
      });
    }

    // 4. Query Sandbox.co.in API
    const verifiedData = await fetchGstinFromSandbox(cleanGstin);

    // 5. Intelligent Contact Details Enrichment:
    // If contact details (phone/email) are not provided in public GST response (due to GSTN privacy rules),
    // check if this party exists in our ERP database (PrivateParty master or previous Quotations)
    if (!verifiedData.phone || !verifiedData.email) {
      try {
        const queryNames = [verifiedData.tradeName, verifiedData.legalName].filter(Boolean);
        const nameRegexes = queryNames.map(n => new RegExp(`^${n.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));

        // Step 5a: Check PrivateParty master by trade/legal name or GST
        const matchedParty = await PrivateParty.findOne({
          $or: [
            { name: { $in: nameRegexes } },
            { gst: { $regex: new RegExp(`^${cleanGstin}$`, 'i') } },
          ],
        });

        if (matchedParty) {
          if (!verifiedData.phone && matchedParty.phone) {
            verifiedData.phone = matchedParty.phone;
            verifiedData.contactSource = 'database_match';
          }
          if (!verifiedData.email && matchedParty.email) {
            verifiedData.email = matchedParty.email;
            verifiedData.contactSource = 'database_match';
          }
        }

        // Step 5b: If still missing, check previous saved Quotations for this GSTIN
        if (!verifiedData.phone || !verifiedData.email) {
          const prevQuo = await Quotation.findOne({
            clientGST: cleanGstin,
            $or: [
              { clientPhone: { $exists: true, $ne: '' } },
              { clientEmail: { $exists: true, $ne: '' } },
            ],
          }).sort({ createdAt: -1 });

          if (prevQuo) {
            if (!verifiedData.phone && prevQuo.clientPhone) {
              verifiedData.phone = prevQuo.clientPhone;
              verifiedData.contactSource = 'previous_quotation';
            }
            if (!verifiedData.email && prevQuo.clientEmail) {
              verifiedData.email = prevQuo.clientEmail;
              verifiedData.contactSource = 'previous_quotation';
            }
          }
        }
      } catch (matchErr) {
        console.warn('Party contact match notice:', matchErr.message);
      }
    }

    verifiedData.hasContactInfo = Boolean(verifiedData.phone || verifiedData.email);
    if (!verifiedData.hasContactInfo) {
      verifiedData.contactNote = 'Contact details (Email/Phone) are protected by GSTN privacy regulations and not provided in the public registry. Please enter manually.';
    }

    // Audit log success
    if (req.user?._id) {
      GstAuditLog.create({
        gstin: cleanGstin,
        verifiedBy: req.user._id,
        status: 'success',
        source: verifiedData.fromCache ? 'cache' : 'sandbox',
        legalName: verifiedData.legalName,
        tradeName: verifiedData.tradeName,
        stateCode: verifiedData.stateCode,
        isInterState: verifiedData.isInterState,
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      source: verifiedData.fromCache ? 'cache' : 'sandbox',
      isExistingParty: false,
      message: `Verified successfully: "${verifiedData.tradeName || verifiedData.legalName}".`,
      data: verifiedData,
    });
  } catch (error) {
    console.error('GST verification error:', error.message);

    // Audit log failure
    if (req.user?._id) {
      GstAuditLog.create({
        gstin: cleanGstin,
        verifiedBy: req.user._id,
        status: error.status === 404 ? 'not_found' : 'failed',
        source: 'sandbox',
        stateCode,
        isInterState,
        errorMessage: error.message || 'Verification failed',
      }).catch(() => {});
    }

    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message || 'GSTIN not found or not active in the GST registry.',
      });
    }

    if (error.status === 401) {
      return res.status(502).json({
        success: false,
        message: 'Sandbox authentication failed. Please check your API credentials.',
      });
    }

    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid GSTIN number. Please check and try again.',
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'GST verification service is temporarily unavailable. Please try again later.',
    });
  }
};

/**
 * @desc    Get recent GST verification audit history
 * @route   GET /api/gst/history
 * @access  Private (Authenticated users)
 */
const getGstHistory = async (req, res) => {
  try {
    const history = await GstAuditLog.find()
      .populate('verifiedBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve GST audit history' });
  }
};

module.exports = {
  verifyGstin,
  getGstHistory,
};
