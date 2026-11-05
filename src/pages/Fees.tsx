import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Search,
  Filter,
  Eye,
  Plus,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Percent,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { FeeStatusBadge, Badge } from '../components/common/Badge';
import { FeePlan, PaymentMethod, Student } from '../types';

export const Fees: React.FC = () => {
  const {
    students,
    batches,
    payments,
    feePlans,
    dashboardStats,
    todayDate,
    reversePayment,
    addFeePlan,
    assignFeePlan,
    setIsPaymentModalOpen,
    setSelectedStudentForPayment,
    setPreviewReceipt,
  } = useApp();
  const { userRole } = useAuth();
  const canManageFees = userRole === 'owner' || userRole === 'admin';
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  // Active Tab: 'ledger' | 'transactions' | 'plans' | 'insights'
  const [activeTab, setActiveTab] = useState<'ledger' | 'transactions' | 'plans' | 'insights'>(() => {
    return (searchParams.get('tab') as any) || 'ledger';
  });

  // Ledger filters
  const [searchLedger, setSearchLedger] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<string>(() => {
    return searchParams.get('filter') === 'pending' ? 'pending_any' : 'ALL';
  });
  const [batchFilter, setBatchFilter] = useState('ALL');

  // Transaction filters
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [txnMethodFilter, setTxnMethodFilter] = useState<string>('ALL');
  const [txnStatusFilter, setTxnStatusFilter] = useState<string>('ALL');
  const [txnStartDate, setTxnStartDate] = useState<string>('');
  const [txnEndDate, setTxnEndDate] = useState<string>('');

  // Create Fee Plan Modal State
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCategory, setNewPlanCategory] = useState('Class 10 CBSE');
  const [newPlanAmount, setNewPlanAmount] = useState<number>(3000);
  const [newPlanFrequency, setNewPlanFrequency] = useState<
    'Monthly' | 'Quarterly' | 'Annual' | 'Full Course' | 'Custom'
  >('Monthly');
  const [newPlanDueDay, setNewPlanDueDay] = useState<number>(10);
  const [newPlanMaxDiscount, setNewPlanMaxDiscount] = useState<number>(20);
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [planError, setPlanError] = useState('');

  // Assign Fee Plan Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState(feePlans[0]?.id || '');
  const [assignDiscount, setAssignDiscount] = useState<number>(0);
  const [assignDiscountReason, setAssignDiscountReason] = useState('');
  const [assignCustomDueDate, setAssignCustomDueDate] = useState('2026-11-10');
  const [assignError, setAssignError] = useState('');

  // Lifetime collections across confirmed payments
  const totalLifetimeCollections = useMemo(() => {
    return payments
      .filter(p => p.status !== 'reversed')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  // Filtered Student Fee Ledger
  const filteredLedger = useMemo(() => {
    return students.filter(s => {
      const q = searchLedger.toLowerCase();
      const matchesSearch =
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (batchFilter !== 'ALL' && s.batchId !== batchFilter) return false;

      if (feeStatusFilter === 'pending_any') {
        return s.balanceFee > 0;
      } else if (feeStatusFilter !== 'ALL' && s.feeStatus !== feeStatusFilter) {
        return false;
      }

      return true;
    });
  }, [students, searchLedger, batchFilter, feeStatusFilter]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return payments.filter(txn => {
      const q = txnSearchQuery.toLowerCase();
      const matchesSearch =
        txn.studentName.toLowerCase().includes(q) ||
        txn.receiptNumber.toLowerCase().includes(q) ||
        (txn.remarks && txn.remarks.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (txnMethodFilter !== 'ALL' && txn.paymentMethod !== txnMethodFilter) {
        return false;
      }

      if (txnStatusFilter !== 'ALL' && (txn.status || 'confirmed') !== txnStatusFilter) {
        return false;
      }

      if (txnStartDate && txn.paymentDate < txnStartDate) {
        return false;
      }

      if (txnEndDate && txn.paymentDate > txnEndDate) {
        return false;
      }

      return true;
    });
  }, [payments, txnSearchQuery, txnMethodFilter, txnStatusFilter, txnStartDate, txnEndDate]);

  // Pagination for Student Fee Ledger
  const [ledgerPage, setLedgerPage] = useState(1);
  const ledgerPageSize = 15;
  const totalLedgerPages = Math.ceil(filteredLedger.length / ledgerPageSize) || 1;
  const paginatedLedger = useMemo(() => {
    const start = (ledgerPage - 1) * ledgerPageSize;
    return filteredLedger.slice(start, start + ledgerPageSize);
  }, [filteredLedger, ledgerPage]);

  // Pagination for Payment Transactions
  const [txnPage, setTxnPage] = useState(1);
  const txnPageSize = 15;
  const totalTxnPages = Math.ceil(filteredTransactions.length / txnPageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (txnPage - 1) * txnPageSize;
    return filteredTransactions.slice(start, start + txnPageSize);
  }, [filteredTransactions, txnPage]);

  const handleRecordPayment = (student?: Student) => {
    setSelectedStudentForPayment(student || null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenAssignModal = (student?: Student, plan?: FeePlan) => {
    setAssignStudentId(student ? student.id : students[0]?.id || '');
    setAssignPlanId(plan ? plan.id : feePlans[0]?.id || '');
    setAssignDiscount(0);
    setAssignDiscountReason('');
    setAssignCustomDueDate('2026-11-10');
    setAssignError('');
    setIsAssignModalOpen(true);
  };

  const handleSaveCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) {
      setPlanError('Plan name is required');
      return;
    }
    if (newPlanAmount <= 0) {
      setPlanError('Plan amount must be greater than zero');
      return;
    }

    try {
      addFeePlan({
        name: newPlanName.trim(),
        category: newPlanCategory.trim(),
        amount: Number(newPlanAmount),
        billingFrequency: newPlanFrequency,
        dueDayOfMonth: Number(newPlanDueDay) || 10,
        maxAuthorizedDiscountPercent: Number(newPlanMaxDiscount) || 0,
        description: newPlanDesc.trim() || 'Custom academic fee plan',
        dueDate: `2026-11-${String(newPlanDueDay).padStart(2, '0')}`,
      });
      setIsCreatePlanModalOpen(false);
      setNewPlanName('');
      setNewPlanDesc('');
      setPlanError('');
    } catch (err: any) {
      setPlanError(err.message || 'Failed to create fee plan');
    }
  };

  const handleSaveAssignPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStudentId) {
      setAssignError('Please select a student');
      return;
    }
    if (!assignPlanId) {
      setAssignError('Please select a fee plan');
      return;
    }

    const selectedPlan = feePlans.find(p => p.id === assignPlanId);
    if (selectedPlan && assignDiscount > 0) {
      const maxAllowed = (selectedPlan.amount * (selectedPlan.maxAuthorizedDiscountPercent || 100)) / 100;
      if (assignDiscount > maxAllowed) {
        setAssignError(
          `Discount of ₹${assignDiscount} exceeds maximum authorized concession of ${selectedPlan.maxAuthorizedDiscountPercent}% (₹${maxAllowed}) for this plan.`
        );
        return;
      }
      if (!assignDiscountReason.trim()) {
        setAssignError('An authorized reason is required when granting fee concessions/scholarships.');
        return;
      }
    }

    try {
      assignFeePlan({
        studentId: assignStudentId,
        planId: assignPlanId,
        discountAmount: Number(assignDiscount) || 0,
        discountReason: assignDiscountReason.trim(),
        customDueDate: assignCustomDueDate,
      });
      setIsAssignModalOpen(false);
      setAssignError('');
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign fee plan');
    }
  };

  const selectedPlanForAssign = feePlans.find(p => p.id === assignPlanId);
  const netInvoicedPreview = Math.max(
    0,
    (selectedPlanForAssign?.amount || 0) - (Number(assignDiscount) || 0)
  );

  return (
    <div className="fees-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Fee Management & Ledgers</h1>
          <p>
            Track student fee receivables, partial instalments, authorized discounts, and print official fee vouchers
          </p>
        </div>

        <div className="page-actions-group">
          <div style={{ display: 'flex', gap: '8px' }}>
            {canManageFees && (
              <>
                <Button
                  variant="outline"
                  icon={<Layers size={15} />}
                  onClick={() => setIsCreatePlanModalOpen(true)}
                >
                  Create Fee Plan
                </Button>
                <Button
                  variant="secondary"
                  icon={<Percent size={15} />}
                  onClick={() => handleOpenAssignModal()}
                >
                  Assign Plan / Concession
                </Button>
              </>
            )}

            <Button
              variant="primary"
              icon={<IndianRupee size={16} />}
              onClick={() => handleRecordPayment()}
            >
              Record Manual Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Top High-Level Financial Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Card>
          <CardBody style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>
              Total Contracted Invoiced
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--color-text-main)',
                fontFamily: 'var(--font-family-mono)',
                margin: '4px 0',
              }}
            >
              ₹{students.reduce((sum, s) => sum + s.totalFeeInvoiced, 0).toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Contracted value for {students.length} students
            </span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11.5px', color: '#047857', display: 'block', fontWeight: 600 }}>
              Collected This Month (Nov 2026)
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#047857',
                fontFamily: 'var(--font-family-mono)',
                margin: '4px 0',
              }}
            >
              ₹{dashboardStats.collectedThisMonth.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              UPI (70%) and Cash counter (30%)
            </span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11.5px', color: '#2563eb', display: 'block', fontWeight: 600 }}>
              Lifetime Collections Logged
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#2563eb',
                fontFamily: 'var(--font-family-mono)',
                margin: '4px 0',
              }}
            >
              ₹{totalLifetimeCollections.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Across {payments.filter(p => p.status !== 'reversed').length} confirmed receipts
            </span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11.5px', color: '#b91c1c', display: 'block', fontWeight: 600 }}>
              Outstanding Balance Dues
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#b91c1c',
                fontFamily: 'var(--font-family-mono)',
                margin: '4px 0',
              }}
            >
              ₹{dashboardStats.pendingFees.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Across 20 partial & overdue accounts
            </span>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div className="tab-list">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          Student Fee Ledger ({students.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Payment Transactions ({payments.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          Institute Fee Plans ({feePlans.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          Financial Insights & Dues Watchlist
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Student Fee Ledger                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div>
          {/* Filter Bar */}
          <Card style={{ marginBottom: '16px' }}>
            <CardBody style={{ padding: '14px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                    placeholder="Search by student name, ID..."
                    value={searchLedger}
                    onChange={e => {
                      setSearchLedger(e.target.value);
                      setLedgerPage(1);
                    }}
                  />
                </div>

                <select
                  className="form-select"
                  value={batchFilter}
                  onChange={e => {
                    setBatchFilter(e.target.value);
                    setLedgerPage(1);
                  }}
                >
                  <option value="ALL">All Batches</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  value={feeStatusFilter}
                  onChange={e => {
                    setFeeStatusFilter(e.target.value);
                    setLedgerPage(1);
                  }}
                >
                  <option value="ALL">All Accounts</option>
                  <option value="pending_any">Any Pending Dues (Partial & Overdue)</option>
                  <option value="paid">Fully Paid</option>
                  <option value="partial">Partial Dues</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Ledger Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Batch / Plan</th>
                  <th style={{ textAlign: 'right' }}>Total Invoiced</th>
                  <th style={{ textAlign: 'right' }}>Total Paid</th>
                  <th style={{ textAlign: 'right' }}>Remaining Balance</th>
                  <th>Fee Status</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLedger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty-state">
                      No student accounts matched your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLedger.map(student => (
                  <tr key={student.id}>
                    <td>
                      <strong
                        style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        {student.fullName}
                      </strong>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {student.studentId} &bull; {student.phone}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 500 }}>
                        {student.batchName.split('-')[0].trim()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {student.feePlanName || 'Standard Tuition'}
                        {student.discountAmount ? ` (Concession: ₹${student.discountAmount})` : ''}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)' }}>
                      ₹{student.totalFeeInvoiced.toLocaleString('en-IN')}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-family-mono)',
                        fontWeight: 600,
                        color: '#047857',
                      }}
                    >
                      ₹{student.totalFeePaid.toLocaleString('en-IN')}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-family-mono)',
                        fontWeight: 700,
                        color: student.balanceFee > 0 ? '#b91c1c' : '#047857',
                      }}
                    >
                      ₹{student.balanceFee.toLocaleString('en-IN')}
                    </td>

                    <td>
                      <FeeStatusBadge status={student.feeStatus} />
                    </td>

                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {student.feeDueDate || '10th of Month'}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <Button
                          variant={student.balanceFee > 0 ? 'primary' : 'secondary'}
                          size="sm"
                          icon={<IndianRupee size={13} />}
                          onClick={() => handleRecordPayment(student)}
                        >
                          {student.balanceFee > 0 ? 'Collect' : 'Add'}
                        </Button>

                        {canManageFees && (
                          <Button
                            variant="outline"
                            size="sm"
                            title="Assign custom fee plan or concession"
                            onClick={() => handleOpenAssignModal(student)}
                          >
                            Plan
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>

            {/* Ledger Pagination Bar */}
            {totalLedgerPages > 1 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>
                  Showing {(ledgerPage - 1) * ledgerPageSize + 1} to{' '}
                  {Math.min(ledgerPage * ledgerPageSize, filteredLedger.length)} of {filteredLedger.length} entries
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ledgerPage === 1}
                    onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      fontWeight: 600,
                    }}
                  >
                    Page {ledgerPage} of {totalLedgerPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ledgerPage === totalLedgerPages}
                    onClick={() => setLedgerPage(p => Math.min(totalLedgerPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Payment Transactions                                              */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div>
          {/* Multi-Criteria Transaction Filters */}
          <Card style={{ marginBottom: '16px' }}>
            <CardBody style={{ padding: '14px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '32px', fontSize: '12px' }}
                    placeholder="Search receipt # or student..."
                    value={txnSearchQuery}
                    onChange={e => {
                      setTxnSearchQuery(e.target.value);
                      setTxnPage(1);
                    }}
                  />
                </div>

                <div>
                  <select
                    className="form-select"
                    style={{ fontSize: '12px' }}
                    value={txnMethodFilter}
                    onChange={e => {
                      setTxnMethodFilter(e.target.value);
                      setTxnPage(1);
                    }}
                  >
                    <option value="ALL">All Payment Modes</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <select
                    className="form-select"
                    style={{ fontSize: '12px' }}
                    value={txnStatusFilter}
                    onChange={e => {
                      setTxnStatusFilter(e.target.value);
                      setTxnPage(1);
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="confirmed">Confirmed Only</option>
                    <option value="reversed">Reversed Only</option>
                  </select>
                </div>

                <div>
                  <input
                    type="date"
                    className="form-input"
                    style={{ fontSize: '12px' }}
                    value={txnStartDate}
                    onChange={e => {
                      setTxnStartDate(e.target.value);
                      setTxnPage(1);
                    }}
                    title="Filter by start date"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    className="form-input"
                    style={{ fontSize: '12px' }}
                    value={txnEndDate}
                    onChange={e => {
                      setTxnEndDate(e.target.value);
                      setTxnPage(1);
                    }}
                    title="Filter by end date"
                  />
                </div>

                {(txnSearchQuery || txnMethodFilter !== 'ALL' || txnStatusFilter !== 'ALL' || txnStartDate || txnEndDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTxnSearchQuery('');
                      setTxnMethodFilter('ALL');
                      setTxnStatusFilter('ALL');
                      setTxnStartDate('');
                      setTxnEndDate('');
                      setTxnPage(1);
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Payment Date</th>
                  <th>Student Name</th>
                  <th>Batch</th>
                  <th>Payment Mode</th>
                  <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  <th style={{ textAlign: 'right' }}>Remaining Balance</th>
                  <th>Status</th>
                  <th>Collector</th>
                  <th style={{ textAlign: 'center' }}>Receipt & Audit</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-empty-state">
                      No transactions match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map(txn => {
                    const isReversed = txn.status === 'reversed';

                    return (
                      <tr
                        key={txn.id}
                        style={{
                          backgroundColor: isReversed ? 'rgba(254, 242, 242, 0.45)' : 'transparent',
                        }}
                      >
                        <td style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
                          {txn.receiptNumber}
                        </td>
                        <td>{txn.paymentDate}</td>
                        <td>
                          <strong style={{ textDecoration: isReversed ? 'line-through' : 'none' }}>
                            {txn.studentName}
                          </strong>
                        </td>
                        <td style={{ fontSize: '12px' }}>{txn.batchName.split('-')[0].trim()}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                            }}
                          >
                            {txn.paymentMethod}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontFamily: 'var(--font-family-mono)',
                            fontWeight: 700,
                            color: isReversed ? '#94a3b8' : '#047857',
                            fontSize: '14px',
                            textDecoration: isReversed ? 'line-through' : 'none',
                          }}
                        >
                          ₹{txn.amount.toLocaleString('en-IN')}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontFamily: 'var(--font-family-mono)',
                            color: txn.balanceRemaining > 0 ? '#b91c1c' : '#64748b',
                          }}
                        >
                          ₹{txn.balanceRemaining.toLocaleString('en-IN')}
                        </td>
                        <td>
                          {isReversed ? (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                              }}
                              title={`Reversal reason: ${txn.reversalReason || 'N/A'}`}
                            >
                              REVERSED
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#dcfce7',
                                color: '#15803d',
                              }}
                            >
                              CONFIRMED
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px' }}>{txn.collectedBy}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Eye size={13} />}
                              onClick={() => setPreviewReceipt(txn)}
                            >
                              Receipt
                            </Button>
                            {!isReversed && canManageFees && (
                              <button
                                type="button"
                                className="btn btn-danger-outline btn-sm"
                                style={{ fontSize: '11px', padding: '3px 7px' }}
                                title="Reverse confirmed payment (auditable)"
                                onClick={() => {
                                  const reason = window.prompt(
                                    `Enter auditable reason for reversing payment of ₹${txn.amount} for ${txn.studentName}:`,
                                    'Customer requested correction / Cheque returned'
                                  );
                                  if (reason && reason.trim()) {
                                    reversePayment(txn.id, reason.trim());
                                  }
                                }}
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Transactions Pagination Bar */}
            {totalTxnPages > 1 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>
                  Showing {(txnPage - 1) * txnPageSize + 1} to{' '}
                  {Math.min(txnPage * txnPageSize, filteredTransactions.length)} of {filteredTransactions.length} entries
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txnPage === 1}
                    onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      fontWeight: 600,
                    }}
                  >
                    Page {txnPage} of {totalTxnPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txnPage === totalTxnPages}
                    onClick={() => setTxnPage(p => Math.min(totalTxnPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Fee Plans                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {feePlans.map(plan => (
              <Card key={plan.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={plan.name}
                  subtitle={plan.category}
                  action={
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Due {plan.dueDayOfMonth || 10}th
                    </span>
                  }
                />
                <CardBody style={{ flex: 1 }}>
                  <div style={{ marginBottom: '14px' }}>
                    <span
                      style={{
                        fontSize: '26px',
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        fontFamily: 'var(--font-family-mono)',
                      }}
                    >
                      ₹{plan.amount.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                      / {plan.billingFrequency}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {plan.description}
                  </p>

                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--color-border)',
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      Max Discount: <strong>{plan.maxAuthorizedDiscountPercent || 20}%</strong>
                    </span>
                    {canManageFees && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssignModal(undefined, plan)}
                      >
                        Assign Plan
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: Financial Insights & Dues Watchlist                                */}
      {/* ========================================================================= */}
      {activeTab === 'insights' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.8fr',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            {/* Mode Distribution Card */}
            <Card>
              <CardHeader title="Collection by Payment Channel" />
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['UPI', 'Cash', 'Bank Transfer', 'Cheque'].map(mode => {
                    const totalForMode = payments
                      .filter(p => p.status !== 'reversed' && p.paymentMethod === mode)
                      .reduce((sum, p) => sum + p.amount, 0);
                    const percent =
                      totalLifetimeCollections > 0
                        ? Math.round((totalForMode / totalLifetimeCollections) * 100)
                        : 0;

                    return (
                      <div key={mode}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                          <span><strong>{mode}</strong></span>
                          <span>₹{totalForMode.toLocaleString('en-IN')} ({percent}%)</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percent}%`, backgroundColor: mode === 'UPI' ? '#2563eb' : mode === 'Cash' ? '#10b981' : '#8b5cf6' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* Batch Revenue & Receivables */}
            <Card>
              <CardHeader title="Batch Collections & Receivables" />
              <CardBody>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Batch</th>
                        <th style={{ textAlign: 'right' }}>Invoiced</th>
                        <th style={{ textAlign: 'right' }}>Collected</th>
                        <th style={{ textAlign: 'right' }}>Outstanding</th>
                        <th style={{ textAlign: 'right' }}>Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map(batch => {
                        const bStudents = students.filter(s => s.batchId === batch.id);
                        const invoiced = bStudents.reduce((sum, s) => sum + s.totalFeeInvoiced, 0);
                        const collected = bStudents.reduce((sum, s) => sum + s.totalFeePaid, 0);
                        const pending = bStudents.reduce((sum, s) => sum + s.balanceFee, 0);
                        const eff = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;

                        return (
                          <tr key={batch.id}>
                            <td>
                              <strong>{batch.name.split('-')[0].trim()}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{bStudents.length} Students</div>
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)' }}>₹{invoiced.toLocaleString('en-IN')}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: '#047857' }}>₹{collected.toLocaleString('en-IN')}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: pending > 0 ? '#b91c1c' : '#64748b' }}>₹{pending.toLocaleString('en-IN')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{eff}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Create New Fee Plan                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreatePlanModalOpen}
        onClose={() => setIsCreatePlanModalOpen(false)}
        title="Create New Institute Fee Plan"
        size="large"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsCreatePlanModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCreatePlan}>
              Save & Register Plan
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCreatePlan}>
          {planError && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {planError}
            </div>
          )}

          <div className="form-grid-2">
            <Input
              label="Plan Name"
              required
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              placeholder="e.g. Class 11th - NEET Super 30 Package"
            />
            <Input
              label="Category / Stream"
              value={newPlanCategory}
              onChange={e => setNewPlanCategory(e.target.value)}
              placeholder="e.g. Medical Entrance / Foundation"
            />
          </div>

          <div className="form-grid-3">
            <Input
              type="number"
              label="Base Fee Amount (₹)"
              required
              value={newPlanAmount}
              onChange={e => setNewPlanAmount(Number(e.target.value))}
            />
            <Select
              label="Billing Frequency"
              options={[
                { value: 'Monthly', label: 'Monthly' },
                { value: 'Quarterly', label: 'Quarterly' },
                { value: 'Annual', label: 'Annual' },
                { value: 'Full Course', label: 'Full Course (One-Time)' },
                { value: 'Custom', label: 'Custom Instalment' },
              ]}
              value={newPlanFrequency}
              onChange={e => setNewPlanFrequency(e.target.value as any)}
            />
            <Input
              type="number"
              label="Monthly Due Day (1-31)"
              value={newPlanDueDay}
              onChange={e => setNewPlanDueDay(Number(e.target.value))}
            />
          </div>

          <div className="form-grid-2">
            <Input
              type="number"
              label="Max Authorized Concession (%)"
              value={newPlanMaxDiscount}
              onChange={e => setNewPlanMaxDiscount(Number(e.target.value))}
              helperText="Maximum scholarship allowed without owner override"
            />
            <Input
              label="Description / Curriculum Deliverables"
              value={newPlanDesc}
              onChange={e => setNewPlanDesc(e.target.value)}
              placeholder="e.g. Comprehensive syllabus coverage, test series & study modules"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: Assign Fee Plan to Student                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Fee Plan & Authorize Concession"
        size="large"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAssignPlan}>
              Apply Plan to Student
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveAssignPlan}>
          {assignError && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {assignError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label required">Select Student</label>
            <select
              className="form-select"
              value={assignStudentId}
              onChange={e => setAssignStudentId(e.target.value)}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId}) &bull; Current Due: ₹{s.balanceFee.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">Select Fee Plan</label>
              <select
                className="form-select"
                value={assignPlanId}
                onChange={e => setAssignPlanId(e.target.value)}
              >
                {feePlans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.amount.toLocaleString('en-IN')} ({p.billingFrequency})
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="date"
              label="Payment Due Date"
              value={assignCustomDueDate}
              onChange={e => setAssignCustomDueDate(e.target.value)}
            />
          </div>

          <div className="form-grid-2" style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            <Input
              type="number"
              label="Authorized Concession / Scholarship (₹)"
              value={assignDiscount}
              onChange={e => setAssignDiscount(Number(e.target.value))}
              helperText={`Plan Base: ₹${selectedPlanForAssign?.amount.toLocaleString('en-IN') || 0} | Max: ${selectedPlanForAssign?.maxAuthorizedDiscountPercent || 20}%`}
            />
            <Input
              label="Concession Justification (Audit Log)"
              value={assignDiscountReason}
              onChange={e => setAssignDiscountReason(e.target.value)}
              placeholder="e.g. Merit Scholarship (Rank 1 in entrance test)"
            />
          </div>

          {/* Net Invoiced Amount Preview Card */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#1e40af', display: 'block', fontWeight: 600 }}>
                NET CONTRACTED INVOICE PREVIEW
              </span>
              <span style={{ fontSize: '12px', color: '#475569' }}>
                Base ₹{selectedPlanForAssign?.amount.toLocaleString('en-IN')} minus ₹{assignDiscount.toLocaleString('en-IN')} Concession
              </span>
            </div>
            <strong style={{ fontSize: '20px', color: '#1e40af', fontFamily: 'var(--font-family-mono)' }}>
              ₹{netInvoicedPreview.toLocaleString('en-IN')}
            </strong>
          </div>
        </form>
      </Modal>
    </div>
  );
};
