import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, InstituteConfig, UserRole } from '../types';
import { DEMO_USERS, INITIAL_INSTITUTE_CONFIG } from '../data/mockData';
import { supabase, isSupabaseConfigured, isProduction } from '../lib/supabase';

export const SECOND_INSTITUTE_CONFIG: InstituteConfig = {
  name: 'Vrindavan Vidyapeeth',
  tagline: 'Excellence in Mathematics & Olympiad Training',
  category: 'academic_k12',
  categoryLabel: 'School Academic (Class 9-12 CBSE)',
  address: 'Plot 4, Raman Reti Road, Near ISKCON Temple',
  city: 'Vrindavan',
  state: 'Uttar Pradesh',
  pincode: '281121',
  phone: '+91 98375 66120',
  email: 'info@vrindavanvidyapeeth.org',
  directorName: 'Dr. Brijesh Goswami',
  regNumber: 'UP-VRN-COACH-2023-112',
  academicSession: '2026-2027',
  currencySymbol: '₹',
  receiptPrefix: 'VV-2026-',
  whatsappReminderTemplate: 'Dear {guardian_name}, gentle reminder from {institute_name}. {student_name} has pending tuition fee balance of ₹{balance_fee}. Kindly clear by 10th. Thank you.',
};

export interface RegisterOwnerInput {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  instituteName: string;
  city: string;
  state: string;
  category: InstituteConfig['category'];
  categoryLabel: string;
}

export interface AuthContextType {
  currentUser: UserProfile;
  currentInstitute: InstituteConfig;
  allInstitutes: InstituteConfig[];
  demoUsers: UserProfile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  userRole: UserRole;
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isSuperAdmin: boolean;
  canManageFinances: boolean;
  canManageStaff: boolean;
  canManageSettings: boolean;
  canViewAuditLogs: boolean;
  canRecordPayments: boolean;
  canReversePayments: boolean;
  canExportReports: boolean;
  switchUser: (userId: string) => void;
  switchInstitute: (instituteName: string) => void;
  loginWithEmail: (email: string, password?: string) => Promise<boolean>;
  loginAsDemoUser: (userId: string) => void;
  registerOwnerAndInstitute: (input: RegisterOwnerInput) => Promise<boolean>;
  updateInstituteProfile: (updates: Partial<InstituteConfig>) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  logout: () => void;
}

const STORAGE_KEY_USER = 'fixia_auth_user_v2';
const STORAGE_KEY_AUTH = 'fixia_is_authenticated_v2';
const STORAGE_KEY_INSTITUTES = 'fixia_all_institutes_v2';
const STORAGE_KEY_ACTIVE_INST = 'fixia_active_institute_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allInstitutes, setAllInstitutes] = useState<InstituteConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INSTITUTES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [INITIAL_INSTITUTE_CONFIG, SECOND_INSTITUTE_CONFIG];
  });

  const [currentInstitute, setCurrentInstitute] = useState<InstituteConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_INST);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_INSTITUTE_CONFIG;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!isProduction) {
          const match = DEMO_USERS.find(u => u.id === parsed.id);
          if (match) return match;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse auth user', e);
      }
    }
    if (isProduction) {
      return {
        id: '',
        name: 'Unauthenticated User',
        email: '',
        role: 'staff',
        roleTitle: 'Guest',
        instituteId: '',
        instituteName: '',
      };
    }
    return DEMO_USERS[0]; // Er. Rakesh Sharma (Owner) by default in dev/demo
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
    if (isProduction) {
      return savedAuth === 'true';
    }
    return savedAuth !== null ? savedAuth === 'true' : true;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Sync Supabase user details, memberships, and institutes
  const syncSupabaseUserAndInstitute = async (user: any) => {
    try {
      // 0. Check if user is a Platform Super Admin (Phase 15 Governance)
      const { data: platformAdmin } = await supabase
        .from('platform_admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (platformAdmin) {
        const mappedAdmin: UserProfile = {
          id: user.id,
          name: platformAdmin.full_name || user.email.split('@')[0],
          email: user.email,
          role: 'super_admin',
          roleTitle: 'FIXIA Platform Super Admin',
          instituteId: 'FIXIA-PLATFORM-HQ',
          instituteName: 'FIXIA Cloud Infrastructure',
        };
        setCurrentUser(mappedAdmin);
        setIsAuthenticated(true);
        return;
      }

      // 1. Fetch user profile from public.profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // 2. Fetch membership and institute
      const { data: membership } = await supabase
        .from('memberships')
        .select('*, institutes(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membership && membership.institutes) {
        const inst = membership.institutes;
        const mappedInst: InstituteConfig = {
          name: inst.name,
          tagline: inst.tagline || '',
          category: inst.category || 'academic_k12',
          categoryLabel: inst.category || 'School Academic (Class 9-12 CBSE)',
          address: inst.address || `${inst.city}, ${inst.state}`,
          city: inst.city,
          state: inst.state,
          pincode: inst.pincode || '281001',
          phone: inst.phone,
          email: inst.email || user.email,
          directorName: inst.director_name,
          regNumber: inst.reg_number || 'REG-2026-001',
          academicSession: inst.academic_session || '2026-2027',
          currencySymbol: inst.currency_symbol || '₹',
          receiptPrefix: inst.receipt_prefix || 'RCP-2026-',
          whatsappReminderTemplate: inst.whatsapp_template || '',
        };

        const mappedUser: UserProfile = {
          id: user.id,
          name: profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
          email: user.email,
          role: (membership.role === 'staff' ? 'faculty' : membership.role) as UserRole,
          roleTitle: membership.role_title,
          instituteId: inst.id,
          instituteName: inst.name,
        };

        setCurrentInstitute(mappedInst);
        setCurrentUser(mappedUser);
        setIsAuthenticated(true);
      } else {
        // User authenticated in Supabase but no institute onboarded yet
        const newUser: UserProfile = {
          id: user.id,
          name: profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
          email: user.email,
          role: 'owner',
          roleTitle: 'Institute Founder & Director',
          instituteId: 'PENDING_ONBOARDING',
          instituteName: currentInstitute.name,
        };
        setCurrentUser(newUser);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Error synchronizing Supabase user data:', err);
    }
  };

  // Check active Supabase session on boot and subscribe to auth state changes
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        if (error) {
          console.error('Supabase session restoration error:', error);
          return;
        }
        if (session?.user) {
          await syncSupabaseUserAndInstitute(session.user);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await syncSupabaseUserAndInstitute(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          if (isProduction) {
            setCurrentUser({
              id: '',
              name: 'Unauthenticated User',
              email: '',
              role: 'staff',
              roleTitle: 'Guest',
              instituteId: '',
              instituteName: '',
            });
          } else {
            setCurrentUser(DEMO_USERS[0]);
          }
          localStorage.removeItem(STORAGE_KEY_USER);
          localStorage.removeItem(STORAGE_KEY_AUTH);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Sync state to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTH, isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INSTITUTES, JSON.stringify(allInstitutes));
  }, [allInstitutes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_INST, JSON.stringify(currentInstitute));
  }, [currentInstitute]);

  // Role permissions
  const role = (currentUser?.role || 'owner') as UserRole;
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff' || role === 'faculty';
  const isSuperAdmin = role === 'super_admin';

  const canManageFinances = isOwner || isAdmin;
  const canManageStaff = isOwner || isAdmin;
  const canManageSettings = isOwner;
  const canViewAuditLogs = isOwner;
  const canRecordPayments = isOwner || isAdmin;
  const canReversePayments = isOwner;
  const canExportReports = isOwner || isAdmin;

  const switchUser = (userId: string) => {
    const target = DEMO_USERS.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      setAuthError(null);
    }
  };

  const switchInstitute = (instituteName: string) => {
    const target = allInstitutes.find(inst => inst.name === instituteName);
    if (target) {
      setCurrentInstitute(target);
      setCurrentUser(prev => ({
        ...prev,
        instituteName: target.name,
      }));
    }
  };

  const loginAsDemoUser = (userId: string) => {
    switchUser(userId);
  };

  const loginWithEmail = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    // Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      setIsLoading(false);
      return false;
    }

    if (!password) {
      setAuthError('Password is required for secure authentication.');
      setIsLoading(false);
      return false;
    }

    // Production / Live Supabase Auth
    if (isProduction || isSupabaseConfigured) {
      if (!isSupabaseConfigured) {
        setAuthError('Production error: Supabase backend is not configured.');
        setIsLoading(false);
        return false;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          let msg = error.message;
          if (msg.toLowerCase().includes('invalid login credentials')) {
            msg = 'Invalid email or password. Please verify your credentials or reset your password.';
          } else if (msg.toLowerCase().includes('email not confirmed')) {
            msg = 'Your email address has not been confirmed yet. Please check your inbox.';
          }
          setAuthError(msg);
          setIsLoading(false);
          return false;
        }

        if (data.user) {
          await syncSupabaseUserAndInstitute(data.user);
          setIsAuthenticated(true);
          setIsLoading(false);
          return true;
        }
      } catch (err: any) {
        setAuthError(err.message || 'Supabase authentication failed');
        setIsLoading(false);
        return false;
      }
    }

    // Local authentication fallback for dev demo
    const match = DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    if (match) {
      setCurrentUser(match);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    }

    setCurrentUser({
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: cleanEmail.split('@')[0].replace(/\./g, ' '),
      email: cleanEmail,
      role: 'owner',
      roleTitle: 'Institute Owner / Director',
      instituteId: 'INST-NEW-01',
      instituteName: currentInstitute.name,
    });
    setIsAuthenticated(true);
    setIsLoading(false);
    return true;
  };

  const registerOwnerAndInstitute = async (input: RegisterOwnerInput): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    // Validate inputs
    if (!input.instituteName.trim()) {
      setAuthError('Institute name is required.');
      setIsLoading(false);
      return false;
    }
    if (!input.fullName.trim()) {
      setAuthError('Director full name is required.');
      setIsLoading(false);
      return false;
    }
    if (!input.email.trim() || !input.email.includes('@')) {
      setAuthError('Valid email address is required.');
      setIsLoading(false);
      return false;
    }
    if (input.password && input.password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return false;
    }

    const cleanEmail = input.email.trim().toLowerCase();

    // Live Supabase Onboarding
    if (isSupabaseConfigured) {
      try {
        const password = input.password || 'TemporaryPass123!';
        
        // 1. Sign up user in Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: input.fullName.trim(),
              phone: input.phone.trim(),
            },
          },
        });

        if (signUpError) {
          setAuthError(signUpError.message);
          setIsLoading(false);
          return false;
        }

        // 2. Call the transactional onboard_institute RPC function
        const slug = input.instituteName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        const { error: rpcError } = await supabase.rpc('onboard_institute', {
          p_name: input.instituteName.trim(),
          p_slug: slug,
          p_category: input.category,
          p_city: input.city.trim(),
          p_state: input.state.trim(),
          p_phone: input.phone.trim(),
          p_director_name: input.fullName.trim(),
          p_email: cleanEmail,
        });

        if (rpcError) {
          console.warn('RPC onboard_institute failed, falling back to direct table inserts:', rpcError);
          const { data: instData } = await supabase
            .from('institutes')
            .insert({
              slug: `${slug}-${Date.now().toString().slice(-4)}`,
              name: input.instituteName.trim(),
              category: input.category,
              city: input.city.trim(),
              state: input.state.trim(),
              phone: input.phone.trim(),
              email: cleanEmail,
              director_name: input.fullName.trim(),
            })
            .select()
            .single();

          if (instData && signUpData.user) {
            await supabase.from('memberships').insert({
              institute_id: instData.id,
              user_id: signUpData.user.id,
              role: 'owner',
              role_title: 'Institute Founder & Director',
            });
          }
        }

        if (signUpData.user) {
          await syncSupabaseUserAndInstitute(signUpData.user);
        }
      } catch (err: any) {
        console.error('Supabase registration error:', err);
        if (isProduction) {
          setAuthError(err.message || 'Failed to complete institute onboarding on Supabase.');
          setIsLoading(false);
          return false;
        }
      }
    } else if (isProduction) {
      setAuthError('Cannot register institute: Supabase backend is not configured.');
      setIsLoading(false);
      return false;
    }

    // Update local state
    const newInst: InstituteConfig = {
      name: input.instituteName,
      tagline: 'Leading Academic & Coaching Centre',
      category: input.category,
      categoryLabel: input.categoryLabel,
      address: `${input.city}, ${input.state}`,
      city: input.city,
      state: input.state,
      pincode: '281001',
      phone: input.phone,
      email: cleanEmail,
      directorName: input.fullName,
      regNumber: `REG-${Date.now().toString().slice(-6)}`,
      academicSession: '2026-2027',
      currencySymbol: '₹',
      receiptPrefix: 'RCP-2026-',
      whatsappReminderTemplate: 'Dear {guardian_name}, fee reminder from {institute_name}. {student_name} has pending tuition fee of ₹{balance_fee}. Kindly clear by 10th. Thank you.',
    };

    const newOwner: UserProfile = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: input.fullName,
      email: cleanEmail,
      role: 'owner',
      roleTitle: 'Institute Founder & Director',
      instituteId: `INST-${Date.now().toString().slice(-4)}`,
      instituteName: input.instituteName,
    };

    setAllInstitutes(prev => [newInst, ...prev]);
    setCurrentInstitute(newInst);
    setCurrentUser(newOwner);
    setIsAuthenticated(true);
    setIsLoading(false);
    return true;
  };

  const updateInstituteProfile = async (updates: Partial<InstituteConfig>): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    const merged = { ...currentInstitute, ...updates };
    setCurrentInstitute(merged);
    setAllInstitutes(prev =>
      prev.map(i => (i.name === currentInstitute.name ? merged : i))
    );

    // If Supabase configured, sync update to Supabase
    if (isSupabaseConfigured && currentUser.instituteId) {
      try {
        const { error } = await supabase
          .from('institutes')
          .update({
            name: updates.name,
            tagline: updates.tagline,
            category: updates.category,
            address: updates.address,
            city: updates.city,
            state: updates.state,
            pincode: updates.pincode,
            phone: updates.phone,
            email: updates.email,
            director_name: updates.directorName,
            reg_number: updates.regNumber,
            academic_session: updates.academicSession,
            receipt_prefix: updates.receiptPrefix,
            whatsapp_template: updates.whatsappReminderTemplate,
            updated_at: new Date().toISOString(),
          })
          .eq('name', currentInstitute.name);

        if (error) {
          console.warn('Supabase institute update error:', error);
        }
      } catch (err: any) {
        console.error('Failed to sync institute settings to Supabase:', err);
      }
    }

    setIsLoading(false);
    return true;
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please provide a valid email address for password reset.');
      setIsLoading(false);
      return false;
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
          setAuthError(error.message);
          setIsLoading(false);
          return false;
        }
      } catch (err: any) {
        setAuthError(err.message || 'Failed to dispatch password reset email.');
        setIsLoading(false);
        return false;
      }
    }

    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(console.error);
    }
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_USER);
    if (isProduction) {
      setCurrentUser({
        id: '',
        name: 'Unauthenticated User',
        email: '',
        role: 'staff',
        roleTitle: 'Guest',
        instituteId: '',
        instituteName: '',
      });
    } else {
      setCurrentUser(DEMO_USERS[0]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentInstitute,
        allInstitutes,
        demoUsers: DEMO_USERS,
        isAuthenticated,
        isLoading,
        authError,
        clearAuthError,
        userRole: role,
        isOwner,
        isAdmin,
        isStaff,
        isSuperAdmin,
        canManageFinances,
        canManageStaff,
        canManageSettings,
        canViewAuditLogs,
        canRecordPayments,
        canReversePayments,
        canExportReports,
        switchUser,
        switchInstitute,
        loginWithEmail,
        loginAsDemoUser,
        registerOwnerAndInstitute,
        updateInstituteProfile,
        requestPasswordReset,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
