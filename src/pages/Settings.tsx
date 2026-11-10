import React, { useState } from 'react';
import {
  Building2,
  Save,
  RotateCcw,
  Layers,
  CheckCircle2,
  Shield,
  MessageCircle,
  Sparkles,
  CreditCard,
  FileCode,
  Sliders,
  History,
  AlertTriangle,
  Server,
  DollarSign,
  Key,
  Calendar,
  AlertCircle,
  Check,
  FileText,
  Clock,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import {
  CoachingCategory,
  CommercialSubscription,
  CommercialModelType,
  SubscriptionStatus,
  LicenceStatus,
  MilestoneStatus,
} from '../types';

export const Settings: React.FC = () => {
  const {
    students,
    instituteConfig,
    updateInstituteConfig,
    resetToDemoDefaults,
    resetAllDataToZero,
    setIsArchitectureModalOpen,
    auditLogs,
    commercialSubscription,
    updateCommercialSubscription,
  } = useApp();

  const { canViewAuditLogs, updateInstituteProfile } = useAuth();

  // Active Tab: 'profile' | 'archetype' | 'commercial' | 'audit'
  const [activeTab, setActiveTab] = useState<'profile' | 'archetype' | 'commercial' | 'audit'>('profile');

  // Form State: Profile
  const [name, setName] = useState(instituteConfig.name);
  const [tagline, setTagline] = useState(instituteConfig.tagline);
  const [category, setCategory] = useState<CoachingCategory>(instituteConfig.category);
  const [address, setAddress] = useState(instituteConfig.address);
  const [city, setCity] = useState(instituteConfig.city);
  const [state, setState] = useState(instituteConfig.state);
  const [pincode, setPincode] = useState(instituteConfig.pincode);
  const [phone, setPhone] = useState(instituteConfig.phone);
  const [email, setEmail] = useState(instituteConfig.email);
  const [directorName, setDirectorName] = useState(instituteConfig.directorName);
  const [regNumber, setRegNumber] = useState(instituteConfig.regNumber);
  const [academicSession, setAcademicSession] = useState(instituteConfig.academicSession);
  const [whatsappTemplate, setWhatsappTemplate] = useState(instituteConfig.whatsappReminderTemplate);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // ==========================================
  // COMMERCIAL CONFIGURATION STATE
  // ==========================================
  const [selectedModel, setSelectedModel] = useState<CommercialModelType>(
    commercialSubscription.modelType || 'saas_subscription'
  );
  const [studentLimit, setStudentLimit] = useState<number>(commercialSubscription.studentLimit || 100);
  const [hostingOption, setHostingOption] = useState<string>(
    commercialSubscription.hostingResponsibility || 'FIXIA Cloud (AWS Mumbai ap-south-1)'
  );
  const [enabledModules, setEnabledModules] = useState<string[]>(
    commercialSubscription.enabledModules || ['students', 'batches', 'attendance', 'fees', 'reports', 'staff']
  );

  // Model A (SaaS) State
  const [saasSetupFee, setSaasSetupFee] = useState<number>(commercialSubscription.setupFeePaid || 4999);
  const [saasBillingCycle, setSaasBillingCycle] = useState<'monthly' | 'annual'>(
    commercialSubscription.billingCycle || 'monthly'
  );
  const [saasRecurringAmount, setSaasRecurringAmount] = useState<number>(
    commercialSubscription.recurringAmount || 1499
  );
  const [saasSubscriptionStatus, setSaasSubscriptionStatus] = useState<SubscriptionStatus>(
    commercialSubscription.subscriptionStatus || commercialSubscription.status || 'active'
  );
  const [saasRenewalDate, setSaasRenewalDate] = useState<string>(
    commercialSubscription.renewalDate || '2027-04-01'
  );
  const [saasSupport, setSaasSupport] = useState<string>(
    commercialSubscription.supportEntitlement || '24/7 Priority WhatsApp & Phone Support with Dedicated Account Manager'
  );

  // Model B (One-Time Licence) State
  const [licenceFee, setLicenceFee] = useState<number>(
    commercialSubscription.licencePurchaseFee || 35000
  );
  const [licenceKey, setLicenceKey] = useState<string>(
    commercialSubscription.licenceKey || 'FIXIA-LIC-2026-MTH-9842-PRO'
  );
  const [licenceStartDate, setLicenceStartDate] = useState<string>(
    commercialSubscription.licenceStartDate || '2026-04-01'
  );
  const [licenceExpiryDate, setLicenceExpiryDate] = useState<string>(
    commercialSubscription.licenceExpiryDate || '2027-04-01'
  );
  const [licenceStatus, setLicenceStatus] = useState<LicenceStatus>(
    commercialSubscription.licenceStatus || 'active'
  );
  const [licensedVersion, setLicensedVersion] = useState<string>(
    commercialSubscription.licensedVersion || 'v1.2.0-LTS'
  );
  const [maintenanceResponsibility, setMaintenanceResponsibility] = useState<string>(
    commercialSubscription.maintenanceResponsibility ||
      '1-Year Annual Maintenance Contract (AMC) for security & vulnerability patches'
  );
  const [upgradeEntitlement, setUpgradeEntitlement] = useState<string>(
    commercialSubscription.upgradeEntitlement ||
      'Minor v1.x bug fixes included; major v2.0 requires version upgrade fee'
  );

  // Model C (Custom Development) State
  const [customReqs, setCustomReqs] = useState<string>(
    commercialSubscription.customRequirements ||
      'Biometric fingerprint machine attendance API integration and bespoke parent mobile portal'
  );
  const [quotationRef, setQuotationRef] = useState<string>(
    commercialSubscription.quotationReference || 'QUO-2026-FIX-084'
  );
  const [quotationAmount, setQuotationAmount] = useState<number>(
    commercialSubscription.quotationAmount || 75000
  );
  const [definedScope, setDefinedScope] = useState<string>(
    commercialSubscription.definedScope ||
      'Milestone 1: Biometric machine sync webhook; Milestone 2: Fee ledger export bridge; Milestone 3: Parent mobile notice PWA'
  );
  const [milestoneStatus, setMilestoneStatus] = useState<MilestoneStatus>(
    commercialSubscription.milestoneStatus || 'in_development'
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    commercialSubscription.deliveryDate || '2026-12-15'
  );
  const [deliveryNotes, setDeliveryNotes] = useState<string>(
    commercialSubscription.deliveryNotes || 'Milestone 1 completed. Milestone 2 bridge currently under staging testing.'
  );
  const [customSupportAgreement, setCustomSupportAgreement] = useState<string>(
    commercialSubscription.supportAgreement ||
      '90-day dedicated post-delivery bugfix warranty + custom SLA agreement'
  );

  const handleCategorySelect = (cat: CoachingCategory, label: string) => {
    setCategory(cat);
    updateInstituteConfig({ category: cat, categoryLabel: label });
  };

  const toggleModule = (modKey: string) => {
    setEnabledModules(prev =>
      prev.includes(modKey) ? prev.filter(m => m !== modKey) : [...prev, modKey]
    );
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      tagline,
      category,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      directorName,
      regNumber,
      academicSession,
      whatsappReminderTemplate: whatsappTemplate,
    };

    updateInstituteConfig(payload);
    updateInstituteProfile(payload);

    // Build comprehensive separated commercial subscription payload
    const commercialPayload: Partial<CommercialSubscription> = {
      modelType: selectedModel,
      studentLimit,
      enabledModules,
      hostingResponsibility: hostingOption,

      // Statuses kept distinct
      subscriptionStatus: selectedModel === 'saas_subscription' ? saasSubscriptionStatus : 'not_applicable',
      licenceStatus: selectedModel === 'one_time_licence' ? licenceStatus : 'not_applicable',
      status: selectedModel === 'saas_subscription' ? saasSubscriptionStatus : 'active',

      // Model A
      setupFeePaid: selectedModel === 'saas_subscription' ? saasSetupFee : undefined,
      billingCycle: selectedModel === 'saas_subscription' ? saasBillingCycle : undefined,
      recurringAmount: selectedModel === 'saas_subscription' ? saasRecurringAmount : undefined,
      renewalDate: selectedModel === 'saas_subscription' ? saasRenewalDate : undefined,
      supportEntitlement:
        selectedModel === 'saas_subscription'
          ? saasSupport
          : selectedModel === 'one_time_licence'
          ? 'Annual Maintenance Contract (AMC) Support'
          : customSupportAgreement,

      // Model B
      licencePurchaseFee: selectedModel === 'one_time_licence' ? licenceFee : undefined,
      licenceKey: selectedModel === 'one_time_licence' ? licenceKey : undefined,
      licenceStartDate: selectedModel === 'one_time_licence' ? licenceStartDate : undefined,
      licenceExpiryDate: selectedModel === 'one_time_licence' ? licenceExpiryDate : undefined,
      licensedVersion: selectedModel === 'one_time_licence' ? licensedVersion : undefined,
      maintenanceResponsibility: selectedModel === 'one_time_licence' ? maintenanceResponsibility : undefined,
      upgradeEntitlement: selectedModel === 'one_time_licence' ? upgradeEntitlement : undefined,
      sourceCodeOwnership: false, // Mandatory legal disclosure

      // Model C
      customRequirements: selectedModel === 'custom_development' ? customReqs : undefined,
      quotationReference: selectedModel === 'custom_development' ? quotationRef : undefined,
      quotationAmount: selectedModel === 'custom_development' ? quotationAmount : undefined,
      definedScope: selectedModel === 'custom_development' ? definedScope : undefined,
      milestoneStatus: selectedModel === 'custom_development' ? milestoneStatus : undefined,
      deliveryDate: selectedModel === 'custom_development' ? deliveryDate : undefined,
      deliveryNotes: selectedModel === 'custom_development' ? deliveryNotes : undefined,
      supportAgreement: selectedModel === 'custom_development' ? customSupportAgreement : undefined,
    };

    updateCommercialSubscription(commercialPayload);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToZero = () => {
    if (
      window.confirm(
        'Warning: This will reset ALL student records, batches, attendance logs, payments, expenses, and staff to ZERO (0). This creates a fresh, clean slate for your live institute. Continue?'
      )
    ) {
      resetAllDataToZero();
      alert('All workspace records have been reset to 0.');
    }
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Warning: This will populate your workspace with sample demo data (85 students, 6 batches, ₹32,000 collected, ₹18,500 pending). Continue?'
      )
    ) {
      resetToDemoDefaults();
      alert('Sample demo data has been loaded.');
    }
  };

  const capacityRate = studentLimit > 0 ? Math.round((students.length / studentLimit) * 100) : 0;

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Institute Settings & Commercialization</h1>
          <p>
            Configure institute profile, commercial customer models, coaching vertical archetype, and audit trail
          </p>
        </div>

        <div className="page-actions-group">
          <Button
            variant="outline"
            icon={<RotateCcw size={15} />}
            onClick={handleResetToZero}
            style={{ color: '#ef4444', borderColor: '#fca5a5' }}
          >
            Reset All Data to 0
          </Button>

          <Button
            variant="outline"
            icon={<RotateCcw size={15} />}
            onClick={handleResetData}
          >
            Load Sample Data
          </Button>

          <Button
            variant="primary"
            icon={<Save size={15} />}
            onClick={handleSaveAll}
          >
            {savedSuccess ? 'Settings Saved!' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            color: '#047857',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <strong>Institute settings & commercial configuration updated successfully.</strong>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-strip" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <Building2 size={15} />
          Institute Profile & Receipts
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'archetype' ? 'active' : ''}`}
          onClick={() => setActiveTab('archetype')}
        >
          <Sliders size={15} />
          Coaching Archetype & Terms
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'commercial' ? 'active' : ''}`}
          onClick={() => setActiveTab('commercial')}
        >
          <CreditCard size={15} />
          Commercial Models & Licensing
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={15} />
          Security Audit Trail
        </button>
      </div>

      {/* TAB 1: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <CardHeader
              title="Official Institute Information"
              subtitle="Printed on all official student receipts, attendance rosters, and notices"
            />
            <CardBody>
              <div className="form-grid-2">
                <Input label="Institute Name" value={name} onChange={e => setName(e.target.value)} required />
                <Input label="Motto / Tagline" value={tagline} onChange={e => setTagline(e.target.value)} />
                <Input label="Managing Director / Owner Name" value={directorName} onChange={e => setDirectorName(e.target.value)} required />
                <Input label="Government Registration / Udyam Number" value={regNumber} onChange={e => setRegNumber(e.target.value)} />
                <Input label="Academic Session Year" value={academicSession} onChange={e => setAcademicSession(e.target.value)} />
                <Input label="Official Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <Input label="Primary Contact Phone" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>

              <div style={{ marginTop: '16px' }}>
                <Input label="Full Physical Address" value={address} onChange={e => setAddress(e.target.value)} required />
              </div>

              <div className="form-grid-3" style={{ marginTop: '16px' }}>
                <Input label="City" value={city} onChange={e => setCity(e.target.value)} />
                <Input label="State" value={state} onChange={e => setState(e.target.value)} />
                <Input label="PIN Code" value={pincode} onChange={e => setPincode(e.target.value)} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Notice & Receipt Copy Templates"
              subtitle="Template text used when copying parent fee notices to clipboard"
            />
            <CardBody>
              <div className="form-group">
                <label className="form-label">Fee Reminder Notice Template</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={whatsappTemplate}
                  onChange={e => setWhatsappTemplate(e.target.value)}
                />
                <span className="form-helper">
                  Available tags: &#123;guardian_name&#125;, &#123;student_name&#125;, &#123;balance_fee&#125;, &#123;institute_name&#125;. Note: Used for manual clipboard copy / click-to-chat.
                </span>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      {/* TAB 2: Archetype */}
      {activeTab === 'archetype' && (
        <Card>
          <CardHeader
            title="Coaching Vertical Archetype"
            subtitle="Configures curriculum taxonomy, stream presets, and grading nomenclature"
          />
          <CardBody>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {[
                { id: 'academic_k12', label: 'School Academic & Foundation (Class 9–12)', desc: 'CBSE, ICSE, and UP Board curriculum with subject combinations and terminal exams.' },
                { id: 'test_prep_competitive', label: 'Engineering & Medical Test Prep (JEE / NEET)', desc: 'Intensive OMR test series, daily practice problem (DPP) trackers, and dropper batches.' },
                { id: 'commerce_professional', label: 'Commerce, CA Foundation & Accountancy', desc: 'Ledger mastery, practical tally exercises, economics, and business studies.' },
                { id: 'vocational_skills', label: 'Vocational, Coding & Spoken English', desc: 'Short-term certificate courses, lab batches, and practical skill evaluations.' },
              ].map(arch => (
                <div
                  key={arch.id}
                  onClick={() => handleCategorySelect(arch.id as any, arch.label)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: category === arch.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: category === arch.id ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{arch.label}</strong>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {arch.desc}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* TAB 3: Commercial Model & Licensing */}
      {activeTab === 'commercial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Status Dashboard Bar */}
          <div
            style={{
              padding: '18px 22px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CURRENT COMMERCIAL STATUS
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px 0' }}>
                {selectedModel === 'saas_subscription'
                  ? 'Model A: Cloud SaaS Subscription'
                  : selectedModel === 'one_time_licence'
                  ? 'Model B: One-Time Software Licence'
                  : 'Model C: Custom Development Agreement'}
              </h3>
              <span style={{ fontSize: '12.5px', color: '#475569' }}>
                Enrollment Capacity: <strong>{students.length} / {studentLimit} Active Students</strong> ({capacityRate}% utilized)
              </span>
            </div>

            {/* Separate Status Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '4px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                }}
              >
                {selectedModel.replace('_', ' ').toUpperCase()}
              </span>

              {selectedModel === 'saas_subscription' ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '4px',
                    backgroundColor: saasSubscriptionStatus === 'active' ? '#ecfdf5' : '#fef2f2',
                    color: saasSubscriptionStatus === 'active' ? '#047857' : '#b91c1c',
                    border: `1px solid ${saasSubscriptionStatus === 'active' ? '#a7f3d0' : '#fecaca'}`,
                  }}
                >
                  SUBSCRIPTION: {saasSubscriptionStatus.toUpperCase()}
                </span>
              ) : selectedModel === 'one_time_licence' ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '4px',
                    backgroundColor: licenceStatus === 'active' ? '#ecfdf5' : '#fef2f2',
                    color: licenceStatus === 'active' ? '#047857' : '#b91c1c',
                    border: `1px solid ${licenceStatus === 'active' ? '#a7f3d0' : '#fecaca'}`,
                  }}
                >
                  LICENCE: {licenceStatus.toUpperCase()}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '4px',
                    backgroundColor: '#f5f3ff',
                    color: '#6b21a8',
                    border: '1px solid #ddd6fe',
                  }}
                >
                  MILESTONE: {milestoneStatus.toUpperCase()}
                </span>
              )}

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: '4px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                }}
              >
                {hostingOption.split('(')[0].trim()}
              </span>
            </div>
          </div>

          {/* Three Business Model Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* MODEL A */}
            <div
              onClick={() => setSelectedModel('saas_subscription')}
              style={{
                border: selectedModel === 'saas_subscription' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: selectedModel === 'saas_subscription' ? '#eff6ff' : '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={18} color="#2563eb" />
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>MODEL A: SaaS Subscription</strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                Low upfront setup fee with recurring monthly or annual billing. Managed cloud hosting on FIXIA infrastructure with automated security patching and priority support.
              </p>
              <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#1d4ed8', fontWeight: 600 }}>
                Setup: ₹{saasSetupFee.toLocaleString('en-IN')} &bull; ₹{saasRecurringAmount.toLocaleString('en-IN')}/{saasBillingCycle === 'monthly' ? 'mo' : 'yr'}
              </div>
            </div>

            {/* MODEL B */}
            <div
              onClick={() => setSelectedModel('one_time_licence')}
              style={{
                border: selectedModel === 'one_time_licence' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: selectedModel === 'one_time_licence' ? '#eff6ff' : '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Key size={18} color="#059669" />
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>MODEL B: One-Time Licence</strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                One-time software purchase for deployment on institute-managed VPS or local servers. Non-exclusive executable licence with optional Annual Maintenance Contract (AMC).
              </p>
              <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#047857', fontWeight: 600 }}>
                Purchase: ₹{licenceFee.toLocaleString('en-IN')} &bull; Client VPS / On-Premise
              </div>
            </div>

            {/* MODEL C */}
            <div
              onClick={() => setSelectedModel('custom_development')}
              style={{
                border: selectedModel === 'custom_development' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: selectedModel === 'custom_development' ? '#eff6ff' : '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileCode size={18} color="#7c3aed" />
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>MODEL C: Custom Development</strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                Separately quoted milestone-based engineering for custom requirements, ERP integrations, hardware biometric sync, or proprietary student portals.
              </p>
              <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#6b21a8', fontWeight: 600 }}>
                Quote: ₹{quotationAmount.toLocaleString('en-IN')} &bull; Milestone Contract
              </div>
            </div>
          </div>

          {/* ========================================================
              MODEL A DETAILS PANEL: SaaS Configuration
          ======================================================== */}
          {selectedModel === 'saas_subscription' && (
            <Card>
              <CardHeader
                title="Model A — Cloud SaaS Configuration Parameters"
                subtitle="Configure recurring subscription terms, setup fee, and cloud SLAs"
              />
              <CardBody>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Setup Fee (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={saasSetupFee}
                      onChange={e => setSaasSetupFee(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Billing Cycle</label>
                    <select
                      className="form-select"
                      value={saasBillingCycle}
                      onChange={e => setSaasBillingCycle(e.target.value as any)}
                    >
                      <option value="monthly">Monthly Subscription</option>
                      <option value="annual">Annual Subscription (10% Discount)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Recurring Subscription Amount (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={saasRecurringAmount}
                      onChange={e => setSaasRecurringAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subscription Status</label>
                    <select
                      className="form-select"
                      value={saasSubscriptionStatus}
                      onChange={e => setSaasSubscriptionStatus(e.target.value as any)}
                    >
                      <option value="active">Active (Full Access)</option>
                      <option value="trial">Free Trial Period</option>
                      <option value="past_due">Past Due (Grace Period)</option>
                      <option value="canceled">Canceled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subscription Renewal Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={saasRenewalDate}
                      onChange={e => setSaasRenewalDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Capacity Limit</label>
                    <select
                      className="form-select"
                      value={studentLimit}
                      onChange={e => setStudentLimit(Number(e.target.value))}
                    >
                      <option value={100}>Starter Tier (Up to 100 Students)</option>
                      <option value={200}>Growth Tier (Up to 200 Students)</option>
                      <option value={500}>High-Volume (Up to 500 Students)</option>
                      <option value={1000}>Unlimited Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Cloud Hosting Infrastructure</label>
                    <input
                      type="text"
                      className="form-input"
                      value="FIXIA Cloud (AWS Mumbai ap-south-1)"
                      disabled
                    />
                    <span className="form-helper">Continuous managed cloud infrastructure and automatic nightly database backups.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Support Entitlement Level</label>
                    <input
                      type="text"
                      className="form-input"
                      value={saasSupport}
                      onChange={e => setSaasSupport(e.target.value)}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ========================================================
              MODEL B DETAILS PANEL: One-Time Licence Configuration
          ======================================================== */}
          {selectedModel === 'one_time_licence' && (
            <Card>
              <CardHeader
                title="Model B — One-Time Software Licence Parameters"
                subtitle="Standalone deployment keys, client VPS parameters, and AMC agreements"
              />
              <CardBody>
                {/* Important Legal Callout */}
                <div
                  style={{
                    padding: '14px 18px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 'var(--radius-md)',
                    color: '#92400e',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    marginBottom: '18px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                  <div>
                    <strong>Mandatory Commercial Disclosure:</strong> A one-time software licence grants non-exclusive executable deployment rights on client-managed infrastructure. It does <strong>not</strong> grant or transfer source-code ownership or intellectual property rights. Lifetime cloud hosting or unlimited support is not provided; infrastructure hosting is the responsibility of the client or VPS host.
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">One-Time Licence Fee (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={licenceFee}
                      onChange={e => setLicenceFee(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cryptographic Licence Key</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}
                      value={licenceKey}
                      onChange={e => setLicenceKey(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Licensed Software Version</label>
                    <input
                      type="text"
                      className="form-input"
                      value={licensedVersion}
                      onChange={e => setLicensedVersion(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Licence Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={licenceStartDate}
                      onChange={e => setLicenceStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Licence / AMC Expiry Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={licenceExpiryDate}
                      onChange={e => setLicenceExpiryDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Licence Validation Status</label>
                    <select
                      className="form-select"
                      value={licenceStatus}
                      onChange={e => setLicenceStatus(e.target.value as any)}
                    >
                      <option value="active">Active (Verified & Licensed)</option>
                      <option value="pending_activation">Pending Activation</option>
                      <option value="expired">Expired AMC (Maintenance Required)</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-3" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Hosting Responsibility</label>
                    <select
                      className="form-select"
                      value={hostingOption}
                      onChange={e => setHostingOption(e.target.value)}
                    >
                      <option value="Dedicated Institute VPS (Client-Managed)">Dedicated Institute VPS (Client-Managed)</option>
                      <option value="Local On-Premise Institute Server">Local On-Premise Institute Server</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Maintenance Responsibility</label>
                    <input
                      type="text"
                      className="form-input"
                      value={maintenanceResponsibility}
                      onChange={e => setMaintenanceResponsibility(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Upgrade Entitlement</label>
                    <input
                      type="text"
                      className="form-input"
                      value={upgradeEntitlement}
                      onChange={e => setUpgradeEntitlement(e.target.value)}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ========================================================
              MODEL C DETAILS PANEL: Custom Development Configuration
          ======================================================== */}
          {selectedModel === 'custom_development' && (
            <Card>
              <CardHeader
                title="Model C — Custom Development & Bespoke Scope Parameters"
                subtitle="Separately quoted milestone contracts, custom requirements, and delivery SLA"
              />
              <CardBody>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Quotation Reference</label>
                    <input
                      type="text"
                      className="form-input"
                      value={quotationRef}
                      onChange={e => setQuotationRef(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quoted Contract Amount (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={quotationAmount}
                      onChange={e => setQuotationAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Milestone Delivery Status</label>
                    <select
                      className="form-select"
                      value={milestoneStatus}
                      onChange={e => setMilestoneStatus(e.target.value as any)}
                    >
                      <option value="discovery">1. Requirements & Discovery</option>
                      <option value="in_development">2. In Active Development</option>
                      <option value="testing">3. Staging & Acceptance Testing</option>
                      <option value="delivered">4. Delivered & Deployed</option>
                      <option value="accepted">5. Accepted & Signed Off</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Target Delivery Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Support Agreement Level</label>
                    <input
                      type="text"
                      className="form-input"
                      value={customSupportAgreement}
                      onChange={e => setCustomSupportAgreement(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Custom Requirements Specification</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={customReqs}
                      onChange={e => setCustomReqs(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Defined Milestone Scope & Delivery Notes</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={definedScope}
                      onChange={e => setDefinedScope(e.target.value)}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ========================================================
              FEATURE ENTITLEMENTS (Enabled Modules Checklist)
          ======================================================== */}
          <Card>
            <CardHeader
              title="Feature Entitlements & Module Licensing"
              subtitle="Enforced on database and server level — uncheck to disable modules"
            />
            <CardBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[
                  { key: 'students', label: 'Students Directory & Admissions', desc: 'Core student records, profiles, and CSV export' },
                  { key: 'batches', label: 'Batch & Cohort Timetable', desc: 'Schedules, room allocation, and faculty assignments' },
                  { key: 'attendance', label: 'Attendance Terminal & Daily Registers', desc: 'Daily roll marking, duplicate prevention, and reports' },
                  { key: 'fees', label: 'Fee Management & Invoicing', desc: 'Fee plans, manual payments, vouchers, and reversals' },
                  { key: 'reports', label: 'Institute Intelligence & Reports', desc: '5 comprehensive downloadable CSV reports' },
                  { key: 'staff', label: 'Staff & Faculty Management', desc: 'Instructor directory and RBAC permission roles' },
                ].map(mod => {
                  const isChecked = enabledModules.includes(mod.key);
                  return (
                    <div
                      key={mod.key}
                      onClick={() => toggleModule(mod.key)}
                      style={{
                        padding: '12px 14px',
                        border: isChecked ? '1px solid #93c5fd' : '1px solid var(--color-border)',
                        backgroundColor: isChecked ? '#eff6ff' : '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by div onClick
                        style={{ marginTop: '3px', cursor: 'pointer' }}
                      />
                      <div>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{mod.label}</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {mod.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" icon={<Save size={15} />} onClick={handleSaveAll}>
                  {savedSuccess ? 'Configuration Saved!' : 'Save Commercial Configuration'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader
            title="Institute Security & Operational Audit Trail"
            subtitle="Immutable chronological log of all admissions, fee payments, reversals, and attendance events"
          />
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / User</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Target ID</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty-state">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                        {log.createdAt}
                      </td>
                      <td>
                        <strong>{log.userName}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            fontFamily: 'var(--font-family-mono)',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                        {log.entityType}
                      </td>
                      <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px' }}>
                        {log.entityId}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {log.details ? JSON.stringify(log.details).slice(0, 70) : '—'}
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
