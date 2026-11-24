# Backend prompt — App Store follow-up (round 2)

Round 1 (`BACKEND_PROMPT_APP_STORE.md`) is done and live (commit `5e5a393b`):
blocks, content reports, summit `user_id`, reCAPTCHA on reviews / comments,
sanctum guard on the user lists, comment e-mail leak, account delete,
privacy policy. Checked against the live API on 2026-11-24. This prompt is
what is still missing. Paste everything below the line into a Claude Code
session in the backend repo.

---

The Climbing In Georgia mobile app is going to Apple App Review. The round-1
App Store work (user blocks, content reports, privacy policy, see
`docs/FUNCTIONS_DOCS/user/user_blocks.md` and `content_reports.md`) is
deployed. Two things are still missing; both are **required** for the review.
Items 3–5 are optional. Follow the repo's existing conventions, and verify
each change with `curl` against a local server (JSON body / `Content-Type`,
not just the status code).

## 1. Required: contact form rejects the app's reCAPTCHA tokens

`app/Http/Controllers/Api/Meil/MessageController.php::store()` (`POST /api/message`,
the website's and the app's "Contact us" form) checks the token with plain
`$this->captcha->verify(...)`. The app mints its tokens with the **mobile**
site key, which only `verifySmart()` accepts, so every message sent from the
app fails with `422 { errors: { recaptcha: [...] } }`. The app then retries
with `recaptcha_token: null`, which fails on `!$request->recaptcha_token`.
That form is the only one guests can still use in the app, so the reviewer may
well try it.

Fix: use `verifySmart($request->recaptcha_token, $request->ip())`, the same
pattern as `CommentService::create_comment` and the ascent / review
controllers. Keep the `isConfigured()` fail-open behaviour. Add a feature
test (mobile-secret token accepted, bad token rejected), mirroring how the
existing reCAPTCHA tests fake Google's siteverify.

While you're there, grep for any other `->verify(` call on an endpoint the
mobile app uses, and switch it the same way. Web-only forms can stay as they
are: `ServiceFollowing`, `UserTourReservationController` and
`ReCaptchaController` are not called by the app.

## 2. Required: Terms of Use need a user-content section

Apple guideline 1.2 requires that users agree to terms (the app's sign-up has
the Terms checkbox) which make clear there is **no tolerance for objectionable
content or abusive users**. The live `terms_of_use` text
(`GET /api/get_site_data/get_site_locale_data_for_site/{en|ka}`) is only two
sentences about climbing risk.

Add a migration in the same style as
`2026_11_24_100400_update_privacy_policy_for_app_store.php` that **appends**
this section to the `terms_of_use` text in both locales, keeping the existing
text and HTML formatting. It must be idempotent: skip it if the heading is
already present. If the website's `/terms_of_use` page reads a different
record (e.g. the `guide_terms_of_use` slug from `TermsOfUseSeeder`), update
the one the page actually renders. Also update the seeder so a fresh install
gets the same text.

EN:

> **User content and conduct**
> By creating an account you agree not to post content that is offensive, hateful, harassing, sexual, violent, illegal or spam, and not to impersonate or abuse other users. There is no tolerance for objectionable content or abusive users.
> Every comment, review, ascent, partner post and profile can be reported, and any user can be blocked. Moderators review reports within 24 hours: content that breaks these rules is removed and the accounts that post it are suspended or banned.
> Contact: info@climbing.ge

KA:

> **მომხმარებლის კონტენტი და ქცევა**
> ანგარიშის შექმნით თქვენ თანხმდებით, რომ არ გამოაქვეყნებთ შეურაცხმყოფელ, სიძულვილის შემცველ, შევიწროებით, სექსუალური, ძალადობრივი, უკანონო ან სპამ კონტენტს და არ შეურაცხყოფთ ან არ განასახიერებთ სხვა მომხმარებლებს. შეურაცხმყოფელი კონტენტისა და მოძალადე მომხმარებლების მიმართ ტოლერანტობა არ არსებობს.
> ყველა კომენტარის, შეფასების, ასვლის, პარტნიორის განცხადებისა და პროფილის დარეპორტება შესაძლებელია, ასევე ნებისმიერი მომხმარებლის დაბლოკვა. მოდერატორები შეტყობინებებს 24 საათში განიხილავენ: წესების დამრღვევი კონტენტი იშლება, ხოლო მისი ავტორის ანგარიში შეჩერდება ან დაიბლოკება.
> კონტაქტი: info@climbing.ge

## 3. Optional: `updated_at` on summit ascent rows

`GET /api/summit/ascents/{url_title}` rows have no `updated_at`. The app
versions every image URL with the record's `updated_at` (`?v=`) so a replaced
photo isn't served stale from Cloudflare / device caches. Add `updated_at` to
each row (and to the `recent_ascents` items of `get_climber_profile/{id}` if
they carry a photo).

## 4. Optional: no guest posting on the server

The app now requires login for comments and summit ascents on both
platforms. The API still accepts guests:
`set_guide_comment_by_gest/create_comment/{article_id}` and
`summit/ascent/{summit_id}` answer `422` (validation) to an anonymous request,
not `401`. If the website should drop guest posting too, add `auth:sanctum`
plus the usual account gates to both, and take name / surname / e-mail from
the authenticated user. Leave `POST /api/message` and `POST /api/content_report`
public. Skip this if the website should keep guest comments and guest
ascents.

## 5. Optional: word filter

A small EN + KA blocklist (config file) checked on comment text, review text,
ascent comments and partner-post notes. Reject with `422` and a field error
in Laravel's standard shape (`data.text` for comments, the field name
elsewhere), so the app shows it under the field.

## Later

Sign in with Apple. The iOS app hides Google / Facebook until it exists (App
Store guideline 4.8). Add an `apple` provider to the existing mobile OAuth
flow and report `apple: true` in `GET /api/login/status`.

## Deliverables

The changes, tests, and a short summary with a `curl` example and the real
response for items 1 and 2.
