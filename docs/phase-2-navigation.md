# Phase 2 — Information Architecture & Navigation

**Branch/checkpoint:** `phase1/data-foundation` (Phase 2 changes currently layered on the Phase 1 branch)  
**Preview:** [Smart Analytics](https://3000-i1ldgr65ztb4y95tfg5g6-9f69283c.sg2.manus.computer/)

## Implemented

- Added one responsive application shell to module and administration routes: persistent sidebar, breadcrumbs, cross-workspace search entry, Copilot shortcut, notification shortcut, account menu and sign-out.
- Restructured navigation into the eight primary destinations in the brief plus four administration destinations.
- Added URL-addressable workspace tabs:
  - Network: Overview, Performance, Bottlenecks, Sites.
  - Customers & Experience: Overview, Complaints, Segments.
  - Business: Revenue, Sales, Marketing.
  - Decision Support: Priority Queue, AI Copilot.
  - Users & Access: Users, Roles & Permissions.
- Made Map a distinct primary destination. Replaced the key-dependent Google Maps canvas with Leaflet, OpenStreetMap tiles, status-colored site markers, marker clustering, nine selectable data layers, a selected-site panel and tile attribution.
- Bounded the Infrastructure migration queue to **10 rows per page** and the Map site list to **10 rows per page**. Filters reset their page index.
- Removed the duplicate Platform Health block and Module Discovery card from Executive Overview.
- Preserved existing analysis modules under consolidated routes.

## Old-to-new page mapping

| Old screen or route | New destination |
|---|---|
| Executive Overview | `/` |
| Network Overview | `/network` |
| RF Performance | `/network?view=performance` |
| Bottleneck cockpit | `/network?view=bottlenecks` |
| Sites | `/network?view=sites` |
| Intelligence Map | `/map` |
| Customer Experience | `/customers-experience` |
| Customers | `/customers-experience?view=segments` |
| Complaints | `/customers-experience?view=complaints` |
| Business & Revenue | `/business` |
| Sales | `/business?view=sales` |
| Marketing | `/business?view=marketing` |
| Infrastructure / Fiber | `/infrastructure` |
| Decision Support, Priorities, Decision Queue | `/decision-support` |
| AI Assistant | `/decision-support?view=assistant` |
| Reports | `/reports` |
| Data Sources | `/data-management` (renamed Data Management) |
| User Management | `/users-access?view=users` |
| Roles & Permissions | `/users-access?view=roles` |
| System Settings | `/system-settings` |
| Audit Logs | `/audit-logs` |
| Alerts | Bell still opens the Alerts route; drawer conversion is pending Phase 4. |

## Review screenshots

| Page | Screenshot |
|---|---|
| Executive Overview | [Desktop](./screenshots/phase-2-executive.webp) |
| Network | [Desktop](./screenshots/phase-2-network.webp) |
| Map | [Desktop, Leaflet + OSM tiles](./screenshots/phase-2-map.webp) |
| Customers & Experience | [Desktop](./screenshots/phase-2-customers.webp) |
| Business | [Desktop](./screenshots/phase-2-business.webp) |
| Infrastructure | [Desktop, 10-row pagination](./screenshots/phase-2-infrastructure.webp) |
| Decisions | [Desktop](./screenshots/phase-2-decisions.webp) |
| Reports | [Desktop](./screenshots/phase-2-reports.webp) |
| Data Management | [Desktop](./screenshots/phase-2-data-management.webp) |
| Users & Access | [Roles & Permissions tab](./screenshots/phase-2-users-access.webp) |
| System Settings | [Desktop](./screenshots/phase-2-system-settings.webp) |
| Audit Logs | [Desktop](./screenshots/phase-2-audit-logs.webp) |

## Validation

- `pnpm check`: passed.
- `pnpm test`: **29 test files, 105 tests passed**.
- `pnpm build`: passed.
- Browser confirmed the distinct Map route, visible OpenStreetMap tiles and Leaflet attribution, 10-row Map list, and 10-row Infrastructure queue.
- Temporary preview returns HTTP 200.

## Checklist

| Requirement | Status | Notes |
|---|---|---|
| Eight primary pages and four administration destinations | PASS | Map is an independent primary destination. |
| Consolidated tabs for Network, Customers, Business, Decisions and Users & Access | PASS | Views are linkable with `?view=`. |
| Old route redirects into consolidated workspaces | PASS | RF Performance and Intelligence Map redirects were browser-checked. |
| Shared navigation shell with search, Copilot, bell and user menu | PASS | Executive Overview retains its command-center layout. |
| Remove duplicate Platform Health and Module Discovery blocks | PASS | Removed from Executive Overview. |
| Real basemap, layer toggles, clustering and selected-site panel | PASS | Leaflet + OpenStreetMap tiles (with attribution), no Google API key required. |
| Bounded Map and Infrastructure lists | PASS | 10 rows per page; the former 7,000+ px pages are bounded. |
| Alerts drawer and unread count | PARTIAL | Bell opens the existing Alerts route; drawer and unread count are Phase 4. |
| Persistent time range and region filters that change values across all pages | NOT YET | Not implemented; no non-functional placeholder controls were added. |
| One shared cross-page detail drawer and removal of all mini-maps | NOT YET | Scheduled for the visual/component and workflow phases. |
| Server-enforced and region-scoped RBAC | NOT YET | Grant-aware navigation and a read-only role panel exist; server-side scope enforcement remains a security-phase item. |
| Every long table paginated and every page under 3 default screens | PARTIAL | Map and Infrastructure are bounded. Other existing lists still need a complete audit in the quality phase. |

## Notes

This phase establishes the consolidated route structure. Remaining cross-page filtering, detail-drawer, notification and server-side permission work is explicitly tracked above rather than represented as complete. The temporary sandbox preview is available while this session remains active; it is not a permanent public deployment.
