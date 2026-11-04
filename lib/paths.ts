import path from 'path';
import fs from 'fs';

/**
 * Ensures that both the database directory and uploads directory (plus subdirectories)
 * are created on server startup so the application never crashes on a fresh cloud instance.
 */
export function ensurePersistentStorageDirs(): { dbPath: string; uploadsDir: string } {
  const dbPath = getDbPath();
  const uploadsDir = getUploadsDir();

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (e) {
      console.warn('Failed to create database directory:', e);
    }
  }

  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {
      console.warn('Failed to create uploads directory:', e);
    }
  }

  // Ensure common upload subdirectories
  const subdirs = ['videos', 'audio', 'projects', 'images'];
  for (const sub of subdirs) {
    const subPath = path.join(uploadsDir, sub);
    if (!fs.existsSync(subPath)) {
      try {
        fs.mkdirSync(subPath, { recursive: true });
      } catch (e) {
        console.warn(`Failed to create uploads/${sub} directory:`, e);
      }
    }
  }

  return { dbPath, uploadsDir };
}

/**
 * Returns the absolute path to the SQLite database file.
 * Priority:
 * 1. process.env.DATABASE_PATH
 * 2. process.env.DATA_DIR/rise.db
 * 3. /data/rise.db (if /data exists, e.g. Render mounted persistent disk)
 * 4. ./data/rise.db (default local workspace)
 */
export function getDbPath(): string {
  // 1. Explicit DATABASE_PATH
  if (process.env.DATABASE_PATH) {
    const resolvedPath = path.isAbsolute(process.env.DATABASE_PATH)
      ? process.env.DATABASE_PATH
      : path.join(process.cwd(), process.env.DATABASE_PATH);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        console.warn('Failed to create DB directory:', e);
      }
    }
    return resolvedPath;
  }

  // 2. DATA_DIR
  if (process.env.DATA_DIR) {
    const dir = path.isAbsolute(process.env.DATA_DIR)
      ? process.env.DATA_DIR
      : path.join(process.cwd(), process.env.DATA_DIR);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        console.warn('Failed to create DATA_DIR:', e);
      }
    }
    return path.join(dir, 'rise.db');
  }

  // 3. Render cloud persistent disk mount at /data
  try {
    if (fs.existsSync('/data')) {
      return '/data/rise.db';
    }
  } catch {
    // Ignore permission or file system check errors
  }

  // 4. Default local workspace database: ./data/rise.db
  const dbPath = path.join(process.cwd(), 'data', 'rise.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.warn('Failed to create DB directory:', e);
    }
  }
  return dbPath;
}

/**
 * Returns the absolute directory for user uploads.
 * Priority:
 * 1. process.env.UPLOADS_DIR
 * 2. process.env.DATA_DIR/uploads
 * 3. /data/uploads (if /data exists, e.g. Render mounted persistent disk)
 * 4. ./public/uploads (default local workspace)
 */
export function getUploadsDir(): string {
  // 1. Explicit UPLOADS_DIR
  if (process.env.UPLOADS_DIR) {
    const dir = path.isAbsolute(process.env.UPLOADS_DIR)
      ? process.env.UPLOADS_DIR
      : path.join(process.cwd(), process.env.UPLOADS_DIR);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        console.warn('Failed to create uploads directory:', e);
      }
    }
    return dir;
  }

  // 2. DATA_DIR/uploads
  if (process.env.DATA_DIR) {
    const baseDir = path.isAbsolute(process.env.DATA_DIR)
      ? process.env.DATA_DIR
      : path.join(process.cwd(), process.env.DATA_DIR);
    const dir = path.join(baseDir, 'uploads');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        console.warn('Failed to create uploads directory in DATA_DIR:', e);
      }
    }
    return dir;
  }

  // 3. Render cloud persistent disk mount at /data/uploads
  try {
    if (fs.existsSync('/data')) {
      const renderUploads = '/data/uploads';
      if (!fs.existsSync(renderUploads)) {
        try {
          fs.mkdirSync(renderUploads, { recursive: true });
        } catch (e) {
          console.warn('Failed to create /data/uploads:', e);
        }
      }
      return renderUploads;
    }
  } catch {
    // Ignore filesystem check errors
  }

  // 4. Default local workspace uploads: ./public/uploads
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {
      console.warn('Failed to create uploads directory:', e);
    }
  }
  return uploadsDir;
}

// Auto-run directory initialization on import
try {
  ensurePersistentStorageDirs();
} catch (e) {
  console.warn('Warning during storage directory initialization:', e);
}
