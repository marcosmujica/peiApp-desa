// Barrel file for commonApp utilities
// Re-export the singleton DBChanges so the app imports from a single place
export { default as dbChanges, dbChanges as dbChangesNamed } from './DBChanges';
// If you prefer a named export called `dbChanges`, you can import { dbChangesNamed as dbChanges } from this module.

// Re-export other commonApp exports here as needed
export * from './database';
