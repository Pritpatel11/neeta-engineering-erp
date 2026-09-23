const nodemailer = require('nodemailer');

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
  const cleanPass = rawPass.replace(/\s+/g, '');

  const isLiveConfig = user && cleanPass && !cleanPass.includes('YOUR_GMAIL_16_DIGIT_APP_PASSWORD');

  if (isLiveConfig) {
    if (host) {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass: cleanPass }
      });
      console.log(`[EmailService] Configured live SMTP (${host}:${port}) for ${user}`);
      return cachedTransporter;
    } else {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass: cleanPass }
      });
      console.log(`[EmailService] Configured live Gmail service for ${user}`);
      return cachedTransporter;
    }
  }

  // Fallback: Create ethereal test account for local testing / demo
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('[EmailService] Created ethereal test account:', testAccount.user);
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Could not create test account, fallback to jsonTransport:', err.message);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return cachedTransporter;
  }
}

/**
 * Send an invoice via email with PDF attachment
 */
async function sendInvoiceEmail({ to, subject, note, invoice, pdfBuffer }) {
  if (!to) {
    throw new Error('Recipient email address is required');
  }

  const transporter = await getTransporter();

  const invoiceNo = invoice?.invoiceNo || 'INV';
  const clientName = invoice?.clientName || 'Valued Customer';
  const invoiceDate = invoice?.date || new Date().toISOString().slice(0, 10);
  const totalAmount = invoice?.totalAmount ? Number(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00';
  const dueDate = invoice?.dueDate || 'Upon Receipt';

  const defaultSubject = `Tax Invoice #${invoiceNo} from Neeta Engineering Works`;
  const emailSubject = subject?.trim() || defaultSubject;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
        .wrapper { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0059bb; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
        .summary-box { background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; padding: 16px; margin: 20px 0; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
        .summary-row:last-child { border-bottom: none; font-weight: 700; font-size: 16px; color: #0059bb; padding-top: 10px; }
        .note-box { background: #eff6ff; border-left: 4px solid #0059bb; padding: 12px; margin: 16px 0; font-size: 14px; color: #1e3a8a; border-radius: 0 6px 6px 0; }
        .bank-details { font-size: 13px; color: #475569; margin: 20px 0; padding: 12px; background: #fdfdfd; border: 1px solid #e2e8f0; border-radius: 6px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Neeta Engineering Works</h1>
          <p>179, GIDC Main Road, Navadisa Road, Chandisar, Banaskantha, Gujarat 385510</p>
          <p>GSTIN: 24ABHPP5386L1Z3 | E-Mail: neeta5788@gmail.com</p>
        </div>
        <div class="content">
          <div class="greeting">Dear ${clientName},</div>
          <p>Please find attached your invoice <strong>#${invoiceNo}</strong> dated <strong>${invoiceDate}</strong>.</p>
          
          <div class="summary-box">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
              <tr>
                <td style="color: #64748b;">Invoice Number:</td>
                <td align="right"><strong>${invoiceNo}</strong></td>
              </tr>
              <tr>
                <td style="color: #64748b;">Invoice Date:</td>
                <td align="right">${invoiceDate}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Due Date:</td>
                <td align="right">${dueDate}</td>
              </tr>
              <tr style="border-top: 2px solid #cbd5e1; font-weight: bold; font-size: 16px; color: #0059bb;">
                <td>Total Amount Payable:</td>
                <td align="right">₹ ${totalAmount}</td>
              </tr>
            </table>
          </div>

          ${note ? `<div class="note-box"><strong>Note from sender:</strong><br/>${note}</div>` : ''}

          <div class="bank-details">
            <strong>Bank Details for Payment:</strong><br/>
            Bank: The Mehsana Urban Co-operative Bank Ltd.<br/>
            A/c No: <strong>00141101001022</strong> | IFSC: <strong>MSNU0000014</strong> | Branch: Deesa Branch
          </div>

          <p style="font-size: 13px; color: #64748b;">
            A complete printable copy of this invoice is attached to this email as a PDF document.
          </p>
        </div>
        <div class="footer">
          Neeta Engineering Works &bull; Quality Engineering & Precision Manufacturing<br/>
          This is an automated invoice communication.
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `Invoice_${invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Neeta Engineering Works" <neeta5788@gmail.com>`,
    to,
    subject: emailSubject,
    html: htmlBody,
    attachments
  };

  const info = await transporter.sendMail(mailOptions);

  if (nodemailer.getTestMessageUrl(info)) {
    console.log('[EmailService] Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null
  };
}

/**
 * Send an email notification when a task is assigned to a team member
 */
async function sendTaskAssignmentEmail({ to, task, assignedBy, assignedToUser }) {
  if (!to) {
    console.warn('[EmailService] No recipient email provided for task assignment:', task?.title);
    return { success: false, message: 'No recipient email' };
  }

  try {
    const transporter = await getTransporter();

    const taskTitle = task?.title || 'New Task';
    const taskDesc = task?.description || 'No description provided';
    const priority = (task?.priority || 'medium').toUpperCase();
    const dueDate = task?.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'Not specified';
    const ownerName = assignedBy?.name || 'Owner';
    const recipientName = assignedToUser?.name || 'Team Member';
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173/#/my-tasks';

    // Priority badge styling
    const priorityColors = {
      URGENT: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
      HIGH: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
      MEDIUM: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
      LOW: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
    };
    const style = priorityColors[priority] || priorityColors.MEDIUM;

    const emailSubject = `[Task Assigned] ${taskTitle} (Priority: ${priority})`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0059bb; margin: 0; font-size: 20px; font-weight: 700;">Neeta Engineering Works</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Owner Portal — Task Notification System</p>
        </div>

        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          <div style="margin-bottom: 16px;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: ${style.bg}; color: ${style.text}; border: 1px solid ${style.border};">
              Priority: ${priority}
            </span>
          </div>

          <h3 style="margin-top: 0; margin-bottom: 12px; color: #0f172a; font-size: 18px; font-weight: 600;">
            ${taskTitle}
          </h3>

          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            ${taskDesc}
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Assigned To:</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">${recipientName}</td>
            </tr>
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Assigned By:</td>
              <td style="padding: 10px 0; color: #0059bb; font-weight: 600; text-align: right;">${ownerName} (Owner)</td>
            </tr>
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Due Date:</td>
              <td style="padding: 10px 0; color: #e11d48; font-weight: 600; text-align: right;">${dueDate}</td>
            </tr>
            ${task.relatedModule ? `
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Related Module:</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">${task.relatedModule}</td>
            </tr>` : ''}
          </table>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${portalUrl}" style="display: inline-block; background-color: #0059bb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              View & Update Task in ERP
            </a>
          </div>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 11px;">
          This is an automated operational notification dispatched by Neeta Engineering Works ERP.
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Neeta Engineering Works" <neeta5788@gmail.com>`,
      to,
      subject: emailSubject,
      html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('[EmailService] Task Assignment email preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error('[EmailService] Failed to send task assignment email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send an RFQ (Request for Quotation) email to a raw material vendor
 */
async function sendVendorQuotationRequestEmail({ to, vendorName, prNo, requiredDate, materials = [], notes = '', requestedByName = 'Purchase Manager' }) {
  if (!to) {
    console.warn('[EmailService] No vendor email provided for quotation request:', prNo);
    return { success: false, message: 'Vendor email required' };
  }

  try {
    const transporter = await getTransporter();

    const formattedDate = requiredDate ? new Date(requiredDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) : 'Immediate / Earliest';

    const materialRows = materials.map((m, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${idx + 1}</td>
        <td style="padding: 10px 12px; color: #0f172a; font-weight: 600;">
          ${m.name}
          ${m.code ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">Code: ${m.code}</div>` : ''}
          ${m.specifications ? `<div style="font-size: 11px; color: #0059bb; font-style: italic;">Spec: ${m.specifications}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; text-align: center; color: #475569;">${m.hsn || '-'}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0059bb; font-size: 14px;">
          ${m.quantity} ${m.unit || 'Nos'}
        </td>
      </tr>
    `).join('');

    const emailSubject = `[Quotation Request] Request for Price Quotation — Ref: ${prNo}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="border-bottom: 2px solid #0059bb; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #0059bb; margin: 0; font-size: 22px; font-weight: 700;">Neeta Engineering Works</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Plot No. 12, GIDC Industrial Estate, Mehsana, Gujarat | Purchase & Procurement Dept.</p>
        </div>

        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div>
              <p style="margin: 0; font-size: 14px; color: #475569;">To,</p>
              <h3 style="margin: 4px 0 0 0; font-size: 18px; color: #0f172a; font-weight: 700;">${vendorName || 'Respected Vendor / Supplier'}</h3>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;">
                RFQ: ${prNo}
              </span>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Required By: <strong style="color: #e11d48;">${formattedDate}</strong></div>
            </div>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            Dear Sir/Madam,<br/>
            Please review the following list of required raw materials and provide your most competitive price quotation (inclusive of applicable GST, transportation/shipping, and delivery lead time) at the earliest.
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 10px 12px;">Sr.</th>
                <th style="padding: 10px 12px;">Material Description / Specification</th>
                <th style="padding: 10px 12px; text-align: center;">HSN</th>
                <th style="padding: 10px 12px; text-align: right;">Required Qty</th>
              </tr>
            </thead>
            <tbody>
              ${materialRows}
            </tbody>
          </table>

          ${notes ? `
          <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 6px; font-size: 12px; color: #854d0e; margin-bottom: 20px;">
            <strong>Special Instructions / Notes:</strong> ${notes}
          </div>` : ''}

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #475569;">
            <p style="margin: 0 0 6px 0;"><strong>Please reply to this email with:</strong></p>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.6;">
              <li>Per unit basic rate + GST %</li>
              <li>Estimated delivery period / lead time</li>
              <li>Payment terms (e.g. advance, net 30 days)</li>
              <li>Quotation validity period</li>
            </ul>
          </div>
        </div>

        <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
          Regards,<br/>
          <strong style="color: #0f172a;">${requestedByName}</strong><br/>
          Purchase & Supply Chain Department<br/>
          Neeta Engineering Works
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Neeta Engineering Works - Purchase Dept" <neeta5788@gmail.com>`,
      to,
      subject: emailSubject,
      html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('[EmailService] RFQ email preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error('[EmailService] Failed to send RFQ email to vendor:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendInvoiceEmail,
  sendTaskAssignmentEmail,
  sendVendorQuotationRequestEmail,
};


