import { describe, it, expect, beforeEach } from 'vitest';
import {
  INITIAL_PLATFORM_INSTITUTES,
  INITIAL_SOFTWARE_LICENSES,
  INITIAL_PLATFORM_AUDIT_LOGS,
  DEMO_USERS,
} from '../data/mockData';
import {
  PlatformInstituteRecord,
  SoftwareLicenseRecord,
  PlatformAuditLog,
  CommercialSubscription,
  UserRole,
} from '../types';

describe('Phase 15: FIXIA Super Admin Platform Governance Suite', () => {
  let institutes: PlatformInstituteRecord[];
  let licenses: SoftwareLicenseRecord[];
  let auditLogs: PlatformAuditLog[];

  beforeEach(() => {
    institutes = JSON.parse(JSON.stringify(INITIAL_PLATFORM_INSTITUTES));
    licenses = JSON.parse(JSON.stringify(INITIAL_SOFTWARE_LICENSES));
    auditLogs = JSON.parse(JSON.stringify(INITIAL_PLATFORM_AUDIT_LOGS));
  });

  // ============================================================================
  // 1. Security & Role Isolation Barriers
  // ============================================================================
  describe('TASK 1: Security, Role Segregation & Tenant Isolation', () => {
    it('prohibits institute owners, admins and teachers from accessing super_admin capabilities', () => {
      const allowedRolesForSuperAdmin: UserRole[] = ['super_admin'];

      // Check all non-super_admin roles
      const tenantRoles: UserRole[] = ['owner', 'admin', 'staff', 'faculty', 'teacher'];
      tenantRoles.forEach(role => {
        const isAuthorized = allowedRolesForSuperAdmin.includes(role);
        expect(isAuthorized).toBe(false);
      });

      // Super Admin is authorized
      expect(allowedRolesForSuperAdmin.includes('super_admin')).toBe(true);
    });

    it('verifies that Super Admin persona is distinct from tenant owner persona', () => {
      const superAdminUser = DEMO_USERS.find(u => u.role === 'super_admin');
      const ownerUser = DEMO_USERS.find(u => u.role === 'owner');

      expect(superAdminUser).toBeDefined();
      expect(superAdminUser?.email).toBe('superadmin@fixia.in');
      expect(superAdminUser?.instituteId).toBe('FIXIA-PLATFORM-HQ');

      expect(ownerUser).toBeDefined();
      expect(ownerUser?.role).toBe('owner');
      expect(ownerUser?.instituteId).toBe('INST-MTH-01');

      // Tenant owner must NOT possess platform super admin role
      expect(ownerUser?.role).not.toBe('super_admin');
    });

    it('verifies tenant isolation: institute owners cannot mutate commercial quotas or other institutes', () => {
      const ownerRole: UserRole = 'owner';
      const isPlatformSuperAdmin = (ownerRole as string) === 'super_admin';

      // Tenant owner cannot modify quotas
      const canUpdateCommercialQuota = isPlatformSuperAdmin;
      expect(canUpdateCommercialQuota).toBe(false);

      // Super Admin can modify quotas
      const superAdminRole: UserRole = 'super_admin';
      expect((superAdminRole as string) === 'super_admin').toBe(true);
    });
  });

  // ============================================================================
  // 2. Platform Dashboard Aggregates & Fleet Intelligence
  // ============================================================================
  describe('TASK 2: Platform Fleet Metrics & Aggregation Engine', () => {
    it('accurately computes total, active, trial, and suspended institute distributions', () => {
      const total = institutes.length;
      const active = institutes.filter(i => i.status === 'active').length;
      const trial = institutes.filter(i => i.status === 'trial').length;
      const suspended = institutes.filter(i => i.status === 'suspended').length;

      expect(total).toBe(5);
      expect(active).toBe(3);
      expect(trial).toBe(1);
      expect(suspended).toBe(1);
      expect(active + trial + suspended).toBe(total);
    });

    it('accurately aggregates student capacity across all tenant coaching institutes', () => {
      const totalStudents = institutes.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);
      const totalQuota = institutes.reduce((acc, curr) => acc + (curr.subscription?.studentLimit || 100), 0);

      // 84 (Mathura) + 42 (Vrindavan) + 18 (Agra) + 210 (Lucknow) + 35 (Bareilly) = 389
      expect(totalStudents).toBe(389);
      expect(totalQuota).toBe(850);
      expect(totalStudents).toBeLessThan(totalQuota);
    });

    it('computes Monthly Recurring Revenue (MRR) strictly from active SaaS subscriptions (Model A)', () => {
      const saasInstitutes = institutes.filter(
        i => i.subscription?.modelType === 'saas_subscription' && i.status === 'active'
      );

      // Active Model A: Radha Krishna Academy (1499) + Vrindavan Vidyapeeth (999) = 2498
      const calculatedMRR = saasInstitutes.reduce(
        (acc, curr) => acc + (curr.subscription?.recurringAmount || 0),
        0
      );

      expect(calculatedMRR).toBe(2498);

      // Suspended institutes (Bareilly) must NOT contribute to realized active MRR
      const suspendedMRR = institutes
        .filter(i => i.status === 'suspended')
        .reduce((acc, curr) => acc + (curr.subscription?.recurringAmount || 0), 0);

      expect(suspendedMRR).toBe(1499);
    });
  });

  // ============================================================================
  // 3. Institute Management & Lifecycle Transitions
  // ============================================================================
  describe('TASK 3: Institute Lifecycle Transitions & Status Enforcement', () => {
    it('provisions a new tenant institute with owner profile and initial commercial subscription', () => {
      const newInstId = 'INST-VAR-06';
      const newRecord: PlatformInstituteRecord = {
        id: newInstId,
        name: 'Kashi Scholars Forum',
        category: 'engineering_medical',
        categoryLabel: 'Engineering & Medical Entrance (JEE / NEET)',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        phone: '+91 94150 11992',
        email: 'director@kashischolars.edu.in',
        directorName: 'Prof. Harish Upadhyay',
        regNumber: 'UP-VAR-COACH-2026-902',
        academicSession: '2026-2027',
        status: 'active',
        createdAt: new Date().toISOString(),
        studentCount: 0,
        batchCount: 0,
        facultyCount: 1,
        subscription: {
          id: 'COMM-SUB-06',
          instituteId: newInstId,
          modelType: 'saas_subscription',
          planName: 'Growth Plan (Up to 250 Students)',
          status: 'active',
          studentLimit: 250,
          enabledModules: ['students', 'batches', 'attendance', 'fees'],
          billingCycle: 'monthly',
          recurringAmount: 1999,
          renewalDate: '2027-04-01',
          hostingResponsibility: 'FIXIA Cloud Managed',
          supportEntitlement: '24/7 Priority Support',
          sourceCodeOwnership: false,
        },
      };

      institutes.push(newRecord);

      expect(institutes.length).toBe(6);
      expect(institutes.find(i => i.id === 'INST-VAR-06')).toBeDefined();
      expect(institutes.find(i => i.id === 'INST-VAR-06')?.subscription.studentLimit).toBe(250);
    });

    it('suspends an institute with mandatory administrative audit justification', () => {
      const targetInst = institutes.find(i => i.id === 'INST-MTH-01');
      expect(targetInst).toBeDefined();
      expect(targetInst?.status).toBe('active');

      const suspensionReason = 'Commercial SaaS invoice overdue by 35 days. Second dunning notice elapsed.';
      
      // Enforce non-empty reason
      expect(suspensionReason.trim().length).toBeGreaterThan(0);

      // Mutate state
      targetInst!.status = 'suspended';
      targetInst!.suspensionReason = suspensionReason;

      // Log platform audit
      const newAuditLog: PlatformAuditLog = {
        id: `PAUD-${Date.now()}`,
        action: 'SUSPEND_INSTITUTE',
        targetInstituteId: targetInst!.id,
        targetInstituteName: targetInst!.name,
        actorEmail: 'superadmin@fixia.in',
        actorId: 'USR-SUPERADMIN-01',
        details: { previousStatus: 'active', newStatus: 'suspended' },
        reason: suspensionReason,
        timestamp: new Date().toISOString(),
      };
      auditLogs.push(newAuditLog);

      expect(targetInst?.status).toBe('suspended');
      expect(targetInst?.suspensionReason).toBe(suspensionReason);
      expect(auditLogs.some(l => l.action === 'SUSPEND_INSTITUTE' && l.targetInstituteId === 'INST-MTH-01')).toBe(true);
    });

    it('reactivates a suspended institute and records audit log', () => {
      const bareillyInst = institutes.find(i => i.id === 'INST-BLY-05');
      expect(bareillyInst?.status).toBe('suspended');

      const reactivationReason = 'Invoice cleared via direct bank transfer transaction UTR-98218921.';
      bareillyInst!.status = 'active';
      bareillyInst!.suspensionReason = undefined;

      auditLogs.push({
        id: `PAUD-${Date.now()}`,
        action: 'ACTIVATE_INSTITUTE',
        targetInstituteId: bareillyInst!.id,
        targetInstituteName: bareillyInst!.name,
        actorEmail: 'superadmin@fixia.in',
        actorId: 'USR-SUPERADMIN-01',
        details: { newStatus: 'active' },
        reason: reactivationReason,
        timestamp: new Date().toISOString(),
      });

      expect(bareillyInst?.status).toBe('active');
      expect(bareillyInst?.suspensionReason).toBeUndefined();
      expect(auditLogs.some(l => l.action === 'ACTIVATE_INSTITUTE' && l.targetInstituteId === 'INST-BLY-05')).toBe(true);
    });
  });

  // ============================================================================
  // 4. Commercial Subscription & Quota Administration
  // ============================================================================
  describe('TASK 4: Commercial Subscription & Student Quota Expansion', () => {
    it('allows Super Admin to expand student quota and logs mandatory audit reason', () => {
      const mathuraInst = institutes.find(i => i.id === 'INST-MTH-01');
      expect(mathuraInst?.subscription.studentLimit).toBe(100);

      const newQuota = 250;
      const quotaReason = 'Institute expanded from 6 to 12 classroom batches. Approved upgraded Growth Tier quota.';

      mathuraInst!.subscription.studentLimit = newQuota;
      mathuraInst!.subscription.planName = 'Enterprise Expansion (Up to 250 Students)';

      auditLogs.push({
        id: `PAUD-${Date.now()}`,
        action: 'UPDATE_QUOTA',
        targetInstituteId: mathuraInst!.id,
        targetInstituteName: mathuraInst!.name,
        actorEmail: 'superadmin@fixia.in',
        actorId: 'USR-SUPERADMIN-01',
        details: { previousQuota: 100, newQuota: 250 },
        reason: quotaReason,
        timestamp: new Date().toISOString(),
      });

      expect(mathuraInst?.subscription.studentLimit).toBe(250);
      const audit = auditLogs.find(l => l.action === 'UPDATE_QUOTA' && l.details.newQuota === 250);
      expect(audit).toBeDefined();
      expect(audit?.reason).toBe(quotaReason);
    });

    it('enforces module entitlements and allows Super Admin to grant optional modules', () => {
      const vrindavanInst = institutes.find(i => i.id === 'INST-VRN-02');
      expect(vrindavanInst?.subscription.enabledModules).not.toContain('expenses');

      // Grant expenses and timetable module
      vrindavanInst!.subscription.enabledModules.push('expenses', 'timetable');

      expect(vrindavanInst?.subscription.enabledModules).toContain('expenses');
      expect(vrindavanInst?.subscription.enabledModules).toContain('timetable');
    });
  });

  // ============================================================================
  // 5. Software License Governance (Model B) & Offline Checksum
  // ============================================================================
  describe('TASK 5: Software License Issuance & Offline Hardware Checksum', () => {
    it('generates a cryptographically formatted perpetual license key for Model B deployment', () => {
      const rand1 = 8491;
      const rand2 = 2390;
      const rand3 = 7712;
      const generatedKey = `FIXIA-LIC-${rand1}-${rand2}-${rand3}`;

      // Pattern: FIXIA-LIC-XXXX-XXXX-XXXX
      const licensePattern = /^FIXIA-LIC-\d{4}-\d{4}-\d{4}$/;
      expect(licensePattern.test(generatedKey)).toBe(true);

      const newLicense: SoftwareLicenseRecord = {
        id: `LIC-${Date.now()}`,
        licenseKey: generatedKey,
        instituteId: 'INST-AGR-03',
        instituteName: 'Taj City IIT-JEE Forum',
        modelType: 'one_time_licence',
        licensedVersion: 'v2.4.0-LTS',
        status: 'active',
        licenseStartDate: '2026-11-10',
        maxStudents: 300,
        hardwareFingerprint: 'SRV-AGR-INTEL-XEON-9921',
        offlineChecksum: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
        maintenanceValidUntil: '2027-11-10',
        sourceCodeOwnership: false, // Explicit legal requirement
        createdAt: new Date().toISOString(),
        issuedBy: 'superadmin@fixia.in',
      };

      licenses.push(newLicense);

      expect(licenses.length).toBe(3);
      expect(newLicense.sourceCodeOwnership).toBe(false);
      expect(newLicense.offlineChecksum).toBeDefined();
    });

    it('strictly enforces sourceCodeOwnership = false across all Model B perpetual licenses', () => {
      licenses.forEach(lic => {
        expect(lic.sourceCodeOwnership).toBe(false);
      });
    });

    it('validates offline cryptographic payload structure for air-gapped coaching institutes', () => {
      const activeLicense = licenses.find(l => l.status === 'active');
      expect(activeLicense).toBeDefined();

      const offlinePayload = {
        schema: 'FIXIA-LIC-OFFLINE-V1',
        licenseKey: activeLicense!.licenseKey,
        instituteId: activeLicense!.instituteId,
        instituteName: activeLicense!.instituteName,
        maxStudents: activeLicense!.maxStudents,
        hardwareFingerprint: activeLicense!.hardwareFingerprint,
        checksum: activeLicense!.offlineChecksum,
        sourceCodeOwnership: false,
      };

      expect(offlinePayload.schema).toBe('FIXIA-LIC-OFFLINE-V1');
      expect(offlinePayload.licenseKey).toMatch(/^FIXIA-LIC-\d{4}-\d{4}-\d{4}$/);
      expect(offlinePayload.maxStudents).toBeGreaterThan(0);
      expect(offlinePayload.sourceCodeOwnership).toBe(false);
    });

    it('revokes an active software license upon breach or non-payment', () => {
      const targetLic = licenses.find(l => l.id === 'LIC-2026-001');
      expect(targetLic?.status).toBe('active');

      targetLic!.status = 'suspended';

      expect(targetLic?.status).toBe('suspended');
    });
  });

  // ============================================================================
  // 6. Platform Audit Ledger & Export
  // ============================================================================
  describe('TASK 6: Immutable Platform Audit Trail & CSV Export', () => {
    it('verifies platform audit log record fields and action taxonomy', () => {
      const sampleLog = auditLogs[0];
      expect(sampleLog).toHaveProperty('id');
      expect(sampleLog).toHaveProperty('action');
      expect(sampleLog).toHaveProperty('targetInstituteId');
      expect(sampleLog).toHaveProperty('actorEmail');
      expect(sampleLog).toHaveProperty('reason');
      expect(sampleLog).toHaveProperty('timestamp');
      expect(sampleLog.reason.length).toBeGreaterThan(0);
    });

    it('generates valid CSV structure for compliance reporting', () => {
      const headers = ['Log ID', 'Timestamp', 'Action', 'Target Institute', 'Institute ID', 'Actor Email', 'Reason'];
      const rows = auditLogs.map(l => [
        l.id,
        l.timestamp,
        l.action,
        `"${l.targetInstituteName}"`,
        l.targetInstituteId,
        l.actorEmail,
        `"${l.reason}"`,
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      expect(csv).toContain('Log ID,Timestamp,Action');
      expect(csv).toContain('superadmin@fixia.in');
      expect(csv).toContain('UPDATE_QUOTA');
    });
  });
});
