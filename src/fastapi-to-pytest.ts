import fs from 'fs/promises';
import path from 'path';
import {OpenAPISchema, Endpoint, Request, Response} from "./types.js"

const __dirname = path.dirname(new URL(import.meta.url).pathname);

function parseOpenAPISchema(schema: OpenAPISchema): Endpoint[] {
  const endpoints: Endpoint[] = [];

  for (const [path, methods] of Object.entries(schema.paths)) {
    for (const [method, details] of Object.entries(methods)) {
      const request: Request = {
        method: method.toUpperCase(),
        body: {},
        headers: {},
        parameters: {},
      };
      let possible_endpoint_parameteric = ""

      // Handle path parameters
      if (path.includes('{')) {
        
        request.parameters = Object.fromEntries(
          (details.parameters || [])
            .filter((p: any) => p.in === 'path')
            .map((p: any) => [p.name, p.schema?.default || ''])
        );
      }

      // Handle request body
      if (details.requestBody) {
        const content = details.requestBody.content;
        if (content['application/json']) {
          const ref = content['application/json'].schema.$ref;
          if (ref) {
            const components = ref.split('/').slice(1);
            let newSchema: any = schema;
            for (const component of components) {
              newSchema = newSchema[component];
            }
            const props = newSchema.properties;
            request.body = Object.fromEntries(
              Object.entries(props).map(([k, v]: [string, any]) => [k, v.default || ''])
            );
          }
        }
      }

      // Handle response
      const responseDetails = details.responses['200'] || {};
      const responseContent = responseDetails.content?.['application/json'] || {};
      const responseSchema = responseContent.schema || {};
      let responseBody: Record<string, any> = {};

      if (responseSchema.$ref) {
        const refPath = responseSchema.$ref.split('/');
        responseBody = schema.components?.schemas[refPath[refPath.length - 1]]?.properties || {};
      } else {
        responseBody = responseSchema.properties || {};
      }

      const response: Response = {
        status: 200,
        body: Object.fromEntries(
          Object.entries(responseBody).map(([k, v]: [string, any]) => [k, v.default || ''])
        ),
        headers: {},
      };

      endpoints.push({ endpoint: path, request, response });
    }
  }

  return endpoints;
}

function generateJsonStructure(openApiSchema: OpenAPISchema): Endpoint[] {
  return parseOpenAPISchema(openApiSchema);
}

export async function generatePytestFiles(url: string, outputDir: string): Promise<void> {
  try {
    // Fetch the OpenAPI schema
    const response = await fetch(`${url}/openapi.json`);
    const openApiSchema: OpenAPISchema = await response.json();

    // Generate the JSON structure
    const result = generateJsonStructure(openApiSchema);

    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Save the result to a file
    const outputPath = path.join(outputDir, 'generated_endpoints.json');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

    console.log(`Generated endpoints saved to ${outputPath}`);
  } catch (error) {
    console.error('Error generating pytest files:', error);
    throw error;
  }
}

export async function writePytestFile(outputDir: string): Promise<void> {
  const templatePath = path.join(__dirname, 'template', 'pytest.md');
  const template = await fs.readFile(templatePath, 'utf8');
  const outputPath = path.join(outputDir, 'test_endpoints.py');
  await fs.writeFile(outputPath, template);
}
