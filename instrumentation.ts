export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensurePersistentStorageDirs } = await import('./lib/paths');
    ensurePersistentStorageDirs();
    const { getDb } = await import('./lib/db');
    getDb();
  }
}
