import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  FileText,
  Trash2,
  CheckCircle2,
  Building,
  Users,
  Zap,
  TrendingDown,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Expense, ExpenseCategory, ExpensePaymentMode } from '../types';

export const Expenses: React.FC = () => {
  const { expenses, addExpense, voidExpense, todayDate, dashboardStats } = useApp();
  const { userRole } = useAuth();
  const canManageExpenses = userRole === 'owner' || userRole === 'admin';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('ALL');
  const [filterVoided, setFilterVoided] = useState<'all' | 'active' | 'voided'>('active');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedExpenseToVoid, setSelectedExpenseToVoid] = useState<Expense | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');

  // Add Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('rent');
  const [formAmount, setFormAmount] = useState<number>(5000);
  const [formDate, setFormDate] = useState(todayDate);
  const [formRecipient, setFormRecipient] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<ExpensePaymentMode>('upi');
  const [formRefNumber, setFormRefNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Current Month calculations
  const currentMonthKey = todayDate.slice(0, 7); // e.g., '2026-11'

  const activeExpenses = useMemo(() => expenses.filter(e => !e.isVoided), [expenses]);
  const voidedExpenses = useMemo(() => expenses.filter(e => e.isVoided), [expenses]);

  const thisMonthExpenses = useMemo(() => {
    return activeExpenses
      .filter(e => e.expenseDate.startsWith(currentMonthKey))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [activeExpenses, currentMonthKey]);

  const totalVoidedAmount = useMemo(() => {
    return voidedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [voidedExpenses]);

  // Net Operating Income = Actual Monthly Fee Collections minus Monthly Operating Expenses
  const netOperatingIncome = dashboardStats.collectedThisMonth - thisMonthExpenses;

  // Category breakdown for this month
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    activeExpenses
      .filter(e => e.expenseDate.startsWith(currentMonthKey))
      .forEach(e => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });
    return map;
  }, [activeExpenses, currentMonthKey]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Voided status filter
      if (filterVoided === 'active' && exp.isVoided) return false;
      if (filterVoided === 'voided' && !exp.isVoided) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) return false;

      // Payment mode filter
      if (selectedPaymentMode !== 'ALL' && exp.paymentMode !== selectedPaymentMode) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          exp.title.toLowerCase().includes(q) ||
          (exp.recipient && exp.recipient.toLowerCase().includes(q)) ||
          (exp.referenceNumber && exp.referenceNumber.toLowerCase().includes(q)) ||
          exp.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [expenses, filterVoided, selectedCategory, selectedPaymentMode, searchQuery]);

  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormCategory('rent');
    setFormAmount(5000);
    setFormDate(todayDate);
    setFormRecipient('');
    setFormPaymentMode('upi');
    setFormRefNumber('');
    setFormNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Expense title / description is required.');
      return;
    }
    if (formAmount <= 0) {
      setFormError('Expense amount must be greater than zero.');
      return;
    }

    try {
      addExpense({
        title: formTitle.trim(),
        category: formCategory,
        amount: Number(formAmount),
        expenseDate: formDate,
        recipient: formRecipient.trim() || undefined,
        paymentMode: formPaymentMode,
        referenceNumber: formRefNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to record expense.');
    }
  };

  const handleOpenVoidModal = (exp: Expense) => {
    setSelectedExpenseToVoid(exp);
    setVoidReason('');
    setVoidError('');
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoid = () => {
    if (!selectedExpenseToVoid) return;
    if (!voidReason.trim()) {
      setVoidError('A mandatory reason must be provided to void an expense voucher.');
      return;
    }

    try {
      voidExpense(selectedExpenseToVoid.id, voidReason.trim());
      setIsVoidModalOpen(false);
    } catch (err: any) {
      setVoidError(err.message || 'Failed to void expense.');
    }
  };

  const categoryLabels: Record<ExpenseCategory, string> = {
    rent: 'Classroom Rent & Lease',
    salaries: 'Teacher & Staff Salaries',
    utilities: 'Electricity & Utilities',
    stationery: 'Printing & DPP Booklets',
    marketing: 'Marketing & Student Outreach',
    maintenance: 'Maintenance & Repairs',
    software: 'Software & Cloud Services',
    other: 'General Overhead',
  };

  return (
    <div className="expenses-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Institute Expenses & Outflow</h1>
          <p>Track operating overhead, classroom leases, faculty salaries, and net operating income.</p>
        </div>

        {canManageExpenses && (
          <div className="page-actions-group">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenAddModal}
            >
              Record New Expense
            </Button>
          </div>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="stat-card-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Monthly Expenses (Nov 2026)
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#b91c1c' }}>
            ₹{thisMonthExpenses.toLocaleString('en-IN')}
          </span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Across {activeExpenses.filter(e => e.expenseDate.startsWith(currentMonthKey)).length} recorded vouchers
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Monthly Fee Collections
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#047857' }}>
            ₹{dashboardStats.collectedThisMonth.toLocaleString('en-IN')}
          </span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Actual realized student payments
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Net Operating Income (P&L)
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: netOperatingIncome >= 0 ? '#eff6ff' : '#fef2f2',
                color: netOperatingIncome >= 0 ? '#2563eb' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IndianRupee size={18} />
            </div>
          </div>
          <span
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: netOperatingIncome >= 0 ? '#1e40af' : '#b91c1c',
            }}
          >
            {netOperatingIncome >= 0 ? '+' : ''}₹{netOperatingIncome.toLocaleString('en-IN')}
          </span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Collections minus operational overhead
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Voided Vouchers
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={16} />
            </div>
          </div>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#475569' }}>
            ₹{totalVoidedAmount.toLocaleString('en-IN')}
          </span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {voidedExpenses.length} reversed vouchers (audited)
          </span>
        </div>
      </div>

      {/* Main Expense Table Card */}
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Expense Vouchers Ledger</span>
              <span className="badge badge-default" style={{ fontSize: '12px' }}>
                {filteredExpenses.length} Records
              </span>
            </div>
          }
          action={
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '180px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Search vouchers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    height: '36px',
                    paddingLeft: '32px',
                    paddingRight: '12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="ALL">All Categories</option>
                <option value="rent">Rent & Lease</option>
                <option value="salaries">Teacher Salaries</option>
                <option value="utilities">Utilities & Electricity</option>
                <option value="stationery">Stationery & DPPs</option>
                <option value="marketing">Marketing</option>
                <option value="maintenance">Maintenance</option>
                <option value="software">Software & Tech</option>
                <option value="other">Other Overhead</option>
              </select>

              <select
                value={filterVoided}
                onChange={e => setFilterVoided(e.target.value as any)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="active">Active Only</option>
                <option value="voided">Voided Only</option>
                <option value="all">All Vouchers</option>
              </select>
            </div>
          }
        />

        <CardBody style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description / Voucher</th>
                  <th>Category</th>
                  <th>Recipient / Vendor</th>
                  <th>Mode</th>
                  <th>Ref Number</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                  {canManageExpenses && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={canManageExpenses ? 9 : 8} style={{ textAlign: 'center', padding: '36px' }}>
                      <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                        No expense records found matching current filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id} style={{ opacity: exp.isVoided ? 0.6 : 1 }}>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {exp.expenseDate}
                      </td>
                      <td>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--color-text-main)' }}>
                          {exp.title}
                        </strong>
                        {exp.notes && (
                          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                            {exp.notes}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {categoryLabels[exp.category] || exp.category}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {exp.recipient || '—'}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, color: '#475569' }}>
                          {exp.paymentMode}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>
                        {exp.referenceNumber || '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '14px', color: exp.isVoided ? '#94a3b8' : '#b91c1c' }}>
                        {exp.isVoided ? <del>₹{exp.amount.toLocaleString('en-IN')}</del> : `₹${exp.amount.toLocaleString('en-IN')}`}
                      </td>
                      <td>
                        {exp.isVoided ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                            }}
                            title={`Voided: ${exp.voidReason || 'No reason specified'}`}
                          >
                            VOIDED
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            CONFIRMED
                          </span>
                        )}
                      </td>
                      {canManageExpenses && (
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {!exp.isVoided && (
                            <button
                              onClick={() => handleOpenVoidModal(exp)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '4px 8px',
                              }}
                              title="Void expense record"
                            >
                              Void
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Institute Expense Voucher"
        size="large"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveExpense}>
              Save Expense Voucher
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px' }}>
              {formError}
            </div>
          )}

          <Input
            label="Expense Title / Purpose *"
            placeholder="e.g. November Classroom Lease / AC Maintenance"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label="Category *"
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as ExpenseCategory)}
              options={[
                { value: 'rent', label: 'Classroom Rent & Lease' },
                { value: 'salaries', label: 'Teacher & Staff Salaries' },
                { value: 'utilities', label: 'Electricity & Utilities' },
                { value: 'stationery', label: 'Printing & Test Booklets' },
                { value: 'marketing', label: 'Marketing & Banners' },
                { value: 'maintenance', label: 'Maintenance & Repairs' },
                { value: 'software', label: 'Software & Technology' },
                { value: 'other', label: 'Other General Overhead' },
              ]}
            />

            <Input
              label="Amount (₹) *"
              type="number"
              min={1}
              value={formAmount}
              onChange={e => setFormAmount(Number(e.target.value))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Expense Date *"
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              required
            />

            <Select
              label="Payment Mode *"
              value={formPaymentMode}
              onChange={e => setFormPaymentMode(e.target.value as ExpensePaymentMode)}
              options={[
                { value: 'upi', label: 'UPI / Google Pay / PhonePe' },
                { value: 'bank_transfer', label: 'Bank Transfer / NEFT / IMPS' },
                { value: 'cash', label: 'Cash at Desk' },
                { value: 'cheque', label: 'Bank Cheque' },
                { value: 'card', label: 'Debit / Credit Card' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Recipient / Vendor / Landlord"
              placeholder="e.g. Shri Radhey Real Estate / UPPCL"
              value={formRecipient}
              onChange={e => setFormRecipient(e.target.value)}
            />

            <Input
              label="Reference / Cheque Number"
              placeholder="e.g. UTR-9182910"
              value={formRefNumber}
              onChange={e => setFormRefNumber(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Notes / Audit Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes for accounting and audit verification..."
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Void Expense Modal */}
      <Modal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        title="Void Expense Voucher"
        size="normal"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsVoidModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmVoid}>
              Confirm Void
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: 0 }}>
            You are about to void the expense <strong>"{selectedExpenseToVoid?.title}"</strong> (
            ₹{selectedExpenseToVoid?.amount.toLocaleString('en-IN')}).
          </p>
          <p style={{ fontSize: '12.5px', color: '#b91c1c', margin: 0 }}>
            This voucher will be excluded from net operating income calculations. The original record is permanently preserved for accounting audit trails.
          </p>

          {voidError && (
            <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '6px', fontSize: '12.5px' }}>
              {voidError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Mandatory Void Reason *
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Duplicate entry recorded by receptionist / Cheque bounced"
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
