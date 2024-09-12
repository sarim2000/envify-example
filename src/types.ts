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


export interface OpenAPISchema {
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas: Record<string, any>;
  };
}

export interface Request {
  method: string;
  body: Record<string, any>;
  headers: Record<string, string>;
  parameters: Record<string, any>;
}

export interface Response {
  status: number;
  body: Record<string, any>;
  headers: Record<string, string>;
}

export interface Endpoint {
  endpoint: string;
  request: Request;
  response: Response;
}



