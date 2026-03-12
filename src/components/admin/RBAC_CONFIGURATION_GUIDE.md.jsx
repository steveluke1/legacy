# RBAC Configuration Guide - EFI PIX Integration

## Overview
This document lists all entities that must be configured with proper Role-Based Access Control (RBAC) in the Base44 dashboard to ensure security and data isolation.

## Critical: Admin-Only Entities
These entities contain sensitive financial and operational data. Configure them as **ADMIN-ONLY** in the Base44 dashboard:

1. **AdminUser** - Administrator accounts
2. **AdminSession** - Admin authentication sessions
3. **MarketSettings** - Global marketplace configuration (fee %, EFI settings)
4. **PixCharge** - PIX payment charges and QR codes
5. **SplitPayout** - Payment split configurations and status
6. **LedgerEntry** - Append-only audit log of all marketplace operations
7. **AnalyticsEvent** - User analytics and behavior tracking
8. **CommerceEvent** - Commerce/transaction analytics
9. **CashLedger** - CASH transaction logs
10. **PaymentTransaction** - Payment records

## Owner-Only Entities (User Data)
These entities should be configured as **OWNER-ONLY** (users can only access their own records):

1. **AuthUser** - User accounts
2. **AuthSession** - User authentication sessions
3. **SellerPayoutProfile** - Seller PIX keys and payout data
   - seller_user_id must match authenticated user
   - Critical: Contains personal financial information
4. **AlzOrder** - Marketplace orders
   - buyer_user_id or seller_user_id must match authenticated user
5. **UserAccount** - Portal account data
6. **GameAccount** - Game account data

## Public Read, Owner Write
These entities can be read by all but only modified by owner:

1. **AlzListing** - Marketplace listings
   - Anyone can view active listings
   - Only seller can modify their listings
2. **AlzLock** - ALZ escrow locks
   - Linked to listings, same ownership rules

## Implementation Notes

### Frontend Guards
- Never query sensitive entities directly from frontend without admin check
- Use `useAdminAuth()` hook to verify admin access before showing sensitive data
- Use `base44.auth.me()` to verify user ownership before operations

### Backend Functions
All backend functions must:
1. Validate user authentication via `base44.auth.me()`
2. Verify ownership for user-specific operations
3. Require admin token for privileged operations
4. Use service role only when necessary and after validation

### Idempotency Protection
- AlzLock: indexed on idempotency_key
- AlzOrder: indexed on idempotency_key
- All critical operations must include idempotency checks

### Audit Trail
Every sensitive operation should create a LedgerEntry:
- Type: ALZ_LOCK, ALZ_RELEASE, PIX_CHARGE_CREATED, PIX_CONFIRMED, SPLIT_APPLIED, etc.
- Actor: system/admin/seller/buyer
- Metadata: operation details for forensics

## Configuration Checklist

Before going to production:

- [ ] Configure ADMIN-ONLY access for all admin entities
- [ ] Configure OWNER-ONLY access for user financial data
- [ ] Test that users cannot access other users' orders/profiles
- [ ] Test that non-admins cannot read/write MarketSettings
- [ ] Test that non-admins cannot access LedgerEntry or PixCharge
- [ ] Verify frontend admin guards are working
- [ ] Verify backend functions validate user identity
- [ ] Test idempotency: duplicate operations should fail gracefully
- [ ] Review all Base44 entity security rules in dashboard

## Security Best Practices

1. **Principle of Least Privilege**: Grant minimum required access
2. **Defense in Depth**: Backend validation + frontend guards + entity RBAC
3. **Audit Everything**: Every financial operation in LedgerEntry
4. **Fail Closed**: If RBAC check fails, deny access (don't fall back to permissive)
5. **Idempotency**: All money operations must be idempotent
6. **Encryption**: Sensitive data (PIX keys) should be encrypted at rest
7. **Rate Limiting**: Implement rate limits on order creation/PIX generation

## Testing RBAC

Create test scenarios:
1. User A tries to read User B's SellerPayoutProfile → Should fail
2. User A tries to modify User B's AlzOrder → Should fail
3. Non-admin tries to read MarketSettings → Should fail
4. Non-admin tries to read LedgerEntry → Should fail
5. User tries to create order with another user's seller_user_id → Should fail
6. Duplicate idempotency_key → Should fail gracefully

## Emergency Response

If security issue detected:
1. Immediately disable affected functionality via MarketSettings.efi_split_enabled = false
2. Review LedgerEntry for suspicious operations
3. Check PixCharge and SplitPayout for unauthorized transactions
4. Lock affected user accounts if needed
5. Create incident report with full audit trail

---

**Last Updated**: 2025-12-21  
**Version**: 1.0 - EFI PIX Integration Foundation