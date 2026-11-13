import { isRecaptchaFailure } from './recaptcha';
import { isGateHandled } from './accountGate';

// Human message for a failed API call. Laravel 422s carry field errors in
// `errors`, other failures a `message`; a missing response is a network
// problem (see feedback memory: the real native error lives on
// err.request.responseText — keep it for the detail line).
//
// Returns '' for refusals the global account gate already explained (banned,
// age restriction, unverified e-mail — see utils/accountGate.js), so screens
// don't stack their own error on top of the gate's sheet.
export function apiErrorMessage(err, t, fallbackKey = 'auth.generic_error') {
  if (isGateHandled(err)) return '';
  if (isRecaptchaFailure(err)) return t('climb.recaptcha_failed');
  const data = err?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).flat().join('\n');
  }
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (err?.isAxiosError && !err.response) {
    const native = err?.request?.responseText;
    return native ? `${t('error.request_failed')}\n${native}` : t('error.request_failed');
  }
  return t(fallbackKey);
}

// Laravel 422 field errors as { field: 'first message' }. Keys keep the
// server's dotted names (`data.text`, `birthday`…).
export function fieldErrors(err) {
  const errs = err?.response?.status === 422 ? err?.response?.data?.errors : null;
  if (!errs || typeof errs !== 'object') return {};
  return Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));
}
