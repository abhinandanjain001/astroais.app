'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const AuthContext = createContext<{ user: User | null; loading: boolean; openAccount: () => void }>({ user: null, loading: true, openAccount: () => {} });
export const useAuth = () => useContext(AuthContext);

function friendlyError(error: unknown) {
  const messages: Record<string, string> = {
    'auth/popup-closed-by-user': 'Sign-in was cancelled. You can try again when you’re ready.',
    'auth/cancelled-popup-request': 'Another sign-in window is already open. Please finish there.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.',
    'auth/unauthorized-domain': 'Google sign-in is not available on this address. Please visit astroais.app.',
    'auth/network-request-failed': 'We could not connect. Check your internet connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes before trying again.',
    'auth/user-disabled': 'This account is disabled. Please contact support.',
    'auth/account-exists-with-different-credential': 'This email has an older account. Please contact support to link it to Google, or use another Google account.',
  };
  return messages[(error as { code?: string })?.code || ''] || 'We could not complete Google sign-in. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let revision = 0;
    let active = true;
    const unsubscribe = onIdTokenChanged(firebaseAuth(), async next => {
      const current = ++revision;
      if (!next) setUser(null);
      setLoading(true);
      try {
        const token = next ? await next.getIdTokenResult() : null;
        if (!active || current !== revision) return;
        const provider = (token?.claims.firebase as {sign_in_provider?: string} | undefined)?.sign_in_provider;
        if (next && (provider !== 'google.com' || token?.claims.email_verified !== true)) {
          setUser(null);
          setError('Please sign in with Google to continue. Email and password sign-in is no longer available.');
          setOpen(true);
          await signOut(firebaseAuth());
        } else setUser(next);
      } catch {
        if (active && current === revision) setError('We could not restore your session. Please sign in with Google again.');
      } finally { if (active && current === revision) setLoading(false); }
    }, () => { if (active) { setUser(null); setLoading(false); setError('Please sign in with Google again.'); } });
    return () => { active = false; ++revision; unsubscribe(); };
  }, []);
  function openAccount() { setError(''); setOpen(true); }
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); setOpen(false); }
    catch (error) { setError(friendlyError(error)); }
    finally { setBusy(false); }
  }
  return <AuthContext.Provider value={{ user, loading, openAccount }}>
    {children}
    <Dialog open={open} onOpenChange={next => { if (!busy) setOpen(next); }}>
      <DialogContent className="auth-dialog">
        <span className="eyebrow">YOUR ASTROIS ACCOUNT</span>
        <DialogTitle>{user ? 'Welcome back' : 'Welcome to Astrois'}</DialogTitle>
        <DialogDescription>{user ? user.email : 'Continue with your Google account to begin your personal astrology conversation.'}</DialogDescription>
        {user ? <button className="button primary" disabled={busy} onClick={() => void run(() => signOut(firebaseAuth()))}>{busy ? 'Signing out…' : 'Sign out'}</button> : <button className="button primary" disabled={busy || loading} onClick={() => void run(() => {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          return signInWithPopup(firebaseAuth(), provider);
        })}>{busy ? 'Connecting to Google…' : 'Continue with Google'}</button>}
        {error && <p className="auth-error" role="alert">{error}</p>}
      </DialogContent>
    </Dialog>
  </AuthContext.Provider>;
}
