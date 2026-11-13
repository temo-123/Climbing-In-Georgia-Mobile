// The web user panel's account_alerts() (services/menuBadges.js): what's left
// to fix in the profile. Each key maps to the field Options opens for it.
// Order = how they're listed.
export const ACCOUNT_ALERT_KEYS = ['email', 'name', 'location', 'birthday', 'image'];

const blank = (v) => !String(v ?? '').trim();

export function accountAlerts(user) {
  if (!user) return [];
  const out = [];
  if (!user.email_verified_at) out.push('email');
  if (blank(user.name) || blank(user.surname)) out.push('name');
  if (blank(user.country) || blank(user.city)) out.push('location');
  if (!user.birthday) out.push('birthday');
  if (!user.image) out.push('image');
  return out;
}
