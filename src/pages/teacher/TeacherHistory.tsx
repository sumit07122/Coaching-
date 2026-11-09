import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  History,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  X,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  getTeacherAssignedBatches,
  getBatchAttendanceRoster,
} from '../../utils/teacherUtils';
import { AttendanceSession } from '../../types';

export const TeacherHistory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialBatchId = searchParams.get('batchId') || 'all';

  const { currentUser } = useAuth();
  const { batches, staff, attendanceSessions, attendance, students } = useApp();
  const navigate = useNavigate();

  // 1. Get teacher's assigned batches
  const myBatches = getTeacherAssignedBatches(currentUser, batches, staff);
  const myBatchIds = new Set(myBatches.map(b => b.id));

  // 2. Filter states
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>(initialBatchId);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<AttendanceSession | null>(null);

  // 3. Filter sessions belonging to teacher's assigned batches
  const filteredSessions = useMemo(() => {
    return attendanceSessions
      .filter(s => myBatchIds.has(s.batchId))
      .filter(s => {
        if (selectedBatchFilter !== 'all' && s.batchId !== selectedBatchFilter) {
          return false;
        }
        if (selectedDateFilter && s.sessionDate !== selectedDateFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [attendanceSessions, myBatchIds, selectedBatchFilter, selectedDateFilter]);

  // Roster for selected modal session
  const modalRoster = useMemo(() => {
    if (!selectedSessionForModal) return [];
    return getBatchAttendanceRoster(
      selectedSessionForModal.batchId,
      students,
      attendance,
      selectedSessionForModal.id
    );
  }, [selectedSessionForModal, students, attendance]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0' }}>
          Attendance History
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Review historical roll-calls, daily presence rates, and session logs for your batches.
        </p>
      </div>

      {/* Filter Bar (min 48px touch targets) */}
      <div
        className="teacher-card"
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
          <Filter size={16} />
          <span>Filter:</span>
        </div>

        {/* Batch Filter Dropdown */}
        <select
          value={selectedBatchFilter}
          onChange={e => setSelectedBatchFilter(e.target.value)}
          style={{
            height: 48,
            minHeight: 48,
            padding: '0 12px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            fontSize: '13.5px',
            fontWeight: 500,
            outline: 'none',
            flex: 1,
            minWidth: '180px',
          }}
        >
          <option value="all">All My Batches ({myBatches.length})</option>
          {myBatches.map(b => (
            <option key={b.id} value={b.id}>
              {b.code} - {b.name}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={selectedDateFilter}
          onChange={e => setSelectedDateFilter(e.target.value)}
          placeholder="Filter by date..."
          style={{
            height: 48,
            minHeight: 48,
            padding: '0 12px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            fontSize: '13.5px',
            outline: 'none',
          }}
        />

        {selectedDateFilter && (
          <button
            onClick={() => setSelectedDateFilter('')}
            style={{
              height: 48,
              minHeight: 48,
              padding: '0 12px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear Date
          </button>
        )}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          <History size={40} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>
            No Attendance Sessions Found
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            There are no recorded attendance sessions matching your current filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSessions.map(session => {
            const batch = batches.find(b => b.id === session.batchId);
            const formattedDate = new Date(session.sessionDate).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={session.id}
                className="teacher-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginBottom: 0,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
                      {formattedDate}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                      {batch?.code || 'BATCH'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0' }}>
                    {batch?.name || 'Class Batch'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
                    <span>Enrolled: <strong>{session.totalEnrolled}</strong></span>
                    <span>Present: <strong style={{ color: '#10b981' }}>{session.totalPresent}</strong></span>
                    <span>Absent: <strong style={{ color: '#ef4444' }}>{session.totalAbsent}</strong></span>
                    {session.totalLate > 0 && (
                      <span>Late: <strong style={{ color: '#f59e0b' }}>{session.totalLate}</strong></span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: session.attendanceRate >= 75 ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {session.attendanceRate}%
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                      Presence
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedSessionForModal(session)}
                    style={{
                      height: 48,
                      minHeight: 48,
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#ffffff',
                      color: '#2563eb',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                    aria-label={`View roll roster for ${session.sessionDate}`}
                  >
                    <Eye size={16} />
                    <span>View Roll</span>
                  </button>

                  <button
                    onClick={() => navigate(`/teacher/attendance/${session.batchId}`)}
                    style={{
                      height: 48,
                      minHeight: 48,
                      padding: '0 14px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                    title="Open terminal for this batch"
                  >
                    Open Terminal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Roll Roster Modal */}
      {selectedSessionForModal && (
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
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 2px 0' }}>
                  Session Roll Details
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedSessionForModal.sessionDate} • {selectedSessionForModal.totalPresent} Present,{' '}
                  {selectedSessionForModal.totalAbsent} Absent
                </span>
              </div>
              <button
                onClick={() => setSelectedSessionForModal(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {selectedSessionForModal.notes && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    marginBottom: '14px',
                  }}
                >
                  <strong style={{ color: '#475569' }}>Session Notes: </strong>
                  <span>{selectedSessionForModal.notes}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {modalRoster.map((student, idx) => {
                  const record = attendance.find(
                    r =>
                      r.sessionId === selectedSessionForModal.id &&
                      r.studentId === student.studentId
                  );
                  const status = record?.status || 'present';

                  return (
                    <div
                      key={student.studentId}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, display: 'block' }}>
                            {student.studentName}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>
                            {student.studentCode}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            backgroundColor:
                              status === 'present'
                                ? '#ecfdf5'
                                : status === 'absent'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              status === 'present'
                                ? '#065f46'
                                : status === 'absent'
                                ? '#991b1b'
                                : '#92400e',
                          }}
                        >
                          {status}
                        </span>
                        {record?.remarks && (
                          <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            {record.remarks}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedSessionForModal(null)}
                style={{
                  height: 48,
                  minHeight: 48,
                  padding: '0 20px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
