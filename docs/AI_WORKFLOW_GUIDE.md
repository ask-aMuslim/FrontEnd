# AI-Driven API Integration Workflow

This guide details how to use AI tools and Postman to streamline the integration between the backend (Swagger) and the Angular frontend.

## Prerequisites
- **Postman**: For testing and mocking API endpoints.
- **Swagger/OpenAPI Spec**: The source of truth for API definitions.
- **AI Assistant**: To generate code and types.

## Recommended Tool Stack for "Zero-Effort" Integration

To achieve near-automatic integration, I recommend this specific stack:

### 1. **OpenAPI Generator (The Foundation)**
*Not strictly AI, but better.*
- **What it does**: Reads your Swagger URL and **automatically generates** the entire Angular `ApiService`, all TypeScript interfaces, and API methods.
- **Why**: Zero manual typing of interfaces. 100% match with the backend.
- **Command**: `npx @openapitools/openapi-generator-cli generate -i [swagger_url] -g typescript-angular -o src/app/core/api`

### 2. **Cursor (The AI IDE)**
- **What it does**: Allows you to highlight a component and say "Connect this functionality to `UserService.getUser`".
- **Why**: It reads your generated API code and writes the frontend logic for you.

### 3. **Postman "Postbot"**
- **What it does**: AI assistant built into Postman.
- **Why**: Automatically writes test scripts and visualizes responses without you writing code.

---

## Workflow

### 1. Type Generation
Instead of writing interfaces manually, ask the AI to generate them from the Swagger JSON.

**Prompt Template:**
> "Here is the Swagger JSON schema for the `[Endpoint Name]` endpoint: `[Paste Schema]`. Please generate the corresponding TypeScript interfaces for the request and response."

### 2. Service Implementation
Once interfaces are defined, use the AI to generate the Angular service method.

**Prompt Template:**
> "Using the `ApiService` in `src/app/core/services/api.service.ts`, implement a method in `[ServiceName]` to call `POST /api/[endpoint]`. Use the `[InterfaceName]` interface for the payload and expect a `[ResponseInterface]` response."

### 3. Mocking with Postman
If the backend is not ready, use Postman to create a mock server.
1. Import the Swagger YAML/JSON into Postman.
2. Create a "Mock Server" from the collection.
3. Update `src/environments/environment.ts` to point `apiBaseUrl` to the Postman mock URL.

### 4. Integration Verification
Use the AI to write a test case or a verification script.

**Prompt Template:**
> "Write a unit test for `[ServiceName].[methodName]` that mocks `ApiService` and verifies that the correct HTTP method and URL are called."
