type EnvType = "json" | "default";


export class Config {
  consulUrl?: string;
  consulToken?: string;
  consulPath?: string;
  consulFolder?: string;
  openaiApiKey?: string;
  envType: EnvType;

  constructor(options: Partial<Config> = {}) {
    this.consulUrl = options.consulUrl;
    this.consulToken = options.consulToken;
    this.consulPath = options.consulPath;
    this.envType = options.envType || "default";
    this.openaiApiKey = options.openaiApiKey;
  }
}

export interface OpenAPIPath {
  [path: string]: {
    [method: string]: {
      summary?: string;
      operationId?: string;
      parameters?: any[];
      requestBody?: any;
      responses: {
        [statusCode: string]: {
          description: string;
          content?: {
            [contentType: string]: {
              schema: any;
            };
          };
        };
      };
    };
  };
}

export interface OpenAPISpec {
  paths: OpenAPIPath;
  components: {
    schemas: {
      [schemaName: string]: any;
    };
  };
}
