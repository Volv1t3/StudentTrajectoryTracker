import { supabase } from './storage';

/**
 * Execute stored procedure via Supabase RPC
 * 
 * @param procedureName - Name of the stored procedure
 * @param params - Parameters to pass to the procedure
 * @returns Result from the stored procedure
 */
export async function callStoredProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T> {
  const { data, error } = await supabase.rpc(procedureName, params);
  
  if (error) {
    console.error(`Error calling stored procedure ${procedureName}:`, error);
    throw error;
  }
  
  return data as T;
}

/**
 * Query builder for SELECT operations
 * Wraps Supabase query builder for consistency
 */
export function query(tableName: string) {
  return supabase.from(tableName);
}

// Example stored procedure wrappers (to be implemented when procedures are ready)

/**
 * Get colaborador by ID
 */
export async function getColaboradorById(id: number) {
  return callStoredProcedure('sp_get_colaborador_by_id', { p_id: id });
}

/**
 * Get all visible projects
 */
export async function getVisibleProjects() {
  return callStoredProcedure('sp_get_visible_projects');
}

/**
 * Create new colaborador from signup
 */
export async function createColaborador(data: any) {
  return callStoredProcedure('sp_create_colaborador', data);
}

// Add more stored procedure wrappers as they are created in the database
