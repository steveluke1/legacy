import { base44 } from '@/api/base44Client';

/**
 * Build accounts list from GameAccount entities
 * 
 * @param {object} params - { q: '', page: 1, pageSize: 20 }
 * @returns {Promise<object>} Accounts data
 */
export async function buildAccountsFromEntities({ q = '', page = 1, pageSize = 20 }) {
  try {
    // Build filter
    let filter = {};
    
    if (q && q.trim()) {
      // Search in username or email (if available)
      // Note: Base44 entities don't support $or directly in client-side filtering
      // So we'll fetch all and filter in memory
      filter = {};
    }

    // Fetch accounts - safe limit
    const allAccounts = await base44.entities.GameAccount.filter(
      filter,
      '-created_date',
      500 // Safe limit for client-side filtering
    );

    // Client-side search
    let filteredAccounts = allAccounts;
    if (q && q.trim()) {
      const searchLower = q.toLowerCase();
      filteredAccounts = allAccounts.filter(acc => 
        (acc.username && acc.username.toLowerCase().includes(searchLower)) ||
        (acc.email && acc.email.toLowerCase().includes(searchLower)) ||
        (acc.id && acc.id.toLowerCase().includes(searchLower))
      );
    }

    // Pagination
    const total = filteredAccounts.length;
    const skip = (page - 1) * pageSize;
    const items = filteredAccounts.slice(skip, skip + pageSize).map(acc => ({
      id: acc.id,
      username: acc.username,
      email: acc.email,
      cash_balance: acc.cash_balance || 0,
      cash_locked: acc.cash_locked || 0,
      created_at: acc.created_date || acc.created_at,
      is_active: acc.is_active
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };

  } catch (error) {
    console.error('[buildAccountsFromEntities] Error:', error);
    
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      notes: { missingData: true, error: error.message }
    };
  }
}