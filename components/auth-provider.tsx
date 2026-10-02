'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const AuthContext = createContext<{ user: User | null; loading: boolean; openAccount: () => void }>({ user: null, loading: true, openAccount: () => {} });
export const useAuth = () => useContext(AuthContext);

function friendlyError(error: unknown) {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect. Please try again.',
    'auth/email-already-in-use': 'An account already uses this email. Sign in or reset your password.',
    'auth/weak-password': 'Please choose a stronger password with at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled. You can try again when you’re ready.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups or sign in with email.',
    'auth/unauthorized-domain': 'Google sign-in is not available on this address. Please visit astroais.app.',
    'auth/network-request-failed': 'We could not connect. Check your internet connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes before trying again.',
    'auth/user-disabled': 'This account is disabled. Please contact support.',
    'auth/account-exists-with-different-credential': 'Use your original sign-in method for this email.',
  };
  return messages[code || ''] || 'We could not complete sign-in. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => onAuthStateChanged(firebaseAuth(), next => { setUser(next); setLoading(false); }, () => {
    setLoading(false); setError('We could not restore your session. Please sign in again.');
  }), []);
  function openAccount() { setError(''); setNotice(''); setPassword(''); setMode('signin'); setOpen(true); }
  function changeMode(next: typeof mode) { setMode(next); setError(''); setNotice(''); setPassword(''); }
  async function run(action: () => Promise<unknown>, close = true) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await action(); setPassword(''); if (close) setOpen(false); }
    catch (error) { setError(friendlyError(error)); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      if (mode === 'reset') {
        await sendPasswordResetEmail(firebaseAuth(), email.trim());
        setNotice('If an account uses this email, you’ll receive a password reset link. Check your inbox and spam folder.');
      } else if (mode === 'signup') await createUserWithEmailAndPassword(firebaseAuth(), email.trim(), password);
      else await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
    }, mode !== 'reset');
  }
  return <AuthContext.Provider value={{ user, loading, openAccount }}>
    {children}
    <Dialog open={open} onOpenChange={next => { if (!busy) { setOpen(next); setPassword(''); } }}>
      <DialogContent className="auth-dialog">
        <span className="eyebrow">YOUR ASTROIS ACCOUNT</span>
        <DialogTitle>{user ? 'Welcome back' : mode === 'signup' ? 'A little space for you' : mode === 'reset' ? 'Reset your password' : 'Welcome to Astrois'}</DialogTitle>
        <DialogDescription>{user ? user.email : mode === 'reset' ? 'We’ll send a link to your email.' : 'Sign in to begin your personal astrology conversation.'}</DialogDescription>
        {user ? <button className="button primary" disabled={busy} onClick={() => void run(() => signOut(firebaseAuth()))}>{busy ? 'Signing out…' : 'Sign out'}</button> : <>
          {mode !== 'reset' && <><button className="button secondary" disabled={busy || loading} onClick={() => void run(() => signInWithPopup(firebaseAuth(), new GoogleAuthProvider()))}>Continue with Google</button><div className="auth-divider">or continue with email</div></>}
          <form onSubmit={submit} className="auth-form">
            <label htmlFor="account-email">Email address</label>
            <input id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} placeholder="you@example.com" />
            {mode !== 'reset' && <><label htmlFor="account-password">Password</label><input id="account-password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 6 : 1} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'} /></>}
            <button className="button primary" disabled={busy || loading} type="submit">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</button>
          </form>
          {mode === 'signin' && <button className="auth-link" disabled={busy} onClick={() => changeMode('reset')}>Forgot password?</button>}
          <button className="auth-link" disabled={busy} onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
        </>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
      </DialogContent>
    </Dialog>
  </AuthContext.Provider>;
}
