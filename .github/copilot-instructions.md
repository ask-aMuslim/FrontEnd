## AskAMuslim AI Agent Operating Instructions (Single Source of Truth)

This file is the **only** project instruction file to be used for agent behavior.
Ignore any deleted legacy instruction files and avoid loading broad skill packs unless explicitly requested.

### Execution Model
- Execute tasks in one flow: **Analyze → Plan → Implement → Verify**.
- Keep context minimal: only open files required for the task.
- Do not pause for intermediate confirmations unless blocked by missing requirements.

### Architecture and Code Rules
- Angular 20, standalone components, `ChangeDetectionStrategy.OnPush` by default.
- Strict TypeScript: no `any`, no unsafe casts, no dead code, no duplicated logic.
- No HTTP calls in components; use `src/app/api/fn/**` + facades in `src/app/api/facades/**`.
- Prefer signals + immutable updates; no direct state mutation.
- No business logic in templates, no inline styles, no magic numbers.

### Contract and Integration Discipline
- Treat OpenAPI/Postman contracts as authoritative.
- For API-impacting changes, validate with project checks (including swagger/contract checks when relevant).
- Never invent endpoints; verify in workspace before implementation.

### Quality Gates
- Before completion, run and pass: build, test, lint (and contract checks when applicable).
- Fix introduced errors before finishing.

### Context Hygiene
- Keep one instruction source only: this file.
- Avoid loading extra rule systems or redundant instruction files.

### Speckit Usage
- Use Speckit workflows when the task is feature-sized or multi-step.
- For small scoped edits, apply minimal-change implementation directly, then verify.
- Orchestrate the full Speckit pipeline using these subagents as needed:
  - `speckit.analyze`
  - `speckit.checklist`
  - `speckit.clarify`
  - `speckit.constitution`
  - `speckit.plan`
  - `speckit.specify`
  - `speckit.tasks`
  - `speckit.taskstoissues`
  - `speckit.implement`
- Ensure each pipeline step completes successfully and produce the corresponding outputs (spec, plan, tasks, implementation artifacts).
- Treat Speckit as the authoritative workflow engine; do not bypass it for work that matches a Speckit stage.

### Skill System (must remain intact)
- This repo includes a global AI skill system; do not delete or ignore it.
- Follow skill guidance when the task or maintainers explicitly require it.
- Do not load all 600+ skills into the context; only use the subset that applies to the task.

### Figma MCP (Talk-to-Figma) — usage
- Purpose: concise recipe for using the Talk-to-Figma MCP tools to join any Figma channel and fetch node information for any node.
- Quick steps:
  1. Join a Figma channel: call `mcp_talktofigma_join_channel` with the channel string (e.g., `{"channel":"qen7sxyt"}`). Wait for confirmation.
  2. Extract the node id from a Figma URL and prefer the colon format: `1091:40748`.
    - If the URL shows a hyphen form (e.g., `1091-40748`), convert the hyphen to a colon before calling the tool.
  3. Get node info: call `mcp_talktofigma_get_node_info` with the nodeId (e.g., `{"nodeId":"1091:40748"}`). The tool returns JSON with node metadata, fills, styles, absoluteBoundingBox, and children.
  4. For multiple nodes use `mcp_talktofigma_get_nodes_info` with an array of nodeIds.
  5. Useful related tools:
    - `mcp_talktofigma_get_local_components` — list local components in the document.
    - `mcp_talktofigma_get_reactions` — retrieve prototyping reactions for nodes (useful when creating connectors).
    - `mcp_talktofigma_clone_node`, `mcp_talktofigma_move_node`, `mcp_talktofigma_delete_node` — modify nodes (use carefully; confirm nodeIds and coords).
    - `mcp_talktofigma_scan_text_nodes` — extract text content from a frame or selection.
  6. Common errors & remedies:
    - "Node not found": ensure the nodeId uses colon format (`1091:40748`) and that the agent has joined the correct channel; re-join the channel if needed.
    - Web fetch shows "WebGL not supported": this is expected when fetching the public Figma URL in a headless/webfetch context — still use MCP tools to operate on nodes.
    - Access denied: request the file be shared or perform the action from an account with access.
  7. Example payloads:
    - Join channel: `{ "channel": "qen7sxyt" }`
    - Get node info: `{ "nodeId": "1091:40748" }`


### Verification Tools & Environments
- **UI tasks**: Use Chrome DevTools MCP to validate UI updates, component render trees, and state changes.
- **API integration tasks**: Use Postman MCP + Postman extension to validate endpoints, request bodies, and responses; use Chrome DevTools MCP to verify correct UI interaction with the API.
- **Design reference**: Figma: http://figma.com/design/90ZtQuhT2ww9KvzjZm4SIq/UX~UI-%7C-Ask-A-Muslim?node-id=1-4&p=f&t=DJXus2KQZovbHkMi-0

### Access Points
- **Admin panel**: https://adminpanel.ask-a-muslim.com/auth/login
  - email: `administrator@ask-a-muslim.com`
  - password: `P@ssw0rd`
- **User site (local)**: run locally and log in via:
  - email: `aa6310336@gmail.com`
  - password: `Pa$$w0rd`

