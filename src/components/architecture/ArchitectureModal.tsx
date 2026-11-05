import React from 'react';
import { ShieldCheck, Database, Server, KeyRound, Building, Layers, DollarSign } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';

export const ArchitectureModal: React.FC = () => {
  const { isArchitectureModalOpen, setIsArchitectureModalOpen } = useApp();

  if (!isArchitectureModalOpen) return null;

  return (
    <Modal
      isOpen={isArchitectureModalOpen}
      onClose={() => setIsArchitectureModalOpen(false)}
      title="FIXIA CoachingOS — Multi-Tenant Architecture & Commercialization Plan"
      size="large"
      footer={
        <Button variant="primary" onClick={() => setIsArchitectureModalOpen(false)}>
          Understood & Close
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13.5px', lineHeight: 1.6 }}>
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px 16px' }}>
          <strong style={{ color: '#1e40af', display: 'block', marginBottom: '4px' }}>
            Phase 0 Prototype to Production Multi-Tenant Transition Blueprint
          </strong>
          <span style={{ color: '#1e3a8a', fontSize: '12.5px' }}>
            This technical roadmap details the exact production patterns required to convert this single-tenant in-memory prototype into a battle-tested multi-tenant SaaS platform serving thousands of coaching centres across India.
          </span>
        </div>

        {/* 1. Multi-Tenant Data Isolation */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Database size={18} style={{ color: '#2563eb' }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>1. Institute-Level Data Isolation (PostgreSQL RLS)</h4>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Instead of risky application-level filtering, all database tables (`students`, `batches`, `attendance`, `payments`) will contain a foreign key column <code>tenant_id UUID NOT NULL</code>.
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>PostgreSQL Row Level Security (RLS):</strong> Enabled on every table. The database connection executes <code>SET LOCAL app.current_tenant_id = '...'</code> on transaction start, making it physically impossible for Institute A to read Institute B's records even if an application bug exists.</li>
            <li><strong>Subdomain & Custom Domain Routing:</strong> Automated slug-based routing (e.g. <code>radheya.fixia.in</code> or <code>portal.sharmaclasses.com</code>) resolving to tenant context at edge (Cloudflare Workers).</li>
          </ul>
        </div>

        {/* 2. Role-Based Access Control */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <KeyRound size={18} style={{ color: '#059669' }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>2. RBAC & Granular Institute Permissions</h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: '#0f172a' }}>Institute Owner</strong>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Full control over finances, fee collection, staff permissions, batch pricing, and ledger exports.</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: '#0f172a' }}>Front-Desk Admin</strong>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Can take admissions, record student fees, print receipts, and call parents. Cannot change institute settings.</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: '#0f172a' }}>Teaching Faculty</strong>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Restricted view: Can only view assigned batch rosters and mark daily attendance. Zero access to student fee ledgers.</span>
            </div>
          </div>
        </div>

        {/* 3. Subscription, Licensing & Student Limits */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign size={18} style={{ color: '#d97706' }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>3. Commercial Packaging & Entitlements</h4>
          </div>
          <ul style={{ paddingLeft: '20px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>SaaS Subscription Tiers:</strong>
              <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                <li><em>Starter (₹999/mo):</em> Up to 100 students, 1 branch, attendance & printable receipts.</li>
                <li><em>Growth (₹2,499/mo):</em> Up to 300 students, WhatsApp automated payment receipts, advanced analytics CSV exports.</li>
              </ul>
            </li>
            <li><strong>One-Time Lifetime Software License:</strong> Offered for conservative institutes in Mathura/Agra wanting an on-premise or dedicated single-tenant VPS setup with a one-time fee + annual support AMC.</li>
            <li><strong>Soft & Hard Limits:</strong> When student count reaches 95/100, an in-app banner notifies the director to upgrade tier without breaking active daily attendance.</li>
          </ul>
        </div>

        {/* 4. Infrastructure & Hosting Responsibility */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Server size={18} style={{ color: '#7c3aed' }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>4. Hosting, Reliability & WhatsApp Integration</h4>
          </div>
          <ul style={{ paddingLeft: '20px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Low Latency Indian Cloud Region:</strong> Hosted in AWS Mumbai (ap-south-1) for sub-50ms latency across Uttar Pradesh and Northern India.</li>
            <li><strong>WhatsApp Business API:</strong> Integrated via Meta Cloud API or Gupshup for 1-click official template delivery of fee receipts directly to parent mobile numbers.</li>
            <li><strong>Automatic Nightly Backups:</strong> Automated S3 daily database snapshots with 30-day retention and one-click disaster recovery.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
