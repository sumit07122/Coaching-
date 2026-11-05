import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Users,
  Check,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  MessageCircle,
  Search,
  ArrowRight,
  TrendingUp,
  BarChart2,
  FileText,
  ShieldCheck,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { AttendanceStatus, Student } from '../types';

export const Attendance: React.FC = () => {
  const {
    students,
    batches,
    attendance,
    attendanceSessions,
    todayDate,
    instituteConfig,
    markAttendance,
    markAllPresent,
    saveAttendanceSession,
    getDailyAttendanceSummaries,
    getBatchAttendanceSummaries,
    getStudentAttendanceSummary,
    getMonthlyAttendanceSummaries,
    getAbsentStudentsForDate,
  } = useApp();
  const { userRole, currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Primary navigation: Daily Terminal vs Reports
  const [activeTab, setActiveTab] = useState<'terminal' | 'reports'>('terminal');

  // Reports sub-tab
  const [reportsSubTab, setReportsSubTab] = useState<
    'daily' | 'batches' | 'students' | 'monthly' | 'absentees'
  >('daily');

  // Active batch selection
  const [selectedBatchId, setSelectedBatchId] = useState<string>(() => {
    const fromParam = searchParams.get('batch');
    if (fromParam && batches.some(b => b.id === fromParam)) return fromParam;
    return batches[0]?.id || 'BAT-101';
  });

  // Active date selection
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [studentFilterQuery, setStudentFilterQuery] = useState<string>('');

  // Sync batch if query param changes
  useEffect(() => {
    const fromParam = searchParams.get('batch');
    if (fromParam && batches.some(b => b.id === fromParam)) {
      setSelectedBatchId(fromParam);
    }
  }, [searchParams, batches]);

  // Active batch object
  const activeBatch = batches.find(b => b.id === selectedBatchId) || batches[0];

  // Enrolled active students in active batch
  const batchStudents = useMemo(() => {
    return students.filter(s => s.batchId === selectedBatchId && s.status !== 'archived');
  }, [students, selectedBatchId]);

  // Check if an attendance session already exists in records for this batch and date
  const currentSession = useMemo(() => {
    return attendanceSessions.find(
      s => s.batchId === selectedBatchId && s.sessionDate === selectedDate
    );
  }, [attendanceSessions, selectedBatchId, selectedDate]);

  // Attendance map for this date & batch
  const attendanceStatusMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    batchStudents.forEach(stu => {
      const rec = attendance.find(
        a => a.studentId === stu.id && a.date === selectedDate
      );
      map[stu.id] = rec ? rec.status : 'present'; // Default present if not yet recorded
    });
    return map;
  }, [batchStudents, attendance, selectedDate]);

  // Sync existing session notes and student remarks when batch or date changes
  useEffect(() => {
    if (currentSession && currentSession.notes) {
      setSessionNotes(currentSession.notes);
    } else {
      setSessionNotes('');
    }

    const remarksMap: Record<string, string> = {};
    batchStudents.forEach(stu => {
      const rec = attendance.find(a => a.studentId === stu.id && a.date === selectedDate);
      if (rec?.remarks) remarksMap[stu.id] = rec.remarks;
    });
    setStudentRemarks(remarksMap);
  }, [currentSession, selectedBatchId, selectedDate, batchStudents, attendance]);

  // Calculate live counters
  const presentCount = Object.values(attendanceStatusMap).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceStatusMap).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendanceStatusMap).filter(s => s === 'late').length;
  const totalCount = batchStudents.length;
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const handleToggleStatus = (studentId: string, newStatus: AttendanceStatus) => {
    markAttendance(selectedDate, selectedBatchId, studentId, newStatus, studentRemarks[studentId]);
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setStudentRemarks(prev => ({ ...prev, [studentId]: remark }));
    const currentStatus = attendanceStatusMap[studentId] || 'present';
    markAttendance(selectedDate, selectedBatchId, studentId, currentStatus, remark);
  };

  const handleMarkAllPresent = () => {
    markAllPresent(selectedDate, selectedBatchId);
    setSavedFeedback(`Marked all ${batchStudents.length} students present for ${activeBatch?.name}!`);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleSaveAttendance = () => {
    try {
      const recordsToCommit = batchStudents.map(stu => ({
        studentId: stu.id,
        status: attendanceStatusMap[stu.id] || 'present',
        remarks: studentRemarks[stu.id] || undefined,
      }));

      const result = saveAttendanceSession({
        batchId: selectedBatchId,
        date: selectedDate,
        records: recordsToCommit,
        notes: sessionNotes.trim() || undefined,
      });

      setSavedFeedback(
        `Attendance successfully saved! Recorded ${result.session.totalPresent} Present, ${result.session.totalAbsent} Absent (${result.session.attendanceRate}%) for ${activeBatch?.name} on ${selectedDate}.`
      );
      setTimeout(() => setSavedFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving attendance session');
    }
  };

  const handleCopyAbsenceNotice = (student: Student, batchName: string) => {
    const text = `Respected Parent, this is an automated attendance notice from ${instituteConfig.name}. Your ward ${student.fullName} was marked absent for ${batchName} on ${selectedDate}. Kindly contact the institute reception at ${instituteConfig.phone} if this absence was unexcused.`;
    navigator.clipboard.writeText(text);
    setCopiedStudentId(student.id);
    setTimeout(() => setCopiedStudentId(null), 2500);
  };

  // Report Data
  const dailySummaries = useMemo(() => getDailyAttendanceSummaries(selectedDate), [getDailyAttendanceSummaries, selectedDate]);
  const batchSummaries = useMemo(() => getBatchAttendanceSummaries(), [getBatchAttendanceSummaries]);
  const monthlySummaries = useMemo(() => getMonthlyAttendanceSummaries(), [getMonthlyAttendanceSummaries]);
  const absentStudentsList = useMemo(() => getAbsentStudentsForDate(selectedDate), [getAbsentStudentsForDate, selectedDate]);

  const filteredStudentSummaries = useMemo(() => {
    const list = students.filter(s => s.status !== 'archived').map(s => getStudentAttendanceSummary(s.id));
    if (!studentFilterQuery.trim()) return list;
    const q = studentFilterQuery.toLowerCase();
    return list.filter(
      item =>
        item.studentName.toLowerCase().includes(q) ||
        item.studentCode.toLowerCase().includes(q) ||
        item.batchName.toLowerCase().includes(q)
    );
  }, [students, getStudentAttendanceSummary, studentFilterQuery]);

  return (
    <div className="attendance-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Attendance Operations & Terminal</h1>
          <p>
            Batch register rolls, audit history, duplicate prevention, and comprehensive attendance reports
          </p>
        </div>

        <div className="page-actions-group">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'terminal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('terminal')}
            >
              <CalendarCheck size={15} />
              Daily Register Terminal
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart2 size={15} />
              Attendance Reports & Audits
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedFeedback && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#065f46',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle size={18} />
          <strong>{savedFeedback}</strong>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE REGISTER TERMINAL                                 */}
      {/* ========================================================================= */}
      {activeTab === 'terminal' && (
        <>
          {/* Control Strip & Live Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.8fr',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
            {/* Controls Card */}
            <Card>
              <CardHeader title="Select Batch & Date" />
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Batch</label>
                    <select
                      className="form-select"
                      value={selectedBatchId}
                      onChange={e => setSelectedBatchId(e.target.value)}
                    >
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.studentCount} students)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Attendance Date</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        className="form-input"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Duplicate Prevention & Audit Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: currentSession ? '#eff6ff' : '#f8fafc',
                      border: `1px solid ${currentSession ? '#bfdbfe' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      fontSize: '11.5px',
                    }}
                  >
                    <History size={14} style={{ color: currentSession ? '#2563eb' : '#64748b' }} />
                    <span style={{ color: currentSession ? '#1e40af' : '#475569', fontWeight: 500 }}>
                      {currentSession ? (
                        <>
                          Session ID: <code>{currentSession.id}</code> &bull; Marked by{' '}
                          <strong>{currentSession.markedByUserName}</strong>
                          {currentSession.updatedByUserName && (
                            <span> (Last edited by {currentSession.updatedByUserName})</span>
                          )}
                        </>
                      ) : (
                        'New session roll &bull; Click "Save Attendance" to commit records to institute ledger'
                      )}
                    </span>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Topic / Session Notes (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Chapter 4: Electric Potential numericals"
                      value={sessionNotes}
                      onChange={e => setSessionNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    <span>
                      Timing: <strong>{activeBatch?.timing}</strong>
                    </span>{' '}
                    &bull; <span>Days: {activeBatch?.scheduleDays}</span> &bull;{' '}
                    <span>Instructor: {activeBatch?.instructor}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Live Batch Attendance Metric Card */}
            <Card>
              <CardHeader
                title="Batch Attendance Pulse"
                subtitle={`${activeBatch?.name} • ${selectedDate}`}
                action={
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<CheckCircle size={14} />}
                      onClick={handleMarkAllPresent}
                    >
                      Mark All Present
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Save size={14} />}
                      onClick={handleSaveAttendance}
                    >
                      Save Attendance
                    </Button>
                  </div>
                }
              />
              <CardBody>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    textAlign: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                      Enrolled Students
                    </span>
                    <strong style={{ fontSize: '22px', fontFamily: 'var(--font-family-mono)' }}>
                      {totalCount}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#065f46', display: 'block' }}>
                      Present
                    </span>
                    <strong
                      style={{
                        fontSize: '22px',
                        fontFamily: 'var(--font-family-mono)',
                        color: '#047857',
                      }}
                    >
                      {presentCount}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#92400e', display: 'block' }}>
                      Late
                    </span>
                    <strong
                      style={{
                        fontSize: '22px',
                        fontFamily: 'var(--font-family-mono)',
                        color: '#d97706',
                      }}
                    >
                      {lateCount}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#991b1b', display: 'block' }}>
                      Absent
                    </span>
                    <strong
                      style={{
                        fontSize: '22px',
                        fontFamily: 'var(--font-family-mono)',
                        color: '#dc2626',
                      }}
                    >
                      {absentCount}
                    </strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    <span>Session Attendance Rate</span>
                    <strong style={{ color: attendancePct >= 75 ? '#047857' : '#dc2626' }}>
                      {attendancePct}%
                    </strong>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${attendancePct}%`,
                        backgroundColor: attendancePct >= 80 ? '#10b981' : attendancePct >= 65 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Attendance Register Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Roll / Student ID</th>
                  <th>Student Name</th>
                  <th>Guardian Contact</th>
                  <th style={{ textAlign: 'center' }}>Mark Status</th>
                  <th>Remarks / Note</th>
                </tr>
              </thead>
              <tbody>
                {batchStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty-state">
                      No active students enrolled in {activeBatch?.name}.
                    </td>
                  </tr>
                ) : (
                  batchStudents.map((student, idx) => {
                    const currentStatus = attendanceStatusMap[student.id] || 'present';
                    const remark = studentRemarks[student.id] || '';

                    return (
                      <tr
                        key={student.id}
                        style={{
                          backgroundColor:
                            currentStatus === 'absent'
                              ? 'rgba(254, 242, 242, 0.45)'
                              : currentStatus === 'late'
                              ? 'rgba(254, 243, 199, 0.45)'
                              : 'transparent',
                        }}
                      >
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                          {idx + 1}
                        </td>

                        <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
                          {student.studentId}
                        </td>

                        <td>
                          <strong
                            style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
                            onClick={() => navigate(`/students/${student.id}`)}
                          >
                            {student.fullName}
                          </strong>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {student.phone}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '12.5px' }}>{student.guardianName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {student.guardianPhone}
                          </div>
                        </td>

                        {/* Interactive 3-way toggle buttons */}
                        <td style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border)',
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(student.id, 'present')}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: currentStatus === 'present' ? '#10b981' : '#ffffff',
                                color: currentStatus === 'present' ? '#ffffff' : '#475569',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <CheckCircle size={14} />
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(student.id, 'late')}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderLeft: '1px solid var(--color-border)',
                                borderRight: '1px solid var(--color-border)',
                                borderTop: 'none',
                                borderBottom: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: currentStatus === 'late' ? '#f59e0b' : '#ffffff',
                                color: currentStatus === 'late' ? '#ffffff' : '#475569',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Clock size={14} />
                              Late
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(student.id, 'absent')}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: currentStatus === 'absent' ? '#ef4444' : '#ffffff',
                                color: currentStatus === 'absent' ? '#ffffff' : '#475569',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <XCircle size={14} />
                              Absent
                            </button>
                          </div>
                        </td>

                        {/* Remarks input */}
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '12px', padding: '4px 8px', maxWidth: '220px' }}
                            placeholder="Optional remark..."
                            value={remark}
                            onChange={e => handleRemarkChange(student.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE REPORTS & AUDITS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="attendance-reports-view">
          {/* Sub-tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '12px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${reportsSubTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportsSubTab('daily')}
            >
              <Calendar size={13} />
              Daily Attendance Roll ({dailySummaries.length} Batches)
            </button>

            <button
              type="button"
              className={`btn btn-sm ${reportsSubTab === 'batches' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportsSubTab('batches')}
            >
              <Users size={13} />
              Batch-wise Attendance
            </button>

            <button
              type="button"
              className={`btn btn-sm ${reportsSubTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportsSubTab('students')}
            >
              <FileSpreadsheet size={13} />
              Student-wise Attendance
            </button>

            <button
              type="button"
              className={`btn btn-sm ${reportsSubTab === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportsSubTab('monthly')}
            >
              <TrendingUp size={13} />
              Monthly Summary
            </button>

            <button
              type="button"
              className={`btn btn-sm ${reportsSubTab === 'absentees' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportsSubTab('absentees')}
            >
              <AlertCircle size={13} />
              Absent Student List ({absentStudentsList.length})
            </button>
          </div>

          {/* Sub-tab 1: Daily Attendance */}
          {reportsSubTab === 'daily' && (
            <Card>
              <CardHeader
                title={`Daily Attendance Summary: ${selectedDate}`}
                subtitle="Cross-cohort attendance roll, total enrolled vs present, and recording staff"
              />
              <CardBody>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Batch Name</th>
                        <th>Target Course</th>
                        <th>Enrolled</th>
                        <th>Present</th>
                        <th>Late</th>
                        <th>Absent</th>
                        <th>Attendance %</th>
                        <th>Marked By</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummaries.map(item => {
                        const batch = batches.find(b => b.id === item.batchId);
                        return (
                          <tr key={item.batchId}>
                            <td>
                              <strong>{item.batchName}</strong>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              {batch?.course}
                            </td>
                            <td>{item.totalEnrolled}</td>
                            <td style={{ color: '#047857', fontWeight: 600 }}>{item.totalPresent}</td>
                            <td style={{ color: '#d97706', fontWeight: 600 }}>{item.totalLate}</td>
                            <td style={{ color: '#dc2626', fontWeight: 600 }}>{item.totalAbsent}</td>
                            <td>
                              <Badge
                                variant={
                                  item.attendanceRate >= 80
                                    ? 'success'
                                    : item.attendanceRate >= 65
                                    ? 'warning'
                                    : 'danger'
                                }
                              >
                                {item.attendanceRate}%
                              </Badge>
                            </td>
                            <td style={{ fontSize: '12px' }}>{item.markedBy}</td>
                            <td style={{ textAlign: 'center' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBatchId(item.batchId);
                                  setActiveTab('terminal');
                                }}
                              >
                                Open Terminal
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Sub-tab 2: Batch-wise Attendance */}
          {reportsSubTab === 'batches' && (
            <Card>
              <CardHeader
                title="Batch-wise Performance & Attendance Rates"
                subtitle="Cumulative attendance percentage, sessions conducted, and lead faculty"
              />
              <CardBody>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Batch Name</th>
                        <th>Faculty Instructor</th>
                        <th>Enrolled Students</th>
                        <th>Sessions Conducted</th>
                        <th>Total Present Marks</th>
                        <th>Total Absent Marks</th>
                        <th>Average Attendance</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchSummaries.map(item => (
                        <tr key={item.batchId}>
                          <td>
                            <strong>{item.batchName}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {item.course}
                            </div>
                          </td>
                          <td>{item.instructor}</td>
                          <td>{item.enrolledStudents}</td>
                          <td>{item.totalSessions}</td>
                          <td style={{ color: '#047857' }}>{item.totalPresentMarks}</td>
                          <td style={{ color: '#dc2626' }}>{item.totalAbsentMarks}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '6px',
                                  backgroundColor: '#e2e8f0',
                                  borderRadius: '999px',
                                  overflow: 'hidden',
                                  minWidth: '60px',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${item.averageAttendanceRate}%`,
                                    backgroundColor:
                                      item.averageAttendanceRate >= 80 ? '#10b981' : '#f59e0b',
                                  }}
                                />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '12px' }}>
                                {item.averageAttendanceRate}%
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBatchId(item.batchId);
                                setActiveTab('terminal');
                              }}
                            >
                              Register
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Sub-tab 3: Student-wise Attendance */}
          {reportsSubTab === 'students' && (
            <Card>
              <CardHeader
                title="Student-wise Attendance Directory"
                subtitle="Audit individual student punctuality, total classes attended, and absent records"
                action={
                  <div style={{ position: 'relative', width: '240px' }}>
                    <Search
                      size={14}
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
                      placeholder="Search student or roll..."
                      value={studentFilterQuery}
                      onChange={e => setStudentFilterQuery(e.target.value)}
                    />
                  </div>
                }
              />
              <CardBody>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Roll / ID</th>
                        <th>Student Name</th>
                        <th>Batch Name</th>
                        <th>Total Classes</th>
                        <th>Present</th>
                        <th>Late</th>
                        <th>Absent</th>
                        <th>Attendance %</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentSummaries.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="table-empty-state">
                            No students match your query.
                          </td>
                        </tr>
                      ) : (
                        filteredStudentSummaries.map(item => (
                          <tr key={item.studentId}>
                            <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
                              {item.studentCode}
                            </td>
                            <td>
                              <strong>{item.studentName}</strong>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              {item.batchName}
                            </td>
                            <td>{item.totalClasses}</td>
                            <td style={{ color: '#047857', fontWeight: 600 }}>{item.presentCount}</td>
                            <td style={{ color: '#d97706' }}>{item.lateCount}</td>
                            <td style={{ color: '#dc2626', fontWeight: 600 }}>{item.absentCount}</td>
                            <td>
                              <strong
                                style={{
                                  color: item.attendanceRate >= 80 ? '#047857' : '#dc2626',
                                }}
                              >
                                {item.attendanceRate}%
                              </strong>
                            </td>
                            <td>
                              <Badge
                                variant={
                                  item.attendanceRate >= 85
                                    ? 'success'
                                    : item.attendanceRate >= 75
                                    ? 'info'
                                    : 'danger'
                                }
                              >
                                {item.attendanceRate >= 85
                                  ? 'Optimal'
                                  : item.attendanceRate >= 75
                                  ? 'Satisfactory'
                                  : 'Defaulter (<75%)'}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/students/${item.studentId}`)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Sub-tab 4: Monthly Summary */}
          {reportsSubTab === 'monthly' && (
            <Card>
              <CardHeader
                title="Monthly Attendance Summary"
                subtitle="High-level monthly audit across the entire academic session"
              />
              <CardBody>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
                      Current Month
                    </span>
                    <strong style={{ fontSize: '18px' }}>November 2026</strong>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#065f46', display: 'block' }}>
                      Present Marks
                    </span>
                    <strong style={{ fontSize: '20px', color: '#047857' }}>
                      {monthlySummaries[0]?.totalPresentMarks || 72}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#991b1b', display: 'block' }}>
                      Absent Marks
                    </span>
                    <strong style={{ fontSize: '20px', color: '#dc2626' }}>
                      {monthlySummaries[0]?.totalAbsentMarks || 13}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#1e40af', display: 'block' }}>
                      Institute Attendance Rate
                    </span>
                    <strong style={{ fontSize: '20px', color: '#2563eb' }}>
                      {monthlySummaries[0]?.averageAttendanceRate || 85}%
                    </strong>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  <p>
                    All attendance data is synchronized with your multi-tenant Supabase PostgreSQL database
                    and complies with institute Row-Level Security policies. Attendance sessions are deduplicated
                    by <code>(institute_id, batch_id, session_date)</code>.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Sub-tab 5: Absent Student List */}
          {reportsSubTab === 'absentees' && (
            <Card>
              <CardHeader
                title={`Absent Student Watchlist (${selectedDate})`}
                subtitle="Students marked absent today across all cohorts with guardian contacts and instant WhatsApp notice copy"
              />
              <CardBody>
                {absentStudentsList.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#047857' }}>
                    <CheckCircle size={32} style={{ marginBottom: '8px' }} />
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>
                      Zero Absentees! 100% attendance recorded for {selectedDate}.
                    </p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Roll / ID</th>
                          <th>Student Name</th>
                          <th>Batch</th>
                          <th>Guardian Name</th>
                          <th>Guardian Phone</th>
                          <th>Remark</th>
                          <th style={{ textAlign: 'center' }}>WhatsApp Absence Notice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {absentStudentsList.map((item, idx) => (
                          <tr key={item.student.id}>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                              {idx + 1}
                            </td>
                            <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
                              {item.student.studentId}
                            </td>
                            <td>
                              <strong
                                style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
                                onClick={() => navigate(`/students/${item.student.id}`)}
                              >
                                {item.student.fullName}
                              </strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', fontWeight: 500 }}>
                                {item.batch.name}
                              </span>
                            </td>
                            <td>{item.student.guardianName}</td>
                            <td>
                              <strong>{item.student.guardianPhone}</strong>
                            </td>
                            <td style={{ fontSize: '12px', color: '#b91c1c' }}>
                              {item.remarks || 'Unexcused Absence'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <Button
                                variant="whatsapp"
                                size="sm"
                                icon={<MessageCircle size={14} />}
                                onClick={() => handleCopyAbsenceNotice(item.student, item.batch.name)}
                              >
                                {copiedStudentId === item.student.id ? 'Notice Copied!' : 'Copy Notice'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
