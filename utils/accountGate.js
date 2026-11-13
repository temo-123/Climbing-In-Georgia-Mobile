import api, { API_BASE_URL } from './api';

// Global API error handling for the account states the backend enforces on
// every write (docs in the web repo: FUNCTIONS_DOCS/global/age_restriction.md,
// email_verification.md). One axios interceptor classifies the refusal and
// emits an event; AccountGateHost (the sheets / screens) and AuthContext (the
// session) listen. Precedence, same as the backend: banned → age → e-mail.
//
// The rejected error is flagged `gateHandled`, so a screen's own error text /
// toast can skip it (apiErrorMessage() returns '' for it).

const listeners = new Set();

export function onGateEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitGateEvent(type, data) {
  listeners.forEach((fn) => {
    try { fn(type, data); } catch {}
  });
}

// 'banned' | 'age_restricted' | 'email_not_verified' | null
export function gateCode(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  if (status !== 403 || !data || typeof data !== 'object') return null;
  if (data.is_banned) return 'banned';
  if (data.code === 'age_restricted') return 'age_restricted';
  if (data.code === 'email_not_verified') return 'email_not_verified';
  return null;
}

export function isGateHandled(err) {
  return !!err?.gateHandled;
}

function sentWithToken(config) {
  const h = config?.headers;
  if (!h) return false;
  const value = typeof h.get === 'function' ? h.get('Authorization') : (h.Authorization || h.authorization);
  return !!value;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const code = gateCode(err);
    if (code) {
      err.gateHandled = true;
      emitGateEvent(code, err.response.data);
    } else if (err?.response?.status === 401 && sentWithToken(err.config) && !err.config?.skipAuthGate) {
      // AuthContext double-checks with /auth_user before dropping the session,
      // so one endpoint answering 401 by mistake doesn't log anybody out.
      emitGateEvent('unauthorized');
    }
    return Promise.reject(err);
  }
);

// GET /email/resend → { message: 'Verification email sent' | 'Email already verified' }
// (429 when too frequent). One shared 60 s cooldown for the bar, the sheet and
// the verify screen, so switching between them doesn't reset it.
const RESEND_COOLDOWN_MS = 60000;
let resendUntil = 0;
const cooldownListeners = new Set();

export function resendCooldownLeft() {
  return Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000));
}

export function onResendCooldown(fn) {
  cooldownListeners.add(fn);
  return () => cooldownListeners.delete(fn);
}

export function startResendCooldown() {
  resendUntil = Date.now() + RESEND_COOLDOWN_MS;
  cooldownListeners.forEach((fn) => fn());
}

// → 'sent' | 'already' | 'error'
export async function resendVerificationEmail() {
  try {
    const { data } = await api.get(`${API_BASE_URL}/email/resend`);
    if (/already/i.test(data?.message || '')) return 'already';
    startResendCooldown();
    return 'sent';
  } catch (err) {
    if (err?.response?.status === 429) startResendCooldown();
    return 'error';
  }
}
