# NPC Interaction Events

### ProcessStartInteraction — Begin interacting with an entity

```
[HH:MM:SS] LocalPlayer: ProcessStartInteraction(entityId, interactionType, distance, canInteract, "NPC_Name")
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Entity ID (NPC, player saddlebag, interactable object) |
| `interactionType` | u32 | Type of interaction: `7` = talk/vendor, `3` = saddlebag/personal storage |
| `distance` | f32 | Distance to entity when interaction started (0 for self-interactions) |
| `canInteract` | bool | Whether the interaction is valid |
| `NPC_Name` | string | Internal NPC identifier (e.g., `"NPC_Yetta"`, `"NPC_Kalaba"`), empty string for non-NPC interactions |

**When it fires:** Player clicks on or otherwise initiates interaction with an NPC or interactable entity.

**Interaction types observed:**
- `7` — NPC talk/vendor (includes storage NPCs, hired vendors)
- `3` — Saddlebag / personal storage (entityId = player entity, NPC_Name = `""`)

### ProcessWaitInteraction — Interaction delay

```
[HH:MM:SS] LocalPlayer: ProcessWaitInteraction(entityId, delay, "", "")
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Entity being interacted with |
| `delay` | u32 | Wait time in milliseconds (e.g., `500`) |

**When it fires:** Brief server-side delay during an NPC interaction, typically before a screen transition (e.g., opening shop logs, switching vendor tabs).

### ProcessPreTalkScreen — NPC talk screen preamble

```
[HH:MM:SS] LocalPlayer: ProcessPreTalkScreen(npcId, PreTalkScreenInfo)
```

Fires before each talk/prompt screen. Appears repeatedly during a single NPC conversation as the player navigates between screens (gift, vendor, dialogue).

### ProcessTalkScreen — NPC dialogue

```
[HH:MM:SS] LocalPlayer: ProcessTalkScreen(npcId, "", "dialogue text", "", System.Int32[], System.String[], 0, Generic)
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID |
| `dialogue text` | string | The NPC's spoken text |
| `Generic` | enum | Dialogue category |

**When it fires:** NPC greets the player or responds during conversation.

### ProcessPromptForItem — NPC requests an item (gift giving)

```
[HH:MM:SS] LocalPlayer: ProcessPromptForItem(npcId, "Give Gift", "dialogue", "prompt", null, System.Int32[], System.String[], -1301, "", Error, 0, ForNpc, "NPC_Name")
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID |
| `"Give Gift"` | string | Action type |
| `dialogue` | string | NPC's response text (e.g., `"A gift? For me?"`, `"Oh, thanks!"`) |
| `prompt` | string | UI prompt text (`"Choose gift"` or `"Choose another gift"`) |
| `ForNpc` | enum | Indicates this is an NPC-directed gift |
| `NPC_Name` | string | Internal NPC identifier |

**When it fires:** NPC opens the gift-giving UI. Fires once initially, then again after each gift is given (with updated dialogue like `"Choose another gift"`).

### ProcessDeltaFavor — NPC favor change

```
[HH:MM:SS] LocalPlayer: ProcessDeltaFavor(npcId, "NPC_Name", delta, isGift)
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID |
| `NPC_Name` | string | Internal NPC identifier |
| `delta` | f32 | Favor amount gained (e.g., `2.8476`, `1.582`) |
| `isGift` | bool | True when favor is from a gift |

**When it fires:** After giving a gift to an NPC. The delta varies per item — different gifts are worth different amounts of favor.

### ProcessEndInteraction — Interaction ended

```
[HH:MM:SS] LocalPlayer: ProcessEndInteraction(entityId)
```

**When it fires:** Player ends an NPC interaction (closes dialogue, walks away).

### ProcessFirstEverInteraction — First interaction with entity

```
[HH:MM:SS] LocalPlayer: ProcessFirstEverInteraction("interactionData")
```

**When it fires:** First time interacting with a specific entity type (portals, etc.). Contains interaction metadata string.

**NOT YET PARSED.**

### ProcessEnableInteractor — Interactable entities

```
[HH:MM:SS] LocalPlayer: ProcessEnableInteractor(System.Int32[], System.Int32[])
```

**When it fires:** On login/zone change. Lists entities that can be interacted with.

**NOT YET PARSED.**

### ProcessBook — Display book or log content

```
[HH:MM:SS] LocalPlayer: ProcessBook("title", "content", "bookType", "", "", False, False, False, False, False, "")
```

| Field | Type | Meaning |
|---|---|---|
| `title` | string | Book/log title (e.g., `"Yesterday's Shop Logs"`, `"Today's Shop Logs"`) |
| `content` | string | Full text content with `\n` line breaks |
| `bookType` | string | Category (e.g., `"PlayerShopLog"`) |

**When it fires:** Player opens a readable book, scroll, or log in-game. For player shops, the hired vendor NPC provides daily shop logs via this event.

**Player shop log content** includes structured entries like:
- `"Toncom bought Thin Mesh Grate at a cost of 350 per 1 = 350"` — customer purchase
- `"Zenith collected 3800 Councils from customer purchases"` — owner collecting gold
- `"Zenith added Guava x100 to shop"` — owner stocking items
- `"Zenith made Guavax100 visible in shop at a cost of 500 per 1"` — owner setting prices
- `"Zenith paid 10900 Councils to hire Mantis Attendant for another 24 hours."` — vendor hire renewal
- `"Fidge sent a note to shop owner"` — customer message
- `"Zenith removed Basic Metal Slab x55 from shop"` — owner pulling items
