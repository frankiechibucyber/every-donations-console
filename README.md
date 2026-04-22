# Every Donations Console

A small internal tool I built for the every.org operations team, so they can
manually work the handful of donations that fall off the automated rail each
week. It is not meant to be customer facing.

Submitted by **Gabriel Eneh**.

## What this is, at a glance

Let me tell you the shape of this in a few sentences before you dig in. The
backend is a Next.js application with four endpoints: one to create a
donation, one to list all of them, one to fetch a single donation by its
uuid, and one to update the status of a donation. The dashboard is a single
page that lives in the same project and shares the same code. For storage I
used an in memory store, exactly as the spec allowed, but I put it behind an
interface so that the moment somebody wants to plug in a real database, it is
a single line of code. The state machine rules live in one file that both
the backend and the dashboard import from, so they can never disagree about
what transitions are allowed. For validation I used Zod on every incoming
request body. Every error response comes out in the same shape. And every
endpoint writes one structured log line to standard output, so anything that
reads logs can pick them up and make sense of them.

## How I approached this

Let me be straightforward with you. Before I wrote a single line of code, I
read the spec twice. Then I sat down and wrote out the parts of the spec
that were deliberately left open (the shape of idempotency beyond the one
required case, the shape of the dashboard, what "processing a donation"
should even mean in this context) and made a call on each one on its own.
The section below called Decisions walks through every single one of those
calls and the thinking behind it. Anywhere I did something different from
what the spec strictly said, I have flagged it clearly so that whoever
reviews this can see the choice and challenge it if they want to.

The guiding principle behind everything I built was this. I wanted the next
engineer who touches this code to be able to read it in one sitting and
extend it without rewriting it. That is why the layers are thin. That is why
the decision points are put exactly where a reviewer would look for them.
That is why the parts I chose not to build are spelled out along with the
hook where they would go. I was not trying to build a monument. I was
trying to build something that lasts and adapts.

## How to run it

There are three ways to run this locally, and I have put them in order of
how convenient they are.

**The first way uses nvm and yarn.** This is the path I would recommend,
because it reads the Node version straight from the .nvmrc file in the
repository and makes sure you are on exactly the version I used:

```bash
nvm use            # reads .nvmrc, lands on Node 22.15.0
yarn install
yarn dev           # http://localhost:3000
```

**The second way is for anyone who already has Node 22 or newer and Yarn
Classic installed.** You can skip the version manager step and go:

```bash
yarn install
yarn dev
```

I pinned the Node version in the `engines` field of `package.json`, and I
pinned the yarn version through the `packageManager` field. On any setup
that uses Corepack, the correct yarn gets picked up automatically with no
extra steps from you.

**The third way uses Docker and does not require Node on your machine at
all.** The image is small and runs fast:

```bash
docker build -t every-donations-console .
docker run --rm -p 3000:3000 every-donations-console
```

The Dockerfile has three build stages (one for dependencies, one for the
actual build, and one for the runtime) all on an Alpine Linux base. I turned
on what Next.js calls standalone output mode, which means the production
image only carries what the server actually needs at runtime, not the whole
build toolchain. The container runs as a regular user, not as root, and it
ships with a healthcheck that pings the `/api/health` endpoint to confirm
the server is alive.

### Other commands worth knowing

Beyond running the app, there are a handful of yarn scripts I wired up.

`yarn test` runs Vitest once through. There are 32 tests.

`yarn test:watch` runs Vitest in watch mode, which is nice when you are
editing something.

`yarn lint` runs ESLint using the flat config that ships with the Next.js
ESLint package.

`yarn typecheck` runs the TypeScript compiler in check only mode, with the
strict flag turned on plus two extra strictness flags I enabled called
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

`yarn build` builds the production bundle using Turbopack, which is the
newer and faster bundler that ships with recent Next.js versions.

`yarn format` runs Prettier with a configuration that matches the one
every.org uses in their donate button repository.

## Using the dashboard

Open `http://localhost:3000` after you start the dev server and you will
land straight on the dashboard. The first thing you see is the work queue,
meaning the donations that are still in new or pending status. Those are
the ones that actually need somebody to look at them. I made this the
default view because when an operator opens this tool, they are almost
always opening it because something needs their attention. From there, a
segmented filter at the top lets you switch to All, Success, or Failure.
There is also a dropdown that narrows the view by payment method, so you
can quickly check, for instance, whether crypto donations are doing poorly
this week compared to credit card donations.

If you click on a row, it expands right there and shows you the full
history of that donation, with a timestamp on every status change. So if
you need to answer the question "why did this one fail?", the answer is
sitting right there. You do not have to go digging in log files.

The action buttons on the right of each row read from the same rules file
that the backend uses. This means the dashboard can never offer you a
button that the backend would turn around and reject. Donations that are
already in success or failure, in other words the journey is done for
them, have no buttons at all, because there is nowhere else for them to
go.

## Where the important logic lives

If you only had time to read two files in this whole repository, read
these two. They carry most of the weight, and I would point any reviewer
at them first.

The first is `src/domain/transitions.ts`. This is the state machine
itself. The backend endpoint that handles status updates imports from it
to decide which transitions are legal. The dashboard button renderer also
imports from it to decide which buttons to show. Because they both read
from the same constant, they cannot get out of sync with each other. If
tomorrow the rules change, both sides pick up the change from one place.

The second is `src/data/repository.ts`. This is where the storage
interface lives, along with the in memory implementation I used. The
point of separating the interface from the implementation is that
plugging in a real database (whether it is SQLite, Postgres, or anything
else) is a matter of writing one new class that satisfies the same
interface. The endpoints themselves never need to change.

Everything else in the repository is, to put it plainly, plumbing around
these two files.

## The API, endpoint by endpoint

### Creating a donation with POST /donations

The request body follows the shape given in the spec:

```json
{
  "uuid": "a1b2c3d4-0001-0001-0001-000000000001",
  "amount": 5000,
  "currency": "USD",
  "paymentMethod": "cc",
  "nonprofitId": "org1",
  "donorId": "donor_01",
  "status": "new",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

If the request is good, you get back a 201 with the full donation record.
The server sets its own `updatedAt` timestamp and adds an empty
`transitions` array to the record.

If the request body has a problem, you get back a 400 with the code
`INVALID_PAYLOAD`. The response body also includes a `details` array
where each entry tells you exactly which field failed and exactly why.

If the uuid in the request already exists in the system, you get back a
409 with the code `DUPLICATE_UUID`, and the response body actually
includes the record that is already there under `error.details.existing`.
That way you can compare the two records yourself and decide whether you
genuinely meant to create a new one and picked the wrong uuid, or whether
it is just a retry.

### Listing donations with GET /donations

The response shape is this:

```
{ "donations": Donation[], "nextCursor"?: string }
```

With no query parameters, the endpoint returns every donation in the
system, which matches the spec exactly. If you pass `?limit=N`, the
response also comes back with a `nextCursor` value, and you can pass that
back as `?cursor=...` on the next request to get the next page. Just pass
it back as it is. Do not try to read or parse what is inside the cursor,
because the format is not guaranteed.

### Fetching a single donation with GET /donations/:uuid

If the donation exists, you get back a 200 with the full record,
including the transitions history. If it does not exist, you get back a
404 with the code `DONATION_NOT_FOUND`.

### Updating the status with PATCH /donations/:uuid/status

The request body is as small as it gets:

```
{ "status": "pending" | "success" | "failure" | "new" }
```

If everything is good, you get a 200 back with the updated donation
record. The `transitions` array has a new entry appended to it describing
the change, and the `updatedAt` timestamp is refreshed.

If the donation does not exist, you get a 404.

If the requested status matches the current status of the donation, you
get a 409 with the code `NO_OP`. This is exactly what the spec required.

If the requested move is not one of the allowed transitions from the
current status, you get a 422 with the code `INVALID_TRANSITION`. The
response body also includes `error.details.allowedFromHere`, which lists
out the statuses the donation is actually allowed to move to right now.
That is useful when somebody is trying to work out why their update is
getting rejected.

### The health endpoint GET /api/health

This returns `{ ok: true, at: <ISO timestamp> }` and is used by the
Docker healthcheck to confirm the container is alive. It returns right
away and does not touch the store or make any outbound calls.

### The shape of every error response

Every single error response from this API comes out in the same shape:

```json
{
  "error": {
    "code": "STABLE_CODE",
    "message": "Human-readable",
    "details": { ... }
  }
}
```

The stable codes you will see are `INVALID_PAYLOAD`,
`DONATION_NOT_FOUND`, `DUPLICATE_UUID`, `NO_OP`, and
`INVALID_TRANSITION`. Clients can branch on these codes safely. The
message is meant for humans reading the error. Do not try to parse it in
code.

## The state machine, in one picture

```
new ──▶ pending ──┬──▶ success
                  └──▶ failure
```

`success` and `failure` are final statuses. There is nowhere to go from
them. I keep this constant in `src/domain/transitions.ts`, and as I
mentioned earlier, it is the single place of truth that both the backend
and the dashboard read from.

## Decisions, and the thinking behind them

### On idempotency (this one the spec explicitly asked me to document)

The spec required that a PATCH trying to set the same status twice
returns a 409. Everything else was deliberately left to my judgment.
Here is what I did and why.

**When a POST arrives with a uuid that already exists, I return a 409
with the code `DUPLICATE_UUID`.** The response body includes the
existing record in `error.details.existing`. That way, the caller can
compare the two records and decide whether it is really a duplicate or
whether they just picked the wrong uuid by mistake and need to try again
with a fresh one.

**When a PATCH tries to set the status to what the donation is already
in, I return a 409 with the code `NO_OP`.** This is the minimum the spec
required.

**I deliberately did not add Stripe style Idempotency Key headers.**
That pattern is designed for automated systems that retry their requests
when the network misbehaves. But the people using this tool are human
operators clicking buttons in a browser. A human is not going to retry
the same update a hundred times a second because of a dropped packet.
The day something other than a human starts calling this API, I will add
those headers. Not before. And I want to say clearly where that feature
would go when we add it: it belongs as middleware on the route, not
inside the domain logic.

### On the product decisions I made for the dashboard (also something the spec asked me to document)

The spec said the dashboard needs to let operators view donations and
update their statuses. Beyond that, it left things to my judgment, with
a few quality bars around hiding invalid transitions, surfacing errors,
and showing amounts in dollars. Here are the calls I made about what an
operator actually needs to get their job done.

**The default view is the work queue, not the full list.** When somebody
opens this tool, they are almost always opening it because something
needs their attention. So the first thing they see is donations in new
and pending status. They can switch to the full list, or to the
successful ones, or to the failed ones, with one click on a segmented
control.

**There is a filter for payment method on top of the status filter.** A
common operations question is "are crypto donations failing more than
credit card donations this week?". A dropdown answers that in one click.

**At the top of the dashboard there are three small summary tiles.** One
shows how many donations need action right now. One shows how many have
been successfully processed so far. And one shows the failure rate over
the last seven days. Those three numbers answer the question "how are we
doing?" without forcing anyone to scan the table.

**Clicking a row opens the full transition history inline.** This is a
small timeline showing every status change with a timestamp. If a
teammate asks why a particular donation ended up in failure, the answer
is right there, not hidden in some log file somewhere.

**Invalid transitions are not rendered at all, not just greyed out.**
Greying out a button tells the user "you could do this but you cannot
right now." Simply not showing it tells them "this is not a move from
here." The second message is the correct one for the situation.

**Rows that are in a final status have no action buttons at all.** A
success row or a failure row has nowhere to go, so the action column is
just empty for those.

**Errors from the backend show up inline in a banner that you can
dismiss.** The banner shows the real error code and the real error
message from the backend, not a vague "something went wrong." If the
error was a validation problem, you see which field. If it was a
forbidden transition, you see exactly which moves were allowed. That
matters when somebody is trying to clear a stuck record quickly.

**Amounts are rendered in dollars from integer cents in a single
formatter.** That formatter lives in `src/ui/format.ts` and is used
everywhere in the dashboard that displays money.

### On the stack and framework

**I chose Next.js App Router for both the backend and the frontend.**
Every.org's public backend is Koa and TypeScript, so the most on brand
choice would have been a Koa API plus a separate Vite and React project
for the dashboard. I made a different call on purpose. For a tool of
this scope, having one repository and one development server is
genuinely simpler, and simpler means the next engineer who has to change
this has less to hold in their head. And because the storage layer is
behind an interface, moving the API out into a standalone Koa service
later is a small job, not a rewrite.

### On storage

**In memory, behind an interface.** The spec explicitly allowed in
memory storage. The `InMemoryDonationRepository` class implements the
`DonationRepository` interface. A SQLite implementation using the
`better-sqlite3` library would drop straight in behind the same
interface without touching any of the endpoint code. Reads return cloned
copies of the stored records using `structuredClone`, so that a caller
cannot accidentally mutate the store by modifying the object they
received back.

### On the shape of the data

**The audit trail lives on the donation record itself.** Every donation
carries a `transitions: StatusTransition[]` array with it. Every time a
PATCH succeeds, a new entry is appended. This is what allows the
dashboard to show the full per donation history right there in the row.
In a bigger version of this system I would pull the transitions out
into their own immutable events table, treat the donation row itself as
a projection over that event stream, and have final statuses trigger a
webhook through what is called the outbox pattern. The outbox pattern
is just a slightly fancy name for writing the event and the state
change in the same database transaction so nothing can fall through the
cracks. Keeping the history directly on the record here is that same
idea, just in a smaller form.

**The POST endpoint accepts all four statuses, not just `new`.** The
spec's POST body includes `status`, and the sample data contains
donations in every status. My seeding goes through the same
`repository.create(input)` call that real ingress would use. The state
machine only restricts what PATCH can do, which is the right place for
it.

**Uuids are validated as strings that must not be empty, not as strict
RFC 4122 uuids.** The sample uuids the spec gave me parse, but they are
not valid by the strict international standard. Their version bits are
all zeros, and their variant bits use an older format. If I used the
standard uuid validator, it would reject all eight of the seed records.
I loosened the check to "a string with at least one character in it"
and I am documenting the choice here so that the looseness is
intentional and visible rather than a silent surprise.

**Amounts stay as integer cents from top to bottom, and only become
dollars at the edge of the UI.** Zod rejects anything that is not a
whole number. JavaScript has no real decimal number type, so carrying
amounts as integer cents all the way through avoids the tiny rounding
errors that financial software developers have lost sleep over. The
conversion to dollars happens exactly once, in the formatter that runs
right before the number hits the screen.

### What I chose not to build, on purpose

**I did not add optimistic concurrency on PATCH.** The every.org
engineering team is four people, and this tool handles a handful of
records a day. The chance of two operators editing the same record at
the same second is effectively zero. The right way to handle it when
the scale demands it is an `If-Match: <updatedAt>` header on PATCH,
returning a 412 when the client's version is stale so the dashboard can
refetch and let the operator decide. That is about half an hour of work
on the day it is actually needed.

**I did not add a log shipper.** Every endpoint writes one structured
JSON line to standard output with fields like `level`, `route`,
`outcome`, `uuid`, `durationMs`, and any transition context. Running
under any process manager or container runtime, those lines are already
picked up and parsed as JSON by whatever you are using. If log
forwarding ever becomes a real requirement, swapping the console call
for pino is one afternoon of work in one file.

**I chose ESLint and Prettier over Biome.** Biome would be faster, yes,
and it is a first class option in recent Next.js scaffolding. But
every.org's public repositories use ESLint and Prettier with a specific
style (tabs at width two, no trailing comma, no bracket spacing, single
quotes). I matched that style, because a reviewer from every.org is
already used to reading code that looks that way.

## Libraries I looked at and decided not to use

There is a tendency to reach for a library every time a new concept
shows up in a codebase. I pushed back against that here, and I want to
walk you through the decisions in case it is useful.

**State machine libraries like yay-machine, matchina, and fsmator.** For
four states and four transitions, a single constant file and a one line
check does the job. I would reach for one of these libraries only if
transitions needed guards, conditions, or callbacks, which they do not
here.

**@tanstack/react-table.** It is a great library, but for a table with
eight rows and seven columns, plain JSX was shorter and more direct.

**neverthrow and ts-pattern.** Throwing domain errors and mapping them
to HTTP responses in one central place is what most TypeScript
codebases already look like. It is also easier for a reviewer who is
new to the code to follow the flow.

**next-test-api-route-handler.** Calling the exported GET, POST, and
PATCH functions directly in my tests has zero extra dependencies and
works cleanly. The examples of how I did that are in
`tests/routes.*.test.ts`.

**Zod `z.interface()`.** It is faster than `z.object()`, yes. But it
gives up some useful methods like `extend`, `merge`, `pick`, and
`omit`. I stayed with `z.object()` because it is what most people know.

**React Compiler, Server Actions, and the `"use cache"` directive.**
These are exciting new features, but each of them solves a problem I do
not actually have in this codebase.

## Testing

I wrote 32 tests using Vitest 4. Each test builds a synthetic request
object and calls the exported endpoint function directly. No HTTP
server is spun up for the tests, and no testing framework shims sit in
the middle.

The file `tests/transitions.test.ts` covers the full four by four truth
table of the state machine, meaning every possible move from every
possible starting status, plus the checks that final statuses really
are final.

The file `tests/routes.post.test.ts` covers the create endpoint: the
happy path, the duplicate uuid case, non positive amounts, and wrong
types.

The file `tests/routes.patch.test.ts` covers the status update endpoint:
the happy path, the same status case, an invalid transition, a not
found case, terminal transitions, and enum validation.

The file `tests/routes.get.test.ts` covers the list and fetch endpoints:
the envelope shape, the pagination cursor, the found case, and the not
found case.

Every test file calls a helper called `resetRepositoryForTests()` in
its `beforeEach` hook. This means the tests never leak state into one
another.

## What I would do with more time

There are several things I would add, in roughly the order I would
tackle them.

The first is authentication. I would plug in NextAuth with Google sign
in and lock access so that only people with an @every.org email address
can get through. Every endpoint would check for a valid session, and
the name of the person making each change would get recorded in the
donation's transitions history. So the timeline on any record would
say "Jane moved this from pending to success at such and such time,"
not just "moved from pending to success." That adds real accountability
and makes it easy to figure out who to ask when a donation looks odd.

The second is swapping the in memory storage for a real database. I
would reach for SQLite through the `better-sqlite3` library because it
is very simple to set up and more than enough for this volume of
traffic. The way I wrote the storage layer, this is genuinely a one
line change in `src/server/container.ts`. The endpoints never need to
know.

The third is adding protection against two people editing the same
record at the same second. The UI would hold the version of the record
it loaded, send it along on PATCH, and the server would reject the
update with a 412 if the version had changed in the meantime. The
dashboard would catch the rejection, refetch, and show a small
"somebody else just edited this, here is what changed, still want to
continue?" dialog.

The fourth is proper webhook delivery. Right now final status changes
log a structured event line to standard output, which is enough for a
demo but not for production. In production you need actual delivery to
whoever is listening, with retries, and a safety net for when the
receiver is temporarily down. I would add a small table called
`pending_events` written in the same database transaction as the status
change, so nothing is ever lost in between. A small background worker
would read from it and post events out, retrying on failure. If
delivery keeps failing after several retries, the event moves to what
people call a dead letter queue, which is simply a separate table where
a human can inspect it later. This is the same pattern every.org
already uses for its real webhooks.

The fifth is observability, which is just a slightly fancy word for
being able to see what is happening inside the system. I would swap the
console calls for a proper logging library called pino, which prints
prettily in development and outputs clean JSON in production that any
log pipeline can pick up. I would add timing measurements for every
endpoint, and I would wire up a basic error rate alert so the team
finds out about problems from notifications, not by accident.

The sixth is bulk actions in the dashboard. Operators often arrive to
find thirty new donations waiting to move to pending. I would add
checkboxes, a small control that says "advance all selected to
pending," and a confirmation screen showing exactly what is about to
change before the operator commits to it.

The seventh is pagination in the dashboard. The server already supports
a cursor. I just did not turn it on in the UI because eight seed
records is not enough to bother with. The moment the list grows long
enough that scrolling gets annoying, I would switch it on in the table
and add page controls at the bottom.

The eighth and final one is a CSV export button. Sometimes an operator
just needs to send their manager "here are all the donations that
failed last week," and a one click export of the currently filtered
view handles that cleanly.

## Repository layout

```
every-donations-console/
├── .github/workflows/ci.yml
├── .nvmrc                               # Node 22.15.0
├── .prettierrc                          # every.org style
├── Dockerfile                           # 3 stage alpine build
├── src/
│   ├── app/
│   │   ├── page.tsx                     # dashboard (server component)
│   │   └── api/donations/
│   │       ├── route.ts                 # POST and GET list
│   │       └── [uuid]/
│   │           ├── route.ts             # GET single
│   │           └── status/route.ts      # PATCH status
│   ├── domain/                          # framework independent
│   │   ├── types.ts
│   │   ├── transitions.ts               # TRANSITIONS plus helpers
│   │   └── errors.ts                    # DomainError subclasses
│   ├── data/
│   │   ├── repository.ts                # interface plus in memory impl
│   │   └── seed.ts                      # 8 spec donations
│   ├── server/
│   │   ├── container.ts                 # repo singleton, resetForTests
│   │   ├── schemas.ts                   # Zod
│   │   ├── errorMap.ts                  # DomainError to HTTP
│   │   ├── webhook.ts                   # final state envelope emitter
│   │   └── log.ts                       # structured JSON logger
│   └── ui/                              # client side
│       ├── client-root.tsx              # useReducer plus fetch orchestration
│       ├── components/
│       └── format.ts
└── tests/
    ├── transitions.test.ts
    ├── routes.post.test.ts
    ├── routes.patch.test.ts
    ├── routes.get.test.ts
    └── helpers.ts
```
