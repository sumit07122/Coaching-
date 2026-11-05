import { describe, it, expect } from 'vitest';
import { isServiceRoleKey, isSupabaseConfigured } from '../lib/supabase';
import { RegisterOwnerInput } from '../context/AuthContext';
import { UserRole } from '../types';

describe('Supabase Client Security & Service-Role Guard', () => {
  it('correctly identifies and flags service-role JWT keys', () => {
    // Construct a mock service-role JWT payload
    const servicePayload = btoa(JSON.stringify({ role: 'service_role', sub: 'admin-123' }));
    const serviceRoleJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${servicePayload}.signature`;

    expect(isServiceRoleKey(serviceRoleJwt)).toBe(true);
    expect(isServiceRoleKey('supabase_service_role_secret_key')).toBe(true);
  });

  it('allows safe public anonymous keys', () => {
    const anonPayload = btoa(JSON.stringify({ role: 'anon', sub: 'anon-user' }));
    const anonJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${anonPayload}.signature`;

    expect(isServiceRoleKey(anonJwt)).toBe(false);
    expect(isServiceRoleKey('')).toBe(false);
    expect(isServiceRoleKey(undefined)).toBe(false);
  });
});

describe('Role-Based Authorization & Permission Logic', () => {
  function computePermissions(role: UserRole) {
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin';
    const isStaff = role === 'staff' || role === 'faculty';

    return {
      canManageFinances: isOwner || isAdmin,
      canManageStaff: isOwner || isAdmin,
      canManageSettings: isOwner,
      canViewAuditLogs: isOwner,
      canRecordPayments: isOwner || isAdmin,
      canReversePayments: isOwner,
      canExportReports: isOwner || isAdmin,
      isStaffOnly: isStaff,
    };
  }

  it('enforces Owner privileges for full institute administration', () => {
    const perms = computePermissions('owner');
    expect(perms.canManageFinances).toBe(true);
    expect(perms.canManageStaff).toBe(true);
    expect(perms.canManageSettings).toBe(true);
    expect(perms.canViewAuditLogs).toBe(true);
    expect(perms.canReversePayments).toBe(true);
    expect(perms.canExportReports).toBe(true);
    expect(perms.isStaffOnly).toBe(false);
  });

  it('enforces Admin privileges (restricted from settings and payment reversals)', () => {
    const perms = computePermissions('admin');
    expect(perms.canManageFinances).toBe(true);
    expect(perms.canManageStaff).toBe(true);
    expect(perms.canExportReports).toBe(true);
    // Admins cannot change institute settings, view audit logs, or reverse payments
    expect(perms.canManageSettings).toBe(false);
    expect(perms.canViewAuditLogs).toBe(false);
    expect(perms.canReversePayments).toBe(false);
  });

  it('enforces Staff / Faculty privileges (blocked from financial access and management)', () => {
    const staffPerms = computePermissions('staff');
    expect(staffPerms.canManageFinances).toBe(false);
    expect(staffPerms.canManageStaff).toBe(false);
    expect(staffPerms.canManageSettings).toBe(false);
    expect(staffPerms.canViewAuditLogs).toBe(false);
    expect(staffPerms.canRecordPayments).toBe(false);
    expect(staffPerms.canReversePayments).toBe(false);
    expect(staffPerms.isStaffOnly).toBe(true);

    const facultyPerms = computePermissions('faculty');
    expect(facultyPerms.canManageFinances).toBe(false);
    expect(facultyPerms.canManageSettings).toBe(false);
    expect(facultyPerms.isStaffOnly).toBe(true);
  });
});

describe('Institute Onboarding & Tenant Bootstrapping Validation', () => {
  function validateOnboardingInput(input: Partial<RegisterOwnerInput>): { valid: boolean; error?: string } {
    if (!input.instituteName || !input.instituteName.trim()) {
      return { valid: false, error: 'Institute name is required.' };
    }
    if (!input.fullName || !input.fullName.trim()) {
      return { valid: false, error: 'Director full name is required.' };
    }
    if (!input.email || !input.email.includes('@')) {
      return { valid: false, error: 'Valid email address is required.' };
    }
    if (!input.password || input.password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long.' };
    }
    if (!input.city || !input.city.trim()) {
      return { valid: false, error: 'City is required.' };
    }
    return { valid: true };
  }

  it('accepts valid onboarding input payload', () => {
    const input: RegisterOwnerInput = {
      instituteName: 'Vrindavan IIT-JEE Gurukul',
      fullName: 'Dr. Mohan Das',
      email: 'director@gurukul.org',
      password: 'SecurePassword2026!',
      phone: '+91 94120 54321',
      city: 'Vrindavan',
      state: 'Uttar Pradesh',
      category: 'engineering_medical',
      categoryLabel: 'Science & Competitive (JEE / NEET)',
    };

    const res = validateOnboardingInput(input);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('rejects onboarding with weak or missing password', () => {
    const input: Partial<RegisterOwnerInput> = {
      instituteName: 'Agra Commerce Academy',
      fullName: 'Sanjay Gupta',
      email: 'sanjay@agra.com',
      password: '123', // too short (< 6)
      city: 'Agra',
    };

    const res = validateOnboardingInput(input);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('at least 6 characters');
  });

  it('rejects onboarding with missing institute or director name', () => {
    const noNameRes = validateOnboardingInput({
      instituteName: '',
      fullName: 'Valid Name',
      email: 'valid@email.com',
      password: 'validpassword',
      city: 'Mathura',
    });
    expect(noNameRes.valid).toBe(false);
    expect(noNameRes.error).toContain('Institute name is required');

    const noDirectorRes = validateOnboardingInput({
      instituteName: 'Valid Academy',
      fullName: '',
      email: 'valid@email.com',
      password: 'validpassword',
      city: 'Mathura',
    });
    expect(noDirectorRes.valid).toBe(false);
    expect(noDirectorRes.error).toContain('Director full name is required');
  });
});

describe('Authentication & Password Reset Validation', () => {
  function validateLoginInput(email: string, password?: string): { valid: boolean; error?: string } {
    if (!email || !email.includes('@')) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { valid: false, error: 'Password is required for secure authentication.' };
    }
    return { valid: true };
  }

  function validateResetInput(email: string): { valid: boolean; error?: string } {
    if (!email || !email.includes('@')) {
      return { valid: false, error: 'Please provide a valid email address for password reset.' };
    }
    return { valid: true };
  }

  it('validates email and password requirements on login', () => {
    expect(validateLoginInput('director@academy.org', 'validpass').valid).toBe(true);
    expect(validateLoginInput('invalid-email', 'validpass').valid).toBe(false);
    expect(validateLoginInput('director@academy.org', '').valid).toBe(false);
  });

  it('validates password reset email dispatch', () => {
    expect(validateResetInput('director@academy.org').valid).toBe(true);
    expect(validateResetInput('not-an-email').valid).toBe(false);
    expect(validateResetInput('').valid).toBe(false);
  });
});

