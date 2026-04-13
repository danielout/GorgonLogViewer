# Non-Process Timestamped Events

Events that appear with `[HH:MM:SS]` timestamps but are not `LocalPlayer: Process*` calls. These cover combat hits, ability usage, network state, zone loading, audio, and rendering.

## Combat

### OnAttackHitMe — Incoming attack on an entity

```
[HH:MM:SS] entity_ID: OnAttackHitMe(attackInfo). Evaded = bool
[HH:MM:SS] localPlayer - entity_ID: OnAttackHitMe(attackInfo). Evaded = bool
```

| Field | Type | Meaning |
|---|---|---|
| `entity_ID` | string | Entity being hit (e.g., `entity_273817`) |
| `attackInfo` | opaque | Attack details (C# ToString, not easily parseable) |
| `Evaded` | bool | True if the attack was evaded/dodged |

**When it fires:** An entity is hit by an attack. Lines prefixed with `localPlayer -` indicate the player character was hit. High frequency during combat.

**Note:** The `entity_ID` prefix replaces `LocalPlayer:` — these are area-level events, not player commands.

### UseAbility — Ability usage attempt

```
[HH:MM:SS] UseAbility(abilityInfo): looksOkayToUse = bool
[HH:MM:SS] UseAbility(abilityInfo): unusableCode = reason, target = targetInfo
[HH:MM:SS] UseAbility(abilityInfo): too far away! Moving closer!
```

| Field | Type | Meaning |
|---|---|---|
| `abilityInfo` | opaque | Ability details |
| `looksOkayToUse` | bool | True if ability can be used |
| `unusableCode` | enum | Why ability can't be used: `Cooldown`, `GlobalCooldown`, `Disabled`, `InvalidTarget`, `NoTarget`, `StillAttacking`, `TooFarAway`, `Unusable`, `Usable` |
| `target` | string | Current target info (empty string if no target, or `Selectable(...)`) |

**When it fires:** Player attempts to use an ability. Fires for both successful and failed attempts. The `unusableCode` is particularly useful for understanding why abilities fail.

## Network & Connection

### New Network State — Connection lifecycle

```
[HH:MM:SS] New Network State: description (oldState -> newState)
```

| Field | Type | Meaning |
|---|---|---|
| `description` | string | Human-readable state description (e.g., "Connecting...", "Logging In...", "Logged In") |
| `oldState` | enum | Previous state |
| `newState` | enum | New state |

**Known states:** `Unconnected`, `Connecting`, `ConnectedButNotLoggedIn`, `LoggingIn`, `LoggedInButNoCharacters`, `GotCharacters`, `InitializedArea`

**When it fires:** During the login flow and on disconnects. Useful for tracking connection issues.

### Vivox — Voice chat state

```
[HH:MM:SS] Vivox - LoginAsync(channelInfo)
[HH:MM:SS] Vivox - Logged in!
```

**When it fires:** Voice chat system connects or disconnects.

## Zone & Area

### Initializing area — Zone load

```
[HH:MM:SS] !!! Initializing area! (serverId): AreaName
```

| Field | Type | Meaning |
|---|---|---|
| `serverId` | u32 | Server/instance identifier |
| `AreaName` | string | Internal area name (e.g., `AreaSerbule`, `AreaGazlukCaves`) — maps to `areas.json` CDN data |

**When it fires:** Player enters a new zone. Preceded by a `LOADING LEVEL` line (non-timestamped). The area name maps to entries in the CDN `areas.json` for friendly names.

### ClearCursor — Cursor state reset

```
[HH:MM:SS] ClearCursor(source)
```

| Field | Type | Meaning |
|---|---|---|
| `source` | string | What triggered the cursor clear (e.g., `SelectionController`) |

**When it fires:** UI cursor state is reset, typically during loading screens or interaction transitions.

## Audio

### Playing sound — Sound effect played

```
[HH:MM:SS] elapsedTime: Playing sound soundName (UnityEngine.AudioClip), cmd=command, delay=N, skipChance=N
```

| Field | Type | Meaning |
|---|---|---|
| `elapsedTime` | f32 | Time elapsed since session start (seconds) |
| `soundName` | string | Sound clip name (e.g., `food_eat`, `Combat_Sword_SwordSlash_Swish`, `Werewolf_Bite_Swish_Growl`, `Cow_Moo`) |
| `command` | enum | Playback mode (e.g., `PlayFromPool`) |
| `delay` | f32 | Playback delay in seconds |
| `skipChance` | f32 | Probability of skipping this sound |

**When it fires:** A sound effect is triggered. High frequency during combat. Sound names reveal what actions are happening (eating, combat by weapon type, ambient creature sounds).

## Rendering & Appearance

### Download appearance loop — Character model loading

```
[HH:MM:SS] Download appearance loop @BaseN-sex(sex=s, race=r, ...) is waiting on Appearance assetName
```

**When it fires:** The game is loading a character's visual appearance (models, textures, equipment). Contains the full appearance specification including race, body proportions, equipment slots, and color values. Very long lines — can contain the complete character appearance string.

### Appearance messages — Model loading state

```
[HH:MM:SS] Appearance for EntityName is being set, but they're currently loading! Canceling the load.
[HH:MM:SS] Appearance for EntityName is being set, but they're already queued. Replacing them in the queue.
[HH:MM:SS] Appearance EntityName (info) was destroyed while actively loading, canceling its load.
[HH:MM:SS] Appearance EntityName (info) was destroyed while queued, removing it from the queue.
[HH:MM:SS] An appearance preview's appearance is being set before the previous set completed.
```

**When it fires:** Entity appearance (model/texture) loading encounters state conflicts. Common in crowded areas where many player/NPC models are loading simultaneously.

### Successfully downloaded Texture — Texture asset loaded

```
[HH:MM:SS] Successfully downloaded Texture textureName (info) from source
```

**When it fires:** A texture asset is downloaded and loaded. Common during initial zone load and when new entities appear.

### LoadAssetAsync / IsDoneLoading — Asset loading progress

```
[HH:MM:SS] LoadAssetAsync: assetName. Status=status. Done=bool. PercentComplete=N
[HH:MM:SS] IsDoneLoading: assetName. Status=status. Done=bool. PercentComplete=N
```

**When it fires:** Asset bundles are being loaded asynchronously. Very high frequency during zone loads and character creation screens.

## Errors

### Runtime errors — Timestamped error messages

```
[HH:MM:SS]  Error: description
```

Common error types:
- `Post proc for entity_N has been running for more than 10 seconds, scrapping it.` — appearance loading timeout
- `Queued destruction of an object that is already queued to be destroyed?` — double-destruction warning
- `Exposed Skin Missing for part: ...` — missing model part
- `Network state is InitializedArea but actually we're not connected!` — connection lost

**When it fires:** Various runtime errors. Most are non-fatal rendering/loading issues.

- `general error! Disconnected due to being AFK too long` — AFK disconnect
- `Particle prefab 'X' has a ParticleInfo without a scheduled delete` — particle cleanup warning

### Warning messages

```
[HH:MM:SS]  Warning: description
```

- `Got too many pixels from server! N but max is N` — server sent oversized data

## Session & Login

### Logged in as character — Login marker

```
[HH:MM:SS] Logged in as character CharacterName. Time UTC=YYYY/MM/DD HH:MM:SS. Timezone Offset -HH:MM:SS
```

**When it fires:** Player selects a character and enters the game world. Contains the character name, server UTC time, and timezone offset.

### Logging chat — Chat log file path

```
[HH:MM:SS] Logging chat to C:/Users/.../AppData/LocalLow/Elder Game/Project Gorgon/ChatLogs/Chat-YY-MM-DD.log
```

**When it fires:** Chat logging begins. Shows the file path being written to.

### Loading/Saving Chat Tabs — Chat UI state

```
[HH:MM:SS] Loading Chat Tabs:
[HH:MM:SS] Saving Chat Tabs:
```

**When it fires:** Chat tab configuration is loaded (on login) or saved (on logout/zone change).

### Lost connection — Disconnect

```
[HH:MM:SS] Lost connection to server! Reason: Connection terminated
```

**When it fires:** Client disconnects from the server. Reason describes the cause.

### Sent C_INIT2 — Area initialization handshake

```
[HH:MM:SS] Sent C_INIT2 for AreaName
```

**When it fires:** Client sends area initialization to the server after a zone load completes. The area name matches CDN `areas.json` entries.

## Guild & Social

### General Guild Info — Guild membership

```
[HH:MM:SS] General Guild Info: in guild 'GuildName'
```

**When it fires:** Player's guild membership confirmed on login.

### Voice channel — Voice chat join/leave

```
[HH:MM:SS] Joined voice channel: serverId-HuntingGroup-groupId
[HH:MM:SS] Left voice channel: serverId-HuntingGroup-groupId
```

**When it fires:** Player joins or leaves a Vivox voice chat channel, typically tied to a hunting group.

### Participant — Voice chat members

```
[HH:MM:SS] Participant PlayerName added to channel serverId-HuntingGroup-groupId
[HH:MM:SS] Participant PlayerName removed from channel serverId-HuntingGroup-groupId
```

**When it fires:** A player joins or leaves a voice channel the local player is in.

## Effects

### Removing effect — Local effect removal

```
[HH:MM:SS] Removing effect from local player: effectInfo
```

**When it fires:** An effect/buff is removed from the player. Separate from `ProcessRemoveEffects` — this is a client-side log of the removal.

## Gameplay

### Move to — Auto-move for ability

```
[HH:MM:SS] Move to TargetName finished, trying again to use ability Ability(abilityInfo)
```

**When it fires:** Player was out of range to use an ability, auto-moved to the target, and is now retrying the ability.

### NOTE: processed message during loading — Chat during zone load

```
[HH:MM:SS] NOTE: processed message during loading: messageText
```

**When it fires:** Chat messages received while a zone is loading. These are queued and logged but may not appear in the chat UI during the load.

### ShowBook — Book display triggered

```
[HH:MM:SS] ShowBook("title", "content"). Current book is bookId
```

**When it fires:** A book/log UI is triggered. `Current book` shows what was previously displayed (`null` if nothing). `GuildMotd` indicates the guild message of the day.

### Set fog — Map visibility

```
[HH:MM:SS] Set fog for map ID #mapId
```

**When it fires:** Fog/exploration visibility is configured for a zone map.

## Rendering Warnings

### Cannot remove particle — Missing particle effect

```
[HH:MM:SS] Cannot remove: entity entity_N doesn't have particle ParticleName
```

**When it fires:** The game tries to remove a particle effect from an entity that doesn't have it. Common and non-fatal. Particle names reveal active buff/ability visuals (e.g., `BuffGreen`, `BoneWhirlwind`, `CryogenicFreeze`).

### Ref-count cleanup — Asset unloading

```
[HH:MM:SS] Ref-count cleanup of appearance assetName
```

**When it fires:** An appearance asset's reference count dropped to zero and it's being cleaned up.

### NullAnimEx — Missing animator

```
[HH:MM:SS] NullAnimEx.IsAttackState(...)
[HH:MM:SS] NullAnimEx.SetMode(...)
```

**When it fires:** Animation calls on an entity that has no animator component. Non-fatal warnings.

### Drag state — UI drag warning

```
[HH:MM:SS] Still dragging DraggingIcon (UnityEngine.GameObject) but the mouse is no longer held down!
```

**When it fires:** UI drag operation lost track of the mouse state.
