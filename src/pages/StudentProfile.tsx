import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  IndianRupee,
  CalendarCheck,
  GraduationCap,
  FileText,
  UserCheck,
  UserX,
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FeeStatusBadge, Badge } from '../components/common/Badge';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    students,
    batches,
    payments,
    attendance,
    instituteConfig,
    setIsPaymentModalOpen,
    setSelectedStudentForPayment,
    setPreviewReceipt,
  } = useApp();

  const [copiedReminder, setCopiedReminder] = useState(false);

  const student = students.find(s => s.id === id);

  if (!student) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Student Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '12px 0 20px 0' }}>
          No student found with ID: {id}
        </p>
        <Button variant="primary" onClick={() => navigate('/students')}>
          Back to Student Directory
        </Button>
      </div>
    );
  }

  const batch = batches.find(b => b.id === student.batchId);
  const studentPayments = payments.filter(p => p.studentId === student.id);
  const studentAttendance = attendance.filter(a => a.studentId === student.id);

  // Attendance stats for student
  const presentCount = studentAttendance.filter(a => a.status === 'present').length;
  const absentCount = studentAttendance.filter(a => a.status === 'absent').length;
  const totalClasses = presentCount + absentCount;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  const handleCopyWhatsAppReminder = () => {
    const msg = instituteConfig.whatsappReminderTemplate
      .replace('{guardian_name}', student.guardianName)
      .replace('{institute_name}', instituteConfig.name)
      .replace('{student_name}', student.fullName)
      .replace('{balance_fee}', student.balanceFee.toLocaleString('en-IN'));

    navigator.clipboard.writeText(msg);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  return (
    <div className="student-profile-page">
      {/* Top Navigation */}
      <div style={{ marginBottom: '16px' }}>
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate('/students')}
        >
          Back to Students
        </Button>
      </div>

      {/* Hero Profile Card */}
      <Card style={{ marginBottom: '24px' }}>
        <CardBody style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            {/* Identity */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '22px',
                  border: '2px solid #bfdbfe',
                }}
              >
                {student.fullName
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                    {student.fullName}
                  </h1>
                  <FeeStatusBadge status={student.feeStatus} />
                  {student.status === 'archived' ? (
                    <Badge variant="warning">Archived</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12.5px',
                    color: 'var(--color-text-muted)',
                    marginTop: '4px',
                  }}
                >
                  <span>
                    ID: <strong style={{ fontFamily: 'var(--font-family-mono)' }}>{student.studentId}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>Batch: <strong>{student.batchName}</strong></span>
                  <span>&bull;</span>
                  <span>Admitted: {student.admissionDate}</span>
                </div>
              </div>
            </div>

            {/* Quick CTAs */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {student.balanceFee > 0 && (
                <Button
                  variant="whatsapp"
                  size="sm"
                  icon={<MessageCircle size={15} />}
                  onClick={handleCopyWhatsAppReminder}
                >
                  {copiedReminder ? 'Reminder Copied!' : 'WhatsApp Fee Notice'}
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                icon={<IndianRupee size={15} />}
                onClick={() => {
                  setSelectedStudentForPayment(student);
                  setIsPaymentModalOpen(true);
                }}
              >
                Record Payment
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3-Column Profile Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Contact & Personal Details */}
        <Card>
          <CardHeader title="Contact & Guardian" />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Student Phone
                </span>
                <strong>{student.phone}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Email Address
                </span>
                <span>{student.email || 'Not provided'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Guardian Name ({student.guardianRelation})
                </span>
                <strong>{student.guardianName}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Guardian Phone
                </span>
                <strong>{student.guardianPhone}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Residential Address / Area
                </span>
                <span>{student.address || student.notes || `${instituteConfig.city}, Uttar Pradesh`}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Gender / Enrollment Status
                </span>
                <span>{student.gender} &bull; <strong style={{ textTransform: 'capitalize' }}>{student.status || 'active'}</strong></span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Academic & Batch Details */}
        <Card>
          <CardHeader title="Academic Enrollment" />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Course
                </span>
                <strong>{student.course}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Batch Schedule & Timings
                </span>
                <strong>{batch?.timing || 'Morning Batch'}</strong>
                <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                  {batch?.scheduleDays || 'Mon-Sat'}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Classroom / Hall
                </span>
                <span>{batch?.room || 'Main Lecture Hall'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11.5px' }}>
                  Faculty Instructor
                </span>
                <span>{batch?.instructor || instituteConfig.directorName}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader title="Attendance Record" />
          <CardBody>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: attendanceRate >= 80 ? '#047857' : '#b91c1c',
                  lineHeight: 1,
                }}
              >
                {attendanceRate}%
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Overall Attendance Rate
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12.5px',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>
                  Classes Present
                </span>
                <strong style={{ color: '#047857', fontSize: '16px' }}>{presentCount}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>
                  Classes Absent
                </span>
                <strong style={{ color: '#b91c1c', fontSize: '16px' }}>{absentCount}</strong>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Financial Ledger & Payment History */}
      <Card>
        <CardHeader
          title="Student Financial Ledger"
          subtitle="Complete record of course fees, collected instalments, and balance due"
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<IndianRupee size={14} />}
              onClick={() => {
                setSelectedStudentForPayment(student);
                setIsPaymentModalOpen(true);
              }}
            >
              Collect Instalment
            </Button>
          }
        />
        <CardBody style={{ padding: 0 }}>
          {/* Summary Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: '#fafbfc',
              padding: '16px 24px',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>
                Total Course Fee Invoiced
              </span>
              <strong style={{ fontSize: '20px', fontFamily: 'var(--font-family-mono)' }}>
                ₹{student.totalFeeInvoiced.toLocaleString('en-IN')}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>
                Total Paid to Date
              </span>
              <strong
                style={{
                  fontSize: '20px',
                  fontFamily: 'var(--font-family-mono)',
                  color: '#047857',
                }}
              >
                ₹{student.totalFeePaid.toLocaleString('en-IN')}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>
                Outstanding Remaining Balance
              </span>
              <strong
                style={{
                  fontSize: '20px',
                  fontFamily: 'var(--font-family-mono)',
                  color: student.balanceFee > 0 ? '#b91c1c' : '#047857',
                }}
              >
                ₹{student.balanceFee.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Payment Transactions Table */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Payment Date</th>
                <th>Amount Paid</th>
                <th>Mode</th>
                <th>Remaining Balance</th>
                <th>Collected By</th>
                <th>Remarks</th>
                <th style={{ textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {studentPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-empty-state">
                    No payment transactions recorded yet. Click "Collect Instalment" to log fee.
                  </td>
                </tr>
              ) : (
                studentPayments.map(txn => (
                  <tr key={txn.id}>
                    <td style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
                      {txn.receiptNumber}
                    </td>
                    <td>{txn.paymentDate}</td>
                    <td
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontWeight: 700,
                        color: '#047857',
                      }}
                    >
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                        }}
                      >
                        {txn.paymentMethod}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-family-mono)' }}>
                      ₹{txn.balanceRemaining.toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: '12px' }}>{txn.collectedBy}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {txn.remarks || 'Standard instalment'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye size={13} />}
                        onClick={() => setPreviewReceipt(txn)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};
