# iOS App Store submission

Status of the iOS developer's checklist (2026-11-24), plus the listing text
and reviewer notes. Backend changes: round 1
[`BACKEND_PROMPT_APP_STORE.md`](BACKEND_PROMPT_APP_STORE.md) (done, live),
round 2 [`BACKEND_PROMPT_APP_STORE_2.md`](BACKEND_PROMPT_APP_STORE_2.md) (required items done; optional 3–5 open).

## Checklist at a glance

| Item from the iOS developer | Status |
|---|---|
| Hide Google / Facebook on iOS | ✅ app |
| Block user | ✅ app + API (`user_block/*`, server-side filtering) |
| Report → endpoint | ✅ app + API (`content_report`, mail to info@climbing.ge, admin page) |
| No guest comments | ✅ app, both platforms (summit ascents too) |
| `supportsTablet: false`, `ka` localization | ✅ app.json |
| Remove `react-native-fbsdk-next` | ✅ (and the unused Google Sign-In SDK) |
| Firebase iOS app `ge.climbing.app` | ✅ `GoogleService-Info.plist` is the iOS app (`…:ios:…`) of the same project as Android, bundle ID matches |
| Expo collaborator | ⏳ you: expo.dev → Members → invite (Admin) |
| Test account with sample data | ⏳ you: create and send privately |
| Test QR code | ✅ `docs/app_store/test_summit_qr_agmashenebeli.png` + review note below |
| App name | ⏳ you decide ("Climbing in Georgia" recommended) |
| Subtitle, descriptions EN/KA, keywords, category | ✅ drafts below |
| Privacy policy content | ✅ live, EN + KA (all data types, deletion, block / report) |
| Terms of Use: no tolerance for objectionable content | ✅ live, EN + KA (`guide_terms_of_use`, what climbing.ge/terms_of_use shows; also summit / user subdomains) |
| Contact form works from the app | ✅ `MessageController` uses `verifySmart` (backend `9183ee02`) |
| Support URL / contact | ✅ climbing.ge, info@climbing.ge |
| App icon 1024×1024, opaque | ⚠️ upscaled placeholder: replace with an export of the original artwork |
| Screenshots | iOS developer (simulator) |
| Extra, found in the audit: donations (IAP rule), Firebase iOS build setting | ✅ app (see table below) |

## 1. Code changes — done in the app

| Item | Where | Notes |
|------|-------|-------|
| Google / Facebook buttons hidden on iOS | `utils/storeRules.js` (`SOCIAL_LOGIN_ENABLED`), used by `SocialLoginButtons.jsx` | Guideline 4.8: third-party login needs Sign in with Apple next to it. iOS keeps e-mail / password. Android unchanged. Turn it back on once Sign in with Apple exists (app + backend). |
| Block user | `utils/blockedUsers.js`, `components/moderation/ModerationActions.jsx`, `components/user/BlockedUsersManager.jsx` | "Block" on comments, route / multi-pitch reviews, route / multi-pitch ascents, summit ascents, partner posts and climber profiles. A blocked climber's content is hidden everywhere (comments + replies, reviews, ascents, summit ascents + photos, partner posts, climbers directory, profile). Unblock: on their profile, or Options → "Blocked climbers". Stored on the device per account and synced with `/api/user_block/*` once the backend has it (works device-only until then). |
| Report | `components/moderation/ReportSheet.jsx`, `components/ReportButton.jsx` | In-app sheet (reason + details) → `POST /api/content_report`. Falls back to a pre-filled e-mail to info@climbing.ge while that endpoint doesn't exist. Article comments keep their existing `add_comment_complaint` endpoint. The sheet tells users reports are handled within 24 h. |
| Login required for every form (both platforms) | `ArticleComments.jsx`, `screens/summit/SubmitAscentScreen.jsx`, `ReportSheet.jsx` | Comments and summit ascents need an account (guests see a Log in card). Guests can still report, but by pre-filled e-mail instead of the API. Only About → contact message (and donations) stay open to guests. Reviews, route ascents, area conditions and partner posts already required login. |
| `supportsTablet: false` | `app.json` | iPhone only → no iPad screenshots / testing. |
| `CFBundleLocalizations: ["en", "ka"]` | `app.json` | |
| `react-native-fbsdk-next` removed | `package.json` | Also removed `@react-native-google-signin/google-signin` — unused too (CLAUDE.md: don't reintroduce either). |
| 1024×1024 opaque iOS icon | `assets/icon-ios-1024.png`, `app.json` → `ios.icon` | **Upscaled** from the 512×512 `assets/icon.png` (flattened on white). Replace it with an export from the original artwork for a sharp icon — same path, no other change needed. |

| Donations hidden on iOS | `utils/storeRules.js` (`DONATIONS_ENABLED`): floating button in `App.js`, "My donations" in `UserProfileScreen.jsx` | Guidelines 3.1.1 / 3.2.2: money paid to the developer inside an app must use In-App Purchase; only Apple-approved nonprofits may take donations outside it. The card checkout would be rejected. Android unchanged. |
| Firebase iOS build | `app.json` → `expo-build-properties` `ios.useFrameworks: "static"` | Required by `@react-native-firebase` on iOS; without it the iOS build fails. Android unaffected. |
| No ad-network / advertising ID | `firebase.json` | Added `google_analytics_registration_with_ad_network_enabled: false` (AD_ID collection was already off). The app never shows the App Tracking Transparency prompt, so answer "No" to tracking in App Privacy. |
| Photo permission text | `app.json` | One specific purpose string (ascent photo / profile picture) in both places; removed the unused "save photos" permission (the app never saves to the library). |
| Delete-account password hint | `locales/*.json` | Said social sign-ups could leave the password empty; the backend always requires it. |

Checked and fine: account deletion in-app (Options → Delete account), Terms +
Privacy checkboxes at sign-up, permissions asked only when a feature needs
them (no prompt at launch), no mention of Android / Google Play in the UI,
no plain-`http` requests, `ITSAppUsesNonExemptEncryption: false` (RSA is only
used to protect the login password — exempt), libraries ship their own iOS
privacy manifests, guests can browse the guidebook without an account.

Test before submitting: `eas build -p ios --profile preview` (or a simulator
build) — log in, block someone from a comment, check their content
disappears, unblock in Options, send a report.

## 2. Firebase and Expo — manual steps (you)

- **Firebase:** `GoogleService-Info.plist` in the repo already has
  `BUNDLE_ID = ge.climbing.app`. In the Firebase console → Project settings,
  check that this iOS app is registered there and that the plist was
  downloaded from *that* app (same `GOOGLE_APP_ID`). If not, register
  `ge.climbing.app`, download a fresh plist, replace the file.
- **Expo:** expo.dev → project `climbing-in-georgia-mobile` (owner
  `temo-123`) → Settings → Members → invite the iOS developer (role
  *Developer* or *Admin* — Admin is needed to manage iOS credentials).

## 3. For App Review

**Test account** — create it yourself on the live site/app (verified e-mail,
adult birthday), log a few ascents, add favourites, and send the
credentials to the iOS developer privately. Don't put them in this repo.

**QR scanner** — test QR: [`app_store/test_summit_qr_agmashenebeli.png`](app_store/test_summit_qr_agmashenebeli.png)
(encodes `http://summit.climbing.ge/summit/agmashenebeli?make_ascent=12`,
the same format as the plates on real summits). Review note text:

> Summit QR codes are physical plates on mountain summits in Georgia. To test:
> log in with the test account → Summits → QR scanner → scan the attached QR
> image from another screen. The app opens "Record ascent" for Agmashenebeli
> peak. GPS verification will show "not verified" because you are not on the
> summit — the ascent is still recorded. You can also open any summit from the
> Summits list and tap "Record ascent" without scanning.

Ascents the reviewer records will be real rows — delete them afterwards.

**User-generated content note** (paste into Review Notes):

> Users can report any comment, review, ascent, partner post or profile
> (flag icon → reason), and block any user (their content is then hidden;
> manage in Options → Blocked climbers). Only signed-in users can post.
> Moderators review reports within 24 hours at info@climbing.ge.

## 4. Listing

**App name** — decision needed: app.json says "Climb Georgia", Google Play says
"Climbing In Georgia". Recommendation: **"Climbing in Georgia"** on both stores
(same brand as the website and Play; "climbing" + "Georgia" are what people
search). Changing `expo.name` changes the home-screen label too.

**Subtitle** (≤ 30)
- EN: `Climbing guide for Georgia` (26)
- KA: `საქართველოს ცოცვის გზამკვლევი` (29)

**Keywords** (≤ 100, comma-separated, no spaces):
`climbing,bouldering,crag,topo,ice,mountaineering,caucasus,kazbegi,svaneti,routes,guidebook,summit` (97)

**Category:** primary **Sports**, secondary **Travel**.

**Support URL:** https://climbing.ge · **Contact:** info@climbing.ge ·
**Privacy policy:** https://climbing.ge/privacy_policy

**Description (EN)**

> The climbing guidebook for Georgia, from the team behind climbing.ge.
>
> CRAGS AND ROUTES
> Every outdoor climbing area with sector topos, route tables (grade, height,
> bolts), multi-pitch routes and boulders. Find a route by grade or style
> across a whole area and see which ones you've already climbed.
>
> ICE, MOUNTAINS AND GYMS
> Ice climbing spots, mountaineering routes and summits of the Caucasus, and
> indoor gyms with opening hours and a live "open now" badge.
>
> YOUR LOGBOOK
> Log route and multi-pitch ascents, rate and review routes, and record summit
> ascents by scanning the QR plate on top — with GPS verification and a photo.
>
> OFFLINE
> Download the guidebook and use topos, routes and summits with no signal.
>
> COMMUNITY
> Find a climbing partner for your next trip, follow other climbers, see
> events and save your favourite areas.
>
> Available in English and Georgian.

**Description (KA)**

> საქართველოს ცოცვის გზამკვლევი climbing.ge-ის გუნდისგან.
>
> საცოცი რეგიონები და მარშრუტები
> ყველა საცოცი რეგიონი სექტორების ტოპოებით, მარშრუტების ცხრილებით (სირთულე,
> სიმაღლე, ბოლტები), მულტიპიჩებითა და ბოლდერებით. მოძებნეთ მარშრუტი
> სირთულით ან სტილით მთელ რეგიონში და ნახეთ, რომელი გაქვთ უკვე გავლილი.
>
> ყინული, მთები და დარბაზები
> ყინულზე ცოცვის ადგილები, კავკასიონის სამთო მარშრუტები და მწვერვალები,
> საცოცი დარბაზები სამუშაო საათებით და „ახლა ღიაა“ ნიშნით.
>
> თქვენი ლოგბუქი
> აღნიშნეთ მარშრუტებსა და მულტიპიჩებზე ასვლები, შეაფასეთ მარშრუტები და
> დააფიქსირეთ მწვერვალზე ასვლა მწვერვალის QR დაფის დასკანერებით — GPS
> დადასტურებითა და ფოტოთი.
>
> ოფლაინ რეჟიმი
> ჩამოტვირთეთ გზამკვლევი და გამოიყენეთ ტოპოები, მარშრუტები და მწვერვალები
> ინტერნეტის გარეშე.
>
> საზოგადოება
> იპოვეთ პარტნიორი შემდეგი ასვლისთვის, გამოიწერეთ სხვა მცოცავები, ნახეთ
> ღონისძიებები და შეინახეთ რჩეული რეგიონები.
>
> ხელმისაწვდომია ქართულ და ინგლისურ ენებზე.

**Privacy policy must mention** (check climbing.ge/privacy_policy — the
backend prompt asks for this too): e-mail, name / surname, phone, date of
birth, country / city, profile photo and ascent photos, location (only while
recording a summit ascent, for GPS verification), Firebase Analytics usage
data (no advertising ID — `firebase.json` disables AD_ID collection),
comments / reviews / partner posts, how to delete the account (in the app:
Options → Delete account), and the contact e-mail.

**App Privacy ("nutrition label") in App Store Connect:** Contact info (name,
e-mail, phone), Identifiers (user ID), User content (photos, comments /
reviews), Location (precise, app functionality only), Usage data / Diagnostics
(Firebase Analytics, analytics). Linked to the user, **not** used for
tracking.

**Age rating questionnaire:** user-generated content with reporting /
blocking → expect **12+**. "Unrestricted web access": No (the app opens only
climbing.ge pages and links climbers post on their profiles).

**Screenshots:** the iOS developer captures them from the simulator
(6.9", 1320×2868).
