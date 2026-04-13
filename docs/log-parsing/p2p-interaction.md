# Player-to-Player Interaction Events

Events for direct player-to-player interactions: trading items and forming groups.

### ProcessP2PStartInteraction — P2P interaction initiated

```
[HH:MM:SS] LocalPlayer: ProcessP2PStartInteraction(interactionType, targetEntityId)
```

| Field | Type | Meaning |
|---|---|---|
| `interactionType` | enum | Type of interaction: `Trade`, `Group` |
| `targetEntityId` | u32 | Entity ID of the other player |

**When it fires:** A player-to-player interaction begins (trade window opens, group invite accepted).

### ProcessP2PRequestInteraction — P2P interaction request sent/received

```
[HH:MM:SS] LocalPlayer: ProcessP2PRequestInteraction(interactionType, targetEntityId, "label")
```

| Field | Type | Meaning |
|---|---|---|
| `interactionType` | enum | Type of interaction: `Trade`, `Group` |
| `targetEntityId` | u32 | Entity ID of the other player |
| `label` | string | Context label — "???" for trade requests, group name for group invites |

**When it fires:** A trade or group request is sent or received. For groups, the label contains the group name (e.g., "My Group").

### ProcessP2PSetTrade — Trade items updated

```
[HH:MM:SS] LocalPlayer: ProcessP2PSetTrade(targetEntityId, slotIndex, itemList, isConfirmed)
```

| Field | Type | Meaning |
|---|---|---|
| `targetEntityId` | u32 | Entity ID of the trade partner |
| `slotIndex` | u32 | Trade slot index |
| `itemList` | List | Items in the trade (opaque C# list) |
| `isConfirmed` | bool | True when a player confirms their side of the trade |

**When it fires:** During a player trade, fires when either player adds/removes items or confirms the trade. The `isConfirmed` flag toggles as players lock in their offers.

### ProcessP2PEndInteraction — P2P interaction ended

```
[HH:MM:SS] LocalPlayer: ProcessP2PEndInteraction(interactionType, targetEntityId, wasCompleted)
```

| Field | Type | Meaning |
|---|---|---|
| `interactionType` | enum | Type of interaction: `Trade`, `Group` |
| `targetEntityId` | u32 | Entity ID of the other player |
| `wasCompleted` | bool | True if the interaction completed successfully, False if cancelled |

**When it fires:** A P2P interaction ends, either by completion or cancellation.
