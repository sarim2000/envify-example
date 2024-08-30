type EnvType = "json" | "default";


class Config {
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
