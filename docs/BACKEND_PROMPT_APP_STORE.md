# Backend prompt — App Store (iOS) requirements

Paste everything below the line into a Claude Code session opened in the
backend repo (Laravel, github.com/temo-123/climbing.ge).

---

The Climbing In Georgia mobile app (React Native / Expo, talks to
`https://climbing.ge/api/` with Sanctum Bearer tokens) is being submitted to
the Apple App Store. Apple's guideline 1.2 (user-generated content) requires
**blocking users** and **reporting content**, and some existing backend bugs
would break the reviewer's test. The app side is already built and calls the
endpoints below; it falls back gracefully while they don't exist. Please
implement them exactly as specified (paths, verbs, JSON shapes), following the
repo's existing conventions (controllers, services, route groups, migrations).

General rules for every new route:
- It must be a real API route returning JSON — this backend's SPA catch-all
  answers any unmatched path with the HTML shell (200), so verify each one with
  `curl` against a local server and check the body / `Content-Type`, not just
  the status.
- Resolve the user with the **`sanctum` guard explicitly** (`auth('sanctum')->user()`
  / `auth:sanctum` middleware), like `SummitController::my_ascents`. Guard-less
  `auth()->user()` resolves against the session guard and treats every Bearer
  request as logged-out (that is the bug in section 3).
- Respect the existing account gates (`is_banned`, `age_restricted`,
  `email_not_verified` 403 responses) for write actions, same as other writes.

## 1. Block users

Migration `user_blocks`: `id`, `user_id` (blocker, FK users, cascade delete),
`blocked_user_id` (FK users, cascade delete), timestamps, unique
(`user_id`, `blocked_user_id`).

Routes (`auth:sanctum`):

| Verb + path | Behaviour | Response |
|---|---|---|
| `GET /api/user_block/list` | Users the caller blocked, newest first | `200` JSON array of `{ id, name, surname, image, updated_at }` (`image` = the `user_profil_img` filename, same as on climber profiles). Empty array when none. |
| `POST /api/user_block/block/{user_id}` | Idempotent. Also deletes follow rows in **both** directions between the two users. | `200 { "status": "blocked" }`. `422` when blocking yourself, `404` unknown user. |
| `DELETE /api/user_block/unblock/{user_id}` | Idempotent. | `200 { "status": "unblocked" }` |

Server-side effects (the app already filters on the client, this makes it
hold on the website and for other devices too):
- When a request carries a token, exclude content authored by users the
  caller blocked from: `get_article/get_guide_comment/get_article_comments/{id}`
  (comments and their answers), route and multi-pitch review lists, route and
  multi-pitch ascent lists, `summit/ascents/{url_title}`,
  `get_partner_post/get_partner_posts`, `get_climber_profile/list`.
- A blocked user cannot follow the blocker (`set_user_follow/follow/{id}` →
  `403 { code: "blocked" }`) and cannot reply to the blocker's comments.
- `GET /api/get_climber_profile/{id}`: when the caller blocked this user, add
  `"blocked_by_me": true` to the response.

Also: `GET /api/summit/ascents/{url_title}` — include `user_id` on every
ascent row (null for guest ascents). The app needs it to hide a blocked
climber's summit ascents and to offer "Block" on them.

## 2. Content reports

Migration `content_reports`: `id`, `reporter_user_id` (nullable FK users,
null on delete), `reporter_email` (nullable string), `type` (string),
`content_id` (unsigned big int), `reason` (string), `details` (text,
nullable), `status` (string, default `open`; `open` / `resolved` /
`dismissed`), `handled_by` (nullable FK users), `handled_at` (nullable
timestamp), timestamps. Index (`type`, `content_id`).

Route: `POST /api/content_report` — **public** (guests can report), user
resolved optionally via `auth('sanctum')->user()`. Throttle `10,1` per IP.

Request body (JSON):

```json
{ "type": "route_review", "id": 123, "reason": "spam", "details": "optional text", "email": "optional@reporter" }
```

Validation:
- `type` in: `user`, `route_review`, `mtp_review`, `route_ascent`,
  `mtp_ascent`, `summit_ascent`, `partner_post`, `comment`
- `id` required integer; the referenced record must exist for that type
  (→ `404` otherwise)
- `reason` in: `hostile`, `off_topic`, `spam`, `sexual_content`, `anger`,
  `conflict`, `language`
- `details` nullable string max 500; `email` nullable email
- No reCAPTCHA on this endpoint (or, if you add it, use `verifySmart()` and
  fail open when the token is null).

Responses: `201 { "status": "reported" }`; when the same reporter (user id,
or email/IP for guests) already has an open report on the same `type` + `id`:
`200 { "status": "already_reported" }`; `422` validation errors in Laravel's
standard shape; `429` throttled.

On every new report, e-mail the moderators at **info@climbing.ge** (queued
mail): type, link to the content on the website / admin, reason, details,
reporter. Apple requires reports to be acted on within 24 hours.

Admin panel (`user.climbing.ge`, same style as the existing comment
complaints page): list of reports filterable by status, with actions *Hide /
delete content*, *Ban user* (existing ban flow), *Dismiss*; actions set
`status`, `handled_by`, `handled_at`.

## 3. Existing bugs the App Store reviewer would hit

1. **reCAPTCHA on reviews and comments:** `create_route_review`,
   `create_mtp_review` and `CommentService::create_comment` call plain
   `verify()`, which rejects the app's mobile-key tokens — the app gets
   `422 "reCAPTCHA verification failed"` on every review and comment. Switch
   them to `verifySmart()`, like the ascent endpoints already do.
2. **Wrong auth guard (500 / empty):**
   `GET /api/get_article/get_guide_comment/get_user_comments` and
   `GET /api/get_route/get_route_review/get_user_review` return **500** for a
   logged-in app user, and `GET /api/get_mtp_review/get_user_mtp_reviews`
   returns an empty `200`. They call guard-less `auth()->user()`. Use
   `auth('sanctum')->user()` and `auth:sanctum` middleware, as in
   `SummitController::my_ascents`.
3. **E-mail leak:** the public `get_article_comments` payload includes guest
   commenters' `email`. Remove it from the response (hide the attribute /
   select only needed columns).
4. **`account/delete`:** the app's delete-account form still tells social
   sign-ups the password can be left empty, but the endpoint always requires
   `password`. Either accept a missing password for accounts with no usable
   password set, or confirm it must stay required (the app copy will be fixed
   to match). Apple requires account deletion to work in-app.

## 4. Privacy policy (climbing.ge/privacy_policy, EN + KA)

Make sure the page states: data collected — e-mail, name / surname, phone
number, date of birth, country / city, profile photo, ascent photos, location
(only while recording a summit ascent, to verify the summit was reached),
comments / reviews / partner posts, Firebase Analytics usage data (no
advertising identifier); what it's used for; that data is not sold or used for
tracking; how to delete the account (app: Options → Delete account; website:
the same in the user panel) and what deletion removes; how to report content
and block users; contact: info@climbing.ge.

## 4b. Terms of use (climbing.ge/terms_of_use, EN + KA)

Apple also requires that users agree to terms which make clear there is **no
tolerance for objectionable content or abusive users** (the app's sign-up
already has the Terms checkbox). Add a section saying: no hateful, harassing,
sexual, violent or spam content; reported content is reviewed within 24
hours; offending content is removed and offending accounts are banned; users
can report content and block users.

Recommended: a simple server-side word filter (EN + KA blocklist in config)
on comments, reviews, ascent comments and partner posts. Reject with `422`
and a `data.text` field error, the same shape as other validation errors.

## 5. Optional: enforce "no guest posting" on the server

The app now requires login for comments and summit ascents on both
platforms (only the contact message stays open to guests). To make that rule
hold everywhere, including the website and old app versions, add
`auth:sanctum` (plus the usual account gates) to
`set_guide_comment_by_gest/create_comment/{article_id}` and
`summit/ascent/{summit_id}`, and use the authenticated user's name / e-mail
instead of the request body. Leave the contact-message endpoint public. Only
do this if the website should drop guest comments and guest ascents too.

## 6. Later (not needed for this submission)

**Sign in with Apple** — the app currently hides Google / Facebook on iOS
because guideline 4.8 requires Apple login next to them. When ready, add an
`apple` provider to the existing mobile OAuth flow (`/api/login/{provider}?mobile=1`
→ `/api/login/{provider}/mobile_callback` → `climbinggeorgia://oauth-callback`
→ `POST /api/login/mobile/exchange`, see the app's `docs/OAUTH.md`) and report
it in `GET /api/login/status` as `apple: true`. Apple may hide the user's
real e-mail (private relay address) and sends the name only on first login —
store it then.

## Deliverables

Migrations, models, controllers / services, routes, the mail, the admin page,
and a short summary listing each endpoint with a `curl` example and its real
response from a local run.
