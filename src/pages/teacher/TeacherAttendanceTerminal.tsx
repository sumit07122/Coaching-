import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  AlertCircle,
  Search,
  CheckCircle2,
  Users,
  ArrowLeft,
  Save,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';
import {
  getTeacherAssignedBatches,
  getBatchAttendanceRoster,
  checkAttendanceStatus,
} from '../../utils/teacherUtils';

export const TeacherAttendanceTerminal: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    batches,
    students,
    staff,
    attendance,
    attendanceSessions,
    todayDate,
    saveAttendanceSession,
  } = useApp();

  // 1. Validate batch existence & teacher authorization
  const myBatches = getTeacherAssignedBatches(currentUser, batches, staff);
  const targetBatch = batches.find(b => b.id === batchId);
  const isAuthorized = myBatches.some(b => b.id === batchId);

  // 2. Date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [searchFilter, setSearchFilter] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // 3. Check if attendance was already recorded for this batch on selectedDate
  const existingSessionStatus = useMemo(
    () => (batchId ? checkAttendanceStatus(batchId, attendanceSessions, selectedDate) : { isMarked: false }),
    [batchId, attendanceSessions, selectedDate]
  );

  // 4. Build student roster (with historical preservation for transferred students)
  const roster = useMemo(() => {
    if (!batchId) return [];
    return getBatchAttendanceRoster(
      batchId,
      students,
      attendance,
      existingSessionStatus.session?.id
    );
  }, [batchId, students, attendance, existingSessionStatus.session?.id]);

  // 5. Local roll state: Map<studentId, { status: AttendanceStatus, remarks: string }>
  const [rollMap, setRollMap] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});

  // Initialize or re-populate rollMap when roster or existing session changes
  useEffect(() => {
    const initialRoll: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    roster.forEach(student => {
      // Look for existing attendance record on this date
      const existingRecord = attendance.find(
        r => r.batchId === batchId && r.studentId === student.studentId && r.date === selectedDate
      );

      if (existingRecord) {
        initialRoll[student.studentId] = {
          status: existingRecord.status,
          remarks: existingRecord.remarks || '',
        };
      } else {
        // Default to 'present' for speedy roll call
        initialRoll[student.studentId] = {
          status: 'present',
          remarks: '',
        };
      }
    });

    setRollMap(initialRoll);

    if (existingSessionStatus.session?.notes) {
      setSessionNotes(existingSessionStatus.session.notes);
    } else {
      setSessionNotes('');
    }
  }, [batchId, roster, selectedDate, existingSessionStatus.session]);

  // 6. Submission & Modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Status counters
  const totalEnrolled = roster.length;
  const presentCount = Object.values(rollMap).filter(r => r.status === 'present').length;
  const absentCount = Object.values(rollMap).filter(r => r.status === 'absent').length;
  const lateCount = Object.values(rollMap).filter(r => r.status === 'late').length;
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  // Filtered roster for search
  const displayedRoster = roster.filter(
    s =>
      s.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Action: Mark single student
  const handleMarkStudent = (studentId: string, status: AttendanceStatus) => {
    setRollMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status,
      },
    }));
  };

  // Action: Update single student remarks
  const handleUpdateRemarks = (studentId: string, remarks: string) => {
    setRollMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present' }),
        remarks,
      },
    }));
  };

  // Action: Mark All Present quick action
  const handleMarkAllPresent = () => {
    setRollMap(prev => {
      const updated = { ...prev };
      roster.forEach(s => {
        updated[s.studentId] = {
          ...(updated[s.studentId] || { remarks: '' }),
          status: 'present',
        };
      });
      return updated;
    });
  };

  // Action: Save Attendance Roll
  const handleConfirmSave = async () => {
    if (!batchId) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const records = roster.map(s => ({
        studentId: s.studentId,
        status: rollMap[s.studentId]?.status || 'present',
        remarks: rollMap[s.studentId]?.remarks?.trim() || undefined,
      }));

      await saveAttendanceSession({
        batchId,
        date: selectedDate,
        records,
        notes: sessionNotes.trim() || undefined,
      });

      setIsConfirmModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.error('Failed to save attendance roll:', err);
      setSubmitError(err.message || 'An error occurred while saving the roll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Security Check: Unauthorized teacher trying to access an unassigned batch
  if (!targetBatch || !isAuthorized) {
    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '60px auto',
          padding: '32px 24px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
          Access Denied: Unassigned Batch
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
          You are not designated as the instructor for this batch. As per institute security and student data protection protocols, faculty can only record attendance for authorized classes.
        </p>
        <button
          onClick={() => navigate('/teacher/classes')}
          className="terminal-submit-btn"
          style={{ margin: '0 auto', minHeight: 48, fontSize: '14px' }}
        >
          <ArrowLeft size={16} />
          Return to My Assigned Classes
        </button>
      </div>
    );
  }

  // Get absent students list for confirmation modal
  const absentStudents = roster.filter(s => rollMap[s.studentId]?.status === 'absent');

  return (
    <div>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/teacher')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 0',
            minHeight: 44,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Classes</span>
        </button>

        {existingSessionStatus.isMarked && (
          <span className="teacher-pill-badge completed">
            <CheckCircle2 size={13} />
            Previously Recorded for this Date
          </span>
        )}
      </div>

      {/* Terminal Batch Details Card */}
      <div className="attendance-terminal-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px' }}>
                {targetBatch.code}
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {targetBatch.course}
              </span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>
              {targetBatch.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} style={{ color: '#2563eb' }} />
                {targetBatch.timing}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} style={{ color: '#2563eb' }} />
                {targetBatch.room || 'Room 101'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} style={{ color: '#2563eb' }} />
                {totalEnrolled} Students
              </span>
            </div>
          </div>

          {/* Date Picker (min 48px touch target) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              Session Date
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  height: '48px',
                  minHeight: '48px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-border)',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Live Attendance Ribbon */}
        <div className="attendance-live-ribbon">
          <div className="attendance-ribbon-item">
            <span className="attendance-ribbon-label">Enrolled</span>
            <span className="attendance-ribbon-val">{totalEnrolled}</span>
          </div>
          <div className="attendance-ribbon-item">
            <span className="attendance-ribbon-label">Present</span>
            <span className="attendance-ribbon-val present">{presentCount}</span>
          </div>
          <div className="attendance-ribbon-item">
            <span className="attendance-ribbon-label">Absent</span>
            <span className="attendance-ribbon-val absent">{absentCount}</span>
          </div>
          <div className="attendance-ribbon-item">
            <span className="attendance-ribbon-label">Late</span>
            <span className="attendance-ribbon-val late">{lateCount}</span>
          </div>
          <div className="attendance-ribbon-item">
            <span className="attendance-ribbon-label">Attendance</span>
            <span className="attendance-ribbon-val" style={{ color: attendanceRate >= 75 ? '#10b981' : '#f59e0b' }}>
              {attendanceRate}%
            </span>
          </div>
        </div>

        {/* Quick Action & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button
            onClick={handleMarkAllPresent}
            style={{
              height: 48,
              minHeight: 48,
              padding: '0 16px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              fontWeight: 700,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Mark all students present"
          >
            <Check size={18} />
            <span>Mark All Present</span>
          </button>

          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Filter student list..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '38px',
                paddingRight: '12px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Student Attendance List */}
      <div style={{ marginBottom: '16px' }}>
        {displayedRoster.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              No students found matching your search filter.
            </p>
          </div>
        ) : (
          displayedRoster.map((student, index) => {
            const currentRoll = rollMap[student.studentId] || { status: 'present', remarks: '' };
            const statusClass =
              currentRoll.status === 'present'
                ? 'marked-present'
                : currentRoll.status === 'absent'
                ? 'marked-absent'
                : 'marked-late';

            return (
              <div
                key={student.studentId}
                className={`terminal-student-card ${statusClass}`}
              >
                <div className="terminal-student-main">
                  <div className="terminal-student-info">
                    <div className="terminal-student-avatar">
                      {student.studentName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                          #{index + 1}
                        </span>
                        <span className="terminal-student-name">
                          {student.studentName}
                        </span>
                        {student.isTransferred && (
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Transferred Cohort
                          </span>
                        )}
                      </div>
                      <span className="terminal-student-roll">
                        {student.studentCode}
                      </span>
                    </div>
                  </div>

                  {/* Touch Attendance Buttons (min 48px height, >=48px touch target) */}
                  <div className="terminal-btn-group">
                    <button
                      type="button"
                      onClick={() => handleMarkStudent(student.studentId, 'present')}
                      className={`terminal-btn btn-p ${currentRoll.status === 'present' ? 'active' : ''}`}
                      aria-label={`Mark ${student.studentName} Present`}
                    >
                      <Check size={16} style={{ marginRight: 4 }} />
                      <span>Present</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkStudent(student.studentId, 'absent')}
                      className={`terminal-btn btn-a ${currentRoll.status === 'absent' ? 'active' : ''}`}
                      aria-label={`Mark ${student.studentName} Absent`}
                    >
                      <X size={16} style={{ marginRight: 4 }} />
                      <span>Absent</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkStudent(student.studentId, 'late')}
                      className={`terminal-btn btn-l ${currentRoll.status === 'late' ? 'active' : ''}`}
                      aria-label={`Mark ${student.studentName} Late`}
                    >
                      <Clock size={16} style={{ marginRight: 4 }} />
                      <span>Late</span>
                    </button>
                  </div>
                </div>

                {/* Optional Remarks input (visible when absent or late, or toggleable) */}
                {(currentRoll.status === 'absent' || currentRoll.status === 'late') && (
                  <div style={{ marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder={`Add note for ${student.studentName} (e.g. sick leave, informed via parent phone)...`}
                      value={currentRoll.remarks}
                      onChange={e => handleUpdateRemarks(student.studentId, e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: '#ffffff',
                        fontSize: '12.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* General Session Notes */}
      <div className="teacher-card">
        <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, marginBottom: '6px' }}>
          Lecture Topics & Session Notes (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="Topics covered today, homework assigned, or notable classroom observations..."
          value={sessionNotes}
          onChange={e => setSessionNotes(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '13px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Floating / Sticky Submit Bar (min 48px touch height) */}
      <div className="terminal-submit-bar">
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>
            Roll Ready for Submission
          </span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-main)' }}>
            {presentCount} Present • {absentCount} Absent • {lateCount} Late
          </span>
        </div>

        <button
          onClick={() => setIsConfirmModalOpen(true)}
          className="terminal-submit-btn"
          disabled={isSubmitting || roster.length === 0}
        >
          <Save size={18} />
          <span>Review & Submit</span>
        </button>
      </div>

      {/* Confirmation Modal before committing */}
      {isConfirmModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0' }}>
              Confirm Attendance Submission
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 16px 0' }}>
              You are about to save the attendance roll for <strong>{targetBatch.name}</strong> on <strong>{selectedDate}</strong>.
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span>Total Enrolled:</span>
                <strong>{totalEnrolled}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#065f46' }}>
                <span>Present:</span>
                <strong>{presentCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#991b1b' }}>
                <span>Absent:</span>
                <strong>{absentCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#92400e' }}>
                <span>Late:</span>
                <strong>{lateCount}</strong>
              </div>
            </div>

            {absentStudents.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Absent Students ({absentStudents.length}):
                </span>
                <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '6px', fontSize: '13px', color: '#475569' }}>
                  {absentStudents.map(s => (
                    <div key={s.studentId} style={{ padding: '3px 0' }}>
                      • {s.studentName} ({s.studentCode})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  height: 48,
                  minHeight: 48,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSubmitting}
                className="terminal-submit-btn"
                style={{ flex: 1.5, minHeight: 48 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Saving Roll...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Confirm & Commit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>
              Attendance Recorded!
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              The attendance roll for <strong>{targetBatch.name}</strong> on <strong>{selectedDate}</strong> has been safely committed to the database.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => navigate('/teacher')}
                className="terminal-submit-btn"
                style={{ width: '100%', minHeight: 48 }}
              >
                Return to Today's Dashboard
              </button>
              <button
                onClick={() => navigate('/teacher/history')}
                style={{
                  height: 48,
                  minHeight: 48,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                View in History Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
