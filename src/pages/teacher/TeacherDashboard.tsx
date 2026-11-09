import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  ArrowRight,
  BookOpen,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  getTeacherAssignedBatches,
  isBatchScheduledForDate,
  checkAttendanceStatus,
} from '../../utils/teacherUtils';

export const TeacherDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { batches, students, staff, attendanceSessions, todayDate } = useApp();
  const navigate = useNavigate();

  // 1. Get teacher's assigned batches
  const myBatches = getTeacherAssignedBatches(currentUser, batches, staff);

  // 2. Identify classes scheduled for today
  const todayClasses = myBatches.filter(b => isBatchScheduledForDate(b, todayDate));

  // 3. Calculate today's attendance status across classes
  const classesWithStatus = todayClasses.map(batch => {
    const status = checkAttendanceStatus(batch.id, attendanceSessions, todayDate);
    const enrolledStudents = students.filter(s => s.batchId === batch.id && s.status === 'active');
    return {
      batch,
      status,
      enrolledCount: enrolledStudents.length,
    };
  });

  const completedCount = classesWithStatus.filter(c => c.status.isMarked).length;
  const pendingCount = classesWithStatus.length - completedCount;

  // Total active students across all assigned batches
  const totalMyStudents = students.filter(
    s => myBatches.some(b => b.id === s.batchId) && s.status === 'active'
  ).length;

  const formattedDate = new Date(todayDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e40af, #2563eb)',
          borderRadius: '16px',
          padding: '24px 20px',
          color: '#ffffff',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={18} style={{ color: '#93c5fd' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Faculty Class Workspace
          </span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.2 }}>
          Namaste, {currentUser.name}!
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '13.5px', color: '#dbeafe' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} />
            {formattedDate}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={15} />
            {currentUser.roleTitle || 'Faculty Member'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="teacher-metrics-grid">
        <div className="teacher-metric-box">
          <span className="teacher-metric-label">Classes Today</span>
          <span className="teacher-metric-val">{todayClasses.length}</span>
        </div>

        <div className="teacher-metric-box">
          <span className="teacher-metric-label">Pending Rolls</span>
          <span
            className="teacher-metric-val"
            style={{ color: pendingCount > 0 ? '#d97706' : '#10b981' }}
          >
            {pendingCount}
          </span>
        </div>

        <div className="teacher-metric-box">
          <span className="teacher-metric-label">Assigned Batches</span>
          <span className="teacher-metric-val">{myBatches.length}</span>
        </div>

        <div className="teacher-metric-box">
          <span className="teacher-metric-label">Total Students</span>
          <span className="teacher-metric-val">{totalMyStudents}</span>
        </div>
      </div>

      {/* Today's Classes Section */}
      <div className="teacher-card">
        <div className="teacher-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: '#2563eb' }} />
            <h2 className="teacher-section-title">Today's Class Schedule</h2>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            {todayClasses.length} Scheduled
          </span>
        </div>

        {classesWithStatus.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px dashed var(--color-border)',
            }}
          >
            <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>
              No Classes Scheduled for Today
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto 16px auto' }}>
              You don't have any classes timetable sessions today. You can still access your full batch roster or inspect past attendance logs.
            </p>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="terminal-submit-btn"
              style={{ margin: '0 auto', minHeight: 48, fontSize: '14px' }}
            >
              <GraduationCap size={16} />
              View All Assigned Batches
            </button>
          </div>
        ) : (
          <div>
            {classesWithStatus.map(({ batch, status, enrolledCount }) => {
              const isMarked = status.isMarked;
              const session = status.session;

              return (
                <div key={batch.id} className="teacher-class-card">
                  <div className="teacher-class-top">
                    <div className="teacher-class-info">
                      <h3>{batch.name}</h3>
                      <div className="teacher-class-sub">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} style={{ color: '#64748b' }} />
                          {batch.timing}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} style={{ color: '#64748b' }} />
                          {batch.room || 'Room 101'}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={14} style={{ color: '#64748b' }} />
                          {enrolledCount} Students
                        </span>
                      </div>
                    </div>

                    {isMarked ? (
                      <span className="teacher-pill-badge completed">
                        <CheckCircle2 size={13} />
                        Marked ({session?.attendanceRate}%)
                      </span>
                    ) : (
                      <span className="teacher-pill-badge pending">
                        <AlertCircle size={13} />
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Action Button (min 48px touch target) */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      onClick={() => navigate(`/teacher/attendance/${batch.id}`)}
                      className="terminal-submit-btn"
                      style={{
                        flex: 1,
                        minHeight: 48,
                        fontSize: '14.5px',
                        backgroundColor: isMarked ? '#ffffff' : '#10b981',
                        color: isMarked ? '#2563eb' : '#ffffff',
                        border: isMarked ? '1.5px solid #2563eb' : 'none',
                        boxShadow: isMarked ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)',
                      }}
                      aria-label={`Take attendance for ${batch.name}`}
                    >
                      {isMarked ? (
                        <>
                          <span>Review / Edit Attendance Roll</span>
                          <ArrowRight size={16} />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Take Attendance Roll</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access Card */}
      <div className="teacher-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0' }}>Need to check past attendance records?</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Inspect daily rolls, check late marks, or review monthly class percentage summaries.
          </p>
        </div>
        <button
          onClick={() => navigate('/teacher/history')}
          style={{
            height: 48,
            minHeight: 48,
            padding: '0 18px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            fontWeight: 600,
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <span>Open History Log</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

