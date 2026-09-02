# Climber Profile & Climbers Directory — Mobile App

Documentation for the public climber-profile feature (points, followers, radar-chart activity stats, climbers directory) in the Climbing In Georgia React Native app. Mirrors the equivalent feature on the climbing.ge website — see the backend's own `docs/CLIMBER_PROFILE.md` in the `climbing.ge` repo for the server-side implementation this is built against.

---

## Table of Contents

- [Overview](#overview)
- [Screens & Components](#screens--components)
- [API Endpoints](#api-endpoints)
- [The `data` / `editing_data` Payload Gotcha](#the-data--editing_data-payload-gotcha)
- [Social Links vs. Extra Links](#social-links-vs-extra-links)
- [Avatar Upload](#avatar-upload)
- [The Points System](#the-points-system)
- [Known Backend Issues](#known-backend-issues)
- [File Reference](#file-reference)

---

## Overview

Every registered user has a public "climber profile" — visible to anyone, logged in or not — showing their avatar, bio, social links, extra links, follower/following counts, a "points" activity score, a 4-axis radar chart (route reviews / MTP reviews / ascents / comments), and their 5 most recent items in each of those four categories. There's also a searchable/sortable directory of all climbers.

This is a thin client over a backend feature that already exists on climbing.ge (`/climber/:id` and `/climbers` on the guide SPA) — the mobile screens call the same public API the website uses, not a mobile-specific one.

---

## Screens & Components

| File | Role |
|------|------|
| `screens/user/UserProfileScreen.jsx` | "My Profile" — own profile summary (avatar, counts, radar, no activity list) + account menu (Options, My Comments, My Route Reviews, My Ascents, My Donations, Favorites, Logout) |
| `screens/user/ClimbersListScreen.jsx` | Full climbers directory — search (350ms debounce), "All (A-Z)" / "Top Active Users" sort toggle, infinite-scroll 2-column grid |
| `screens/user/ClimberProfileScreen.jsx` | Full-page view of one climber (`route.params.userId`), reached from a modal's "View Full Profile" |
| `screens/user/UserOptionsScreen.jsx` | Account settings hub — avatar picker, read-only profile summary + "Edit" button, My Links manager, "Change Password" button |
| `components/user/ClimberProfileContent.jsx` | The actual data-fetching + rendering component, shared by the three screens above. Fetches `GET /get_climber_profile/{userId}` itself. Props: `userId`, `compact` (smaller radar + shows "View Full Profile" button, used inside the modal), `hideActivity` (suppresses the recent-activity list, used for the "my profile" summary), `onAvatarPress`, `onViewFullProfile`, `onOpenClimbersList` |
| `components/user/ClimberProfileModal.jsx` | Bottom-sheet quick-view modal wrapping `ClimberProfileContent` (`compact`) — opened by tapping a card in the list, or the avatar in `UserProfileScreen` |
| `components/user/ClimberCard.jsx` | Grid card for the directory list — avatar, name, followers count, points |
| `components/user/RadarStatsChart.jsx` | Pure inline-SVG 4-axis radar chart (`react-native-svg`, no charting library). Axes run clockwise from the top: route reviews → MTP reviews → ascents → comments — must stay in that order to match the backend's `pointsOrderByExpression()` axis labels |
| `components/user/UserLinksManager.jsx` | CRUD list UI for the unlimited "extra links" feature (`/api/user_site`) |
| `components/user/FormModal.jsx` | Generic bottom-sheet form-modal chrome (backdrop, header, close button, scroll) shared by `EditProfileModal` and `ChangePasswordModal` |
| `components/user/EditProfileModal.jsx` | Profile-info edit form (name/surname/email/country/city/phone/bio) as a modal |
| `components/user/ChangePasswordModal.jsx` | Change-password form as a modal |
| `components/user/WriteOnWebsiteButton.jsx` | Shown on `UserCommentsScreen`/`UserRouteReviewsScreen` empty states and list headers — there is no in-app UI to submit a new comment or review, so this alerts the user to visit climbing.ge instead |
| `navigation/CustomDrawerContent.jsx` | Left drawer header — shows the app icon + "Welcome to Climb Georgia mobile app" when logged out; the user's avatar (tappable → `user_profile`) + "Hi {name}" when logged in. "Powered by climbing.ge" tagline always shows. No logout button here — logout lives in `UserProfileScreen`'s menu and navigates back to the `home` drawer screen afterward. |

Navigation registrations (`navigation/Navigation.jsx`): `climbers_list` → `ClimbersListScreen`, `climber_profile` → `ClimberProfileScreen` (param: `userId`).

---

## API Endpoints

All under `https://climbing.ge/api`.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/get_climber_profile/{user_id}` | None (fully public) | Full profile — see response shape below |
| `GET` | `/get_climber_profile/list` | Optional | `?page=&search=&sort=` — `sort=name` (default) or `sort=top_active`. Paginated, 24/page, standard Laravel paginator shape (`data`, `current_page`, `last_page`, ...). If a valid Bearer token is sent, the logged-in user's own row is excluded |
| `POST` | `/set_user_follow/follow/{user_id}` | Required | 422 if following yourself, 404 if target doesn't exist, idempotent |
| `DELETE` | `/set_user_follow/unfollow/{user_id}` | Required | Idempotent |
| `GET` | `/set_user_follow/follow_status/{user_id}` | Required | `{ following: bool, is_self: bool }` |
| `POST` | `/user/user_image_update/{user_id}` | Required | Multipart. Field name **must** be `image` |
| `POST` | `/get_options/user_info_update/{user_id}` | Required | See [payload gotcha](#the-data--editing_data-payload-gotcha) below |
| `GET` / `POST` / `PUT` / `DELETE` | `/user_site[/{id}]` | Required | Extra-links CRUD — see [Social Links vs. Extra Links](#social-links-vs-extra-links) |

### `GET /get_climber_profile/{user_id}` response shape

```json
{
  "user": {
    "id": 5, "name": "Nino", "surname": "Beridze", "image": "avatars/nino.webp",
    "my_bio": "...", "social_links": { "facebook": "...", "instagram": "..." },
    "created_at": "2025-03-01T10:00:00Z"
  },
  "points_total": 127,
  "followers_count": 12, "following_count": 8,
  "followers": [ { "id": 2, "name": "...", "surname": "...", "image": "..." } ],
  "following": [ ... ],
  "user_sites": [ { "id": 1, "url": "https://..." } ],
  "recent_comments": [ { "id": 1, "text": "...", "created_at": "...", "article_url_title": "...", "article_category": "..." } ],
  "recent_ascents": [ { "id": 1, "ascent_date": "...", "summit_title": "...", "summit_url_title": "..." } ],
  "recent_route_reviews": [ { "id": 1, "stars": 4, "text": "...", "created_at": "...", "route_name": "..." } ],
  "recent_mtp_reviews": [ { "id": 1, "stars": 5, "text": "...", "created_at": "...", "mtp_name": "..." } ],
  "comments_count": 34, "ascents_count": 7,
  "route_reviews_count": 3, "mtp_reviews_count": 0
}
```

`followers`/`following` are capped at 30 each — the mobile UI doesn't currently surface them (only the counts). Every `recent_*` array is capped at 5, most-recent-first.

---

## The `data` / `editing_data` Payload Gotcha

Two backend controllers on the profile-edit path expect the request body wrapped in a specific key, and silently write `null` for anything not present under that key — there is no validation error, so a mistake here is invisible until you notice the data didn't save:

- `POST /get_options/user_info_update/{id}` reads `$request->data['name']`, `$request->data['country']`, etc. — **every** field (`name`, `surname`, `email`, `country`, `city`, `phone_number`, `my_bio`, `social_links`) must be sent every time, wrapped under a top-level `data` key, even if unchanged. This bit us once already: the original mobile implementation posted fields flat and every profile save was quietly nulling out the user's name/surname/email/country/city/phone.
- `POST /user_site` reads `$request->data['url']` (same `data` wrapper) — but `PUT /user_site/{id}` reads `$request->editing_data['url']` (a *different* key, `editing_data`, not `data`). This is a real backend inconsistency, not a typo to normalize on the mobile side — match it exactly per verb.

`EditProfileModal.jsx` sends `social_links: user.social_links ?? {}` even though that form no longer has social-link inputs (see next section) — omitting the key entirely would have the same null-out effect as posting it empty.

---

## Social Links vs. Extra Links

Two separate, easily-confused features:

1. **`social_links`** — a fixed 4-key JSON column (`facebook`/`instagram`/`youtube`/`website`) on the `users` table, edited as part of `user_info_update`. The backend whitelists exactly those 4 keys; anything else is dropped. **Not editable from the app's Edit Profile form anymore** (removed per product decision — a user has no way to enter these from the app currently, only inherited from whatever they set on the website).
2. **Extra / "My Links"** — the `user_site` table, unlimited arbitrary URLs per user, full CRUD via `/api/user_site`. This is what `UserLinksManager.jsx` manages, and what the "I can add lots of links" ask was actually about.

Both are rendered on the public profile (`ClimberProfileContent.jsx`) — social links as small platform icons, extra links as hostname-only text (`new URL(url).hostname`, matching the website's display convention), each opened via `Linking.openURL`.

---

## Avatar Upload

`screens/user/UserOptionsScreen.jsx` reuses the `expo-image-picker` pattern already established in `screens/summit/SubmitAscentScreen.jsx` (camera or gallery → `compressImageIfNeeded` → `FormData`). Field name must be `image`. After a successful upload (or profile edit), call `refreshUser()` from `AuthContext` — it re-fetches `GET /auth_user` and refreshes the cached user so the new avatar/data shows immediately everywhere (drawer header, profile screen) without needing an app restart.

Avatar images live under `public/images/user_profil_img/` (note the backend's typo: `profil`, not `profile`) — see `IMG_BASES.userProfile` in `utils/api.js`.

---

## The Points System

Computed server-side on every request, not stored — see the backend's `config/user_points.php` for the per-action weights (route review, MTP review, ascent, comment). The mobile radar chart's 4 axes (`components/user/RadarStatsChart.jsx`) map 1:1 to the 4 categories that feed into `points_total`; changing the axis order would desync the chart from what the number actually represents.

---

## Known Backend Issues

These are real bugs on the `climbing.ge` backend, confirmed by hitting the live API directly — not something fixable from this repo. Recorded here so a future debugging session doesn't have to re-derive them from scratch.

1. **`get_user_comments` / `get_user_review` return 500 for a real mobile user.** Both controllers call the guard-less `auth()->user()`, which resolves against Laravel's *default* (session) guard — a Bearer-token-only request has no session, so `auth()->user()` is always `null` there, and the controller crashes dereferencing it. Verified live: `curl -H "Accept: application/json" https://climbing.ge/api/get_article/get_guide_comment/get_user_comments` → `500`, even though the equivalent `summit/my_ascents` call correctly returns `401` unauthenticated / real data when authenticated (it explicitly uses the `sanctum` guard). Fix (not applied here — needs the backend repo): add `->middleware('auth:sanctum')` to those two routes, matching how `my_ascents` is already declared.
2. **`get_user_mtp_reviews` has the same root cause but fails silently.** It uses `Auth::id()` instead of `auth()->user()`, which returns `null` instead of crashing, so the query always returns an empty array — for everyone, logged in or not. Same fix applies.
3. **No backend endpoint exists for listing a user's donation history.** `UserDonationsScreen.jsx` calls `GET /my_donations`, which has never had anything to return — the only donation-related backend routes are the one-shot payment flow (`create`/`callback`/`status/{id}`). This screen will show empty until a real "my donations" list endpoint is added server-side.
4. **`show()` (single climber profile) has no ban check**, unlike `list()` — a banned user's profile stays reachable by direct link. Documented for completeness; not something the mobile app can or should work around.

---

## File Reference

| File | Purpose |
|------|---------|
| `components/user/ClimberProfileContent.jsx` | Fetches + renders one climber's profile; shared by all three profile-viewing screens |
| `components/user/ClimberProfileModal.jsx` | Bottom-sheet quick view |
| `components/user/ClimberCard.jsx` | Directory grid card |
| `components/user/RadarStatsChart.jsx` | Inline-SVG radar chart |
| `components/user/UserLinksManager.jsx` | Extra-links CRUD |
| `components/user/FormModal.jsx` | Shared modal chrome |
| `components/user/EditProfileModal.jsx` | Profile-info edit modal |
| `components/user/ChangePasswordModal.jsx` | Password-change modal |
| `components/user/WriteOnWebsiteButton.jsx` | "Not supported in-app yet" CTA for comments/reviews |
| `screens/user/UserProfileScreen.jsx` | Own profile + account menu |
| `screens/user/ClimbersListScreen.jsx` | Directory |
| `screens/user/ClimberProfileScreen.jsx` | Full-page single profile |
| `screens/user/UserOptionsScreen.jsx` | Account settings hub |
| `utils/AuthContext.js` | `refreshUser()` — re-fetches and re-caches the authenticated user after a profile/avatar edit |
| `utils/api.js` | `IMG_BASES.userProfile` |

---

[Go back](../README.md)
