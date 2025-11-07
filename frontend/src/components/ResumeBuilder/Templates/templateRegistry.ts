import type { TemplateConfig, TemplateInfo, TemplateManifest } from './config/templateConfigSchema';

// Template config cache
const templateConfigCache: Map<string, TemplateConfig> = new Map();

// Load template manifest
export function loadTemplateManifest(): TemplateManifest {
  return { templates: [] };
}

// Load all template infos from manifest
export async function loadAllTemplates(): Promise<TemplateInfo[]> {
  return [];
}

// Get template info by id
export function getTemplateInfo(id: string): TemplateInfo | undefined {
  return undefined;
}

// Load template config by id
export async function loadTemplateConfig(id: string): Promise<TemplateConfig | null> {
  // Check cache first
  if (templateConfigCache.has(id)) {
    return templateConfigCache.get(id)!;
  }
  
  // No templates available - return null
  return null;
}

// Clear cache (useful for development)
export function clearTemplateCache(): void {
  templateConfigCache.clear();
}

