# @sai360/n8n-nodes-grc

This is an n8n community node. It lets you use **SAI360 Elevate GRC** in your n8n workflows.

SAI360 Elevate GRC is an end-to-end Governance, Risk & Compliance suite covering Risk Management, Policy Management, Business Continuity Management, Vendor/Third-Party Risk Management, InfoSec/Cybersecurity Management and other GRC domains. This node lets you read, write, query, and orchestrate records and datastores in your SAI360 instance directly from n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)
- [Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `@sai360/n8n-nodes-grc`.

## Operations

The **SAI360 GRC** node exposes the following resources and operations:

- **Table records**
  - *Query (JSON)* — retrieve records from a class/table as JSON.
  - *Query (XML)* — retrieve records as XML or ZIP, with filter expressions, reference modes, metadata and workflow info.
  - *Save (JSON)* — create/update records by passing a JSON array, with optional batch size.
  - *Save (XML)* — create/update records by passing raw XML.
  - *Query or Delete* — execute a server-side query and either retrieve the result set or delete the matched records.
- **Datastores**
  - *Direct execute* — run a configured datastore and return the resulting rows.
  - *Prime for pagination* — initialise a paginated datastore execution and return the grid identifier for follow-up requests.
- **GraphQL**
  - *Execute query* — POST a GraphQL document to `/api/graphql` and return the `data` portion of the response.
- **Session**
  - *Get version info* — retrieve the SAI360 platform version.
  - *Get log* — retrieve the SAI360 server-side log (useful for debugging failed writes).
  - *Logout* — terminate the current SAI360 session.

> Available datastores, classes and GraphQL schemas are **customer-specific**. The dynamic dropdowns in the node (Datastore Name, Table Name, Class Name) load directly from your connected SAI360 instance — there are no defaults shipped with this package.

## Credentials

Two credential types are provided:

- **SAI360 GRC API (Basic Auth)** — username + password against an SAI360 instance. The credential class handles the proprietary `bwise-session` login flow internally: it POSTs to `/api/login`, caches the session token on the credential record, and re-authenticates automatically on session expiry. You only supply the base URL, username and password.
- **SAI360 GRC API (OAuth2)** — standard OAuth2 client credentials flow. Recommended for stateless integrations and machine-to-machine scenarios where you don't want to manage human user sessions.

For both credential types you must supply the **base URL** of your SAI360 instance (including the application context if your tenant uses one, e.g. `https://customer.sai360.net/bwise`).

## Compatibility

- **Minimum tested n8n version**: latest GA release (currently `n8n@2.18.4`, requires Node.js `>=22.16`).
- **SAI360 Elevate**: tested against current GA. The platform's REST surface is broadly stable across recent releases; if your instance pre-dates the introduction of `/api/graphql`, the GraphQL operation will not function but other operations will.
- **n8n Cloud**: this package follows n8n's community node verification requirements (npm provenance, `@n8n/node-cli` lint, `strict: true`). Submit at https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/.

No known version incompatibilities at the time of writing.

## Usage

### Example: Query a customer-defined datastore

This walks through fetching live data from a datastore that exists in your SAI360 tenant.

1. **Add credentials.** In n8n, go to *Credentials → New → SAI360 GRC API (Basic Auth)* (or OAuth2). Set your base URL and either user/password or OAuth2 client details. Click *Save*; n8n will validate by hitting `/versioninfo`.
2. **Add the SAI360 GRC node** to a workflow.
3. **Pick the operation.** Set *Resource* = `Datastore`, *Operation* = `Direct Execute`.
4. **Pick a datastore.** The *Datastore Name or ID* dropdown loads live from your instance — open the menu and pick one of the datastores configured in your SAI360 tenant. (Datastore IDs are bespoke per customer; ask your SAI360 administrator if you don't see what you expect.)
5. **Run the node.** The output is one n8n item per row returned by the datastore. Wire it into downstream nodes like *Set*, *IF*, *Code*, or any third-party connector to push the data wherever you need.

### Example: Create records in a class via JSON

1. Add the **SAI360 GRC** node, set *Resource* = `Table Records`, *Operation* = `Save (JSON)`.
2. Pick the target class from the *Table Name or ID* dropdown (loads live from the instance).
3. Paste a JSON array of records into the *Records* field, e.g.
   ```json
   [
     { "label": "Risk created from n8n", "description": "Imported via webhook" }
   ]
   ```
4. Optionally set *Batch Size* to split large imports. Run the node — failures are surfaced as `NodeApiError` in n8n's executions panel with the SAI360 server log appended for debugging.

### Tips

- For long-running queries, prefer the *Datastore → Prime for Pagination* operation followed by manual paged calls over *Direct Execute*, which fetches up to 10,000 rows in one go.
- The node automatically retries once on session expiry (HTTP 401) by re-authenticating; you don't need to handle this in your workflow.
- Use the *Session → Get Log* operation right after a failed *Save* to retrieve the server-side error trace.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- **SAI360 API documentation** — bundled with every SAI360 instance at `https://<your-sai360-instance>/console/docs`. The docs are private and instance-specific; use your tenant's URL.

## Version history

- **1.0.6** — Refactored basic-auth flow to n8n's `preAuthentication` + `authenticate` credential pattern (`bwise-session` header), enabling cross-workflow session caching and built-in 401 re-auth. Centralised HTTP error handling into the transport layer with structured `NodeApiError` output. Removed dependency `overrides` from `package.json`. Note: HTTP 403 responses are no longer treated as session expiry — they now correctly surface as authorisation errors.
- **1.0.5 and earlier** — Initial published versions. Compatible with SAI360 Elevate releases at or above the version that introduced `/api/login`, `/api/instances`, `/api/modelinstance`, `/api/griddata` and `/api/graphql` endpoints.
