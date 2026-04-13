# Items & Inventory Events

### ProcessAddItem — New item enters inventory

```
[HH:MM:SS] LocalPlayer: ProcessAddItem(InternalName(instanceId), slotIndex, isNew)
```

| Field | Type | Meaning |
|---|---|---|
| `InternalName` | string | CDN internal name (e.g., `MetalSlab2`, `UnrefinedSilverOre`) |
| `instanceId` | u64 | Unique instance identifier for this specific stack/item |
| `slotIndex` | i32 | Inventory slot (-1 = auto-placed) |
| `isNew` | bool | True if newly acquired (loot, craft), False if loading inventory |

**When it fires:**
- Login (all inventory items, `isNew=False`)
- Looting items from the ground or containers
- Crafting results
- Receiving items from NPCs/quests
- Item entering inventory that creates a **new stack** (item you didn't already have a stack of)

**Key behavior:** At login, every inventory item fires a ProcessAddItem with `isNew=False`. The `instanceId` and `InternalName` together establish which instance ID corresponds to which item. Items acquired during gameplay fire with `isNew=True`.

### ProcessUpdateItemCode — Existing stack updated

```
[HH:MM:SS] LocalPlayer: ProcessUpdateItemCode(instanceId, encodedValue, fromServer)
```

| Field | Type | Meaning |
|---|---|---|
| `instanceId` | u64 | Instance identifier (same as from ProcessAddItem) |
| `encodedValue` | u32 | Packed value: see decoding below |
| `fromServer` | bool | True = authoritative server update, False = client-side (e.g., moving between storage) |

#### Decoding `encodedValue`

The second argument packs two values into a single integer:

```
encodedValue = (stackSize << 16) | itemTypeId
```

| Bits | Mask | Value |
|---|---|---|
| High 16 bits | `value >> 16` | **Stack size** (new quantity after the update) |
| Low 16 bits | `value & 0xFFFF` | **Item type ID** (maps to CDN `items.id`) |

**Example:**
```
ProcessUpdateItemCode(136937342, 1642723, True)

  1642723 >> 16    = 25       → new stack size is 25
  1642723 & 0xFFFF = 4323     → item type ID 4323 (MetalSlab3)
```

**When it fires:**
- Adding items to an existing stack (quantity increases)
- Consuming items from a stack (crafting, using consumables — quantity decreases)
- Moving items between inventory and storage (typically `fromServer=False`)

**Tracking deltas:** By remembering the previous stack size for each instance ID, the delta between old and new stack size tells you how many items were added or removed:
```
delta = newStackSize - previousStackSize
  > 0 → items gained
  < 0 → items consumed/moved
```

### ProcessDeleteItem — Item removed from inventory

```
[HH:MM:SS] LocalPlayer: ProcessDeleteItem(instanceId)
```

| Field | Type | Meaning |
|---|---|---|
| `instanceId` | u64 | Instance identifier being removed |

**When it fires:**
- Stack fully consumed (last item used)
- Item moved to storage (paired with `ProcessAddToStorageVault`)
- Item destroyed or quest-consumed
- Motherlode map consumed on successful find

**Important:** DeleteItem fires for both "real" deletion (item consumed/destroyed) and storage transfers. To distinguish, check if a `ProcessAddToStorageVault` follows immediately — if so, the item was stowed, not destroyed.

### ProcessAddToStorageVault — Item moved to storage

```
[HH:MM:SS] LocalPlayer: ProcessAddToStorageVault(npcId, -1, slot, InternalName(instanceId))
```

When this follows a ProcessDeleteItem with the same instanceId, the item was **moved to storage**, not consumed.

### ProcessExtendedItemUseInfo — Extended item use data

```
[HH:MM:SS] LocalPlayer: ProcessExtendedItemUseInfo(SystemName, ActionType, System.Collections.Generic.List`1[System.Int32])
```

**When it fires:** On login. Known systems: `Gourmand` with `Initialize` action — contains list of food item IDs the player has eaten.

Known systems: `Gourmand` with `Initialize` action — contains list of food item IDs the player has eaten.

### ProcessSetLockedItems — Locked items

```
[HH:MM:SS] LocalPlayer: ProcessSetLockedItems(System.Int32[])
```

**When it fires:** On login. Items the player has locked/protected from accidental use.

### ProcessInventoryFolderSettings — Inventory UI state

```
[HH:MM:SS] LocalPlayer: ProcessInventoryFolderSettings(System.Collections.Generic.List`1[InventoryFolderSettings])
```

**When it fires:** On login. Player's inventory folder/tab configuration.

### ProcessRemoveLoot — Loot removed

```
[HH:MM:SS] LocalPlayer: ProcessRemoveLoot(lootId)
```

**When it fires:** Loot container removed from the world (after looting or timeout).
