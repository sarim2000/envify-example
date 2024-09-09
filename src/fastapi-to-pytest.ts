import fs from 'fs/promises';
import path from 'path';
import { OpenAPISpec } from './types.js';

export async function generatePytestFiles(apiUrl: string, outputDir: string): Promise<void> {
  const openApiSpec = await fetchOpenApiSpec(apiUrl);
  const testContent = await generateTestContent(openApiSpec);
  await writeTestFile(outputDir, testContent);
}

async function fetchOpenApiSpec(apiUrl: string): Promise<OpenAPISpec> {
  const response = await fetch(`${apiUrl}/openapi.json`);
  return response.json();
}

async function generateTestContent(openApiSpec: OpenAPISpec): Promise<string> {
  let content = `
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)\n
`;

  let content_two = ""

  for (const [path, methods] of Object.entries(openApiSpec.paths)) {
    for (const [method, details] of Object.entries(methods)) {
      const operationId = details.operationId || `${method}_${path.replace(/\W/g, '_')}`;
      const schema = details.requestBody?.content?.['application/json']?.schema || {};
      let schemaComponents;
      if (schema && schema.$ref) {
        const refParts = schema.$ref.split('/');
        const schemaName = refParts[refParts.length - 1];
        schemaComponents = openApiSpec.components.schemas[schemaName];
      } else {
        schemaComponents = schema;
      }

      let requestSchemaComponents: any = { parameters: [] };

      // Add parameters if they exist
      if (details.parameters) {
        requestSchemaComponents.parameters = details.parameters;
      }

      // Add request body schema if it exists (typically for POST, PUT, PATCH)
      if (details.requestBody?.content?.['application/json']?.schema) {
        const schema = details.requestBody.content['application/json'].schema;
        if (schema.$ref) {
          const refParts = schema.$ref.split('/');
          const schemaName = refParts[refParts.length - 1];
          requestSchemaComponents.body = openApiSpec.components.schemas[schemaName];
        } else {
          requestSchemaComponents.body = schema;
        }
      }

      let responseSchemaComponents = null;
      if (details.responses['200']?.content?.['application/json']?.schema) {
        const schema = details.responses['200'].content['application/json'].schema;
        if (schema.$ref) {
          const refParts = schema.$ref.split('/');
          const schemaName = refParts[refParts.length - 1];
          responseSchemaComponents = openApiSpec.components.schemas[schemaName];
        } else {
          responseSchemaComponents = schema;
        }
      }

      const testCase = await generateTestCase(method, path, requestSchemaComponents, responseSchemaComponents);
      for (const test of testCase) {
        content_two += `\n${test}\n`;
      }
    }
  }


  return content + content_two;
}

function generateTestCase(method: string, path: string, requestSchema: any, responseSchema: any): string[] {
  const testCases: string[] = [];
  const functionName = `test_${method.toLowerCase()}_${path.replace(/\//g, '_').replace(/[{}]/g, '')}`;
  const url = path.replace(/{([^}]+)}/g, '$1');

  let setupCode = '';
  let requestCode = '';
  let assertionCode = '';

  // Handle path parameters
  const pathParams = requestSchema.parameters?.filter((param: any) => param.in === 'path') || [];
  const queryParams = requestSchema.parameters?.filter((param: any) => param.in === 'query') || [];

  pathParams.forEach((param: any) => {
    setupCode += `    ${param.name} = "example_${param.name}"\n`;
  });

  // Handle query parameters
  if (queryParams.length > 0) {
    setupCode += '    query_params = {\n';
    queryParams.forEach((param: any) => {
      setupCode += `        "${param.name}": "example_${param.name}",\n`;
    });
    setupCode += '    }\n';
  }

  // Handle request body
  if (requestSchema.body) {
    setupCode += '    request_body = {\n';
    Object.entries(requestSchema.body.properties || {}).forEach(([key, value]: [string, any]) => {
      setupCode += `        "${key}": ${JSON.stringify(value.example || 'example_value')},\n`;
    });
    setupCode += '    }\n';
  }

  // Generate request code
  switch (method.toLowerCase()) {
    case 'get':
      requestCode = queryParams.length > 0 ? `response = client.get('${url}', params=${stringifyObject(queryParams)})` : `response = client.get('${url}')`;
      break;
    case 'post':
      requestCode = `response = client.post('${url}', json=request_body)`;
      break;
    case 'put':
      requestCode = `response = client.put('${url}', json=request_body)`;
      break;
    case 'delete':
      requestCode = `response = client.delete('${url}')`;
      break;
    case 'patch':
      requestCode = `response = client.patch('${url}', json=request_body)`;
      break;
  }

  // Generate assertion code
  // TODO: add response output validation
  assertionCode = `
    assert response.status_code == 200
`;

  if (responseSchema && responseSchema.properties) {
    Object.keys(responseSchema.properties).forEach(key => {
      assertionCode += `    assert "${key}" in response_data\n`;
    });
  }

  // Combine all parts into a test function
  const testFunction = `
def ${functionName}():
${setupCode}
    ${requestCode}
${assertionCode}
`;

  testCases.push(testFunction);
  return testCases;
}

async function writeTestFile(outputDir: string, content: string): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  const testFile = path.join(outputDir, 'test_main.py');
  await fs.writeFile(testFile, content);
}

function stringifyObject(obj: any, maxDepth = 5, currentDepth = 0, cache = new Set()): string {
  if (currentDepth >= maxDepth || cache.has(obj)) {
    return '...';
  }

  cache.add(obj);

  const replacer = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      return stringifyObject(value, maxDepth, currentDepth + 1, cache);
    }
    return value;
  };

  const jsonString = JSON.stringify(obj, replacer, 2);
  return jsonString
    .replace(/"([^"]+)":/g, '$1:') // Remove double quotes around keys
    .replace(/"/g, '') // Remove double quotes around values
    .replace(/[{},]/g, ''); // Remove curly braces and commas
}
