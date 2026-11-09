import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  KeyRound,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const SuperAdminDashboard: React.FC = () => {
  const { platformInstitutes, softwareLicenses } = useApp();
  const navigate = useNavigate();

  // Aggregate Metrics
  const totalInstitutes = platformInstitutes.length;
  const activeInstitutes = platformInstitutes.filter(i => i.status === 'active').length;
  const trialInstitutes = platformInstitutes.filter(i => i.status === 'trial').length;
  const suspendedInstitutes = platformInstitutes.filter(i => i.status === 'suspended').length;

  const totalActiveStudents = platformInstitutes.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);
  const totalAllocatedQuota = platformInstitutes.reduce(
    (acc, curr) => acc + (curr.subscription?.studentLimit || 100),
    0
  );

  const saasSubscriptions = platformInstitutes.filter(i => i.subscription?.modelType === 'saas_subscription');
  const estimatedMonthlyMRR = saasSubscriptions
    .filter(i => i.status === 'active')
    .reduce((acc, curr) => acc + (curr.subscription?.recurringAmount || 1499), 0);

  // Chart data
  const enrollmentChartData = platformInstitutes.map(inst => ({
    name: inst.name.length > 18 ? inst.name.substring(0, 18) + '...' : inst.name,
    enrolled: inst.studentCount,
    limit: inst.subscription?.studentLimit || 100,
  }));

  const modelBreakdownData = [
    {
      name: 'Model A: SaaS Subscription',
      value: platformInstitutes.filter(i => i.subscription?.modelType === 'saas_subscription').length,
      color: '#4f46e5',
    },
    {
      name: 'Model B: Perpetual License',
      value: platformInstitutes.filter(i => i.subscription?.modelType === 'one_time_licence').length,
      color: '#0284c7',
    },
    {
      name: 'Model C: Custom Enterprise',
      value: platformInstitutes.filter(i => i.subscription?.modelType === 'custom_development').length,
      color: '#10b981',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome & Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Platform Overview & Tenant Governance
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Unified SaaS infrastructure metrics across all registered coaching institutes and commercial models.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            icon={<Building2 size={16} />}
            onClick={() => navigate('/superadmin/institutes')}
          >
            Manage Institutes
          </Button>
          <Button
            variant="outline"
            icon={<KeyRound size={16} />}
            onClick={() => navigate('/superadmin/licenses')}
          >
            Issue License
          </Button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-label">Total Institutes</span>
            <div className="sa-stat-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="sa-stat-value">{totalInstitutes}</div>
          <div className="sa-stat-subtext">Registered Coaching Centers</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-label">Active Deployments</span>
            <div className="sa-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="sa-stat-value">{activeInstitutes}</div>
          <div className="sa-stat-subtext" style={{ color: '#059669', fontWeight: 600 }}>
            {Math.round((activeInstitutes / (totalInstitutes || 1)) * 100)}% Fleet Health
          </div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-label">Trial Institutes</span>
            <div className="sa-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="sa-stat-value">{trialInstitutes}</div>
          <div className="sa-stat-subtext">14-Day Free Evaluation</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-label">Suspended</span>
            <div className="sa-stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="sa-stat-value">{suspendedInstitutes}</div>
          <div className="sa-stat-subtext" style={{ color: '#dc2626' }}>Overdue / Inactive</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-label">Active Students</span>
            <div className="sa-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="sa-stat-value">{totalActiveStudents}</div>
          <div className="sa-stat-subtext">Capacity: {totalAllocatedQuota} seats</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-label">Monthly Run-Rate (MRR)</span>
            <div className="sa-stat-icon" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="sa-stat-value">₹{estimatedMonthlyMRR.toLocaleString('en-IN')}</div>
          <div className="sa-stat-subtext">SaaS Recurring Revenue</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '24px' }}>
        {/* Student Enrollment vs Quota Bar Chart */}
        <Card>
          <CardHeader
            title="Student Capacity & Enrollment by Institute"
            subtitle="Current active student headcounts measured against commercial quota limits"
          />
          <CardBody style={{ height: '280px', padding: '16px 20px 10px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="enrolled" fill="#4f46e5" name="Enrolled Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="limit" fill="#cbd5e1" name="Plan Quota Limit" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Commercial Model Distribution */}
        <Card>
          <CardHeader
            title="Commercial Agreements"
            subtitle="Customer distribution by business model"
          />
          <CardBody style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={modelBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {modelBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Institutes`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', fontSize: '11px', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
                <span>SaaS (Model A)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                <span>One-Time License (Model B)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>Custom (Model C)</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Institutes Status Table */}
      <Card>
        <CardHeader
          title="Institute Fleet Directory"
          subtitle="Real-time multi-tenant health and commercial subscription status"
          action={
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight size={14} />}
              onClick={() => navigate('/superadmin/institutes')}
            >
              View Full Roster
            </Button>
          }
        />
        <div className="sa-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Institute & Code</th>
                <th>City & State</th>
                <th>Director / Owner</th>
                <th>Model & Plan</th>
                <th>Enrollment / Quota</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {platformInstitutes.map(inst => {
                const limit = inst.subscription?.studentLimit || 100;
                const ratio = Math.round(((inst.studentCount || 0) / limit) * 100);
                return (
                  <tr key={inst.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{inst.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{inst.id}</div>
                    </td>
                    <td>
                      {inst.city}, {inst.state}
                    </td>
                    <td>
                      <div>{inst.directorName}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{inst.email}</div>
                    </td>
                    <td>
                      <span className="sa-badge sa-badge-model" style={{ marginBottom: '4px' }}>
                        {inst.subscription?.modelType === 'saas_subscription' ? 'Model A' : 'Model B'}
                      </span>
                      <div style={{ fontSize: '12px', color: '#334155' }}>{inst.subscription?.planName}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="sa-quota-bar">
                          <div
                            className={`sa-quota-fill ${ratio > 90 ? 'danger' : ratio > 75 ? 'warn' : ''}`}
                            style={{ width: `${Math.min(ratio, 100)}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>
                          {inst.studentCount} / {limit} ({ratio}%)
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`sa-badge ${
                          inst.status === 'active'
                            ? 'sa-badge-active'
                            : inst.status === 'trial'
                            ? 'sa-badge-trial'
                            : 'sa-badge-suspended'
                        }`}
                      >
                        {inst.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/superadmin/institutes')}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
