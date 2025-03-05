# Cloudflare Worker API Project - Todo Checklist

## 1. Project Setup
- [X] **Initialize Project:**  
  - [X] Create a new Cloudflare Worker project (using Wrangler).
  - [X] Set up a basic project structure (e.g., index.js or worker.js).

- [X] **Basic "Hello, world!" Endpoint:**  
  - [X] Add an event listener for fetch events.
  - [X] Implement a simple response returning "Hello, world!".

## 2. Authorization Handling
- [X] **Retrieve Authorization Header:**  
  - [X] In the fetch handler, extract the `Authorization` header from the request.
  
- [X] **Validate Authorization Token:**  
  - [X] Compare the extracted token against `AUTH_TOKEN` stored in Cloudflare secrets.
  - [X] Return a JSON response with an error message and a 401 status if the token is missing or invalid.

## 3. Request Parsing and Validation
- [X] **Parse Request Body:**  
  - [X] Handle only POST requests.
  - [X] Parse the incoming JSON request body.
  
- [X] **Validate Request Fields:**  
  - [X] Check that the `status` field is present and its value is one of `done`, `not_done`, or `canceled`.
  - [X] Verify that the `text` field exists and is a non-empty string.
  - [X] If validation fails, return a JSON error message with a 400 status.

## 4. Define Mappings for Status
- [X] **System Messages:**  
  - [X] Create a constant object mapping each status to its corresponding system message.

- [X] **JSON Schemas:**  
  - [X] Create a constant object mapping each status to its respective JSON schema.

- [X] **HTML Templates:**  
  - [X] Create a constant object mapping each status to its corresponding HTML template with placeholders (e.g., `{{blocked}}`, `{{do_next}}`).

## 5. OpenAI API Integration
- [X] **Implement OpenAI API Call Function:**  
  - [X] Write a function (e.g., `callOpenAI`) that:
    - [X] Constructs the request payload with:
      - [X] `"model": "gpt-4o-mini"`
      - [X] `"response_format": "json_schema"`
      - [X] `messages` array with system and user messages.
      - [X] The appropriate JSON schema.
    - [X] Retrieves `OPENAI_API_KEY` from Cloudflare secrets.
    - [X] Sends the payload to the Cloudflare AI Gateway endpoint.
    - [X] Handles errors by logging them and returning an appropriate error response.

## 6. HTML Formatting Function
- [X] **Build HTML Formatter:**  
  - [X] Create a function that accepts the HTML template and the OpenAI API response.
  - [X] Replace all placeholders in the template with the corresponding response values.
  - [X] Return the fully formatted HTML string.

## 7. Main Request Handler Integration
- [X] **Combine All Components:**  
  - [X] In the main fetch event handler:
    - [X] Execute the authorization check.
    - [X] Parse and validate the request body.
    - [X] Based on the `status` field, retrieve the appropriate system message, JSON schema, and HTML template.
    - [X] Call the OpenAI API integration function.
    - [X] Format the API response using the HTML formatting function.
    - [X] Return the final JSON response with the formatted HTML.
  - [X] Ensure all error cases (400, 401, 500) are correctly handled and logged via `console.error()`.

## 8. Testing and Quality Assurance
- [ ] **Write Test Cases / Documentation:**  
  - [ ] Document how to test:
    - [ ] A valid request (ensuring correct HTML output).
    - [ ] An invalid `status` or empty `text` resulting in a 400 response.
    - [ ] Missing or incorrect Authorization header resulting in a 401 response.
    - [ ] Simulated OpenAI API failure resulting in a 500 response.
- [ ] **Manual Testing:**  
  - [ ] Use tools such as Postman or cURL to test each endpoint and scenario.

## 9. Deployment Setup
- [X] **Configure Deployment:**  
  - [X] Create a `wrangler.toml` file with the required settings.
  - [X] Include details for environment variables (e.g., `AUTH_TOKEN`, `OPENAI_API_KEY`).
  
- [X] **Deployment Instructions:**  
  - [X] Add comments or documentation on how to deploy using `wrangler publish`.

## 10. Final Code Review and Integration
- [ ] **Review and Cleanup:**  
  - [ ] Ensure no orphaned code exists and all functions are well integrated.
  - [ ] Double-check error handling, logging, and overall code quality.
- [ ] **Final QA:**  
  - [ ] Perform a full walkthrough to validate the end-to-end functionality of the worker.
