# Practical Patterns

## Practical Patterns — NPC Interactions

### Selling Items to a Vendor

Each sold item produces a three-event sequence:

```
[16:32:25] ProcessDeleteItem(115259296)                                    ← item leaves inventory
[16:32:25] ProcessVendorAddItem(120, AmuletOfCrushingMitigation5(115259296), False)  ← vendor receives it at 120g
[16:32:25] ProcessVendorUpdateAvailableGold(14880, ..., 15000)             ← vendor gold drops by 120
```

When selling a stackable item that already exists in the vendor's inventory:

```
[16:32:27] ProcessDeleteItem(115271948)
[16:32:27] ProcessVendorUpdateItem(115249145, 200909, 7)     ← existing vendor stack updated
[16:32:27] ProcessVendorUpdateAvailableGold(14776, ..., 15000)
```

**Tracking gold earned:** The difference between consecutive `ProcessVendorUpdateAvailableGold` values gives the sale price, or read it directly from `ProcessVendorAddItem`.

### Gift-Giving to an NPC

```
[16:33:00] ProcessPromptForItem(9618, "Give Gift", ..., ForNpc, "NPC_Kalaba")  ← gift UI opens
[16:33:03] ProcessDeltaFavor(9618, "NPC_Kalaba", 2.8476, True)                ← favor gained
[16:33:03] ProcessPromptForItem(9618, "Give Gift", "Oh, thanks!", ...)         ← ready for next gift
[16:33:03] ProcessDeleteItem(114961794)                                         ← gifted item consumed
[16:33:04] ProcessDeltaFavor(9618, "NPC_Kalaba", 1.582, True)                 ← more favor
[16:33:04] ProcessUpdateQuest(1145895, TransitionalQuestState)                 ← quest threshold crossed
```

**Detection logic:**
- `ProcessPromptForItem` with `ForNpc` → gift interaction started
- `ProcessDeleteItem` during a gift prompt → item was given as a gift (not sold or consumed)
- `ProcessDeltaFavor` → favor reward for the gift
- Different items yield different favor amounts

### Player-Owned Shop (Hired Vendor)

Interacting with a hired vendor (`NPC_HiredVendor`) reveals shop management via dialogue and book events:

```
[13:25:58] ProcessStartInteraction(9506, 7, 0, False, "NPC_HiredVendor")
[13:25:59] ProcessTalkScreen(9506, "", "<b>Hi boss, what do you need?</b>\n\n---\n
    Mantis Attendant is hired by you. Time remaining: 27 hours.\n
    Councils in cash-box: 25000", ...)
[13:26:01] ProcessTalkScreen(9506, "", "<b>You collected 25000 councils.</b>\n\n---\n
    Mantis Attendant is hired by you. Time remaining: 27 hours.\n
    Councils in cash-box: 0", ...)
[13:26:04] ProcessBook("Yesterday's Shop Logs", "...", "PlayerShopLog", ...)
[13:26:07] ProcessBook("Today's Shop Logs", "...", "PlayerShopLog", ...)
```

**Key data extractable from hired vendor dialogue:**
- **Attendant type** and **time remaining** (from `TalkScreen` text: `"Mantis Attendant is hired by you. Time remaining: 27 hours."`)
- **Cash-box balance** before/after collection (`"Councils in cash-box: 25000"` → `"Councils in cash-box: 0"`)
- **Collection amount** (`"You collected 25000 councils."`)

**Key data extractable from shop logs (`ProcessBook` with `PlayerShopLog`):**
- Customer purchases: who bought what, price, and quantity
- Owner stocking/pricing/removal actions
- Gold collection history
- Vendor hire payments and renewals
- Customer messages

### Storage Vault Interaction

Interacting with a storage NPC shows vault tabs and allows item transfers:

```
[13:26:55] ProcessStartInteraction(14804, 7, 1200, True, "NPC_Qatik")
[13:26:58] ProcessShowStorageVault(14804, 1507, "Storage", "", 15, ...)        ← first tab
[13:27:03] ProcessShowStorageVault(14804, 1506, "Storage", "", 48, ...)        ← switch tab
[13:27:07] ProcessDeleteItem(136093889)                                         ← item leaves inventory
[13:27:07] ProcessAddToStorageVault(14804, -1, 40, MapleWood(136093889))       ← into storage
[13:27:07] ProcessDeleteItem(133493941)                                         ← stackable, merged
[13:27:07] ProcessRefreshStorageVault(14804, -1, 48, ...)                      ← vault refreshed
```

Retrieving items from storage is the reverse:
```
[13:28:48] ProcessAddItem(MetalSlab4(132702881), 46, True)                     ← item enters inventory
[13:28:48] ProcessRemoveFromStorageVault(14804, -1, 132702881, 11)             ← removed 11 from storage
```

**Bulk stow** (game auto-distributes items across vaults):
```
[13:27:00] ProcessDeleteItem(136202943)
[13:27:00] ProcessDeleteItem(136202764)
[13:27:00] ProcessDeleteItem(136184812)
[13:27:00] ProcessRefreshStorageVault(0, 1505, -1, ...)    ← npcId=0, slotCount=-1 during bulk
[13:27:00] ProcessRefreshStorageVault(0, 1501, -1, ...)
    ... (multiple vaults refresh)
[13:27:00] ProcessScreenText(CraftingNotice, "Stowed 5 items across 3 storages.")
```

### Saddlebag Access

The player's mount saddlebag is accessed via self-interaction (type `3`):

```
[13:27:20] ProcessStartInteraction(4938644, 3, 0, False, "")                   ← self-interaction
[13:27:20] ProcessShowStorageVault(4938644, 114, "Saddlebag", "Access saddlebag contents here", 62, ...)
[13:27:22] ProcessAddItem(DishingHammer(136195024), 59, True)                  ← take from saddlebag
[13:27:22] ProcessRemoveFromStorageVault(4938644, -1, 136195024, 1)
```

**Detection:** `ProcessStartInteraction` with type `3` and empty NPC name → saddlebag. The `ProcessShowStorageVault` will have type `"Saddlebag"` instead of `"Storage"`.

## Instance ID → Item Identity Mapping

Instance IDs are arbitrary per-session numbers. They do **not** correspond to CDN item IDs. To know what item an instance ID refers to, you must either:

1. **Catch the ProcessAddItem at login** — every inventory item is enumerated with `InternalName(instanceId)` when the player logs in
2. **Read the low 16 bits of ProcessUpdateItemCode** — the `itemTypeId` embedded in the encoded value maps to CDN `items.id`

Both approaches should be used together. The AddItem path gives you the internal name mapping; the UpdateItemCode path gives you the numeric type ID and stack size.

## Practical Patterns

### Motherlode Survey Lifecycle

Motherlode maps are used repeatedly to get distance hints. When the correct location is found, the map is consumed and a mining node spawns:

```
[17:37:00] ProcessDoDelayLoop(1, Unset, "Using Kur Mountains Good Metal Motherlode Map", 5305, ...)
[17:37:01] ProcessScreenText(ImportantInfo, "The treasure is 342 meters from here.")
    ↑ distance hint — map NOT consumed

[17:37:03] ProcessDoDelayLoop(1, Unset, "Using Kur Mountains Good Metal Motherlode Map", 5305, ...)
[17:37:04] ProcessDeleteItem(136969636)
[17:37:05] ProcessStartInteraction(5163814, 7, 0, False, "")
[17:37:05] ProcessDoDelayLoop(6, ChopLumber, "Mining ...", 0, AbortIfAttacked, IsInteractorDelayLoop)
[17:37:11] ProcessUpdateItemCode(136937342, 1642723, True)    ← MetalSlab3, stack now 25
[17:37:11] ProcessUpdateItemCode(136807948, 3167735, True)    ← Tungsten, stack now 48
    ↑ found! map consumed → mine node → rewards via stack updates
```

**Detection logic:**
- `ProcessDoDelayLoop` with `"Motherlode Map"` followed by `ProcessScreenText` with distance → ping (searching)
- `ProcessDoDelayLoop` with `"Motherlode Map"` followed by `ProcessDeleteItem` → found (map consumed)
- `ProcessDoDelayLoop` with `"Mining ..."` shortly after → mining the spawned node
- `ProcessUpdateItemCode` calls immediately after mining completes → rewards

### Crafting Consumption

When crafting consumes materials, you see stack decreases:

```
ProcessUpdateItemCode(109085930, 200710, True)    → AdvancedInk, stack decreased
ProcessUpdateItemCode(136144120, 1574047, True)   → TundraLichen, stack decreased
ProcessUpdateItemCode(111587763, 5247202, True)   → MetalSlab2, stack decreased
```

### Storage Transfers (Not Real Deletion)

See the detailed **Storage Vault Interaction** pattern above for full stow/retrieve/bulk sequences. The short version: `ProcessDeleteItem` followed by `ProcessAddToStorageVault` with the same instance ID is a storage move, not a consumption.

## Architecture Notes

### Core Item Tracker

Item event parsing should be a **core system**, not specific to any feature. It provides:

1. **Instance registry** — maps instance IDs to item names/type IDs, built from login AddItem events
2. **Stack tracking** — current stack size per instance, updated on every UpdateItemCode
3. **Delta events** — emits item gained/lost events with item identity and quantity

Features like surveying, crafting tracking, or loot analysis subscribe to these events rather than parsing item lines themselves.

### Limitations

- **Item type ID is 16-bit** — max value 65535. Items with IDs above this would overflow. Check CDN data to confirm all item IDs fit (they should based on the game's scale).
- **Stack overflow** — when a stack hits max (typically 99), additional items of the same type create a new stack via ProcessAddItem rather than ProcessUpdateItemCode.
- **fromServer flag** — `True` on UpdateItemCode means server-authoritative (real game event). `False` typically means client-side inventory management (storage moves). Filter on `True` for tracking real gains/losses.
- **No item metadata in UpdateItemCode** — only the type ID and stack size. For item names, durability, etc., you need the instance registry or CDN lookup.
