Below is a comprehensive blueprint for implementing the Cloudflare Worker API along with iterative, step‐by‐step prompts. Each section builds on the previous one so that the final code is fully integrated with no orphaned pieces. You can hand these prompts over to a code-generation LLM one by one, ensuring incremental progress and best practices at every stage.

---

## 1. Blueprint Overview

**Project Summary:**  
Build a Cloudflare Worker that exposes a POST endpoint. This endpoint:
- Validates an incoming request (authorization header and JSON body with a `status` and `text` field).
- Selects a system message, JSON schema, and HTML template based on the `status` (allowed values: `done`, `not_done`, `canceled`).
- Calls OpenAI through Cloudflare AI Gateway using the selected schema and system message.
- Formats the AI response using the predefined HTML template.
- Returns the formatted HTML (wrapped in JSON) and handles errors gracefully.

**Key Components:**
- **Authorization:** Validate the Bearer token against the stored `AUTH_TOKEN`.
- **Request Validation:** Ensure `status` is one of `done`, `not_done`, or `canceled` and that `text` is a non-empty string.
- **Mapping Constants:** Inline definitions for system messages, JSON schemas, and HTML templates per status.
- **OpenAI Integration:** Build the payload (using model `gpt-4o-mini`) and call OpenAI via Cloudflare AI Gateway with proper error handling.
- **HTML Formatting:** Replace placeholders in the HTML template with the OpenAI response fields.
- **Error Handling:** Return appropriate HTTP codes (400, 401, 500) with JSON error messages.
- **Deployment:** Use `wrangler publish` with an appropriate `wrangler.toml` configuration.

---

## 2. Iterative Breakdown into Chunks

### **Chunk 1: Basic Project Setup**
- **Goal:** Set up the basic Cloudflare Worker project with a simple endpoint that returns a “Hello, world!” message.
- **Substeps:**
  - Initialize a new Cloudflare Worker project (with Wrangler).
  - Create a basic `index.js` (or similar) file with an event listener for fetch events.
  - Return a static “Hello, world!” response.

### **Chunk 2: Implement Authorization Check**
- **Goal:** Enhance the worker to check the Authorization header.
- **Substeps:**
  - Retrieve the `Authorization` header from the request.
  - Compare it against the `AUTH_TOKEN` stored in Cloudflare secrets.
  - Return a `401 Unauthorized` response if the token is missing or invalid.

### **Chunk 3: Parse & Validate Request Body**
- **Goal:** Parse the JSON body of the POST request and validate its fields.
- **Substeps:**
  - Parse the request body.
  - Ensure the JSON contains a non-empty `text` field.
  - Validate that `status` is one of `done`, `not_done`, or `canceled`.
  - Return a `400 Bad Request` for any validation failures.

### **Chunk 4: Define Mappings for Statuses**
- **Goal:** Create constant mappings for system messages, JSON schemas, and HTML templates.
- **Substeps:**
  - Define an inline mapping (object) for each status to its system message.
  - Define corresponding JSON schema objects for each status.
  - Define inline HTML templates with placeholders for each status.

### **Chunk 5: Implement OpenAI API Call Function**
- **Goal:** Create a function that builds and sends the request to OpenAI via Cloudflare AI Gateway.
- **Substeps:**
  - Construct the request payload using the provided system message, user text, and JSON schema.
  - Retrieve the `OPENAI_API_KEY` from Cloudflare secrets.
  - Handle the response from OpenAI.
  - Stub out the function if needed while ensuring proper error handling (return a simulated error if the call fails).

### **Chunk 6: Build HTML Formatting Function**
- **Goal:** Write a function to convert the OpenAI response into a formatted HTML string.
- **Substeps:**
  - Accept the OpenAI response and the corresponding HTML template.
  - Replace placeholders (e.g., `{{blocked}}`, `{{do_next}}`) in the template with data from the response.
  - Return the final HTML string.

### **Chunk 7: Integrate Components in Main Handler**
- **Goal:** Wire everything together in the main event handler.
- **Substeps:**
  - Perform the authorization check.
  - Parse and validate the request body.
  - Select the correct system message, JSON schema, and HTML template based on the `status`.
  - Call the OpenAI function to get a response.
  - Format the OpenAI response into HTML.
  - Return the final JSON response containing the HTML.
  - Ensure that every error scenario is caught and handled with the correct HTTP status code.

### **Chunk 8: Testing & Deployment**
- **Goal:** Prepare for manual testing and deployment.
- **Substeps:**
  - Write in-code comments or unit tests outlining how to test various cases (valid request, invalid status, empty text, missing/incorrect token, OpenAI failure).
  - Create a `wrangler.toml` file with the proper configuration.
  - Add deployment instructions using `wrangler publish`.

---

## 3. Prompts for a Code-Generation LLM

Below are separate markdown sections, each containing a code-tagged text prompt. Each prompt builds on the previous ones and ends with wiring components together.

---

```text
Prompt 1: Basic Project Setup

Create a new Cloudflare Worker project. Initialize the project with a simple entry file (e.g., index.js) that includes an event listener for fetch events. The worker should respond with a plain text "Hello, world!" message to any incoming request. Ensure that the project is set up for further expansion.
```

---

```text
Prompt 2: Implement Authorization Check

Enhance the basic Cloudflare Worker by adding a check for the Authorization header. In the fetch event handler, retrieve the 'Authorization' header and compare it with the stored AUTH_TOKEN (assumed to be set up as a secret in Cloudflare). If the header is missing or the token is invalid, the worker should immediately return a JSON response with an error message ("Unauthorized") and a 401 HTTP status code.
```

---

```text
Prompt 3: Parse and Validate the Request Body

Extend the Cloudflare Worker to handle POST requests. Parse the JSON body of the incoming request. Validate that:
1. A "status" field is present and its value is one of "done", "not_done", or "canceled".
2. A "text" field is present and is a non-empty string.
If any validation fails, return a JSON response with an error message ("Invalid request") and a 400 HTTP status code.
```

---

```text
Prompt 4: Define Mappings for System Messages, Schemas, and HTML Templates

In the worker code, define constant mapping objects for:
- System messages: Map each status ("done", "not_done", "canceled") to a predefined system message string.
- JSON schemas: Map each status to its corresponding JSON schema object.
- HTML templates: Map each status to an inline HTML template string containing placeholders (e.g., {{blocked}}, {{do_next}}).
These constants should be declared at the top of the worker file so that they can be referenced throughout the code.
```

---

```text
Prompt 5: Implement the OpenAI API Call Function

Write a function (e.g., callOpenAI) that takes the system message, user text, and the corresponding JSON schema as parameters. This function should:
- Construct a JSON payload including:
  - "model": "gpt-4o-mini"
  - "response_format": "json_schema"
  - "messages": an array with a system message and the user message.
  - "json_schema": the selected schema object.
- Retrieve the OPENAI_API_KEY from Cloudflare secrets.
- Send the payload to the Cloudflare AI Gateway endpoint (simulate the call if necessary).
- Handle any errors and return the OpenAI API response.
If the API call fails, ensure the function returns or throws an error that can be caught to return a 500 response.
```

---

```text
Prompt 6: Build the HTML Formatting Function

Develop a function that takes the HTML template (for the current status) and the response object returned from the OpenAI API call. The function should replace all placeholder tokens (e.g., {{blocked}}, {{do_next}}) in the template with corresponding values from the response. Return the resulting HTML string.
```

---

```text
Prompt 7: Integrate All Components in the Main Request Handler

Combine the authorization, request validation, system message/schema/template selection, OpenAI API call, and HTML formatting functions in the main fetch event handler. The flow should be:
1. Check for a valid Authorization header.
2. Parse and validate the JSON body.
3. Based on the "status" field, retrieve the appropriate system message, JSON schema, and HTML template.
4. Call the OpenAI API function using these parameters.
5. Format the OpenAI response using the HTML formatting function.
6. Return a JSON response with the final HTML (e.g., { "html": "<formatted_HTML>" }).
Ensure that error handling is in place for each step (return 400, 401, or 500 as needed) and that errors are logged via console.error().
```

---

```text
Prompt 8: Testing and Deployment Setup

Finally, create a wrangler.toml configuration file with the necessary settings for deploying the worker. Include instructions (as comments) for how to deploy using `wrangler publish` and test the API endpoint (using tools such as Postman or cURL).
```

---
