# British Auction RFQ System — Phase-wise Workplan
> Two codebases: Node.js + Express backend, Next.js (App Router) frontend.

---

## Project Structure Overview

```
/backend                         (Node.js + Express)
  /src
    /prisma                      (already done — schema applied, DB connected)
    /lib
      prisma.ts                  (Prisma client singleton)
      auth.ts                    (JWT helpers)
      auction-engine.ts          (ALL auction business logic)
      censor.ts                  (Username censoring)
      validate.ts                (Shared validation functions)
    /middleware
      auth.middleware.ts         (Express middleware to verify JWT)
      role.middleware.ts         (Express middleware to enforce role)
    /routes
      auth.routes.ts
      rfq.routes.ts
      bid.routes.ts
    /controllers
      auth.controller.ts
      rfq.controller.ts
      bid.controller.ts
    app.ts                       (Express app setup)
    server.ts                    (Entry point, starts the server)
  .env

/frontend                        (Next.js App Router — already scaffolded)
  /app
    /login/page.tsx
    /register/page.tsx
    /buyer
      /dashboard/page.tsx
      /rfq
        /create/page.tsx
        /[rfqId]/page.tsx
    /supplier
      /dashboard/page.tsx
      /rfq
        /[rfqId]/page.tsx
    /page.tsx                    (root redirect)
  /lib
    api.ts                       (all fetch calls to the backend in one place)
    auth.ts                      (read current user from cookie/context)
  /components
    StatusBadge.tsx
    RankingsTable.tsx
    ActivityLog.tsx
    CountdownTimer.tsx
    BidForm.tsx
  .env.local
```

---

## Tech Decisions

- **Backend port:** 4000 (Express)
- **Frontend port:** 3000 (Next.js)
- **Auth:** JWT in HTTP-only cookies. Backend sets the cookie, frontend reads it automatically via the browser on every request. No localStorage.
- **CORS:** Backend must allow requests from `http://localhost:3000` with `credentials: true`
- **Timezone:** Store ALL datetimes as UTC in PostgreSQL. Format to local time only on the frontend.
- **Realtime:** Frontend polls the backend every 10 seconds while auction is ACTIVE. No WebSockets needed for assignment.

---

## PHASE 1 — Backend Foundation + Auth

### Goal
Get the Express server running with a working auth system. Every subsequent phase builds on top of this.

---

### Step 1.1 — Express App Setup

Create `/backend/src/app.ts`.

Set up the Express application with the following middleware in this exact order:
1. `cors` — allow origin `http://localhost:3000`, allow credentials `true`, allow headers `Content-Type` and `Authorization`, allow methods `GET POST PATCH DELETE OPTIONS`
2. `express.json()` — parse JSON request bodies
3. `cookie-parser` — parse cookies from incoming requests (needed to read the auth cookie)

Mount route files (to be created in later steps):
- `/api/auth` → auth routes
- `/api/rfq` → rfq routes

Export the app. Do not call `app.listen` here.

Create `/backend/src/server.ts`.

Import the app, call `app.listen` on port 4000 (or `process.env.PORT`). Log "Server running on port 4000" when ready.

---

### Step 1.2 — Prisma Client Singleton

Create `/backend/src/lib/prisma.ts`.

Export a single PrismaClient instance. Attach it to the Node.js `global` object to prevent multiple instances during hot reloads in development. Check if `global.prisma` already exists — if yes, export that. If not, create a new instance, assign it to `global.prisma`, and export it.

---

### Step 1.3 — JWT Helpers

Create `/backend/src/lib/auth.ts`.

**`signToken(payload: { userId: string, role: string, name: string }): string`**
- Signs a JWT using `jsonwebtoken` with `process.env.JWT_SECRET`
- Sets expiry to 7 days
- Returns the token string

**`verifyToken(token: string): payload | null`**
- Verifies the token using the same secret
- Returns the decoded payload on success
- Returns `null` on any failure (expired, invalid, tampered) — never throw

---

### Step 1.4 — Auth Middleware

Create `/backend/src/middleware/auth.middleware.ts`.

This is a standard Express middleware function `(req, res, next)`.

Logic:
1. Read the cookie named `auth_token` from `req.cookies`
2. If missing, return 401 JSON `{ error: "Not authenticated" }`
3. Call `verifyToken` on it
4. If result is null, return 401 JSON `{ error: "Invalid or expired session" }`
5. Attach the decoded payload to `req.user = decodedPayload`
6. Call `next()`

Create `/backend/src/middleware/role.middleware.ts`.

Export a factory function `requireRole(...roles: string[])` that returns an Express middleware.

The returned middleware:
1. Reads `req.user` (set by auth middleware)
2. If `req.user.role` is not in the `roles` array, return 403 JSON `{ error: "Forbidden" }`
3. Otherwise call `next()`

Usage in routes will look like: `router.post('/', authMiddleware, requireRole('BUYER'), controller)`

---

### Step 1.5 — Auth Controller

Create `/backend/src/controllers/auth.controller.ts`.

**`register(req, res)`**

Validate request body:
1. `name`, `email`, `password`, `role` must all be present non-empty strings
2. Email must match a basic email regex
3. Password must be at least 8 characters
4. Role must be exactly `"BUYER"` or `"SUPPLIER"` — reject anything else
5. Check if a user with this email already exists — if yes, return 409 `{ error: "Email already registered" }`

On valid input:
1. Hash password with `bcryptjs`, salt rounds 10
2. Create user in database via Prisma
3. Call `signToken` with `{ userId: user.id, role: user.role, name: user.name }`
4. Set cookie: name `auth_token`, value = token, options: `httpOnly: true`, `sameSite: 'strict'`, `secure: process.env.NODE_ENV === 'production'`, `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days in milliseconds)
5. Return 201 `{ id, email, name, role }` — never return passwordHash

**`login(req, res)`**

1. `email` and `password` must be present
2. Find user by email — if not found, return 401 `{ error: "Invalid credentials" }` (generic message — do not reveal whether email exists)
3. Compare password with `bcryptjs.compare` — if mismatch, return 401 same generic message
4. Sign token, set same cookie as in register
5. Return 200 `{ id, email, name, role }`

**`logout(req, res)`**

Clear the `auth_token` cookie by setting it with `maxAge: 0`. Return 200 `{ message: "Logged out" }`.

**`me(req, res)`**

This route is protected by auth middleware so `req.user` is always present.
Fetch the user from the database by `req.user.userId`.
Return 200 `{ id, email, name, role }`.

---

### Step 1.6 — Auth Routes

Create `/backend/src/routes/auth.routes.ts`.

Wire up:
- `POST /register` → `register` controller (no middleware)
- `POST /login` → `login` controller (no middleware)
- `POST /logout` → `logout` controller (no middleware)
- `GET /me` → `authMiddleware` → `me` controller

Export the router and mount it at `/api/auth` in `app.ts`.

---

### Step 1.7 — Frontend: API Client Setup

Create `/frontend/lib/api.ts`.

This file centralizes all HTTP calls to the backend. Never write `fetch` calls inline in page components — always call a function from this file.

Define a base `apiFetch(path, options)` function that:
- Prepends `http://localhost:4000` to the path
- Always includes `credentials: 'include'` so cookies are sent automatically
- Sets `Content-Type: application/json` for non-GET requests
- Returns the parsed JSON response
- Throws an error with the response's `error` field as the message if the response status is not ok

Then export these named functions (add more as needed in later phases):

- `registerUser(data)` — POST `/api/auth/register`
- `loginUser(data)` — POST `/api/auth/login`
- `logoutUser()` — POST `/api/auth/logout`
- `getMe()` — GET `/api/auth/me`

---

### Step 1.8 — Frontend: Auth Context

Create `/frontend/lib/auth-context.tsx`.

A simple React context that holds the current user state (`{ id, email, name, role } | null`).

On mount, call `getMe()` from `api.ts`. If it succeeds, set the user. If it fails (401), set user to null.

Provide a `logout()` function that calls `logoutUser()` then sets user to null.

Wrap the entire app in this provider inside `/frontend/app/layout.tsx`.

---

### Step 1.9 — Frontend: Login Page

Create `/frontend/app/login/page.tsx`. Mark as `"use client"`.

A centered form with email, password fields and a submit button.

On submit, call `loginUser({ email, password })`. On success, read role from the response and use `router.push` to redirect: BUYER → `/buyer/dashboard`, SUPPLIER → `/supplier/dashboard`. On error, show the error message below the form.

Include a link to the register page.

---

### Step 1.10 — Frontend: Register Page

Create `/frontend/app/register/page.tsx`. Mark as `"use client"`.

Fields: name, email, password, and a select dropdown for role with two options labeled "I am a Buyer" and "I am a Supplier".

On submit, call `registerUser(data)`. On success, redirect same way as login. On error, show error message.

---

### Step 1.11 — Frontend: Route Protection

Create a reusable hook `/frontend/lib/use-require-auth.ts`.

This hook:
1. Reads the user from auth context
2. If user is null and loading is complete, calls `router.push('/login')`
3. If user's role doesn't match the expected role for this route, redirects to the correct dashboard
4. Returns the user

Call this hook at the top of every protected page component.

---

### Phase 1 Checklist
- Start the backend with `ts-node` or `nodemon` — server starts on port 4000 without errors
- POST `/api/auth/register` with valid buyer data — verify 201 response and cookie set
- Check database — user row exists with hashed password, not plaintext
- POST `/api/auth/login` — verify cookie is refreshed
- GET `/api/auth/me` with cookie — returns user info
- POST `/api/auth/login` with wrong password — returns 401 with generic message
- POST `/api/auth/logout` — cookie is cleared
- GET `/api/auth/me` after logout — returns 401
- Frontend login page works end to end — login redirects to correct dashboard
- Frontend register page works end to end

---

## PHASE 2 — RFQ Creation (Backend + Frontend)

### Goal
Buyers can create RFQs with British Auction configuration. All validation enforced.

---

### Step 2.1 — Validation Helpers

Create `/backend/src/lib/validate.ts`.

**`generateReferenceId(): string`**
Returns a string in the format `RFQ-YYYYMMDD-XXXX` where XXXX is a zero-padded random 4-digit number. Example: `RFQ-20241215-0042`.

**`validateRFQInput(body): string[]`**
Returns an array of error message strings. Empty array means valid.

Check these in order:

Field presence:
- `name` must be a non-empty string
- `bidStartTime`, `bidCloseTime`, `forcedCloseTime`, `pickupDate` must all be valid ISO datetime strings — test by calling `new Date(value)` and checking it is not NaN
- `triggerWindowMins` must be a positive integer greater than 0 — use `Number.isInteger` and check `> 0`
- `extensionDurationMins` must be a positive integer greater than 0
- `triggerType` must be exactly one of: `BID_RECEIVED`, `ANY_RANK_CHANGE`, `L1_CHANGE_ONLY`

Business rules (parse all times as Date objects before comparing):
- `bidStartTime` must be strictly greater than `now()` — cannot be in the past
- `bidCloseTime` must be strictly greater than `bidStartTime`
- `forcedCloseTime` must be strictly greater than `bidCloseTime` — equal is rejected
- `pickupDate` must be greater than or equal to `bidCloseTime`
- Auction duration in minutes = `(bidCloseTime - bidStartTime) / 60000`. `triggerWindowMins` must be strictly less than this value.

---

### Step 2.2 — RFQ Controller

Create `/backend/src/controllers/rfq.controller.ts`.

**`createRFQ(req, res)`**

1. `req.user.role` must be BUYER — enforced by middleware, but double check
2. Call `validateRFQInput(req.body)` — if errors array is non-empty, return 400 `{ errors }`
3. Generate a `referenceId` using `generateReferenceId()`
4. Create the RFQ and AuctionConfig in a single `prisma.$transaction`. Inside the transaction, create the RFQ first, then create the AuctionConfig using the new RFQ's id. Set `originalBidCloseTime` equal to the submitted `bidCloseTime` at this point — it never changes after creation. Set status to `DRAFT`.
5. Handle Prisma unique constraint error (code `P2002`) on `referenceId` — retry up to 3 times with a new generated id before returning 500.
6. After the transaction, create an `ActivityLog` entry: type `AUCTION_OPENED`, description `"RFQ [referenceId] created. Auction scheduled to open at [bidStartTime formatted]."`.
7. Return 201 with the created RFQ including its nested `auctionConfig`.

**`listRFQs(req, res)`**

1. If role is BUYER: fetch all RFQs where `buyerId === req.user.userId`. Before returning, call `activateAuctionIfDue` and `closeAuctionIfDue` for each DRAFT or ACTIVE auction (import these from `auction-engine.ts`). Include `auctionConfig`. Attach `currentLowestBid` (minimum `totalAmount` among all bids, or null) and `totalBidCount` to each RFQ.
2. If role is SUPPLIER: fetch all RFQs where `status === ACTIVE`. Same enrichment. Order by `bidCloseTime` ascending.
3. Return 200 with the array.

**`getRFQ(req, res)`**

1. Extract `rfqId` from `req.params`
2. Call `activateAuctionIfDue(rfqId)` then `closeAuctionIfDue(rfqId)` — import from auction-engine
3. Fetch the RFQ with all relations: `auctionConfig`, `extensions` ordered by `createdAt` asc, `activityLogs` ordered by `occurredAt` asc, `bids` including each bid's supplier `name`
4. If not found, return 404
5. If role is BUYER and `rfq.buyerId !== req.user.userId`, return 403
6. Compute current rankings using `computeCurrentRankings(rfqId)` — import from auction-engine
7. Attach rankings to each bid in the response
8. If role is SUPPLIER: apply `censorNameForViewer(name, req.user.userId, bid.supplierId)` to each bid's supplier name — import from censor.ts
9. If role is BUYER: full names visible
10. Return 200 with the enriched RFQ

---

### Step 2.3 — RFQ Routes

Create `/backend/src/routes/rfq.routes.ts`.

Wire up:
- `GET /` → `authMiddleware` → `listRFQs`
- `POST /` → `authMiddleware` → `requireRole('BUYER')` → `createRFQ`
- `GET /:rfqId` → `authMiddleware` → `getRFQ`

Export the router and mount it at `/api/rfq` in `app.ts`.

---

### Step 2.4 — Censor Helper

Create `/backend/src/lib/censor.ts`.

**`censorName(name: string): string`**
- If name length is 1: return that character + `"**"`
- If name length is 2: return first character + `"*"`
- Otherwise: return first character + `"*".repeat(name.length - 2)` + last character
- Examples: `"FastFreight"` → `"F*********t"`, `"AB"` → `"A*"`, `"X"` → `"X**"`

**`censorNameForViewer(name: string, viewerSupplierId: string, bidSupplierId: string): string`**
- If `viewerSupplierId === bidSupplierId`, return `name` unchanged
- Otherwise return `censorName(name)`

---

### Step 2.5 — Auction Engine: Foundation Functions

Create `/backend/src/lib/auction-engine.ts`. This file will grow across phases. Start with these two functions.

**`activateAuctionIfDue(rfqId: string, prisma?): Promise<void>`**
- Fetch the RFQ by id (use the passed prisma client or the singleton if none passed)
- If status is not `DRAFT`, return immediately
- If `new Date() >= rfq.bidStartTime`, update status to `ACTIVE` and create an ActivityLog entry: type `AUCTION_OPENED`, description `"Auction is now live. Bidding is open."`

**`closeAuctionIfDue(rfqId: string, prisma?): Promise<void>`**
- Fetch the RFQ by id
- Capture `now = new Date()`
- If status is not `ACTIVE`, return immediately
- If `now >= rfq.forcedCloseTime`: update status to `FORCE_CLOSED`, create ActivityLog: type `AUCTION_FORCE_CLOSED`, description `"Auction force closed at [forcedCloseTime formatted]. Hard deadline reached. No further bids accepted."`
- Else if `now >= rfq.bidCloseTime`: update status to `CLOSED`, create ActivityLog: type `AUCTION_CLOSED`, description `"Auction closed naturally at [bidCloseTime formatted]. No further bids accepted."`

---

### Step 2.6 — Frontend: API Functions for RFQ

Add these functions to `/frontend/lib/api.ts`:

- `createRFQ(data)` — POST `/api/rfq`
- `listRFQs()` — GET `/api/rfq`
- `getRFQ(rfqId)` — GET `/api/rfq/[rfqId]`

---

### Step 2.7 — Frontend: Buyer Dashboard

Create `/frontend/app/buyer/dashboard/page.tsx`. Mark as `"use client"`.

Call `useRequireAuth('BUYER')` at the top to protect the route.

On mount, call `listRFQs()`. Display a table with columns:
- RFQ Name
- Reference ID
- Current Lowest Bid (show `"No bids yet"` if null, formatted `$X.XX` if present)
- Current Bid Close Time (formatted local timezone)
- Forced Close Time (formatted local timezone)
- Status (colored badge — DRAFT=gray "Upcoming", ACTIVE=green "Live", CLOSED=amber "Closed", FORCE_CLOSED=red "Force Closed")
- Total Bids

Each row is clickable, navigates to `/buyer/rfq/[rfqId]`.

Include a "Create New RFQ" button at the top right. Include a logout button.

---

### Step 2.8 — Frontend: RFQ Create Page

Create `/frontend/app/buyer/rfq/create/page.tsx`. Mark as `"use client"`.

Call `useRequireAuth('BUYER')` at the top.

Form fields:
- RFQ Name (text, required)
- Bid Start Date and Time (`datetime-local`, required)
- Bid Close Date and Time (`datetime-local`, required)
- Forced Bid Close Date and Time (`datetime-local`, required)
- Pickup / Service Date (`datetime-local`, required)
- Trigger Window in minutes (number, min=1, required)
- Extension Duration in minutes (number, min=1, required)
- Extension Trigger Type (select with three options: "Any Bid Received", "Any Rank Change", "L1 (Lowest Bidder) Change Only" mapping to `BID_RECEIVED`, `ANY_RANK_CHANGE`, `L1_CHANGE_ONLY`)

On submit, call `createRFQ(formData)`. On 400 response, display each error from the `errors` array next to the relevant field. On success, redirect to `/buyer/dashboard`. Disable submit button while request is in flight.

---

### Phase 2 Checklist
- POST `/api/rfq` as a buyer — verify 201, check DB has both RFQ row and AuctionConfig row
- Verify `originalBidCloseTime === bidCloseTime` in DB at creation
- Verify `status = DRAFT` at creation
- POST `/api/rfq` as a supplier — verify 403
- POST `/api/rfq` with `forcedCloseTime === bidCloseTime` — verify 400 with error message
- POST `/api/rfq` with `triggerWindowMins >= auction duration` — verify 400
- POST `/api/rfq` with `bidStartTime` in the past — verify 400
- GET `/api/rfq` as buyer — returns the created RFQ
- GET `/api/rfq/[rfqId]` — returns full RFQ with auctionConfig
- Frontend create page submits correctly and redirects to dashboard
- Buyer dashboard shows the new RFQ row

---

## PHASE 3 — Bid Submission and The Auction Engine (Most Critical)

### Goal
Implement bid submission with full concurrency safety, automatic extension logic, and correct ranking computation. All business logic lives in `auction-engine.ts`.

---

### Step 3.1 — Auction Engine: `computeCurrentRankings`

Add this function to `/backend/src/lib/auction-engine.ts`.

**`computeCurrentRankings(rfqId: string, prisma?): Promise<RankingEntry[]>`**

1. Fetch all bids for this RFQ, include the supplier's `name` field
2. Group bids by `supplierId` — for each supplier, keep only the bid with the latest `receivedAt` (their most recent submission is the one that counts for ranking)
3. Sort the one-bid-per-supplier list by `totalAmount` ascending. For ties on `totalAmount`, sort by `receivedAt` ascending — the supplier who submitted that price first gets the better rank.
4. Assign rank numbers starting at 1
5. Return an array of objects: `{ supplierId, supplierName, bidId, totalAmount, rank, receivedAt }`

---

### Step 3.2 — Auction Engine: `isWithinTriggerWindow`

Add this pure function to `/backend/src/lib/auction-engine.ts`.

**`isWithinTriggerWindow(bidReceivedAt: Date, rfq: RFQWithConfig): boolean`**

- `windowStart = rfq.bidCloseTime.getTime() - (rfq.auctionConfig.triggerWindowMins * 60 * 1000)`
- Return `true` if `bidReceivedAt.getTime() >= windowStart AND bidReceivedAt.getTime() < rfq.bidCloseTime.getTime()`
- Return `false` otherwise
- The trigger window always uses the CURRENT `bidCloseTime` (which may have been extended). This is why the function takes the rfq object as it exists at the moment of the check.

---

### Step 3.3 — Auction Engine: `shouldExtend`

Add this pure function to `/backend/src/lib/auction-engine.ts`.

**`shouldExtend(rfq, newBidReceivedAt, rankingsBefore, rankingsAfter): boolean`**

First: if `isWithinTriggerWindow(newBidReceivedAt, rfq)` is false, return `false` immediately — no extension outside the trigger window regardless of trigger type.

Then branch on `rfq.auctionConfig.triggerType`:

**`BID_RECEIVED`:** Being in the trigger window is sufficient. Return `true`.

**`ANY_RANK_CHANGE`:**
- Build a map of `supplierId → rank` from `rankingsBefore`
- Build a map of `supplierId → rank` from `rankingsAfter`
- If any supplier's rank number differs between the two maps, return `true`
- If a supplier appears in `rankingsAfter` but not in `rankingsBefore` (first bid ever), return `true`
- Otherwise return `false`

**`L1_CHANGE_ONLY`:**
- `previousL1 = rankingsBefore.find(r => r.rank === 1)?.supplierId ?? null`
- `currentL1 = rankingsAfter.find(r => r.rank === 1)?.supplierId ?? null`
- If `previousL1 !== currentL1`, return `true`
- Otherwise return `false`

---

### Step 3.4 — Auction Engine: `applyExtension`

Add this function to `/backend/src/lib/auction-engine.ts`. Must be called with a transaction prisma client.

**`applyExtension(rfq, triggeringBidId, triggerType, txPrisma): Promise<AuctionExtension | null>`**

1. `previousCloseTime = rfq.bidCloseTime`
2. `proposedMs = rfq.bidCloseTime.getTime() + (rfq.auctionConfig.extensionDurationMins * 60 * 1000)`
3. `newCloseTimeMs = Math.min(proposedMs, rfq.forcedCloseTime.getTime())`
4. `newCloseTime = new Date(newCloseTimeMs)`
5. If `newCloseTime.getTime() === rfq.bidCloseTime.getTime()` — already at forced close cap, return `null` without updating anything
6. Update `rfq.bidCloseTime` to `newCloseTime` using `txPrisma`
7. Insert `AuctionExtension` row: `rfqId`, `triggeringBidId`, `triggerType`, `previousCloseTime`, `newCloseTime`
8. Insert `ActivityLog` row: type `AUCTION_EXTENDED`, description `"Auction extended by [Y] minutes ([human reason]). Previous close: [old time]. New close: [new time]."`
   - Human reason: BID_RECEIVED → `"new bid received"`, ANY_RANK_CHANGE → `"supplier ranking changed"`, L1_CHANGE_ONLY → `"lowest bidder changed"`
9. Return the created `AuctionExtension` record

---

### Step 3.5 — Auction Engine: `processBid` (Master Function)

Add this to `/backend/src/lib/auction-engine.ts`.

**`processBid(rfqId, supplierId, bidData): Promise<{ bid, rankings }>`**

This entire function runs inside `prisma.$transaction(async (tx) => { ... }, { isolationLevel: 'Serializable' })`.

Serializable isolation means only one transaction per RFQ runs at a time. All concurrent calls queue up. This eliminates the double-extension race condition and the simultaneous L1 problem entirely.

**Step A:** Fetch the RFQ with `auctionConfig` included using `tx`.

**Step B:** Call `activateAuctionIfDue(rfqId, tx)`.

**Step C:** Call `closeAuctionIfDue(rfqId, tx)`.

**Step D:** Re-fetch the RFQ after the above to get fresh status. If status is not `ACTIVE`, throw `new Error("Auction is not accepting bids. Status: " + rfq.status)`.

**Step E:** Capture `receivedAt = new Date()` right now. This is the authoritative server timestamp for this bid.

**Step F:** If `receivedAt >= rfq.bidCloseTime`, throw `new Error("Bid received after auction close time. Not accepted.")`.

**Step G:** Validate `bidData`:
- `carrierName` must be a non-empty string
- `freightCharges`, `originCharges`, `destinationCharges` must each be a finite number >= 0
- `transitTimeDays` must be an integer >= 1
- `quoteValidityDate` must parse as a valid date and be in the future
- Collect all failures into an array — if any exist, throw `new Error("Validation failed: " + failures.join(", "))`

**Step H:** Compute `totalAmount = Number(freightCharges) + Number(originCharges) + Number(destinationCharges)` on the server. Ignore any `totalAmount` field in `bidData`.

**Step I:** Call `computeCurrentRankings(rfqId, tx)` and store as `rankingsBefore`.

**Step J:** Insert the new `Bid` row using `tx`. Set `receivedAt` to the server timestamp from Step E. Set `rankAtSubmission = 0` as a placeholder for now.

**Step K:** Call `computeCurrentRankings(rfqId, tx)` again and store as `rankingsAfter`. This now includes the new bid.

**Step L:** Find the new bid's rank in `rankingsAfter` (match by `bidId`). Update the bid's `rankAtSubmission` to that rank using `tx`.

**Step M:** Get the supplier's name from `rankingsAfter`. Call `censorName(supplierName)` for use in log descriptions.

**Step N:** Call `shouldExtend(rfq, receivedAt, rankingsBefore, rankingsAfter)`.

**Step O:** If `shouldExtend` returned `true`, call `applyExtension(rfq, newBid.id, rfq.auctionConfig.triggerType, tx)`. Note: pass the `rfq` object as it was fetched in Step D — `applyExtension` uses `rfq.bidCloseTime` as the previous close time.

**Step P:** Insert `ActivityLog` entry: type `BID_SUBMITTED`, description `"Bid submitted by [censoredName] — Total: $[totalAmount toFixed 2]. Rank at submission: L[rank]."`.

**Step Q:** If any supplier's rank changed between `rankingsBefore` and `rankingsAfter`, insert `ActivityLog` entry: type `RANK_CHANGED`, description `"Rankings updated. Current L1: [censoredName of rank 1] at $[amount toFixed 2]. Total bids: [rankingsAfter.length]."`.

**Step R:** Return `{ bid: newBid, rankings: rankingsAfter }`. The transaction commits automatically when the async function resolves.

---

### Step 3.6 — Bid Controller

Create `/backend/src/controllers/bid.controller.ts`.

**`listBids(req, res)`**
1. Extract `rfqId` from `req.params`
2. Call `activateAuctionIfDue` and `closeAuctionIfDue`
3. Fetch all bids for this RFQ with supplier name included
4. Call `computeCurrentRankings(rfqId)` to get current standings
5. Attach rank to each bid
6. If role is SUPPLIER: apply `censorNameForViewer` to each bid's supplier name using `req.user.userId`
7. If role is BUYER: full names
8. Return 200 with the array

**`submitBid(req, res)`**
1. If role is not SUPPLIER, return 403
2. Extract `rfqId` from `req.params`
3. Call `processBid(rfqId, req.user.userId, req.body)`
4. Catch errors:
   - Any known business error (auction not active, after close, validation) — return 400 `{ error: message }`
   - Prisma serialization/conflict error (Prisma error code `P2034`) — return 409 `{ error: "Conflict, please retry" }`
   - All other errors — return 500 `{ error: "Internal server error" }`
5. On success, return 201 `{ bid, rankings }`

---

### Step 3.7 — Bid Routes

Create `/backend/src/routes/bid.routes.ts`.

Wire up:
- `GET /:rfqId/bids` → `authMiddleware` → `listBids`
- `POST /:rfqId/bids` → `authMiddleware` → `requireRole('SUPPLIER')` → `submitBid`

Mount this router at `/api/rfq` in `app.ts` (same base path as rfq routes — the `/:rfqId/bids` path makes it distinct).

---

### Step 3.8 — Frontend: API Functions for Bids

Add these to `/frontend/lib/api.ts`:
- `getBids(rfqId)` — GET `/api/rfq/[rfqId]/bids`
- `submitBid(rfqId, data)` — POST `/api/rfq/[rfqId]/bids`

---

### Step 3.9 — Frontend: Reusable Components

Create these components in `/frontend/components/`:

**`StatusBadge.tsx`**
Takes a `status` string prop. Renders a small pill/badge:
- DRAFT → gray background, text "Upcoming"
- ACTIVE → green background, text "Live"
- CLOSED → amber background, text "Closed"
- FORCE_CLOSED → red background, text "Force Closed"

**`CountdownTimer.tsx`**
Takes a `targetTime: Date` prop and an `onExpired: () => void` callback.
Uses `setInterval` every 1000ms to compute `timeLeft = targetTime - now`. Displays as `HH:MM:SS`. When `timeLeft <= 0`, displays "Auction Closed" in red and calls `onExpired`. Cleans up the interval in useEffect return.

**`RankingsTable.tsx`**
Takes `rankings` array and `currentUserId` string as props.
Renders a table with columns: Rank (as L1, L2...), Supplier, Total Amount, Freight, Origin, Destination, Transit Days, Quote Validity.
Highlights the row where `supplierId === currentUserId` with a distinct background.
If rankings array is empty, shows "No bids have been submitted yet."

**`ActivityLog.tsx`**
Takes `logs` array as prop.
Renders a scrollable list of log entries, each showing formatted timestamp and description.
Newest entry at the bottom.

**`BidForm.tsx`**
Takes `rfqId` and `onBidSubmitted: () => void` callback as props.
Renders the bid submission form. Computes and shows a live "Total Amount" as the user types in the three charge fields.
On submit, calls `submitBid(rfqId, formData)`. On success, calls `onBidSubmitted()`. On error, shows the error message.

---

### Step 3.10 — Frontend: Supplier Dashboard

Create `/frontend/app/supplier/dashboard/page.tsx`. Mark as `"use client"`.

Call `useRequireAuth('SUPPLIER')`. On mount, call `listRFQs()`. Same table layout as buyer dashboard but no "Create New RFQ" button. Include logout button.

---

### Step 3.11 — Frontend: Supplier Auction Detail Page

Create `/frontend/app/supplier/rfq/[rfqId]/page.tsx`. Mark as `"use client"`.

Call `useRequireAuth('SUPPLIER')`.

Set up polling: use `useEffect` with `setInterval` every 10 seconds calling `getRFQ(rfqId)`. Update all state on each response. Stop polling (`clearInterval`) when status becomes CLOSED or FORCE_CLOSED. Also clear on component unmount.

Layout (top to bottom):
1. RFQ name, reference ID, `StatusBadge`
2. Current Bid Close Time and Forced Close Time (formatted local)
3. Auction config display (read-only): Trigger type, X minutes, Y minutes
4. `CountdownTimer` — pass `bidCloseTime` as target. In the `onExpired` callback, stop polling and refresh the RFQ once more to get final state.
5. `RankingsTable` — pass current rankings and current user's id
6. `BidForm` — only render when status is ACTIVE. Pass `onBidSubmitted` callback that re-fetches the RFQ immediately.
7. `ActivityLog` — pass activity logs

---

### Step 3.12 — Frontend: Buyer Auction Detail Page

Create `/frontend/app/buyer/rfq/[rfqId]/page.tsx`. Mark as `"use client"`.

Call `useRequireAuth('BUYER')`. Same polling setup.

Layout differences from supplier page:
- No `BidForm`
- `RankingsTable` receives uncensored names (backend already handles this based on role cookie)
- Show `originalBidCloseTime` alongside current `bidCloseTime` so buyer can see total extension
- Show "Extended X times" count from `extensions` array length
- Full `ActivityLog`

---

### Phase 3 Checklist
- POST `/api/rfq/[rfqId]/bids` as a supplier — verify bid row in DB with correct `totalAmount` computed server-side and `receivedAt` as server time
- Submit bids from two different supplier accounts — verify ranking order in response
- Submit two bids with identical `totalAmount` — verify earlier `receivedAt` wins the better rank
- Supplier viewing detail page sees censored names for others, own name in full
- Set an RFQ's `bidCloseTime` to 5 minutes from now in DB directly, submit a bid — verify `bidCloseTime` was extended in DB
- Verify `AuctionExtension` row exists with correct `previousCloseTime` and `newCloseTime`
- Verify extension never exceeds `forcedCloseTime`
- Submit multiple bids rapidly — verify `bidCloseTime` recalculates from the new close time each time, no double extension
- Try submitting a bid after `bidCloseTime` — verify 400 with clear message
- Try submitting a bid as a buyer — verify 403
- Activity log has BID_SUBMITTED, RANK_CHANGED, AUCTION_EXTENDED entries in correct order

---

## PHASE 4 — Auction Close and Final State

### Goal
Ensure auctions close correctly, status transitions are correct, and the frontend reflects final state cleanly.

---

### Step 4.1 — Verify `closeAuctionIfDue` is Called Everywhere Needed

Confirm it is called in:
- Inside `processBid` transaction (Step C) — most critical
- Top of `getRFQ` controller
- Top of `listRFQs` controller (for each active/draft auction in the list)
- Top of `listBids` controller

This is the substitute for a background cron job. Every time someone interacts with an auction, its status is checked and updated.

---

### Step 4.2 — Zero Bids Edge Case

When an auction closes with no bids:
- Status transitions to CLOSED or FORCE_CLOSED normally
- `computeCurrentRankings` returns an empty array — this is fine, handle it in the frontend
- `RankingsTable` component must show "No bids were submitted for this auction" when the array is empty — do not try to render an empty table
- `currentLowestBid` in the listing must be shown as `"—"` not null or undefined

---

### Step 4.3 — Frontend Polling Final State Handling

In both buyer and supplier detail pages, when a poll response returns status CLOSED or FORCE_CLOSED:
1. Call `clearInterval` to stop polling
2. Update all state with the final data
3. Hide the `BidForm` (supplier page)
4. Show a final status banner: "This auction has closed." or "This auction was force closed." with appropriate styling

---

### Phase 4 Checklist
- Let an RFQ's `bidCloseTime` pass with zero bids — GET the RFQ, verify status is CLOSED
- Set `bidCloseTime` and `forcedCloseTime` both to be very soon, keep submitting bids to extend, verify status becomes FORCE_CLOSED when hard deadline is hit
- Activity log for force closed auction says "force closed" — different text than natural close
- Frontend supplier page stops showing bid form after close
- Frontend polling stops after auction closes — verify no more network requests in browser devtools

---

## PHASE 5 — Final Hardening

### Goal
Systematically verify every edge case and security concern before submission.

---

### Step 5.1 — Full Edge Case Verification List

Work through every item:

**Timing:**
- Bid submitted exactly at `bidCloseTime` — server rejects it (`receivedAt >= bidCloseTime`)
- Extension that would overshoot `forcedCloseTime` — capped correctly to exactly `forcedCloseTime`
- Trigger window recalculates from the new `bidCloseTime` after each extension — submit a bid that extends, then immediately submit another and verify the second bid checks against the new (extended) close time

**Bid rules:**
- Supplier bids higher than their previous bid — accepted without error
- Two suppliers submit same `totalAmount` — earlier `receivedAt` wins better rank
- L1 supplier submits a new lower bid — with `BID_RECEIVED` this extends, with `L1_CHANGE_ONLY` this does NOT extend (same supplier stays L1)

**Creation validation:**
- `bidStartTime` in the past → 400
- `forcedCloseTime === bidCloseTime` → 400
- `triggerWindowMins >= auction duration in minutes` → 400
- `extensionDurationMins = 0` → 400
- Missing required fields → 400 with descriptive error messages

**UI robustness:**
- Countdown hits zero — bid form disables immediately
- Supplier name is one character — `censorName` returns without crash
- Page loaded when auction is already closed — correct status, no bid form

---

### Step 5.2 — Security Checklist

- Every API route returns 401 when called without a valid cookie
- Buyer cannot POST to `/api/rfq/[rfqId]/bids` — returns 403
- Supplier cannot POST to `/api/rfq` to create an RFQ — returns 403
- `totalAmount` in request body is ignored — server computes it
- `receivedAt` in request body is ignored — server uses `new Date()`
- JWT secret comes from `process.env.JWT_SECRET` — not hardcoded anywhere
- `.env` is in `.gitignore` for both `/backend` and `/frontend`

---

### Step 5.3 — Environment Variables

**Backend `/backend/.env`:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — random string, minimum 32 characters
- `PORT` — 4000
- `NODE_ENV` — development or production

**Frontend `/frontend/.env.local`:**
- `NEXT_PUBLIC_API_URL` — `http://localhost:4000`

Update `/frontend/lib/api.ts` to use `process.env.NEXT_PUBLIC_API_URL` as the base URL instead of a hardcoded string.

---

### Step 5.4 — Frontend Polish

- All datetimes displayed in user's local timezone using `toLocaleString()` — never show raw UTC strings
- All monetary amounts displayed with exactly 2 decimal places and a `$` prefix
- Every page has a loading state — show a spinner while initial data fetch is in progress
- Every page has an error state — if API call fails, show a user-friendly message
- Root `/frontend/app/page.tsx` — on load, call `getMe()`. If authenticated, redirect to correct dashboard. If not, redirect to `/login`.
- Logout button on all dashboard and detail pages calls `logoutUser()` then redirects to `/login`

---

## Non-Negotiable Rules Summary

Read this before writing any code in each phase.

1. **Server time is always the source of truth** — never use a client-provided timestamp for any bid timing or close-time logic
2. **totalAmount is always computed server-side** — freightCharges + originCharges + destinationCharges. Ignore any client-sent totalAmount
3. **All bid processing runs inside a single Serializable Prisma transaction** — this handles all concurrency without any additional locking code
4. **Extensions are capped at forcedCloseTime** — `newCloseTime = Math.min(proposed, forcedCloseTime)`. If already at cap, do not extend at all
5. **Bid withdrawal is not allowed** — no DELETE endpoint for bids, ever
6. **Rankings are always computed fresh from the latest bid per supplier** — `rankAtSubmission` is a historical record only, never used to display current standings
7. **CLOSED and FORCE_CLOSED are distinct statuses** — different labels, different colors, different log messages
8. **Supplier names are censored everywhere** except when a supplier views their own name and when a buyer views the detail page
9. **RFQs are never deleted** — no DELETE endpoint for RFQ, ever
10. **Trigger window always recalculates from the current bidCloseTime** — after every extension, the window moves forward with the new close time
11. **No bid direction restriction** — suppliers may bid higher or lower than their previous bid, both are accepted