import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Calendar,
  ArrowRight,
  History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  getTeacherAssignedBatches,
  checkAttendanceStatus,
  isBatchScheduledForDate,
} from '../../utils/teacherUtils';

export const TeacherClasses: React.FC = () => {
  const { currentUser } = useAuth();
  const { batches, students, staff, attendanceSessions, todayDate } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  // 1. Get teacher's assigned batches
  const myBatches = getTeacherAssignedBatches(currentUser, batches, staff);

  // 2. Filter by search
  const filteredBatches = myBatches.filter(
    b =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0' }}>
              My Assigned Batches
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: 0 }}>
              All academic cohorts and lecture batches under your instructional care.
            </p>
          </div>
          <span
            style={{
              padding: '6px 14px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '13px',
              border: '1px solid #bfdbfe',
            }}
          >
            {myBatches.length} Batches
          </span>
        </div>

        {/* Search Bar (min 48px touch height) */}
        <div style={{ position: 'relative', marginTop: '16px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Search your batches by name, course, or batch code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '48px',
              paddingLeft: '44px',
              paddingRight: '16px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              backgroundColor: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          <GraduationCap size={40} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>
            {searchQuery ? 'No matching batches found' : 'No Batches Assigned'}
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            {searchQuery
              ? 'Try modifying your search query or clearing the filter.'
              : 'You do not have any active cohorts assigned to your profile yet. Please contact your institute director or administrative coordinator.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredBatches.map(batch => {
            const isToday = isBatchScheduledForDate(batch, todayDate);
            const status = checkAttendanceStatus(batch.id, attendanceSessions, todayDate);
            const enrolledStudents = students.filter(
              s => s.batchId === batch.id && s.status === 'active'
            );

            return (
              <div
                key={batch.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-xs)',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {batch.code}
                    </span>
                    {isToday ? (
                      status.isMarked ? (
                        <span className="teacher-pill-badge completed">
                          <CheckCircle2 size={12} />
                          Today Marked
                        </span>
                      ) : (
                        <span className="teacher-pill-badge pending">
                          Meets Today
                        </span>
                      )
                    ) : (
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: 500,
                        }}
                      >
                        {batch.scheduleDays}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text-main)' }}>
                    {batch.name}
                  </h3>

                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>
                    {batch.course}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} style={{ color: '#2563eb' }} />
                      <span>{batch.timing}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} style={{ color: '#2563eb' }} />
                      <span>{batch.room || 'Room 101'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={15} style={{ color: '#2563eb' }} />
                      <span>{enrolledStudents.length} Students Enrolled</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions (min 48px touch height) */}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => navigate(`/teacher/attendance/${batch.id}`)}
                    className="terminal-submit-btn"
                    style={{
                      flex: 1,
                      minHeight: 48,
                      fontSize: '14px',
                    }}
                    aria-label={`Take attendance for ${batch.name}`}
                  >
                    <span>Take Attendance</span>
                    <ArrowRight size={15} />
                  </button>

                  <button
                    onClick={() => navigate(`/teacher/history?batchId=${batch.id}`)}
                    style={{
                      width: 48,
                      height: 48,
                      minWidth: 48,
                      minHeight: 48,
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#ffffff',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="View Batch Attendance History"
                    aria-label="View Batch History"
                  >
                    <History size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
