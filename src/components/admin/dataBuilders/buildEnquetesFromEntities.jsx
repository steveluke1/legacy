import { base44 } from '@/api/base44Client';

/**
 * Build enquetes list from Enquete entities
 * 
 * @param {object} params - { search: '', status: 'all', sort: 'newest', operation: 'list'|'create'|'update'|'delete', ... }
 * @returns {Promise<object>} Enquetes data
 */
export async function buildEnquetesFromEntities(params) {
  const { 
    search = '', 
    status = 'all', 
    sort = 'newest',
    operation = 'list',
    ...operationParams
  } = params;

  try {
    // Handle CRUD operations
    switch (operation) {
      case 'create':
        return await createEnquete(operationParams);
      
      case 'update':
        return await updateEnquete(operationParams);
      
      case 'delete':
        return await deleteEnquete(operationParams);
      
      case 'list':
      default:
        return await listEnquetes({ search, status, sort });
    }

  } catch (error) {
    console.error('[buildEnquetesFromEntities] Error:', error);
    throw error;
  }
}

async function listEnquetes({ search, status, sort }) {
  // Build filter
  let filter = {};
  
  if (status !== 'all') {
    filter.status = status;
  }

  // Fetch enquetes
  const sortField = sort === 'newest' ? '-created_date' : 'created_date';
  const allEnquetes = await base44.entities.Enquete.filter(filter, sortField, 100);

  // Client-side search
  let filteredEnquetes = allEnquetes;
  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    filteredEnquetes = allEnquetes.filter(enq =>
      (enq.title && enq.title.toLowerCase().includes(searchLower)) ||
      (enq.description && enq.description.toLowerCase().includes(searchLower))
    );
  }

  return {
    items: filteredEnquetes,
    total: filteredEnquetes.length
  };
}

async function createEnquete({ title, description, options, status, allowMultiple, startsAt, endsAt }) {
  const newEnquete = await base44.entities.Enquete.create({
    title,
    description,
    options: options || [],
    status: status || 'ACTIVE',
    allowMultiple: allowMultiple || false,
    startsAt,
    endsAt,
    totalVotes: 0,
    votesByOption: {}
  });

  return {
    success: true,
    enquete: newEnquete
  };
}

async function updateEnquete({ id, patch }) {
  const updated = await base44.entities.Enquete.update(id, patch);
  
  return {
    success: true,
    enquete: updated
  };
}

async function deleteEnquete({ id, hardDelete }) {
  if (hardDelete) {
    await base44.entities.Enquete.delete(id);
  } else {
    // Soft delete: mark as CLOSED
    await base44.entities.Enquete.update(id, { status: 'CLOSED' });
  }

  return {
    success: true
  };
}