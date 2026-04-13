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
