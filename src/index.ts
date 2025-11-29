import { registerPlugin } from '@capacitor/core';

import type { CapacitorSupabasePlugin } from './definitions';

const CapacitorSupabase = registerPlugin<CapacitorSupabasePlugin>('CapacitorSupabase', {
  web: () => import('./web').then((m) => new m.CapacitorSupabaseWeb()),
});

export * from './definitions';
export { CapacitorSupabase };
