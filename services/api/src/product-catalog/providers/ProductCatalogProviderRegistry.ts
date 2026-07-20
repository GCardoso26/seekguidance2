import type { ProductCategory } from "../domain/enums.js";
import type { ProductCatalogJobKey } from "./ProductCatalogProvider.js";
import type { ProductCatalogProvider } from "./ProductCatalogProvider.js";
import { JOB_KEY_TO_CATEGORY } from "./ProductCatalogProvider.js";

export interface ProviderHealth {
  providerId: string;
  category: ProductCategory;
  healthy: boolean;
  lastError?: string;
  lastSyncAt?: string;
}

export interface ProviderScheduleOptions {
  mode: "full" | "incremental";
  syncSince?: string;
  priority?: "HIGH" | "NORMAL" | "LOW";
}

/**
 * Registro central de providers — register/get/health/schedule.
 */
export class ProductCatalogProviderRegistry {
  private readonly byId = new Map<string, ProductCatalogProvider>();
  private readonly jobs = new Map<ProductCatalogJobKey, ProductCatalogProvider[]>();
  private health = new Map<string, ProviderHealth>();

  register(jobKey: ProductCatalogJobKey, provider: ProductCatalogProvider): void {
    this.byId.set(provider.providerId, provider);
    const list = this.jobs.get(jobKey) ?? [];
    list.push(provider);
    this.jobs.set(jobKey, list);
    this.health.set(provider.providerId, {
      providerId: provider.providerId,
      category: provider.category,
      healthy: true,
    });
  }

  getProvider(providerId: string): ProductCatalogProvider | undefined {
    return this.byId.get(providerId);
  }

  getProvidersByCategory(category: ProductCategory): ProductCatalogProvider[] {
    return [...this.byId.values()].filter((p) => p.category === category);
  }

  getProvidersForJob(jobKey: ProductCatalogJobKey): ProductCatalogProvider[] {
    return this.jobs.get(jobKey) ?? [];
  }

  listJobs(): ProductCatalogJobKey[] {
    return [...this.jobs.keys()];
  }

  markSuccess(providerId: string): void {
    const h = this.health.get(providerId);
    if (h) {
      h.healthy = true;
      h.lastError = undefined;
      h.lastSyncAt = new Date().toISOString();
    }
  }

  markFailure(providerId: string, error: string): void {
    const h = this.health.get(providerId);
    if (h) {
      h.healthy = false;
      h.lastError = error;
    }
  }

  healthReport(): ProviderHealth[] {
    return [...this.health.values()];
  }

  categoryForJob(jobKey: ProductCatalogJobKey): ProductCategory {
    return JOB_KEY_TO_CATEGORY[jobKey];
  }

  /** Enfileira sync (delegado ao caller BullMQ / CLI). */
  schedule(jobKey: ProductCatalogJobKey, _opts: ProviderScheduleOptions): ProductCatalogProvider[] {
    return this.getProvidersForJob(jobKey);
  }
}

export const productCatalogProviderRegistry = new ProductCatalogProviderRegistry();
