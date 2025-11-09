import type { TemplateConfig, TemplateInfo, TemplateManifest } from './config/templateConfigSchema';
import { templatesApi } from '@/lib/api';

// Template config cache
const templateConfigCache: Map<string, TemplateConfig> = new Map();

// Load template manifest
export function loadTemplateManifest(): TemplateManifest {
  return { templates: [] };
}

// Load all template infos from API
export async function loadAllTemplates(): Promise<TemplateInfo[]> {
  try {
    const templates = await templatesApi.list();
    return templates.map((t: any) => ({
      id: t.slug || t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      badge: t.badge,
      preview: t.preview_url,
      colors: t.colors || [],
    }));
  } catch (error) {
    console.error('Failed to load templates from API:', error);
    return [];
  }
}

// Get template info by id
export function getTemplateInfo(id: string): TemplateInfo | undefined {
  return undefined;
}

// Load template config by id from API
export async function loadTemplateConfig(id: string): Promise<TemplateConfig | null> {
  // Check cache first
  if (templateConfigCache.has(id)) {
    return templateConfigCache.get(id)!;
  }
  
  try {
    const template = await templatesApi.get(id);
    if (template && template.schema) {
      const config = template.schema as TemplateConfig;
      
      // Validate that it has required fields
      if (config.metadata && config.layout && config.sections && config.theme) {
        templateConfigCache.set(id, config);
        return config;
      } else {
        console.error(`Template ${id} has invalid schema structure`);
        return null;
      }
    }
  } catch (error) {
    console.error(`Failed to load template ${id} from API:`, error);
  }
  
  return null;
}

// Clear cache (useful for development)
export function clearTemplateCache(): void {
  templateConfigCache.clear();
}

