// System message mappings for each status
const SYSTEM_MESSAGES = {
  done: "You are a formatting expert. Your task is to classify the user-provided text into one category: `key_learnings`. \r\n\r\n### **Rules**\r\n1. **Extract only the user's response**\ndo not include the question itself in the output.\r\n2. **Do not alter the user's text**\nreturn it exactly as provided.\r\n3. **Ignore any HTML tags**\nextract only the meaningful text.\r\n5. **The response must strictly follow the provided JSON schema**.\r\n\r\nYour response must be a structured JSON object that strictly adheres to the provided schema.",
  not_done: "You are a formatting expert. Your task is to classify the user-provided text into one of two categories: `blocked` or `do_next`. \r\n\r\n- **Blocked (`blocked`)**: If any portion of the text answers the question **\"What blocked you?\"**, place it in the `blocked` array.\r\n- **Do Next (`do_next`)**: If any portion of the text answers the question **\"What will you do to ensure you don't get blocked again?\"**, place it in the `do_next` array.\r\n\r\n### **Rules**\r\n1. **Extract only the user's response**\ndo not include the question itself in the output.\r\n2. **Do not alter the user's text**\nreturn it exactly as provided.\r\n3. **Ignore any HTML tags**\nextract only the meaningful text.\r\n5. **The response must strictly follow the provided JSON schema**.\r\n\r\nYour response must be a structured JSON object that strictly adheres to the provided schema.",
  canceled: "You are a formatting expert. Your task is to classify the user-provided text into one category: `why_not`. ### **Rules**\r\n1. Extract only the user's response to the question **\"Why not?\"**\r\n2. Do not alter the user's text\nreturn it exactly as provided.\r\n3. **Ignore any HTML tags**\nextract only the meaningful text.\r\n5. **The response must strictly follow the provided JSON schema**.\r\n\r\nYour response must be a structured JSON object that strictly adheres to the provided schema.",
};

// JSON schema mappings for each status
const JSON_SCHEMAS = {
  done: {"type":"json_schema","json_schema":{"name":"action_done","strict":true,"schema":{"type":"object","properties":{"key_learnings":{"type":"array","description":"An array containing only the user's responses that answer the question 'Any key learnings or next actions?'. The original question should not be included in the output.","items":{"type":"string"}}},"required":["key_learnings"],"additionalProperties":false}}},
  not_done: {"type":"json_schema","json_schema":{"name":"action_not_done","strict":true,"schema":{"type":"object","properties":{"blocked":{"type":"array","description":"An array containing only the user's responses that answer the question 'What blocked you from doing this action?'. The original question should not be included in the output.","items":{"type":"string"}},"do_next":{"type":"array","description":"An array containing only the user's responses that answer the question 'What will you do to ensure you don't get blocked again?'. The original question should not be included in the output.","items":{"type":"string"}}},"required":["blocked","do_next"],"additionalProperties":false}}},
  canceled: {"type":"json_schema","json_schema":{"name":"action_canceled","strict":true,"schema":{"type":"object","properties":{"why_not":{"type":"array","description":"An array containing only the user's responses that answer the question 'Why not?'. The original question should not be included in the output.","items":{"type":"string"}}},"required":["why_not"],"additionalProperties":false}}}
};

// HTML template mappings for each status
const HTML_TEMPLATES = {
  done: `<ul><li>Any key learnings or next actions?<ul>{{#each key_learnings}}<li>{{this}}</li>{{/each}}</ul></li></ul>`,
  not_done: `<ul><li>What blocked you from doing this action?<ul>{{#each blocked}}<li>{{this}}</li>{{/each}}</ul><li>What will you do to ensure you don't get blocked again?<ul>{{#each do_next}}<li>{{this}}</li>{{/each}}</ul></ul>`,
  canceled: `<ul><li>Why not?<ul>{{#each why_not}}<li>{{this}}</li>{{/each}}</ul></ul>`
};

// HTML formatting function
function formatHTML(template, data) {
  let html = template;
  
  // Handle each array in the data using {{#each}} syntax
  for (const key in data) {
    if (Array.isArray(data[key])) {
      // Find the {{#each key}}...{{/each}} block
      const eachRegex = new RegExp(`{{#each ${key}}}([\\s\\S]*?){{/each}}`, 'g');
      const match = eachRegex.exec(html);
      
      if (match) {
        const itemTemplate = match[1]; // The content between {{#each}} and {{/each}}
        const renderedItems = data[key]
          .map(item => itemTemplate.replace(/{{this}}/g, item))
          .join('');
        
        // Replace the entire {{#each}}...{{/each}} block with rendered items
        html = html.replace(eachRegex, renderedItems);
      }
    }
  }
  
  return html;
}

// OpenAI API integration
async function callOpenAI(systemMessage, userText, jsonSchema, cfToken, openaiToken) {
  const payload = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: systemMessage
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userText
          }
        ]
      }
    ],
    response_format: jsonSchema
  };

  try {
    console.log('Sending payload to AI Gateway:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://gateway.ai.cloudflare.com/v1/9fda6217ed24326e5ad7e9c2c772a622/action-status/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiToken}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('Raw AI Gateway response:', responseText);

    if (!response.ok) {
      console.error('AI Gateway API error:', responseText);
      throw new Error(`AI Gateway API call failed with status: ${response.status}`);
    }

    try {
      const data = JSON.parse(responseText);
      
      // Check if we have a valid response structure
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const messageContent = data.choices[0].message.content;
        
        // Try to parse the content as JSON if it's a string
        if (typeof messageContent === 'string') {
          try {
            return JSON.parse(messageContent);
          } catch (parseError) {
            console.error('Error parsing message content as JSON:', parseError);
            return messageContent;
          }
        }
        return messageContent;
      }
      
      return data;
    } catch (parseError) {
      console.error('Error parsing response JSON:', parseError);
      throw new Error('Invalid JSON response from AI Gateway');
    }
  } catch (error) {
    console.error('Error calling AI Gateway:', error);
    throw new Error('Failed to process request with AI service');
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      // Get the Authorization header
      const authHeader = request.headers.get('Authorization');
      
      // Check if Authorization header exists and matches the stored token
      if (!authHeader || authHeader !== env.AUTH_TOKEN) {
        console.error('Authorization failed: Invalid or missing token');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }), 
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Only allow POST requests
      if (request.method !== 'POST') {
        console.error(`Invalid method: ${request.method}`);
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { 
            status: 405,
            headers: {
              'Content-Type': 'application/json',
              'Allow': 'POST'
            }
          }
        );
      }

      // Parse the JSON body
      let body;
      try {
        body = await request.json();
      } catch (error) {
        console.error('JSON parse error:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Validate required fields
      const validStatuses = ['done', 'not_done', 'canceled'];
      if (!body.status || !validStatuses.includes(body.status)) {
        console.error(`Invalid status: ${body.status}`);
        return new Response(
          JSON.stringify({ error: 'Invalid request: status must be one of done, not_done, or canceled' }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (!body.text || typeof body.text !== 'string' || body.text.trim() === '') {
        console.error('Invalid or missing text field');
        return new Response(
          JSON.stringify({ error: 'Invalid request: text must be a non-empty string' }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      try {
        // Get the appropriate system message and JSON schema for the status
        const systemMessage = SYSTEM_MESSAGES[body.status];
        const jsonSchema = JSON_SCHEMAS[body.status];
        const template = HTML_TEMPLATES[body.status];

        // Call OpenAI API with both tokens
        const aiResponse = await callOpenAI(
          systemMessage,
          body.text,
          jsonSchema,
          env.CF_TOKEN,
          env.OPENAI_API_KEY
        );

        // Format the HTML using the template and AI response
        const formattedHtml = formatHTML(template, aiResponse);

        // Return successful response with formatted HTML only
        return new Response(
          JSON.stringify({ html: formattedHtml }), 
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

      } catch (error) {
        console.error('Error processing request:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }), 
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (error) {
      // Catch any unexpected errors
      console.error('Unexpected error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  },
};