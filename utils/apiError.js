import { isRecaptchaFailure } from './recaptcha';

// Human message for a failed API call. Laravel 422s carry field errors in
// `errors`, other failures a `message`; a missing response is a network
// problem (see feedback memory: the real native error lives on
// err.request.responseText — keep it for the detail line).
export function apiErrorMessage(err, t, fallbackKey = 'auth.generic_error') {
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
