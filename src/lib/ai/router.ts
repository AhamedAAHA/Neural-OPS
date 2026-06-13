import { completeWithFallback, getAIProvider, getAvailableProviders } from "./providers";
import { getProviderForAgent } from "./agent-provider-map";

export { getProviderForAgent } from "./agent-provider-map";

export class AIProviderRouter {
  static getProvider(name: string) {
    return getAIProvider(name);
  }

  static listProviders() {
    return getAvailableProviders();
  }

  static routeForAgent(className: string) {
    return getProviderForAgent(className);
  }

  static async route(preferred: string, input: Parameters<typeof completeWithFallback>[1]) {
    return completeWithFallback(preferred, input);
  }
}

export { AIMLProvider, FeatherlessProvider, OpenAIProvider, LocalProvider } from "./providers";
export { completeWithFallback, getAIProvider, getAvailableProviders } from "./providers";
