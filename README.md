# TestDrive: a WebMCP and MCP demo

A test drive booking app that shows how an AI agent can work a web page three ways:

1. With no tools. The agent reads the page and clicks like a person.
2. With WebMCP. The page registers tools on `document.modelContext` that a browser agent can call, in the user's tab, with the user's session.
3. With a classic MCP server. Any MCP client (Claude Code, Claude Desktop) connects to `/api/mcp` over HTTP.

The header has a toggle that turns WebMCP on and off, so the same page can be shown with and without tools. Everything updates live across open tabs.

## Stack

Next.js 16 (App Router, React Compiler, Turbopack), React 19.3 (`ViewTransition`, `Activity`), shadcn 4 on Base UI, Tailwind 4, Drizzle 1.0 on Node's built-in `node:sqlite` (brands, models, cars, slots, bookings), `@modelcontextprotocol/server` 2 for the MCP endpoint, `usewebmcp` for WebMCP registration, `motion` for micro-animations, Server-Sent Events for realtime.

Tests: Vitest 5 (node and browser projects), Playwright 1.63 for end to end. Package decisions and the docs each one came from are in `docs/decisions.md`.

## Run it

```bash
pnpm install
pnpm db:seed          # creates data/testdrive.db with 8 cars and two weeks of slots
pnpm dev              # http://localhost:3000
```

`pnpm db:seed --reset` wipes the fleet and reseeds. The seed is five brands with five current models each (Volvo, Polestar, BMW, Audi, Toyota). Body type, powertrain, gearbox, driven wheels, and seat count follow the real cars, with one common version listed where a model is sold in several; years, colors, features, tow hitch, and taglines are demo choices, not specifications. Cars ship without photos: each shows a generated placeholder (a color derived from the car id, the brand and model as type, the body type, and a faint silhouette) until photos are added in Admin, one URL per line. Added photos show in a carousel with a credit line. Tests use a separate fictional fleet so they do not depend on the demo data.

To browse the database, run `pnpm db:studio` and open https://local.drizzle.studio.

## Browsing and booking

Clicking a car in the list opens it in a modal while the URL changes to `/book/<id>`. That URL is shareable: opened directly or in a new tab it renders the full car page. Closing the modal goes back to the list with its filters and scroll position intact. This is Next.js's intercepting route pattern (`app/@modal/(.)book/[carId]`). Filters only offer values in stock, and results can be shown as cards or a table. The booking picker is a month calendar (days with free slots are selectable, full days are struck through) next to the day's time slots grouped by morning and afternoon.

## Enable WebMCP in Chrome

WebMCP is behind a flag while it is in origin trial.

1. Use Chrome 149 or newer. Chrome 153 or newer also supports unregistering tools, which the header toggle relies on.
2. Open `chrome://flags/#enable-webmcp-testing`, set it to Enabled, relaunch.
3. Reload the app. The header badge reads Native and the toggle becomes active. The (?) button next to it repeats these steps.

Quickest check, in the DevTools console on any page of the app with the toggle on:

```js
const tools = await document.modelContext.getTools();
console.log(tools.map((t) => t.name));
const find = tools.find((t) => t.name === "find_cars");
console.log(await document.modelContext.executeTool(find, JSON.stringify({ powertrain: "electric" })));
```

Chrome takes the arguments as a JSON string and returns the tool's text. To see and call the registered tools by hand, install the [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) extension. The page can only detect whether `document.modelContext` exists, not whether it came from the flag. The [Chrome Status entry](https://chromestatus.com/feature/5117755740913664) shows when the API ships by default.

## Install the classic MCP server

Claude Code:

```bash
claude mcp add --transport http testdrive http://localhost:3000/api/mcp
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "testdrive": { "command": "npx", "args": ["-y", "mcp-remote", "http://localhost:3000/api/mcp"] }
  }
}
```

The Connect page in the app shows the same snippets with the right origin and a copy button.

## Demo script

Which agent to use for each scenario matters, because not every agent speaks WebMCP.

1. No tools: Claude in Chrome. The extension does not discover `document.modelContext` tools (Anthropic's tracker has an open request for it), so it clicks through the page like a person. Leave the WebMCP toggle off or on, it makes no difference to Claude. Open the side panel on the app and ask: "Book a test drive in an electric Volvo with a tow hitch, tomorrow afternoon, for Ada Lovelace." Watch it read cards, open one, pick a slot, and fill the form. Open Admin in a second tab to watch the booking arrive live.
2. WebMCP: an agent that reads the page's tools. Two options today. The Model Context Tool Inspector extension lists the tools, lets you call them by hand, and has a chat that can run against Claude, Gemini, OpenAI, or Ollama with your own key. Gemini in Chrome calls WebMCP tools natively where it is available. Flip the header toggle on, open the tools popover to show what the page registered, and ask the same question. The agent should call `find_cars`, `list_available_slots`, and `book_test_drive` instead of clicking, and the Inspector logs each call. Flip the toggle off and ask again to show the fallback.
3. Classic MCP: Claude Code or Claude Desktop with the server installed (snippets on the Connect page). In a terminal, `claude`, then: "Use the testdrive tools to list electric cars with a tow hitch and book the first free slot tomorrow for Ada Lovelace." The browser tab updates the moment the booking lands.

## How WebMCP works, in general

This section is for anyone who wants to give their own site tools for browser agents. Nothing here depends on Next.js.

**The idea.** A page registers small functions on `document.modelContext`. Each function has a name, a description, a JSON Schema for its input, and an `execute` callback. An agent running in the browser (Gemini in Chrome, an extension such as the Model Context Tool Inspector, or anything else that reads `document.modelContext`) lists those tools and calls them instead of guessing which button to click. The tools run in the user's tab, with the user's session and cookies, so a tool can do exactly what a click would do. When the tab closes, the tools are gone. That is the difference from a classic MCP server, which runs on a backend, is always on, and needs its own auth.

**Registering a tool.** The browser API, as it exists in Chrome 149 and later behind `chrome://flags/#enable-webmcp-testing`:

```js
const controller = new AbortController();
await document.modelContext.registerTool(
  {
    name: "list_available_slots",
    description: "List free 45 minute test drive slots for one car on one day.",
    inputSchema: {
      type: "object",
      properties: {
        car: { type: "string", description: "Car id or car name." },
        date: { type: "string", description: "Day to check, formatted YYYY-MM-DD." },
      },
      required: ["car", "date"],
    },
    annotations: { readOnlyHint: true },
    execute: async ({ car, date }) => {
      const res = await fetch(`/api/slots?car=${car}&date=${date}`);
      return await res.text(); // a plain string is fine
    },
  },
  { signal: controller.signal },
);
// later, for example when the component unmounts:
controller.abort();
```

Points that matter in practice:

- Unregister with the abort signal (Chrome 153 and later). A single-page app mounts and unmounts views all the time; tools that describe a view that is no longer on screen confuse agents. Register page tools when the view mounts and abort when it unmounts. Our toggle in the header does exactly that for every tool at once.
- Return a string, keep it short. Chrome's guidance is up to 1.5K characters of output, 500 for a description, 150 per parameter description, 30 for names. Say what the tool did and include the ids the agent needs for the next call.
- Prefer names over ids in inputs, and accept both. Agents work from what the user said ("the XC60"), so `list_available_slots` takes a car name or id.
- Mark consequences. `readOnlyHint` for reads, `consequentialHint` for anything that books, pays, or deletes, `untrustedContentHint` when a tool returns user-generated content. Agents use these to decide when to ask the user first.
- After a tool runs, update the UI. Agents look at the page to plan the next step, so a tool that books a slot should also make the slot look booked. Ours re-renders through the same live channel the UI uses.
- Keep the same vocabulary everywhere. Our tool names and descriptions live in one file and feed both WebMCP and the classic MCP server, so an agent that learned the tools in one place recognises them in the other.
- One tool, one job. `select_slot` highlights a slot and opens the form; `book_test_drive` books. Splitting them lets the agent show its work and lets the user intervene.

**Where the tools live in this repo.** `src/lib/tool-defs.ts` holds names and descriptions, `src/lib/webmcp-schemas.ts` the JSON Schemas, `src/components/webmcp/` the registration (through the `usewebmcp` React hook, which handles the abort signal on unmount and the enabled flag), and `src/mcp/server.ts` the same tools for classic MCP.

**Testing without an agent.** Paste the DevTools snippet above, or install the Model Context Tool Inspector. In automated tests we install a small stand-in for `document.modelContext` that records registrations and can execute a tool by name (`tests/model-context-stub.js`), so Playwright can flip the toggle and drive the page through the tools.

**Where it is heading.** WebMCP is a Chrome origin trial (Chrome 149 to 156) targeted to ship in Chrome 157. Sites can join the origin trial to enable it for their visitors before that.

**Sources**

- [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp), [imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api), [declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api), [best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices), [securing tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools), [WebMCP compared to MCP](https://developer.chrome.com/docs/ai/webmcp/compare-mcp) on developer.chrome.com
- [WebMCP explainer and spec discussion](https://github.com/webmachinelearning/webmcp) from the Web Machine Learning community group
- [Chrome Status entry](https://chromestatus.com/feature/5117755740913664) for the shipping timeline and the [origin trial registration](https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241)
- [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) extension and its [source](https://github.com/beaufortfrancois/model-context-tool-inspector)
- [Chrome's WebMCP demos](https://github.com/GoogleChromeLabs/webmcp-tools), including a React flight search
- [usewebmcp](https://www.npmjs.com/package/usewebmcp), the React hook used here, from the [WebMCP-org packages](https://github.com/WebMCP-org/npm-packages)
- [Model Context Protocol specification](https://modelcontextprotocol.io) and the [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) used for the classic server
- [mcp-remote](https://www.npmjs.com/package/mcp-remote), the stdio bridge used in the Claude Desktop snippet

## Tools

The names and descriptions live in `src/lib/tool-defs.ts` and are shared by both routes.

| Tool | Where | What it does |
| --- | --- | --- |
| `find_cars` | both | Filter the fleet by brand, model, body type, powertrain, transmission, drivetrain, color, seats, tow hitch, year, feature |
| `list_brands` | both | The brand and model tree |
| `add_model` | MCP, and WebMCP on the admin page | Add a model, creating the brand if needed |
| `list_available_slots` | both | Free 45 minute slots for a car on a day |
| `get_booking`, `book_test_drive`, `cancel_booking` | both | Read, create, cancel a booking |
| `list_bookings`, `create_car`, `generate_slots` | MCP, and WebMCP on the admin page | Admin actions. `create_car` takes brand and model names and a color from the fixed list |
| `filter_cars`, `select_car`, `select_slot` | WebMCP only | Drive the page the user is looking at |

## Tests

```bash
pnpm test          # Vitest: unit (node) and component (chromium) projects
pnpm test:e2e      # Playwright, starts its own dev server on port 3100 with a throwaway database
pnpm lint
pnpm build
```

## Layout

```
src/app            pages and API routes (/api/mcp, /api/events)
src/lib            domain: booking service, filters, tool definitions, events, actions
src/mcp            the classic MCP server
src/components     booking, admin, connect, live, webmcp
src/db             schema, database bootstrap, seed
drizzle            SQL migrations, applied on startup
tests              shared test setup and the document.modelContext stub
e2e                Playwright specs
```

## Contributing

`main` is protected. Work on a branch, open a pull request, and merge once the `checks` and `e2e` workflows pass and every review comment is resolved. Direct pushes to `main` are rejected, including for admins.
