import React, { useState } from 'react';
import { Printer, Share2, Check, Download, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';

// Simple helper to convert Indian rupees to words
function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;

  if (crore > 0) words += inWords(crore) + ' Crore ';
  if (lakh > 0) words += inWords(lakh) + ' Lakh ';
  if (thousand > 0) words += inWords(thousand) + ' Thousand ';
  if (hundred > 0) words += inWords(hundred) + ' Hundred ';
  if (num > 0) {
    if (words !== '') words += 'and ';
    words += inWords(num) + ' ';
  }

  return `Rupees ${words.trim()} Only`;
}

export const ReceiptModal: React.FC = () => {
  const { previewReceipt, setPreviewReceipt, instituteConfig, students } = useApp();
  const [copied, setCopied] = useState(false);

  if (!previewReceipt) return null;

  const student = students.find(s => s.id === previewReceipt.studentId);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = () => {
    const text = `*FEE PAYMENT RECEIPT — ${instituteConfig.name.toUpperCase()}*\n` +
      `Receipt No: ${previewReceipt.receiptNumber}\n` +
      `Date: ${previewReceipt.paymentDate}\n` +
      `Student: ${previewReceipt.studentName} (${student?.studentId || ''})\n` +
      `Batch: ${previewReceipt.batchName}\n` +
      `--------------------------------\n` +
      `Amount Paid Today: ₹${previewReceipt.amount.toLocaleString('en-IN')}\n` +
      `Payment Mode: ${previewReceipt.paymentMethod}\n` +
      `Remaining Balance: ₹${previewReceipt.balanceRemaining.toLocaleString('en-IN')}\n` +
      `Collected By: ${previewReceipt.collectedBy}\n` +
      `--------------------------------\n` +
      `Thank you for your prompt payment!\n` +
      `Phone: ${instituteConfig.phone}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={!!previewReceipt}
      onClose={() => setPreviewReceipt(null)}
      title="Official Payment Receipt"
      size="large"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button
            variant="whatsapp"
            icon={copied ? <Check size={16} /> : <Share2 size={16} />}
            onClick={handleCopyWhatsApp}
          >
            {copied ? 'WhatsApp Message Copied!' : 'Copy Parent WhatsApp Text'}
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setPreviewReceipt(null)}>
              Close
            </Button>
            <Button variant="primary" icon={<Printer size={16} />} onClick={handlePrint}>
              Print / Save PDF
            </Button>
          </div>
        </div>
      }
    >
      <div
        className="receipt-document"
        style={{
          border: '2px solid #0f172a',
          borderRadius: '8px',
          padding: '28px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'var(--font-family-sans)',
        }}
      >
        {/* Institute Header */}
        <div
          style={{
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#1e3a8a',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {instituteConfig.name}
            </h2>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', margin: '2px 0 6px 0' }}>
              {instituteConfig.tagline}
            </p>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>{instituteConfig.address}, {instituteConfig.city} - {instituteConfig.pincode}</span>
              <span>Phone: {instituteConfig.phone} | Email: {instituteConfig.email}</span>
              <span>Govt Reg / Udyam: {instituteConfig.regNumber}</span>
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#2563eb',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              FEE RECEIPT
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-family-mono)' }}>
              {previewReceipt.receiptNumber}
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Date: {previewReceipt.paymentDate}
            </span>
          </div>
        </div>

        {/* Student & Payment Meta */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '16px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <span style={{ color: '#64748b', width: '110px', display: 'inline-block' }}>Student Name:</span>
              <strong style={{ fontSize: '14px' }}>{previewReceipt.studentName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', width: '110px', display: 'inline-block' }}>Student ID:</span>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
                {student?.studentId || 'FIX-2026-N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', width: '110px', display: 'inline-block' }}>Guardian:</span>
              <span>{student?.guardianName} ({student?.guardianRelation})</span>
            </div>
            <div>
              <span style={{ color: '#64748b', width: '110px', display: 'inline-block' }}>Phone:</span>
              <span>{student?.phone}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <span style={{ color: '#64748b', width: '110px', display: 'inline-block' }}>Batch / Class:</span>
              <strong>{previewReceipt.batchName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', width: '110px', display: 'inline-block' }}>Academic Year:</span>
              <span>{instituteConfig.academicSession}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', width: '110px', display: 'inline-block' }}>Payment Mode:</span>
              <span
                style={{
                  background: '#f1f5f9',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                {previewReceipt.paymentMethod}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', width: '110px', display: 'inline-block' }}>Collected By:</span>
              <span>{previewReceipt.collectedBy}</span>
            </div>
          </div>
        </div>

        {/* Ledger Breakdown Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '18px',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px' }}>Particulars / Description</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', width: '120px' }}>Amount Invoiced</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', width: '120px' }}>Prior Paid</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', width: '120px' }}>Amount Paid Now</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 10px' }}>
                <strong>Coaching Tuition Fee & Study Materials</strong>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {previewReceipt.remarks || 'Standard instalment received and credited.'}
                </div>
              </td>
              <td style={{ textAlign: 'right', padding: '12px 10px', fontFamily: 'var(--font-family-mono)' }}>
                ₹{previewReceipt.invoicedAmount.toLocaleString('en-IN')}
              </td>
              <td style={{ textAlign: 'right', padding: '12px 10px', fontFamily: 'var(--font-family-mono)', color: '#64748b' }}>
                ₹{previewReceipt.paidAmountPrior.toLocaleString('en-IN')}
              </td>
              <td
                style={{
                  textAlign: 'right',
                  padding: '12px 10px',
                  fontFamily: 'var(--font-family-mono)',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#047857',
                }}
              >
                ₹{previewReceipt.amount.toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Total in words and Balance summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Amount in Words:</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              {numberToIndianWords(previewReceipt.amount)}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Remaining Balance Due:</span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: previewReceipt.balanceRemaining > 0 ? '#b91c1c' : '#047857',
                fontFamily: 'var(--font-family-mono)',
              }}
            >
              ₹{previewReceipt.balanceRemaining.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Footer & Signatures */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '20px',
            borderTop: '1px dashed #cbd5e1',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div>
            <p>1. Fees once paid are non-refundable & non-transferable.</p>
            <p>2. Computer-generated official receipt issued by FIXIA CoachingOS.</p>
          </div>

          <div style={{ textAlign: 'center', width: '180px' }}>
            <div
              style={{
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'cursive',
                fontSize: '14px',
                color: '#1e3a8a',
              }}
            >
              Rakesh Sharma
            </div>
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 600, color: '#0f172a' }}>
              Authorized Signatory
            </div>
            <span>{instituteConfig.name}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
