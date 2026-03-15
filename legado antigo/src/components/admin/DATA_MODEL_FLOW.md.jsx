# ALZ Marketplace - Data Model & Flow Documentation

## Architecture Overview

The ALZ Marketplace uses a robust escrow-based system with EFI PIX integration for secure ALZ trading. All financial operations are logged in an append-only ledger for auditability.

---

## Entity Relationships

```
┌─────────────────┐
│ MarketSettings  │ (Global config: fee %, EFI settings)
└─────────────────┘

┌──────────────────┐         ┌─────────────────┐
│ SellerProfile    │────────▶│ AlzListing      │
│ (Payout info)    │         │ (Active offers) │
└──────────────────┘         └─────────────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │    AlzLock      │
                             │ (Escrow ALZ)    │
                             └─────────────────┘
                                      │
                                      ▼
┌──────────────────┐         ┌─────────────────┐
│   Buyer          │────────▶│    AlzOrder     │
│ (Character nick) │         │ (Purchase)      │
└──────────────────┘         └─────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │  PixCharge   │  │ SplitPayout  │  │ LedgerEntry  │
           │ (QR Code)    │  │ (Split $)    │  │ (Audit log)  │
           └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Complete Transaction Flow

### Phase 1: Seller Lists ALZ

1. **Seller Configuration**
   - Seller fills `SellerPayoutProfile` with:
     - Full name
     - CPF (optional)
     - EFI PIX key (where they receive money)
   - Status: `efi_onboarding_status = "pending"`

2. **Create Listing**
   - Seller creates `AlzListing`:
     - alz_amount: 1000000
     - price_brl: 100.00
     - status: "draft"
   - **Idempotency**: listing_id prevents duplicates

3. **Lock ALZ (Escrow)**
   - System creates `AlzLock`:
     - References listing_id
     - Removes ALZ from game (external operation)
     - status: "locked"
   - **Ledger**: Create entry `type: "ALZ_LOCK"`
   - Listing status → "active"

### Phase 2: Buyer Purchases

4. **Character Validation**
   - Buyer provides character_nick
   - System validates character exists and belongs to buyer
   - Fetch current marketplace fee from `MarketSettings.market_fee_percent`

5. **Order Creation**
   - Create `AlzOrder`:
     - buyer_user_id, character_nick
     - alz_amount, price_brl
     - Calculate: `market_fee_brl = price_brl * (market_fee_percent / 100)`
     - Calculate: `seller_net_brl = price_brl - market_fee_brl`
     - status: "pending_payment"
   - **Idempotency**: order_id + idempotency_key
   - **Ledger**: Create entry `type: "ORDER_CREATED"`

6. **Confirmation Screen**
   - Show buyer:
     - ALZ amount
     - Total price (R$)
     - Character nick
     - Delivery terms
   - **Required Checkboxes** (not pre-checked):
     - Digital delivery confirmation
     - Correct nick confirmation
     - Anti-fraud confirmation
   - Store confirmations in order.metadata
   - Only after all confirmed → generate PIX

7. **PIX Generation (EFI)**
   - Call EFI API to create PIX charge
   - Create `PixCharge`:
     - order_id, txid
     - brl_amount (full price)
     - copy_paste, qr_code_image
     - status: "active"
     - expires_at: now + 15min
   - **Ledger**: Create entry `type: "PIX_CHARGE_CREATED"`
   - Order status → "awaiting_payment"
   - Display QR Code and copy/paste to buyer

### Phase 3: Payment Confirmation

8. **PIX Webhook (EFI → Backend)**
   - EFI sends webhook when PIX is paid
   - Verify webhook signature (security)
   - Update `PixCharge.status = "paid"`
   - Update `AlzOrder.status = "paid"`
   - Store `paid_at` timestamp
   - **Ledger**: Create entry `type: "PIX_CONFIRMED"`
   - **Idempotency**: Check txid to prevent double processing

9. **Split Payout Scheduling**
   - Create `SplitPayout`:
     - order_id, seller_user_id
     - gross_brl (full price)
     - fee_brl (marketplace fee)
     - net_brl (seller receives)
     - status: "scheduled"
   - Call EFI Split API (if enabled)
   - **Ledger**: Create entry `type: "SPLIT_APPLIED"`

### Phase 4: Delivery

10. **ALZ Delivery**
    - Order status → "delivering"
    - **Ledger**: Create entry `type: "DELIVERY_START"`
    - Call game server to transfer ALZ:
      - From: escrow/system
      - To: buyer's character_nick
      - Amount: order.alz_amount
    - Increment `delivery_attempts`
    - **Success**:
      - Order status → "delivered"
      - `delivered_at` = now
      - **Ledger**: `type: "DELIVERY_SUCCESS"`
      - Update `AlzLock.status = "consumed"`
      - **Ledger**: `type: "ALZ_CONSUME"`
    - **Failure**:
      - Order status → "manual_review"
      - **Ledger**: `type: "DELIVERY_FAIL"` with error
      - Admin intervention required

---

## Idempotency Strategy

### Critical Operations with Idempotency Keys

1. **AlzLock Creation**
   - Key: `lock_{listing_id}_{timestamp}`
   - Prevents double-locking same listing

2. **AlzOrder Creation**
   - Key: `order_{buyer_id}_{listing_id}_{timestamp}`
   - Prevents duplicate purchases

3. **PixCharge Creation**
   - Use EFI txid as natural idempotency key
   - Prevents duplicate PIX generation

4. **PIX Webhook Processing**
   - Check if `PixCharge` with txid already marked "paid"
   - Ignore duplicate webhooks

5. **Split Payout**
   - Check if `SplitPayout` for order_id exists
   - Don't re-apply split

### Implementation
```javascript
// Example: Order creation
const idempotencyKey = `order_${buyerId}_${listingId}_${Date.now()}`;
const existing = await base44.entities.AlzOrder.filter({ idempotency_key: idempotencyKey });
if (existing.length > 0) {
  return existing[0]; // Return existing order, don't create duplicate
}
```

---

## Ledger Entries (Audit Trail)

All critical operations create `LedgerEntry` records (append-only):

| Type | When | Metadata |
|------|------|----------|
| ALZ_LOCK | Seller locks ALZ | listing_id, alz_amount |
| ALZ_RELEASE | Lock released (expired/cancelled) | lock_id, reason |
| ALZ_CONSUME | Delivered to buyer | order_id, character_nick |
| PIX_CHARGE_CREATED | PIX QR generated | order_id, txid, amount |
| PIX_CONFIRMED | Webhook received | txid, paid_at |
| SPLIT_APPLIED | Payout scheduled | order_id, net_brl |
| DELIVERY_START | Delivery attempted | order_id, attempt_num |
| DELIVERY_SUCCESS | ALZ delivered | order_id, character_nick |
| DELIVERY_FAIL | Delivery failed | order_id, error_message |
| FEE_CHANGED | Admin changed fee % | old_fee, new_fee |

**Querying Ledger:**
```javascript
// Get all operations for an order
const entries = await base44.entities.LedgerEntry.filter({ 
  ref_id: order_id 
});

// Get all fee changes
const feeChanges = await base44.entities.LedgerEntry.filter({ 
  type: 'FEE_CHANGED' 
});
```

---

## Admin Fee Configuration

### Market Settings Entity
- Single row with `id = "global"`
- `market_fee_percent`: default 1.5%
- Admin can update via UI

### Fee Calculation
```javascript
const marketFee = marketSettings.market_fee_percent; // 1.5
const grossBRL = 100.00;
const feeBRL = grossBRL * (marketFee / 100); // 1.50
const sellerNetBRL = grossBRL - feeBRL; // 98.50
```

### Fee Change Process
1. Admin updates `MarketSettings.market_fee_percent`
2. System creates `LedgerEntry` with old/new values
3. All new orders use updated fee
4. Existing orders unaffected (snapshot stored in order)

---

## Security & RBAC

### Entity Access Control

**Admin-Only:**
- MarketSettings (global config)
- PixCharge (payment data)
- SplitPayout (payout data)
- LedgerEntry (audit log)

**Owner-Only:**
- SellerPayoutProfile (PIX keys)
- AlzOrder (buyer/seller can see their orders)

**Public Read, Owner Write:**
- AlzListing (anyone can browse, only seller can edit)

### Frontend Guards
```javascript
// Seller payout form
const { data: user } = useQuery(['user'], () => base44.auth.me());
// Only fetch if authenticated
const { data: profile } = useQuery(
  ['seller-profile', user?.id],
  () => base44.entities.SellerPayoutProfile.filter({ seller_user_id: user.id }),
  { enabled: !!user }
);
```

### Backend Validation
```javascript
// In backend function
const user = await base44.auth.me();
if (!user) throw new Error('Unauthorized');

// Verify ownership
const order = await base44.entities.AlzOrder.get(orderId);
if (order.buyer_user_id !== user.id && order.seller_user_id !== user.id) {
  throw new Error('Not your order');
}
```

---

## Error Handling & Recovery

### Scenario 1: PIX Paid but Delivery Fails
- Order stuck in "paid" status
- Admin reviews via AdminMarketplace
- Options:
  1. Retry delivery manually
  2. Cancel order and refund (mark as "refund_blocked")
  3. Manual ALZ transfer + mark delivered

### Scenario 2: Duplicate Webhook
- Idempotency check prevents double-processing
- Log warning in LedgerEntry
- No state change

### Scenario 3: Split Payout Fails
- Order delivered but seller not paid
- SplitPayout status = "failed"
- Admin reviews and retries
- Ledger shows failed attempts

### Scenario 4: Wrong Character Nick
- ALZ delivered to wrong character
- **No reversal** (terms agreed during checkout)
- Buyer must contact support
- Admin can verify via LedgerEntry if fraud suspected

---

## Performance & Scaling

### Indexes Required
- AlzLock: `idempotency_key`, `listing_id`, `status`
- AlzOrder: `idempotency_key`, `buyer_user_id`, `seller_user_id`, `status`
- PixCharge: `txid`, `order_id`, `status`
- LedgerEntry: `ref_id`, `type`, `created_at`

### Caching Strategy
- MarketSettings: Cache for 5 minutes
- Active listings: Cache for 30 seconds
- Order status: No cache (real-time updates)

### Background Jobs
1. **Expire Old Locks**: Release locks for expired/inactive listings
2. **Expire PIX Charges**: Cancel orders with expired unpaid PIX
3. **Retry Failed Deliveries**: Attempt delivery for "paid" orders
4. **Reconciliation**: Daily check LedgerEntry vs orders/payouts

---

## Testing Checklist

- [ ] Create seller profile with PIX key
- [ ] Create listing and verify ALZ lock
- [ ] Create order and verify fee calculation
- [ ] Generate PIX (mock) and verify QR code
- [ ] Simulate webhook and verify payment confirmation
- [ ] Verify split payout calculation
- [ ] Simulate delivery and verify ledger entries
- [ ] Admin: Change fee and verify ledger entry
- [ ] Test idempotency: duplicate order creation
- [ ] Test ownership: User A can't see User B's payout profile
- [ ] Test admin-only: Non-admin can't read MarketSettings

---

**Version**: 1.0  
**Last Updated**: 2025-12-21  
**Author**: Base44 AI - CABAL ZIRON Integration Team