import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  organizationId: string;
  userId: string;
}

const storage = new AsyncLocalStorage<TenantContext>();

export function runWithTenantContext<T>(context: TenantContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getTenantContext(): TenantContext | null {
  return storage.getStore() ?? null;
}
