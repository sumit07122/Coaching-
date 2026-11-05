import React, { useState, useEffect } from 'react';
import { IndianRupee, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, Student } from '../../types';

export const RecordPaymentModal: React.FC = () => {
  const {
    students,
    todayDate,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    selectedStudentForPayment,
    setSelectedStudentForPayment,
    recordPayment,
  } = useApp();

  const [studentId, setStudentId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentDate, setPaymentDate] = useState<string>(todayDate);
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync selected student when modal opens
  useEffect(() => {
    if (selectedStudentForPayment) {
      setStudentId(selectedStudentForPayment.id);
      setAmount(selectedStudentForPayment.balanceFee > 0 ? selectedStudentForPayment.balanceFee : 0);
      setRemarks(`Instalment for ${selectedStudentForPayment.batchName}`);
    } else if (students.length > 0 && !studentId) {
      const studentWithDue = students.find(s => s.balanceFee > 0) || students[0];
      setStudentId(studentWithDue.id);
      setAmount(studentWithDue.balanceFee > 0 ? studentWithDue.balanceFee : 0);
      setRemarks(`Instalment for ${studentWithDue.batchName}`);
    }
  }, [selectedStudentForPayment, isPaymentModalOpen]);

  const activeStudent: Student | undefined = students.find(s => s.id === studentId);

  const handleStudentChange = (newId: string) => {
    setStudentId(newId);
    const s = students.find(item => item.id === newId);
    if (s) {
      setAmount(s.balanceFee > 0 ? s.balanceFee : 0);
      setRemarks(`Instalment for ${s.batchName}`);
    }
    setError('');
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) {
      setError('Please select a student.');
      return;
    }
    if (amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }
    if (amount > activeStudent.balanceFee && activeStudent.balanceFee > 0) {
      if (!window.confirm(`Amount (₹${amount}) is higher than outstanding dues (₹${activeStudent.balanceFee}). Record as advance?`)) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      recordPayment({
        studentId: activeStudent.id,
        amount,
        paymentMethod,
        paymentDate,
        remarks,
      });
      setIsPaymentModalOpen(false);
      setSelectedStudentForPayment(null);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isPaymentModalOpen) return null;

  return (
    <Modal
      isOpen={isPaymentModalOpen}
      onClose={() => {
        setIsPaymentModalOpen(false);
        setSelectedStudentForPayment(null);
      }}
      title="Record Fee Payment"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setIsPaymentModalOpen(false);
              setSelectedStudentForPayment(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<IndianRupee size={15} />}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording...' : 'Record & Preview Receipt'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger-text)',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Student Selector */}
        <div className="form-group">
          <label className="form-label required">Select Enrolled Student</label>
          <select
            className="form-select"
            value={studentId}
            onChange={e => handleStudentChange(e.target.value)}
            disabled={!!selectedStudentForPayment}
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentId}) — {s.batchName} — Due: ₹{s.balanceFee.toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </div>

        {/* Live Balance Card */}
        {activeStudent && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              textAlign: 'center',
              gap: '8px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                Total Course Fee
              </span>
              <strong style={{ fontSize: '15px' }}>
                ₹{activeStudent.totalFeeInvoiced.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                Paid So Far
              </span>
              <strong style={{ fontSize: '15px', color: 'var(--color-success)' }}>
                ₹{activeStudent.totalFeePaid.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                Pending Balance
              </span>
              <strong
                style={{
                  fontSize: '15px',
                  color: activeStudent.balanceFee > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                }}
              >
                ₹{activeStudent.balanceFee.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="form-group">
          <label className="form-label required">Amount to Collect (₹)</label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
              }}
            >
              ₹
            </span>
            <input
              type="number"
              className="form-input"
              style={{ paddingLeft: '28px', fontSize: '16px', fontWeight: 600 }}
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="Enter amount in ₹"
              min="1"
              required
            />
          </div>

          {/* Quick Amount Suggestion Pills */}
          {activeStudent && activeStudent.balanceFee > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickAmount(activeStudent.balanceFee)}
              >
                Full Due (₹{activeStudent.balanceFee.toLocaleString('en-IN')})
              </button>
              {activeStudent.balanceFee >= 2000 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickAmount(Math.round(activeStudent.balanceFee / 2))}
                >
                  Half Due (₹{Math.round(activeStudent.balanceFee / 2).toLocaleString('en-IN')})
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickAmount(1000)}
              >
                ₹1,000 Partial
              </button>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Payment Mode</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cash">Cash (Institute Counter)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cheque">Bank Cheque</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Payment Date</label>
            <input
              type="date"
              className="form-input"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Remarks / Reference */}
        <div className="form-group">
          <label className="form-label">Transaction Reference / Note</label>
          <input
            type="text"
            className="form-input"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="e.g. UPI Ref #98124 or Month of November instalment"
          />
        </div>
      </form>
    </Modal>
  );
};
