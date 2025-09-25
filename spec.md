# Friday Prayer Registration — **Next.js** Specification (No Zod, Simplified QR)

## 0. Purpose

Lightweight web app to register attendees for Friday prayers. Admin defines 1..n prayer slots (time, capacity, activation). Users register in one click, optionally add companions, receive a QR code saved locally. Four languages: **de, ar, en, fr**. Runs on **Next.js (App Router)**.

---

## 1. Scope (MVP)

* Public site to register for upcoming Friday prayers.
* Admin dashboard to create/manage prayers and monitor counts.
* Automatic registration window: **from Saturday 00:00 (Europe/Berlin) until the start time**.
* QR code generation per registration containing **prayer id (pid)** and **date**.
* Local persistence in browser (localStorage) so users can present QR offline.

Important: 
On homepage:
Just show the prayer upcoming prayer and a "prominent" register + number in the homepage. When the user register, then we get the qr code displayed, the prayer date and the number of attendants and a  cancel button. If use clicks cancels, then we have the old register. The page is targeted mainly to smartphone views but can be opened from bigger viwers so it should be responsive

The home page should be centered. The available places should be shown only if we have still less than 20 available places and don't show the total number of places. Add Multlanguage support. Display with the default language if the the browser. Add a link to facebook and impressum pages. For impressum, create one typical impressum page for germany. 

Add the EU required cookie accept message that appears the first time
Admin:
The admin should be able to add or remove a new prayer with corresponding start time,  and modify of available places 
---

## 2. Roles

### User

* See list of upcoming prayers with status: **Open / Full / Closed** and remaining seats.
* Register for exactly one prayer per device.
* Adjust companions (±) within capacity until the start time.
* Cancel registration before the start time.
* View/download QR; QR persists in localStorage; works offline.

### Admin

* Create/edit/delete prayer slots (datetime, capacity, location, notes).
* Toggle manual activation (Open/Closed) and set auto-activation.
* See live counters and registrations; export CSV.

---

## 3. Languages & Localization

* UI languages: **en, de, fr, ar** (Arabic is RTL).
* Language switcher on all public pages.
* Localized copy for actions, system messages, and statuses.
* Dates/times shown in **Europe/Berlin** with localized formatting.

---

## 4. Registration Rules

* **Window**: Open automatically from **Saturday 00:00 (Europe/Berlin)** until `prayer.datetime`.
  Admin can override with manual Open/Closed.
* **Capacity**: Hard cap on total **people = 1 + companions**.
* **Per device**: Exactly one active registration per device per prayer.
* **Companions**: Default 0, min 0, max `max_companions` (default 4).
* **Cancellation**: Allowed until start time; frees seats immediately.
* **After start**: Registrations become read-only; no edits/cancel.
* **Offline**: If server is unreachable but a QR exists locally, the user can still display it.

---

## 5. QR Code Requirements

* Generated on successful registration.
* **Contents** (JSON string before encoding to QR):

  ```json
  {
    "pid": "<uuid-v4>",        // prayer id
    "date": "<YYYY-MM-DD>",    // registration date (server-side, Europe/Berlin)
    "ppl": <int>               // total people (1 + companions)
  }
  ```
* QR is saved in localStorage and rendered as an image.
* **No signature, no steward validation**. QR is just a **local proof**.

---

## 6. Persistence (Client)

* `localStorage["fridayReg:<prayer_id>"] = { people, qr_json, lastSeenISO, lang }`
* `localStorage["fridayReg:deviceKey"] = "<random-opaque-128bit>"`

---

## 7. Data Model (Server)

**Tables** (PostgreSQL):

* `prayers(id, title, datetime, capacity, location, notes, active, auto_activation, created_at, updated_at)`
* `registrations(id, prayer_id, created_at, updated_at, people, status['confirmed','canceled'], device_key, lang, qr_payload_text)`
* `admin_users(id, email, password_hash, totp_secret, created_at, active)`
* `settings(key, value_jsonb)`

**Constraints**

* Partial unique index: one active registration per `(prayer_id, device_key)` where `status='confirmed'`.
* Trigger to enforce capacity (sum of active `people` ≤ `capacity`).

---

## 8. Pages & UX (Next.js)

### Public

* `/` (Home): Cards for upcoming prayers; status chip; remaining; **\[−] \[count] \[+] \[Register]**.
* `/confirm/<reg_id>`: Shows QR, time, people, location; buttons **Show full screen**, **Edit companions**, **Cancel**.
* `/qr/<reg_id>`: Fullscreen QR view.

### Admin

* `/admin` (Dashboard): Table of prayers with counts and quick actions.
* `/admin/prayers/new` & `/admin/prayers/[id]`: Create/edit.
* `/admin/prayers/[id]/regs`: Live list, export CSV.

---

## 9. API (Route Handlers)

Base: `/api`

### Public

* `GET /api/prayers` → `[{ id, title, datetime, location, capacity, remaining, status }]`
* `POST /api/registrations`
  **body** `{ prayer_id, people, device_key, lang }`
  **returns** `{ qr: { pid, date, ppl } }`
* `PATCH /api/registrations/:id`
  **body** `{ people }` → `{ ok }`
* `DELETE /api/registrations/:id` → `{ ok }`

### Admin (auth required)

* `GET /api/admin/prayers` → list with counters
* `POST /api/admin/prayers` → create
* `PATCH /api/admin/prayers/:id` → update fields incl. activation
* `GET /api/admin/prayers/:id/registrations` → list regs
* `POST /api/admin/prayers/:id/export` → CSV

---

## 10. Business Logic Details

* **Auto-activation**: computed using server time `Europe/Berlin`.
  `isOpen = (active || (auto_activation && now ∈ [Sat00:00, prayer.datetime))) && remaining>0`.
* **Capacity race**: Registration create/edit executed within a DB transaction; trigger + re-check before commit.
* **Companion edit**: Allowed only while open; same capacity rules.
* **Cancellation**: Soft change to `status='canceled'`; frees seats and releases device lock.

---

## 11. Security & Privacy

* No PII by default. (Optional name/phone can be added later.)
* CSRF protection for state-changing endpoints.
* Rate limiting on register/cancel endpoints.
* Admin auth: email + password (bcrypt/argon2) and optional TOTP.
* CORS restricted to app origin.
* QR contains no sensitive data.

---

## 12. Performance & Offline

* PWA installable; cache shell + `/confirm/<id>` for offline QR viewing.
* Home list is network-first with fallback to stale cache.
* API calls are small and idempotent.
* Page load target: <2s first load, <1s subsequent.

---

## 13. Acceptance Criteria (MVP)

1. Admin can create 2+ Friday prayer slots with capacities and auto-activation enabled.
2. From **Saturday 00:00 Europe/Berlin**, users can register until each start time.
3. User can add companions, receive a QR containing **pid + date (+ppl)**, stored locally.
4. Admin dashboard shows live remaining seats and can deactivate/activate manually.
5. App usable in **en, de, fr, ar (RTL)**; Arabic renders correctly.
6. Offline: previously generated QR viewable without network.

---

## 14. Tech Stack Summary

* **Next.js (App Router)**, React, Server Actions/Route Handlers.
* i18n via **next-intl** or native routing (no zod).
* **PostgreSQL**, Prisma (or pg driver).
* **qrcode** npm package for client/server QR generation.
* PWA (service worker + manifest) for offline QR display.

---
## 15. created already db:
CREATE DATABASE dmk; 
CREATE USER dmk WITH PASSWORD 'dmk';

GRANT ALL PRIVILEGES ON DATABASE dmk TO dmk;

---
**End of spec (Simplified QR)**
