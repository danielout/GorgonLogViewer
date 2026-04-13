# Storage Events

### ProcessShowStorageVault — Open a storage vault tab

```
[HH:MM:SS] LocalPlayer: ProcessShowStorageVault(npcId, vaultId, "Storage", "label", slotCount, System.Collections.Generic.List`1[Item], System.String[], "tabName", System.Int32[], System.String[], modifier)
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID providing storage (or player entity for saddlebag) |
| `vaultId` | u32 | Vault identifier (e.g., `1501`–`1507`, `114` for saddlebag) |
| `"Storage"` | string | Vault type (`"Storage"` for NPC vaults, `"Saddlebag"` for mount storage) |
| `label` | string | Description (e.g., `"Access saddlebag contents here"`, empty for NPC storage) |
| `slotCount` | u32 | Total slots in this vault tab |
| `tabName` | string | Named tab (e.g., `"Gardening and Tools"`, `"Equipment and Ammunition"`, `"Potions and Alchemy Ingredients"`, `"Gems, Crystals, and Ores"`, or empty) |

**When it fires:** Player opens or switches between storage vault tabs. Each tab is a separate vault with its own ID.

### ProcessRefreshStorageVault — Storage vault contents refreshed

```
[HH:MM:SS] LocalPlayer: ProcessRefreshStorageVault(npcId, vaultId, slotCount, System.Collections.Generic.List`1[Item])
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID (0 for bulk stow operations) |
| `vaultId` | u32 | Vault identifier |
| `slotCount` | i32 | Slot count (-1 during bulk operations) |

**When it fires:** After items are added to or removed from storage. During a "stow all" operation, multiple vaults refresh simultaneously (npcId=0, slotCount=-1), followed by a `ProcessScreenText(CraftingNotice, "Stowed N items across M storages.")`.

### ProcessRemoveFromStorageVault — Take item from storage

```
[HH:MM:SS] LocalPlayer: ProcessRemoveFromStorageVault(npcId, -1, instanceId, quantity)
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID (or player entity for saddlebag) |
| `instanceId` | u64 | Instance ID of the item being retrieved |
| `quantity` | u32 | Number of items taken from the stack |

**When it fires:** Player takes an item from storage into inventory. Always paired with a preceding `ProcessAddItem` — the item appears in inventory, then the storage removal is confirmed.

**Key behavior:** The inverse of `ProcessAddToStorageVault`. For AddToStorage, the sequence is `DeleteItem → AddToStorageVault`. For RemoveFromStorage, it's `AddItem → RemoveFromStorageVault`.
