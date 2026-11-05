import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  GraduationCap,
  CalendarCheck,
  Search,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FeeStatusBadge, Badge } from '../components/common/Badge';

export const Reports: React.FC = () => {
  const { students, batches, payments, attendance, todayDate, instituteConfig } = useApp();
  const { currentUser } = useAuth();
  const currentInstId = currentUser?.instituteId || 'INST-MTH-01';

  // 1. Tenant-scoped datasets
  const instStudents = useMemo(() => {
    return students.filter(s => s.instituteId === currentInstId || s.institute_id === currentInstId);
  }, [students, currentInstId]);

  const instBatches = useMemo(() => {
    return batches.filter(b => b.instituteId === currentInstId || b.institute_id === currentInstId);
  }, [batches, currentInstId]);

  const instPayments = useMemo(() => {
    return payments.filter(p => p.instituteId === currentInstId || p.institute_id === currentInstId);
  }, [payments, currentInstId]);

  const instAttendance = useMemo(() => {
    return attendance.filter(a => a.instituteId === currentInstId || a.institute_id === currentInstId);
  }, [attendance, currentInstId]);

  // Report Type: 'students' | 'attendance' | 'collections' | 'pending' | 'batches'
  const [reportType, setReportType] = useState<'students' | 'attendance' | 'collections' | 'pending' | 'batches'>('students');

  // Filters
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('ALL');

  // Quick Date Presets
  const handleDatePreset = (preset: 'today' | 'week' | 'month' | 'last_month' | 'all') => {
    if (preset === 'today') {
      setStartDate(todayDate);
      setEndDate(todayDate);
    } else if (preset === 'week') {
      setStartDate('2026-10-28');
      setEndDate(todayDate);
    } else if (preset === 'month') {
      setStartDate('2026-11-01');
      setEndDate('2026-11-30');
    } else if (preset === 'last_month') {
      setStartDate('2026-10-01');
      setEndDate('2026-10-31');
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    setSelectedBatchId('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPaymentModeFilter('ALL');
  };

  // ==========================================
  // 1. STUDENT REPORT DATA
  // ==========================================
  const filteredStudentsReport = useMemo(() => {
    return instStudents.filter(s => {
      if (selectedBatchId !== 'ALL' && s.batchId !== selectedBatchId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.fullName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.guardianName.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (startDate && s.admissionDate < startDate) return false;
      if (endDate && s.admissionDate > endDate) return false;
      return true;
    });
  }, [instStudents, selectedBatchId, searchQuery, startDate, endDate]);

  // ==========================================
  // 2. ATTENDANCE REPORT DATA
  // ==========================================
  const filteredAttendanceReport = useMemo(() => {
    return instAttendance.filter(a => {
      if (selectedBatchId !== 'ALL' && a.batchId !== selectedBatchId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          a.studentName.toLowerCase().includes(q) ||
          a.studentId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });
  }, [instAttendance, selectedBatchId, searchQuery, startDate, endDate]);

  // ==========================================
  // 3. FEE COLLECTION REPORT DATA
  // ==========================================
  const filteredCollectionsReport = useMemo(() => {
    return instPayments.filter(p => {
      if (selectedBatchId !== 'ALL' && p.batchId !== selectedBatchId) return false;
      if (paymentModeFilter !== 'ALL' && p.paymentMethod !== paymentModeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.studentName.toLowerCase().includes(q) ||
          p.receiptNumber.toLowerCase().includes(q) ||
          p.collectedBy.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (startDate && p.paymentDate < startDate) return false;
      if (endDate && p.paymentDate > endDate) return false;
      return true;
    });
  }, [instPayments, selectedBatchId, paymentModeFilter, searchQuery, startDate, endDate]);

  // ==========================================
  // 4. PENDING FEE REPORT DATA
  // ==========================================
  const filteredPendingReport = useMemo(() => {
    return instStudents
      .filter(s => s.balanceFee > 0)
      .filter(s => {
        if (selectedBatchId !== 'ALL' && s.batchId !== selectedBatchId) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            s.fullName.toLowerCase().includes(q) ||
            s.studentId.toLowerCase().includes(q) ||
            s.phone.includes(q) ||
            s.guardianPhone.includes(q);
          if (!matches) return false;
        }
        if (startDate && s.feeDueDate && s.feeDueDate < startDate) return false;
        if (endDate && s.feeDueDate && s.feeDueDate > endDate) return false;
        return true;
      })
      .sort((a, b) => b.balanceFee - a.balanceFee);
  }, [instStudents, selectedBatchId, searchQuery, startDate, endDate]);

  // ==========================================
  // 5. BATCH REPORT DATA
  // ==========================================
  const batchReportData = useMemo(() => {
    return instBatches.map(batch => {
      const bStudents = instStudents.filter(s => s.batchId === batch.id && s.status === 'active');
      const totalInvoiced = bStudents.reduce((sum, s) => sum + s.totalFeeInvoiced, 0);
      const totalCollected = bStudents.reduce((sum, s) => sum + s.totalFeePaid, 0);
      const totalPending = bStudents.reduce((sum, s) => sum + s.balanceFee, 0);
      const seatFillRate = batch.capacity > 0 ? Math.round((bStudents.length / batch.capacity) * 100) : 0;
      const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

      return {
        batch,
        studentCount: bStudents.length,
        capacity: batch.capacity,
        seatFillRate,
        totalInvoiced,
        totalCollected,
        totalPending,
        collectionRate,
      };
    }).filter(item => {
      if (selectedBatchId !== 'ALL' && item.batch.id !== selectedBatchId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.batch.name.toLowerCase().includes(q) ||
          item.batch.course.toLowerCase().includes(q) ||
          item.batch.instructor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [instBatches, instStudents, selectedBatchId, searchQuery]);

  // ==========================================
  // UNIVERSAL CSV EXPORT GENERATOR
  // ==========================================
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'students') {
      csvContent += 'Student Code,Full Name,Phone,Email,Guardian Name,Guardian Phone,Relation,Batch,Course,Admission Date,Invoiced Fee,Paid Fee,Balance Due,Fee Status,Enrollment Status\n';
      filteredStudentsReport.forEach(s => {
        csvContent += `"${s.studentId}","${s.fullName}","${s.phone}","${s.email || ''}","${s.guardianName}","${s.guardianPhone}","${s.guardianRelation}","${s.batchName}","${s.course}","${s.admissionDate}",${s.totalFeeInvoiced},${s.totalFeePaid},${s.balanceFee},"${s.feeStatus}","${s.status}"\n`;
      });
    } else if (reportType === 'attendance') {
      csvContent += 'Date,Batch ID,Batch Name,Student ID,Student Name,Attendance Status,Remarks,Marked By,Session ID\n';
      filteredAttendanceReport.forEach(a => {
        const batch = instBatches.find(b => b.id === a.batchId);
        csvContent += `"${a.date}","${a.batchId}","${batch?.name || ''}","${a.studentId}","${a.studentName}","${a.status}","${a.remarks || ''}","${a.markedBy || ''}","${a.sessionId || ''}"\n`;
      });
    } else if (reportType === 'collections') {
      csvContent += 'Receipt Number,Payment Date,Student Name,Batch Name,Payment Method,Amount Paid,Invoiced Amount,Prior Paid,Balance Remaining,Collected By,Status,Remarks\n';
      filteredCollectionsReport.forEach(p => {
        csvContent += `"${p.receiptNumber}","${p.paymentDate}","${p.studentName}","${p.batchName}","${p.paymentMethod}",${p.amount},${p.invoicedAmount},${p.paidAmountPrior},${p.balanceRemaining},"${p.collectedBy}","${p.status || 'confirmed'}","${p.remarks || ''}"\n`;
      });
    } else if (reportType === 'pending') {
      csvContent += 'Student ID,Full Name,Phone,Guardian Name,Guardian Contact,Batch Name,Course,Fee Plan,Due Date,Total Invoiced,Paid So Far,Outstanding Balance,Fee Standing\n';
      filteredPendingReport.forEach(s => {
        csvContent += `"${s.studentId}","${s.fullName}","${s.phone}","${s.guardianName}","${s.guardianPhone}","${s.batchName}","${s.course}","${s.feePlanName || 'Standard'}","${s.feeDueDate || '10 Nov 2026'}",${s.totalFeeInvoiced},${s.totalFeePaid},${s.balanceFee},"${s.feeStatus}"\n`;
      });
    } else {
      csvContent += 'Batch Code,Batch Name,Course,Primary Instructor,Schedule,Timing,Room,Enrolled Students,Capacity,Seat Fill Rate,Monthly Fee,Total Invoiced,Total Collected,Total Pending,Collection Efficiency\n';
      batchReportData.forEach(item => {
        csvContent += `"${item.batch.code}","${item.batch.name}","${item.batch.course}","${item.batch.instructor}","${item.batch.scheduleDays}","${item.batch.timing}","${item.batch.room || ''}",${item.studentCount},${item.capacity},${item.seatFillRate}%,${item.batch.monthlyFee || 0},${item.totalInvoiced},${item.totalCollected},${item.totalPending},${item.collectionRate}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FIXIA_${reportType}_report_${todayDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Institute Intelligence & Reports</h1>
          <p>
            Audit student admissions, attendance registers, fee reconciliations, and batch capacities
          </p>
        </div>

        <div className="page-actions-group">
          <Button
            variant="primary"
            icon={<Download size={16} />}
            onClick={handleExportCSV}
          >
            Export Active Report (CSV)
          </Button>
        </div>
      </div>

      {/* Report Category Switcher Tabs */}
      <Card style={{ marginBottom: '16px' }}>
        <CardBody style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${reportType === 'students' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType('students')}
            >
              <Users size={14} style={{ marginRight: '6px' }} />
              Student Report ({instStudents.length})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${reportType === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType('attendance')}
            >
              <CalendarCheck size={14} style={{ marginRight: '6px' }} />
              Attendance Report ({filteredAttendanceReport.length})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${reportType === 'collections' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType('collections')}
            >
              <IndianRupee size={14} style={{ marginRight: '6px' }} />
              Fee Collection Report ({instPayments.length})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${reportType === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType('pending')}
            >
              <AlertCircle size={14} style={{ marginRight: '6px' }} />
              Pending Fee Report ({filteredPendingReport.length})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${reportType === 'batches' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType('batches')}
            >
              <GraduationCap size={14} style={{ marginRight: '6px' }} />
              Batch Report ({instBatches.length})
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Universal Filter Strip: Batch, Search, Date Range, Presets */}
      <Card style={{ marginBottom: '20px' }}>
        <CardBody style={{ padding: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
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
                  style={{ paddingLeft: '32px' }}
                  placeholder="Search by name, ID, or receipt..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Batch Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Batch:</span>
                <select
                  className="form-select"
                  style={{ width: '220px', padding: '6px 10px' }}
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                >
                  <option value="ALL">All Batches</option>
                  {instBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Mode Filter (when on collection report) */}
              {reportType === 'collections' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Payment Mode:</span>
                  <select
                    className="form-select"
                    style={{ width: '150px', padding: '6px 10px' }}
                    value={paymentModeFilter}
                    onChange={e => setPaymentModeFilter(e.target.value)}
                  >
                    <option value="ALL">All Modes</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              )}
            </div>

            {/* Date Filters Bar & Presets */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  Date Range:
                </span>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '135px', padding: '4px 8px', fontSize: '12px' }}
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  title="Start Date"
                />
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>to</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '135px', padding: '4px 8px', fontSize: '12px' }}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  title="End Date"
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => handleDatePreset('today')}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => handleDatePreset('week')}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => handleDatePreset('month')}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => handleDatePreset('last_month')}
                  >
                    Last Month
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => handleDatePreset('all')}
                  >
                    All Time
                  </button>
                </div>
              </div>

              {(startDate || endDate || selectedBatchId !== 'ALL' || searchQuery || paymentModeFilter !== 'ALL') && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw size={12} />}
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ==========================================
          REPORT 1: STUDENT REPORT
      ========================================== */}
      {reportType === 'students' && (
        <Card>
          <CardHeader
            title="Student Enrollment & Demographic Report"
            subtitle={`Showing ${filteredStudentsReport.length} of ${instStudents.length} students`}
          />
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll / Code</th>
                  <th>Student Name</th>
                  <th>Phone</th>
                  <th>Guardian</th>
                  <th>Batch Name</th>
                  <th>Course</th>
                  <th>Admission Date</th>
                  <th style={{ textAlign: 'right' }}>Invoiced</th>
                  <th style={{ textAlign: 'right' }}>Paid</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudentsReport.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="table-empty-state">
                      No students match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudentsReport.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', fontWeight: 600 }}>
                        {s.studentId}
                      </td>
                      <td>
                        <strong>{s.fullName}</strong>
                        {s.email && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{s.email}</div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px' }}>{s.phone}</td>
                      <td>
                        <div style={{ fontSize: '12.5px' }}>{s.guardianName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {s.guardianPhone} ({s.guardianRelation})
                        </div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{s.batchName.split('-')[0].trim()}</td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s.course}</td>
                      <td style={{ fontSize: '12px' }}>{s.admissionDate}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)' }}>
                        ₹{s.totalFeeInvoiced.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: '#047857' }}>
                        ₹{s.totalFeePaid.toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-family-mono)',
                          fontWeight: 700,
                          color: s.balanceFee > 0 ? '#b91c1c' : '#047857',
                        }}
                      >
                        ₹{s.balanceFee.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <FeeStatusBadge status={s.feeStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==========================================
          REPORT 2: ATTENDANCE REPORT
      ========================================== */}
      {reportType === 'attendance' && (
        <Card>
          <CardHeader
            title="Attendance Records & Punctuality Audit"
            subtitle={`Showing ${filteredAttendanceReport.length} daily roll marks`}
          />
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Batch</th>
                  <th>Student Code</th>
                  <th>Student Name</th>
                  <th style={{ textAlign: 'center' }}>Attendance Status</th>
                  <th>Remarks / Notes</th>
                  <th>Marked By</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendanceReport.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty-state">
                      No attendance marks recorded for the selected date range.
                    </td>
                  </tr>
                ) : (
                  filteredAttendanceReport.map(a => {
                    const batch = instBatches.find(b => b.id === a.batchId);
                    return (
                      <tr key={a.id}>
                        <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
                          {a.date}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          <strong>{batch?.name.split('-')[0].trim() || a.batchId}</strong>
                        </td>
                        <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
                          {a.studentId}
                        </td>
                        <td>
                          <strong>{a.studentName}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor:
                                a.status === 'present' ? '#ecfdf5' : a.status === 'late' ? '#fffbeb' : '#fef2f2',
                              color:
                                a.status === 'present' ? '#047857' : a.status === 'late' ? '#b45309' : '#b91c1c',
                              border: `1px solid ${
                                a.status === 'present' ? '#a7f3d0' : a.status === 'late' ? '#fde68a' : '#fecaca'
                              }`,
                            }}
                          >
                            {a.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {a.remarks || '—'}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {a.markedBy || 'Er. Rakesh Sharma'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==========================================
          REPORT 3: FEE COLLECTION REPORT
      ========================================== */}
      {reportType === 'collections' && (
        <Card>
          <CardHeader
            title="Fee Collections & Receipts Register"
            subtitle={`Total Collected in Period: ₹${filteredCollectionsReport
              .filter(p => p.status !== 'reversed')
              .reduce((s, p) => s + p.amount, 0)
              .toLocaleString('en-IN')} across ${filteredCollectionsReport.length} transactions`}
          />
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Batch</th>
                  <th>Mode</th>
                  <th>Collected By</th>
                  <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  <th style={{ textAlign: 'right' }}>Balance Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollectionsReport.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-empty-state">
                      No fee payments recorded in this period.
                    </td>
                  </tr>
                ) : (
                  filteredCollectionsReport.map(txn => {
                    const isReversed = txn.status === 'reversed';
                    return (
                      <tr key={txn.id} style={{ opacity: isReversed ? 0.6 : 1 }}>
                        <td style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 600, fontSize: '12px' }}>
                          {txn.receiptNumber}
                        </td>
                        <td style={{ fontSize: '12px' }}>{txn.paymentDate}</td>
                        <td>
                          <strong>{txn.studentName}</strong>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {txn.batchName.split('-')[0].trim()}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: txn.paymentMethod === 'UPI' ? '#eff6ff' : '#f8fafc',
                              color: txn.paymentMethod === 'UPI' ? '#1d4ed8' : '#334155',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {txn.paymentMethod}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {txn.collectedBy}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontFamily: 'var(--font-family-mono)',
                            fontWeight: 700,
                            color: isReversed ? '#94a3b8' : '#047857',
                            textDecoration: isReversed ? 'line-through' : 'none',
                          }}
                        >
                          ₹{txn.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: '#b91c1c' }}>
                          ₹{txn.balanceRemaining.toLocaleString('en-IN')}
                        </td>
                        <td>
                          {isReversed ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                              }}
                            >
                              REVERSED
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              CONFIRMED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==========================================
          REPORT 4: PENDING FEE REPORT
      ========================================== */}
      {reportType === 'pending' && (
        <Card>
          <CardHeader
            title="Outstanding Fee Defaulters & Dues"
            subtitle={`Total Outstanding: ₹${filteredPendingReport.reduce((s, a) => s + a.balanceFee, 0).toLocaleString('en-IN')} across ${filteredPendingReport.length} students`}
          />
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll / ID</th>
                  <th>Student Name</th>
                  <th>Batch</th>
                  <th>Guardian Contact</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Total Invoiced</th>
                  <th style={{ textAlign: 'right' }}>Total Paid</th>
                  <th style={{ textAlign: 'right' }}>Pending Dues</th>
                  <th>Standing</th>
                </tr>
              </thead>
              <tbody>
                {filteredPendingReport.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-empty-state">
                      No pending fee defaulters in this batch.
                    </td>
                  </tr>
                ) : (
                  filteredPendingReport.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', fontWeight: 600 }}>
                        {s.studentId}
                      </td>
                      <td>
                        <strong>{s.fullName}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {s.phone}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{s.batchName.split('-')[0].trim()}</td>
                      <td>
                        <div style={{ fontSize: '12.5px' }}>{s.guardianName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {s.guardianPhone}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {s.feeDueDate || '10 Nov 2026'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)' }}>
                        ₹{s.totalFeeInvoiced.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: '#047857' }}>
                        ₹{s.totalFeePaid.toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-family-mono)',
                          fontWeight: 700,
                          color: '#b91c1c',
                          fontSize: '14px',
                        }}
                      >
                        ₹{s.balanceFee.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <FeeStatusBadge status={s.feeStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==========================================
          REPORT 5: BATCH CAPACITY & PERFORMANCE
      ========================================== */}
      {reportType === 'batches' && (
        <Card>
          <CardHeader
            title="Batch Capacity, Enrollment & Performance Summary"
            subtitle="Operational overview across all cohorts"
          />
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Batch Code</th>
                  <th>Batch Name</th>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th style={{ textAlign: 'center' }}>Enrolled / Capacity</th>
                  <th style={{ textAlign: 'center' }}>Seat Fill Rate</th>
                  <th style={{ textAlign: 'right' }}>Invoiced</th>
                  <th style={{ textAlign: 'right' }}>Collected</th>
                  <th style={{ textAlign: 'right' }}>Pending</th>
                  <th style={{ textAlign: 'center' }}>Collection Rate</th>
                </tr>
              </thead>
              <tbody>
                {batchReportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-empty-state">
                      No cohorts match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  batchReportData.map(item => (
                    <tr key={item.batch.id}>
                      <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', fontWeight: 600 }}>
                        {item.batch.code}
                      </td>
                      <td>
                        <strong>{item.batch.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {item.batch.timing} &bull; {item.batch.room || 'Hall A'}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {item.batch.course}
                      </td>
                      <td style={{ fontSize: '12px' }}>{item.batch.instructor}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-family-mono)' }}>
                        <strong>{item.studentCount}</strong> / {item.capacity}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            color: item.seatFillRate >= 80 ? '#047857' : '#b45309',
                          }}
                        >
                          {item.seatFillRate}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)' }}>
                        ₹{item.totalInvoiced.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: '#047857' }}>
                        ₹{item.totalCollected.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: '#b91c1c' }}>
                        ₹{item.totalPending.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            color: item.collectionRate >= 75 ? '#047857' : '#b91c1c',
                          }}
                        >
                          {item.collectionRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
