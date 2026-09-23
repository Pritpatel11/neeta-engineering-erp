import { z } from 'zod';
import { erpGet } from '../erpClient.js';

/**
 * Tool: get_payment
 */
export const getPaymentTool = {
  name: 'get_payment',
  description: 'Retrieve details of a customer payment receipt by payment record ID or transaction reference.',
  parameters: z.object({
    id: z.string().optional().describe('Payment MongoDB ID'),
    reference: z.string().optional().describe('Transaction reference, UTR, or Cheque number'),
  }),
  handler: async ({ id, reference }) => {
    if (!id && !reference) {
      throw new Error('Please provide either payment ID or transaction reference.');
    }

    const payments = await erpGet('/private-payments', {}, 'get_payment');

    if (!Array.isArray(payments)) {
      return {
        content: [{
          type: 'text',
          text: 'No payment records found in the ERP system.',
        }],
      };
    }

    const cleanRef = reference?.toLowerCase().trim();
    const payment = payments.find(p =>
      (id && p._id === id) ||
      (cleanRef && p.reference?.toLowerCase() === cleanRef)
    );

    if (!payment) {
      return {
        content: [{
          type: 'text',
          text: `Payment with ${id ? `ID "${id}"` : `reference "${reference}"`} was not found.`,
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          paymentId: payment._id,
          invoiceNo: payment.invoiceNo,
          customer: payment.partyName,
          amountPaid: `INR ${Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          reference: payment.reference || 'N/A',
          bankDetails: payment.bankDetails || 'N/A',
          notes: payment.notes || '',
          financialYear: payment.financialYear,
        }, null, 2),
      }],
    };
  },
};

/**
 * Tool: search_payments
 */
export const searchPaymentsTool = {
  name: 'search_payments',
  description: 'Search payment transactions by invoice number, customer name, payment method, or date range.',
  parameters: z.object({
    invoiceNo: z.string().optional().describe('Invoice Number (e.g. "PI-001")'),
    customerName: z.string().optional().describe('Customer or party name'),
    paymentMethod: z.enum(['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Bank Transfer', 'Other']).optional().describe('Payment mode'),
    startDate: z.string().optional().describe('Filter payments on or after this date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('Filter payments on or before this date (YYYY-MM-DD)'),
    limit: z.number().optional().default(25).describe('Maximum records to return (default: 25)'),
  }),
  handler: async ({ invoiceNo, customerName, paymentMethod, startDate, endDate, limit = 25 }) => {
    const params = {};
    if (invoiceNo) params.invoiceNo = invoiceNo;
    if (customerName) params.partyName = customerName;
    if (paymentMethod) params.paymentMethod = paymentMethod;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    params.limit = limit;

    const payments = await erpGet('/private-payments', params, 'search_payments');

    if (!Array.isArray(payments) || payments.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No payment records found matching the specified filters.',
        }],
      };
    }

    const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const summary = payments.map(p => ({
      paymentId: p._id,
      invoiceNo: p.invoiceNo,
      partyName: p.partyName,
      amount: `INR ${Number(p.amount).toLocaleString('en-IN')}`,
      date: p.paymentDate,
      mode: p.paymentMethod,
      ref: p.reference || '—',
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalRecords: payments.length,
          totalAmountReceived: `INR ${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          payments: summary,
        }, null, 2),
      }],
    };
  },
};
