import { base44 } from '@/api/base44Client';

/**
 * Build streamer packages list from StreamerPackage entities
 * 
 * @param {object} params - { includeInactive: true }
 * @returns {Promise<object>} Packages data
 */
export async function buildStreamerPackagesFromEntities({ includeInactive = true }) {
  try {
    // Build filter
    const filter = includeInactive ? {} : { is_active: true };

    // Fetch packages - Base44 only supports single column sort
    const packages = await base44.entities.StreamerPackage.filter(
      filter,
      '-created_date', // Single sort column only
      100
    );

    // Sort in memory: sort_order ASC (lower first), then created_date DESC (newer first)
    const sortedPackages = packages.sort((a, b) => {
      const orderA = typeof a.sort_order === 'number' ? a.sort_order : 999999;
      const orderB = typeof b.sort_order === 'number' ? b.sort_order : 999999;
      
      if (orderA !== orderB) {
        return orderA - orderB; // ASC
      }
      
      // Fallback to created_date DESC
      const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
      const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
      return dateB - dateA; // DESC
    });

    return {
      success: true,
      packages: sortedPackages,
      total: sortedPackages.length,
      notes: { source: 'entities', warnings: [] }
    };

  } catch (error) {
    console.error('[buildStreamerPackagesFromEntities] Error:', error);
    
    return {
      success: true,
      packages: [],
      total: 0,
      notes: { source: 'entities', missingData: true, error: error.message, warnings: ['Erro ao buscar pacotes'] }
    };
  }
}