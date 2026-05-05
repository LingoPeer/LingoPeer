import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getAuthState, setAuthState } from './storage';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

async function fetchProfileWithToken(token) {
  return apiFetch('/api/me/profile', { token });
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getAuthState());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setAuthState(auth);
  }, [auth]);

  const applyProfile = useCallback((profile) => {
    setAuth((prev) => ({
      ...prev,
      profile,
      placementCompleted: Boolean(profile?.level),
      level: profile?.level?.cefr ?? prev.level,
      user: { ...prev.user, ...profile?.user, avatar: profile?.user?.avatar || null },
    }));
  }, []);

  const refreshProfile = useCallback(async (tokenOverride) => {
    const token = tokenOverride ?? getAuthState().token;
    if (!token) return null;
    const data = await fetchProfileWithToken(token);
    applyProfile(data.profile);
    return data.profile;
  }, [applyProfile]);

  useEffect(() => {
    const { token } = getAuthState();
    if (!token) return;
    refreshProfile(token).catch(() => {
      setAuth((prev) => ({
        ...prev,
        token: null,
        user: null,
        profile: null,
        isLoggedIn: false,
        pendingExam: null,
        placementCompleted: false,
      }));
    });
  }, [refreshProfile]);

  const api = useMemo(() => {
    return {
      auth,
      isAuthenticating,
      authError,
      refreshProfile,

      login: async ({ email, password }) => {
        setIsAuthenticating(true);
        setAuthError('');
        try {
          const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: { email, password },
            auth: false,
          });
          if (!data.success) {
            throw new Error(data.message || 'Login failed');
          }
          setAuth((prev) => ({
            ...prev,
            isLoggedIn: true,
            token: data.token,
            user: { ...prev.user, ...data.user, avatar: data.user?.avatar || null },
            pendingExam: null,
            firstLoginAt: prev.firstLoginAt ?? new Date().toISOString(),
          }));
          const profile = await fetchProfileWithToken(data.token);
          applyProfile(profile.profile);
          return {
            success: true,
            user: data.user,
            placementCompleted: Boolean(profile.profile?.level),
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to login';
          setAuthError(message);
          return { success: false, message };
        } finally {
          setIsAuthenticating(false);
        }
      },

      googleLogin: async (credential) => {
        setIsAuthenticating(true);
        setAuthError('');
        try {
          const data = await apiFetch('/api/auth/google', {
            method: 'POST',
            body: { credential },
            auth: false,
          });
          if (!data.success) {
            throw new Error(data.message || 'Google login failed');
          }
          setAuth((prev) => ({
            ...prev,
            isLoggedIn: true,
            token: data.token,
            user: { ...prev.user, ...data.user, avatar: data.user?.avatar || null },
            pendingExam: data.exam ?? null,
            placementCompleted: false,
            level: null,
            profile: null,
            firstLoginAt: prev.firstLoginAt ?? new Date().toISOString(),
          }));
          const profile = await fetchProfileWithToken(data.token);
          applyProfile(profile.profile);
          return {
            success: true,
            user: data.user,
            exam: data.exam,
            placementCompleted: Boolean(profile.profile?.level),
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Google login failed';
          setAuthError(message);
          return { success: false, message };
        } finally {
          setIsAuthenticating(false);
        }
      },

      register: async ({ name, email, password }) => {
        setIsAuthenticating(true);
        setAuthError('');
        try {
          const data = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: { name, email, password },
            auth: false,
          });
          if (!data.success) {
            throw new Error(data.message || 'Registration failed');
          }
          setAuth((prev) => ({
            ...prev,
            isLoggedIn: true,
            token: data.token,
            user: { ...prev.user, ...data.user, avatar: data.user?.avatar || null },
            pendingExam: data.exam ?? null,
            placementCompleted: false,
            level: null,
            profile: null,
            firstLoginAt: prev.firstLoginAt ?? new Date().toISOString(),
          }));
          return { success: true, user: data.user, exam: data.exam };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          setAuthError(message);
          return { success: false, message };
        } finally {
          setIsAuthenticating(false);
        }
      },

      logout: () => {
        setAuth({
          isLoggedIn: false,
          token: null,
          user: null,
          profile: null,
          pendingExam: null,
          placementCompleted: false,
          level: null,
          firstLoginAt: null,
        });
        setAuthError('');
      },

      completePlacement: (level) => {
        setAuth((prev) => ({
          ...prev,
          placementCompleted: true,
          level,
          pendingExam: null,
        }));
      },

      setPendingExam: (exam) => {
        setAuth((prev) => ({ ...prev, pendingExam: exam }));
      },

      updateAvatar: (avatarUrl) => {
        setAuth((prev) => ({
          ...prev,
          user: { ...prev.user, avatar: avatarUrl },
          profile: prev.profile
            ? { ...prev.profile, user: { ...prev.profile?.user, avatar: avatarUrl } }
            : prev.profile,
        }));
      },

      reset: () => {
        setAuth(getAuthState());
        setAuthError('');
      },
    };
  }, [auth, authError, isAuthenticating, applyProfile]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
