# Vendor Events

### ProcessVendorScreen — Open vendor shop

```
[HH:MM:SS] LocalPlayer: ProcessVendorScreen(npcId, favorLevel, currentGold, serverId, maxGold, "greeting", VendorInfo[], VendorInfo[], VendorInfo[], VendorPurchaseCap[], System.Int32[], System.String[], -1601)
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID |
| `favorLevel` | enum | Favor tier with this NPC (e.g., `SoulMates`, `BestFriends`) |
| `currentGold` | u32 | Gold the vendor currently has available to buy your items |
| `serverId` | u64 | Server-side identifier |
| `maxGold` | u32 | Maximum gold the vendor can hold |
| `greeting` | string | Vendor greeting text |
| `VendorInfo[]` | array | Vendor inventory tabs (buy/sell/buyback) |
| `VendorPurchaseCap[]` | array | Per-item purchase limits |

**When it fires:** Player opens the vendor/shop UI on an NPC.

**Key behavior:** `favorLevel` reflects the player's relationship tier with that NPC, which determines available inventory and prices. `currentGold` decreases as you sell items to the vendor.

### ProcessVendorAddItem — Sell item to vendor

```
[HH:MM:SS] LocalPlayer: ProcessVendorAddItem(price, InternalName(instanceId), isFromBuyback)
```

| Field | Type | Meaning |
|---|---|---|
| `price` | u32 | Sale price in gold (councils) |
| `InternalName` | string | Item internal name (e.g., `AmuletOfCrushingMitigation5`) |
| `instanceId` | u64 | Item instance ID (same as from ProcessAddItem/DeleteItem) |
| `isFromBuyback` | bool | False = selling to vendor, True = from buyback tab |

**When it fires:** Player sells an item to the vendor. Always preceded by a `ProcessDeleteItem` with the same instance ID (item leaves player inventory).

### ProcessVendorUpdateItem — Vendor stack updated

```
[HH:MM:SS] LocalPlayer: ProcessVendorUpdateItem(instanceId, encodedValue, price)
```

| Field | Type | Meaning |
|---|---|---|
| `instanceId` | u64 | Instance ID already in vendor inventory |
| `encodedValue` | u32 | Packed value, same encoding as ProcessUpdateItemCode: `(stackSize << 16) \| itemTypeId` |
| `price` | u32 | Price per unit |

**When it fires:** Selling a stackable item that the vendor already has a stack of. Instead of creating a new entry (`VendorAddItem`), the existing vendor stack is updated.

### ProcessVendorUpdateAvailableGold — Vendor gold balance change

```
[HH:MM:SS] LocalPlayer: ProcessVendorUpdateAvailableGold(currentGold, serverId, maxGold)
```

| Field | Type | Meaning |
|---|---|---|
| `currentGold` | u32 | Vendor's gold after the transaction |
| `serverId` | u64 | Server-side identifier |
| `maxGold` | u32 | Vendor's maximum gold capacity |

**When it fires:** After every vendor buy/sell transaction. `currentGold` decreases when the vendor buys from you (pays you gold), increases when you buy from them.

### ProcessVendorRemoveItem — Item removed from vendor stock

```
[HH:MM:SS] LocalPlayer: ProcessVendorRemoveItem(instanceId)
```

| Field | Type | Meaning |
|---|---|---|
| `instanceId` | u64 | Instance ID of the item removed from the vendor's display |

**When it fires:** An item is fully purchased or otherwise removed from the vendor's displayed stock.

### ProcessBarterScreen — Barter/trade screen opened

```
[HH:MM:SS] LocalPlayer: ProcessBarterScreen(npcId, "dialogue", BarterInfo[], System.Int32[], System.String[], cost)
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID |
| `dialogue` | string | NPC's barter dialogue (may include HTML color tags and trade count info) |
| `cost` | i32 | Cost modifier |

**When it fires:** Player opens a barter/trade screen with an NPC. Some NPCs offer item-for-item trades with daily limits, shown in the dialogue text.
