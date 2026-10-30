import { API_BASE_URL, IMG_BASES } from '../../utils/api';

// Endpoints + options for the two climbable things: single-pitch routes
// (sport / boulder / ice) and multi-pitch routes (MTPs). Same flows as the
// website's route / MTP modals (GUIDBOOK.md → Route ascents, MTP ascents,
// Route & MTP reviews). reCAPTCHA action names match the website's.
export const KINDS = {
  route: {
    detail: (id) => `${API_BASE_URL}/get_route/get_route_for_modal/${id}`,
    ascents: (id) => `${API_BASE_URL}/get_route_ascent/get_route_ascents/${id}`,
    createAscent: (id) => `${API_BASE_URL}/set_route_ascent/create_route_ascent/${id}`,
    reviews: (id) => `${API_BASE_URL}/get_route/get_route_review/get_all_route_reviews/${id}`,
    createReview: (id) => `${API_BASE_URL}/set_route/set_route_review/create_route_review/${id}`,
    ascentAction: 'route_ascent',
    reviewAction: 'route_review',
    photoBase: IMG_BASES.routeAscent,
    i18n: 'site.guide.route_ascent',
  },
  mtp: {
    detail: (id) => `${API_BASE_URL}/get_mtp/get_mtp_for_modal/${id}`,
    ascents: (id) => `${API_BASE_URL}/get_mtp_ascent/get_mtp_ascents/${id}`,
    createAscent: (id) => `${API_BASE_URL}/set_mtp_ascent/create_mtp_ascent/${id}`,
    reviews: (id) => `${API_BASE_URL}/get_mtp_review/get_all_mtp_reviews/${id}`,
    createReview: (id) => `${API_BASE_URL}/set_mtp_review/create_mtp_review/${id}`,
    ascentAction: 'mtp_ascent',
    reviewAction: 'mtp_review',
    photoBase: IMG_BASES.mtpAscent,
    i18n: 'site.guide.mtp_ascent',
  },
};

export const ROUTE_STYLES = ['onsight', 'flash', 'redpoint', 'toprope'];
// Boulders have no onsight in practice — flash / send / top rope only.
export const BOULDER_STYLES = ['flash', 'redpoint', 'toprope'];
export const MTP_STYLES = ['lead', 'second', 'alternate'];

export function isBoulder(route) {
  return route?.category === 'bouldering' || /^V/i.test(route?.grade || '');
}
