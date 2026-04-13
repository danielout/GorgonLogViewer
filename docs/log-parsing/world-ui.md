# World & UI Events

### ProcessMapFx — Map marker/point of interest

```
[HH:MM:SS] LocalPlayer: ProcessMapFx((x, y, z), radius, type, "label", category, "description")
```

| Field | Type | Meaning |
|---|---|---|
| `position` | (f32, f32, f32) | World coordinates |
| `radius` | u32 | Effect radius |
| `type` | u32 | Marker type |
| `label` | string | Short label (e.g., `"Tsavorite is here"`) |
| `category` | enum | Marker category (e.g., `ImportantInfo`) |
| `description` | string | Detailed text (e.g., `"The Tsavorite is 441m east and 1316m north."`) |

**When it fires:** Survey results, resource discoveries, and other map-pinned events.

**NOT YET PARSED** (but consumed by `SurveyParser` from raw lines).

### ProcessSetAreaSettings — Area configuration

```
[HH:MM:SS] LocalPlayer: ProcessSetAreaSettings(AreaSettingsFromServer)
```

**When it fires:** On login and zone transitions. Contains area-specific settings.

**NOT YET PARSED.** Serialized C# type — actual data content unknown.

### ProcessScreenText — On-screen notification

```
[HH:MM:SS] LocalPlayer: ProcessScreenText(category, "message")
```

| Field | Type | Meaning |
|---|---|---|
| `category` | enum | Notification type (e.g., `ImportantInfo`, `CraftingNotice`) |
| `message` | string | Display text |

**When it fires:** Various in-game notifications. Known categories:
- `ImportantInfo` — survey distance hints, loot bonuses (e.g., `"The treasure is 342 meters from here."`, `"Malachite collected! Also found Quartz x3"`)
- `CraftingNotice` — crafting/storage results (e.g., `"Stowed 5 items across 3 storages."`)

### ProcessMapFog — Explored map areas

```
[HH:MM:SS] LocalPlayer: ProcessMapFog(System.Collections.Generic.List`1[MapFogHistory])
```

**When it fires:** On login. Map exploration/fog-of-war state.

**NOT YET PARSED.**

### ProcessGuildGeneralInfo — Guild membership

```
[HH:MM:SS] LocalPlayer: ProcessGuildGeneralInfo(guildId, "GuildName", "motd")
```

**When it fires:** On login. Contains guild ID, name, and message of the day.

**NOT YET PARSED.**

### ProcessErrorMessage — Game error

```
[HH:MM:SS] LocalPlayer: ProcessErrorMessage(errorCode, "message")
```

**When it fires:** Various game errors (e.g., entity no longer exists, can't perform action).

**NOT YET PARSED.**

### ProcessTitlesList — Unlocked titles

```
[HH:MM:SS] LocalPlayer: ProcessTitlesList(Initialize, System.Collections.Generic.List`1[System.Int32])
```

**When it fires:** On login. Contains list of title IDs the player has unlocked.

**NOT YET PARSED.**

### ProcessBookList — Known books

```
[HH:MM:SS] LocalPlayer: ProcessBookList(Initialize, System.Collections.Generic.List`1[System.Int32])
```

**When it fires:** On login. Contains list of book IDs the player has read.

**NOT YET PARSED.**

### ProcessSetExtendedGuiFeatures — GUI feature flags

```
[HH:MM:SS] LocalPlayer: ProcessSetExtendedGuiFeatures(ExtendedGuiFeatures)
```

**When it fires:** On login. GUI feature configuration from server.

**NOT YET PARSED.**

### ProcessRedemptionCount — Redemption/loyalty points

```
[HH:MM:SS] LocalPlayer: ProcessRedemptionCount(count)
```

**When it fires:** On login. Current redemption point count.

**NOT YET PARSED.**

### ProcessToolCommandResponse — Tool command result

```
[HH:MM:SS] LocalPlayer: ProcessToolCommandResponse(commandId, success, "message", System.Collections.Generic.Dictionary`2[System.String,System.String])
```

**When it fires:** Response to a tool command (e.g., `/outputcharacter`).

**NOT YET PARSED.**

### ProcessShowStable — Stable UI

```
[HH:MM:SS] LocalPlayer: ProcessShowStable(npcId, StableSlot[], System.Int32[], System.String[], modifier)
```

**When it fires:** Player opens the animal stable UI. Contains stable slot data, animal IDs, and names.

**NOT YET PARSED.**

### ProcessPlayerVendorScreen — Player shop inventory

```
[HH:MM:SS] LocalPlayer: ProcessPlayerVendorScreen(npcId, "", System.Collections.Generic.List`1[PlayerVendorItemForSale], slotCount, bool, bool, ...)
```

**When it fires:** Player opens their own vendor stall management UI.

**NOT YET PARSED.**

### ProcessPlayerVendorScreenUpdate — Player shop item update

```
[HH:MM:SS] LocalPlayer: ProcessPlayerVendorScreenUpdate(npcId, PlayerVendorItemForSale, bool)
```

**When it fires:** Item added or price changed in player's vendor stall.

**NOT YET PARSED.**

### ProcessPlayerVendorScreenRemove — Player shop item removed

```
[HH:MM:SS] LocalPlayer: ProcessPlayerVendorScreenRemove(npcId, instanceId)
```

**When it fires:** Item removed from player's vendor stall.

**NOT YET PARSED.**

### ProcessMapPinAdd — Map pin/marker added

```
[HH:MM:SS] LocalPlayer: ProcessMapPinAdd(mapId, pinType, iconIndex, position, "label")
```

| Field | Type | Meaning |
|---|---|---|
| `mapId` | u32 | Map identifier |
| `pinType` | u32 | Pin type (0 = default, 1+ = special) |
| `iconIndex` | u32 | Icon to display (0 = default, 7 = named POI) |
| `position` | vec3 | World position (x, y, z) |
| `label` | string | Pin label text (empty string for unlabeled pins) |

**When it fires:** Map pins are added, such as quest markers, player-placed pins, or system markers like "Horse Thieves" POI locations.

### ProcessInputBox — Input dialog shown

```
[HH:MM:SS] LocalPlayer: ProcessInputBox(sourceId, inputType, "title", "prompt", "replyLabel", "", "", minLength, maxLength, System.Int32[], System.String[], flags)
```

| Field | Type | Meaning |
|---|---|---|
| `sourceId` | i32 | Source entity or system ID (-9 = system) |
| `inputType` | enum | Input type (e.g., `EnterNumber`, `EnterText`) |
| `title` | string | Dialog title (e.g., "Teleportation Machine") |
| `prompt` | string | Prompt text for the player |
| `minLength` | u32 | Minimum input length |
| `maxLength` | u32 | Maximum input length |

**When it fires:** A dialog box prompts the player for text or number input, such as teleportation circle coordinates.

### ProcessMusicPerformance — Music performance state

```
[HH:MM:SS] LocalPlayer: ProcessMusicPerformance(MusicPerformanceManager+PerformanceInfo)
```

**When it fires:** Music performance system updates. Fires frequently while the performance system is active. The data is opaque (C# ToString of internal class).

### ProcessDoSpecialFX — Special effect triggered

```
[HH:MM:SS] LocalPlayer: ProcessDoSpecialFX("effectPath", position)
```

| Field | Type | Meaning |
|---|---|---|
| `effectPath` | string | Particle effect path (e.g., "ParticlePath") |
| `position` | vec3 | World position where the effect is spawned (x, y, z) |

**When it fires:** Visual particle effects are triggered at a world position.

### ProcessUpdateDescription — Interactable entity description update

```
[HH:MM:SS] ProcessUpdateDescription(entityId, "name", "description", "actionLabel", actionType, "modelInfo", flags)
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Entity ID |
| `name` | string | Display name (e.g., "Thirsty Daisy", "Blooming Poppy") |
| `description` | string | Current state description |
| `actionLabel` | string | Action button text (e.g., "Water Daisy", "Pick Poppy") |
| `actionType` | enum | Action type (e.g., `UseItem`) |
| `modelInfo` | string | Visual model with scale (e.g., "Flower5(Scale=0.65)") |

**When it fires:** Interactable world entities (plants, gardening nodes, etc.) update their name, description, or available action. Common with the gardening system.

**Note:** This event does NOT have the `LocalPlayer:` prefix — it fires directly as `ProcessUpdateDescription`.
