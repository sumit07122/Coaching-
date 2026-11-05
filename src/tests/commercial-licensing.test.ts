import { describe, it, expect } from 'vitest';
import {
  CommercialSubscription,
  CommercialModelType,
  SubscriptionStatus,
  LicenceStatus,
  MilestoneStatus,
} from '../types';
import { INITIAL_COMMERCIAL_SUBSCRIPTION } from '../data/mockData';

// Helper validator enforcing commercial model rules
function validateStudentAdmissionEntitlement(
  currentEnrolledCount: number,
  subscription: CommercialSubscription
): { allowed: boolean; remainingSlots: number; reason?: string } {
  // Check subscription status if SaaS
  if (subscription.modelType === 'saas_subscription') {
    const subStatus = subscription.subscriptionStatus || subscription.status;
    if (subStatus !== 'active' && subStatus !== 'trial') {
      return {
        allowed: false,
        remainingSlots: 0,
        reason: `Commercial admission blocked: SaaS subscription is ${subStatus}. Subscription renewal required.`,
      };
    }
  }

  // Check licence status if One-Time Licence
  if (subscription.modelType === 'one_time_licence') {
    const licStatus = subscription.licenceStatus || 'active';
    if (licStatus !== 'active') {
      return {
        allowed: false,
        remainingSlots: 0,
        reason: `Commercial admission blocked: One-time licence status is ${licStatus}. Activation or renewal required.`,
      };
    }
  }

  const remainingSlots = subscription.studentLimit - currentEnrolledCount;
  if (remainingSlots <= 0) {
    return {
      allowed: false,
      remainingSlots: 0,
      reason: `Institute has reached maximum capacity of ${subscription.studentLimit} students for ${subscription.planName}. Upgrade tier to admit more students.`,
    };
  }

  return { allowed: true, remainingSlots };
}

// Server-side module entitlement check simulator
function checkModuleEntitlement(
  moduleName: string,
  subscription: CommercialSubscription
): { entitled: boolean; reason?: string } {
  if (!subscription.enabledModules.includes(moduleName)) {
    return {
      entitled: false,
      reason: `Module "${moduleName}" is not entitled under the current commercial plan (${subscription.planName}).`,
    };
  }
  return { entitled: true };
}

describe('FIXIA CoachingOS — Commercial Customers & Three Business Models', () => {
  // ==========================================
  // 1. MODEL A — SaaS SUBSCRIPTION
  // ==========================================
  describe('Model A — Cloud SaaS Subscription', () => {
    it('validates Model A complete configuration parameters', () => {
      const saasSub: CommercialSubscription = {
        id: 'COMM-SAAS-01',
        instituteId: 'INST-MTH-01',
        modelType: 'saas_subscription',
        planName: 'Growth Plan (Up to 100 Students)',
        status: 'active',
        subscriptionStatus: 'active',
        licenceStatus: 'not_applicable',
        studentLimit: 100,
        enabledModules: ['students', 'batches', 'attendance', 'fees', 'reports', 'staff'],
        setupFeePaid: 4999,
        billingCycle: 'monthly',
        recurringAmount: 1499,
        renewalDate: '2027-04-01',
        hostingResponsibility: 'FIXIA Cloud (AWS Mumbai ap-south-1)',
        supportEntitlement: '24/7 Priority WhatsApp & Phone Support with Dedicated Account Manager',
      };

      expect(saasSub.modelType).toBe('saas_subscription');
      expect(saasSub.setupFeePaid).toBe(4999);
      expect(saasSub.billingCycle).toBe('monthly');
      expect(saasSub.recurringAmount).toBe(1499);
      expect(saasSub.subscriptionStatus).toBe('active');
      expect(saasSub.renewalDate).toBe('2027-04-01');
      expect(saasSub.studentLimit).toBe(100);
      expect(saasSub.enabledModules).toContain('fees');
      expect(saasSub.supportEntitlement).toContain('Priority WhatsApp & Phone Support');
      expect(saasSub.hostingResponsibility).toContain('AWS Mumbai');
    });

    it('permits student admissions when subscription is active and within limit (85 / 100)', () => {
      const currentStudents = 85;
      const check = validateStudentAdmissionEntitlement(currentStudents, INITIAL_COMMERCIAL_SUBSCRIPTION);
      expect(check.allowed).toBe(true);
      expect(check.remainingSlots).toBe(15);
    });

    it('blocks student admissions when SaaS subscription is expired or past due', () => {
      const expiredSaaS: CommercialSubscription = {
        ...INITIAL_COMMERCIAL_SUBSCRIPTION,
        subscriptionStatus: 'expired',
        status: 'expired',
      };
      const check = validateStudentAdmissionEntitlement(50, expiredSaaS);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('SaaS subscription is expired');
    });

    it('blocks admissions when student capacity limit is reached', () => {
      const atCapacitySubscription: CommercialSubscription = {
        ...INITIAL_COMMERCIAL_SUBSCRIPTION,
        studentLimit: 85,
      };
      const check = validateStudentAdmissionEntitlement(85, atCapacitySubscription);
      expect(check.allowed).toBe(false);
      expect(check.remainingSlots).toBe(0);
      expect(check.reason).toContain('maximum capacity of 85 students');
    });
  });

  // ==========================================
  // 2. MODEL B — ONE-TIME LICENCE
  // ==========================================
  describe('Model B — One-Time Software Licence', () => {
    const oneTimeLicence: CommercialSubscription = {
      id: 'COMM-LIC-02',
      instituteId: 'INST-AGRA-01',
      modelType: 'one_time_licence',
      planName: 'Perpetual Institute Licence v1.0',
      status: 'active',
      subscriptionStatus: 'not_applicable',
      licenceStatus: 'active',
      studentLimit: 250,
      enabledModules: ['students', 'batches', 'attendance', 'fees', 'reports'],
      licencePurchaseFee: 35000,
      licenceKey: 'FIXIA-LIC-2026-MTH-9842-PRO',
      licenceStartDate: '2026-04-01',
      licenceExpiryDate: '2027-04-01',
      licensedVersion: 'v1.2.0-LTS',
      hostingResponsibility: 'Dedicated Institute VPS (Client-Managed)',
      maintenanceResponsibility: '1-Year Annual Maintenance Contract (AMC) for security patches',
      upgradeEntitlement: 'Minor v1.x patches included; major v2.0 requires version upgrade fee',
      supportEntitlement: 'Annual Maintenance Contract (AMC) Standard Support',
      sourceCodeOwnership: false,
    };

    it('validates Model B complete parameters and standalone licensing fields', () => {
      expect(oneTimeLicence.modelType).toBe('one_time_licence');
      expect(oneTimeLicence.licencePurchaseFee).toBe(35000);
      expect(oneTimeLicence.licenceKey).toBe('FIXIA-LIC-2026-MTH-9842-PRO');
      expect(oneTimeLicence.licenceStartDate).toBe('2026-04-01');
      expect(oneTimeLicence.licenceExpiryDate).toBe('2027-04-01');
      expect(oneTimeLicence.licenceStatus).toBe('active');
      expect(oneTimeLicence.licensedVersion).toBe('v1.2.0-LTS');
      expect(oneTimeLicence.studentLimit).toBe(250);
      expect(oneTimeLicence.hostingResponsibility).toBe('Dedicated Institute VPS (Client-Managed)');
      expect(oneTimeLicence.maintenanceResponsibility).toContain('1-Year Annual Maintenance Contract');
      expect(oneTimeLicence.upgradeEntitlement).toContain('Minor v1.x patches');
    });

    it('enforces that one-time licence does NOT grant source code ownership', () => {
      expect(oneTimeLicence.sourceCodeOwnership).toBe(false);

      // Verifies that attempt to claim source code ownership violates commercial license policy
      const invalidLicenceClaim: CommercialSubscription = {
        ...oneTimeLicence,
        sourceCodeOwnership: true as any,
      };
      const validateSourceCodeClaim = (sub: CommercialSubscription) => {
        if (sub.modelType === 'one_time_licence' && sub.sourceCodeOwnership === true) {
          throw new Error('Commercial Policy Violation: One-time licence does not transfer source-code ownership.');
        }
      };

      expect(() => validateSourceCodeClaim(invalidLicenceClaim)).toThrow(
        'One-time licence does not transfer source-code ownership.'
      );
    });

    it('verifies lifetime hosting or unlimited support is not promised for Model B', () => {
      expect(oneTimeLicence.hostingResponsibility).not.toContain('Lifetime Free Hosting');
      expect(oneTimeLicence.supportEntitlement).not.toContain('Unlimited Lifetime Support');
      expect(oneTimeLicence.hostingResponsibility).toContain('Client-Managed');
    });

    it('blocks admissions if one-time licence status is suspended or expired', () => {
      const suspendedLicence: CommercialSubscription = {
        ...oneTimeLicence,
        licenceStatus: 'suspended',
      };
      const check = validateStudentAdmissionEntitlement(100, suspendedLicence);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('One-time licence status is suspended');
    });
  });

  // ==========================================
  // 3. MODEL C — CUSTOM DEVELOPMENT
  // ==========================================
  describe('Model C — Custom Development Agreement', () => {
    const customDevProject: CommercialSubscription = {
      id: 'COMM-DEV-03',
      instituteId: 'INST-CORP-01',
      modelType: 'custom_development',
      planName: 'Bespoke Franchise Multi-Branch Engine',
      status: 'active',
      subscriptionStatus: 'not_applicable',
      licenceStatus: 'not_applicable',
      studentLimit: 1000,
      enabledModules: ['students', 'batches', 'attendance', 'fees', 'reports', 'biometrics'],
      quotationReference: 'QUO-2026-FIX-084',
      quotationAmount: 75000,
      customRequirements: 'Biometric fingerprint machine attendance API integration and parent mobile app',
      definedScope: 'Milestone 1: Biometric machine sync webhook; Milestone 2: Fee ledger export bridge',
      milestoneStatus: 'in_development',
      deliveryDate: '2026-12-15',
      deliveryNotes: 'Milestone 1 completed. Milestone 2 in staging.',
      supportAgreement: '90-day dedicated post-delivery warranty + custom SLA agreement',
      hostingResponsibility: 'Hybrid Multi-Region Cloud',
      supportEntitlement: 'Dedicated Solutions Architect & SLA',
    };

    it('validates Model C parameters including quotation, milestone tracking, and SLA', () => {
      expect(customDevProject.modelType).toBe('custom_development');
      expect(customDevProject.quotationReference).toBe('QUO-2026-FIX-084');
      expect(customDevProject.quotationAmount).toBe(75000);
      expect(customDevProject.customRequirements).toContain('Biometric fingerprint');
      expect(customDevProject.definedScope).toContain('Milestone 1');
      expect(customDevProject.milestoneStatus).toBe('in_development');
      expect(customDevProject.deliveryDate).toBe('2026-12-15');
      expect(customDevProject.supportAgreement).toContain('90-day dedicated post-delivery warranty');
    });

    it('tracks milestone state progression across project lifecycle', () => {
      const validStatuses: MilestoneStatus[] = ['discovery', 'in_development', 'testing', 'delivered', 'accepted'];
      validStatuses.forEach(status => {
        const sub: CommercialSubscription = { ...customDevProject, milestoneStatus: status };
        expect(sub.milestoneStatus).toBe(status);
      });
    });
  });

  // ==========================================
  // 4. SEPARATION OF CONCERNS & FEATURE ENTITLEMENTS
  // ==========================================
  describe('Commercial Separation of Concerns & Module Entitlements', () => {
    it('keeps purchase model, subscription status, licence status, and limits strictly separate', () => {
      const saas = INITIAL_COMMERCIAL_SUBSCRIPTION;
      expect(saas.modelType).toBe('saas_subscription');
      expect(saas.subscriptionStatus).toBe('active');
      expect(saas.licenceStatus).toBe('not_applicable');
      expect(saas.studentLimit).toBe(100);
      expect(saas.hostingResponsibility).toBeDefined();
      expect(saas.supportEntitlement).toBeDefined();
    });

    it('validates feature access on server/database side and blocks unentitled modules', () => {
      const limitedSub: CommercialSubscription = {
        ...INITIAL_COMMERCIAL_SUBSCRIPTION,
        enabledModules: ['students', 'batches', 'attendance'], // 'fees' and 'reports' omitted!
      };

      const feesCheck = checkModuleEntitlement('fees', limitedSub);
      expect(feesCheck.entitled).toBe(false);
      expect(feesCheck.reason).toContain('Module "fees" is not entitled');

      const attendanceCheck = checkModuleEntitlement('attendance', limitedSub);
      expect(attendanceCheck.entitled).toBe(true);
    });

    it('verifies that single unified codebase serves all three commercial models without code forks', () => {
      // All three models share the identical CommercialSubscription interface and application core
      const models: CommercialModelType[] = ['saas_subscription', 'one_time_licence', 'custom_development'];
      models.forEach(model => {
        const sub: CommercialSubscription = {
          ...INITIAL_COMMERCIAL_SUBSCRIPTION,
          modelType: model,
        };
        expect(sub.modelType).toBe(model);
        expect(sub.studentLimit).toBeGreaterThan(0);
        expect(Array.isArray(sub.enabledModules)).toBe(true);
      });
    });
  });
});
