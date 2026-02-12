---
name: mcp-api-integration
description: This skill enforces that any API design, integration, or code generation must first query a configured Postman MCP server to retrieve request and response schemas. It guides the agent to use MCP for endpoint validation, error handling, and code generation without guessing.
---

# MCP API Integration Skill

Whenever the agent is tasked with:
- generating API clients
- validating frontend API usage
- creating backend API requirements
- mapping request/response contracts
- writing integration tests

Then the agent must:

1. Connect to the registered Postman MCP server.
2. Validate that the endpoint exists and schema is correct.
3. Extract request and response schemas from MCP.
4. Cross-check frontend calls against those schemas.
5. Output errors and mismatches if found.
6. Only generate code after successful MCP validation.
7. Apply strict error handling patterns (retries, rate limits, 400/429 handling).
8. Follow enterprise-grade integration patterns.

Do not proceed with code generation that violates these principles.
