# Player Status Events

### ProcessSetAttributes — Player attribute update

```
[HH:MM:SS] LocalPlayer: ProcessSetAttributes(entityId, "[KEY1, KEY2, ...], [val1, val2, ...]")
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Player entity ID |
| `keys` | string[] | Parallel array of attribute names |
| `values` | f32[] | Parallel array of attribute values (matching order to keys) |

**Format:** Two parallel arrays inside a single string argument — attribute names and their values. A single event can set 1 to hundreds of attributes at once.

**When it fires:**
- **Login** — two massive dumps (hundreds of attributes each) covering all character state
- **Mount/dismount** — re-dumps ~44 attributes (stats change when mounted)
- **Skill bar swap** — re-dumps stats affected by active skills
- **During play** — incremental single or small-batch updates (e.g., `[IS_MOUNTED], [1]`, `[CUR_HEALTH, MAX_HEALTH, ...], [667, 667, ...]`)

**Known attribute categories:**
- **Vitals:** `CUR_HEALTH`, `MAX_HEALTH`, `CUR_POWER`, `MAX_POWER`, `CUR_ARMOR`, `MAX_ARMOR`, `CUR_METABOLISM`, `MAX_METABOLISM`
- **Regen:** `COMBAT_REGEN_HEALTH_DELTA`, `NONCOMBAT_REGEN_HEALTH_DELTA`, `COMBAT_REGEN_POWER_DELTA`, `NONCOMBAT_REGEN_POWER_DELTA`, `COMBAT_REGEN_ARMOR_DELTA`, `NONCOMBAT_REGEN_ARMOR_DELTA`
- **Movement:** `MOVEMENT_SPEED`, `SPRINT_BOOST`, `NONCOMBAT_SPRINT_BOOST`, `GRAVITY`, `JUMP_BURST`, `CLIMB_SPEED`
- **Combat modifiers:** `VULN_*` (per damage type × direct/indirect/elite), `MOD_*` (per damage type), `MITIGATION_*`
- **Ability modifiers:** `MOD_ABILITY_*`, `ABILITY_COST_MOD_*`, `ABILITY_RAGE_MOD_*`, `ABILITY_TAUNT_MOD_*`
- **Skill modifiers:** `MOD_SKILL_*`, `BOOST_SKILL_*`
- **NPC interaction:** `NPC_MOD_TRAININGCOST`, `NPC_MOD_MAXSALESVALUE`, `NPC_MOD_FAVORFROMGIFTS`, `NPC_MOD_FAVORFROMHANGOUTS`
- **Social:** `CUR_COMMUNITY`, `MAX_COMMUNITY`, `CUR_PEACEABLENESS`, `MAX_PEACEABLENESS`, `CUR_CLEANLINESS`, `MAX_CLEANLINESS`
- **Crafting:** `MAX_ACTIVE_WORKORDERS`, `WORKORDER_COIN_REWARD_MOD`, `CRAFTING_XP_EARNED_MOD`
- **Mount:** `IS_MOUNTED`, `MAX_MOUNT_ANXIETY`, `MOUNTED_TOP_SPEED_LAND`, `MOUNTED_TURN_SPEED_LAND`, `MOUNTED_ACCELERATION_LAND`, `MAX_SADDLEBAG_VAULT_SIZE`, `MOUNT_RESILIENCE`, etc.
- **Equipment:** `EQUIPMENT_LEVEL_CAP`, `EQUIPMENT_CAP_MASK`
- **Inventory:** `MAX_INVENTORY_SIZE`, `BONUS_STABLE_SLOTS`, `MAX_SADDLEBAG_VAULT_SIZE`
- **XP modifiers:** `COMBAT_XP_EARNED_MOD`, `CRAFTING_XP_EARNED_MOD`, `ANATOMY_XP_EARNED_MOD`, `SKINNING_XP_EARNED_MOD`, `ANGLING_XP_EARNED_MOD`, etc.
- **Misc:** `FOOD_LEVEL`, `ACTIVE_TITLE`, `RACIAL_LEVEL`, `AUTOLOOT_RADIUS`, `PVP`, `IS_CORPSE_INTACT`, `CUR_COMBAT_WISDOM`, `CUR_HYDRATION`, `MAX_HYDRATION`

**Examples:**
```
# Login dump (abbreviated — real line has hundreds of attributes)
[23:32:47] LocalPlayer: ProcessSetAttributes(11921435, "[MAX_HEALTH, CUR_HEALTH, MAX_POWER, CUR_POWER, ...], [667, 667, 442, 442, ...]")

# Mount
[23:33:25] LocalPlayer: ProcessSetAttributes(11921978, "[IS_MOUNTED], [1]")

# Health/combat update
[23:33:33] LocalPlayer: ProcessSetAttributes(11921978, "[CUR_HEALTH, MAX_HEALTH, CUR_POWER, MAX_POWER, CUR_ARMOR, MAX_ARMOR, CUR_METABOLISM, MAX_METABOLISM], [667, 667, 442, 442, 766, 766, 140, 140]")

# Single modifier change
[23:32:47] LocalPlayer: ProcessSetAttributes(11921435, "[WORKORDER_COIN_REWARD_MOD], [1.36]")
```

### ProcessSetWeather — Weather change

```
[HH:MM:SS] LocalPlayer: ProcessSetWeather("WeatherName", boolFlag)
```

| Field | Type | Meaning |
|---|---|---|
| `WeatherName` | string | Weather condition name (e.g., `"Clear Sky"`, `"Cloudy 3"`) |
| `boolFlag` | bool | Possibly indicates outdoor area (always True in samples) |

**When it fires:** On login and when the weather changes (zone transitions, weather cycle updates).

Relevant for features that depend on weather conditions (e.g., some Fletching recipes require clear weather).

**Examples:**
```
[23:32:47] LocalPlayer: ProcessSetWeather("Clear Sky", True)
[16:06:32] LocalPlayer: ProcessSetWeather("Cloudy 3", True)
```

### ProcessPlayerMount — Mount/dismount

```
[HH:MM:SS] LocalPlayer: ProcessPlayerMount(entityId, isMounting)
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Player entity ID |
| `isMounting` | bool | True = mounting, False = dismounting |

**When it fires:** Player mounts or dismounts. Followed by `ProcessSetAttributes([IS_MOUNTED], [1/0])`, `ProcessSetActiveSkills`, and `ProcessSetEquippedItems` with updated appearance.

**Examples:**
```
[23:33:25] LocalPlayer: ProcessPlayerMount(11921978, True)
[23:33:31] LocalPlayer: ProcessPlayerMount(11921978, False)
```

### ProcessMountXpStatus — Mount XP eligibility

```
[HH:MM:SS] LocalPlayer: ProcessMountXpStatus(status)
```

| Field | Type | Meaning |
|---|---|---|
| `status` | enum | XP eligibility (e.g., `NotEarnedInThisArea`, `AlreadyMaxLevel`) |

**When it fires:** After mounting, indicates whether mount XP can be earned in the current area.

**NOT YET PARSED.**

### ProcessSetEquippedItems — Equipment state

```
[HH:MM:SS] LocalPlayer: ProcessSetEquippedItems(System.Int32[], System.Int32[], System.Int32[], "appearanceString", entityId)
```

| Field | Type | Meaning |
|---|---|---|
| `int[] (x3)` | arrays | Item ID arrays (serialized as C# type names in log) |
| `appearanceString` | string | Full appearance/equipment string with slot assignments |
| `entityId` | u32 | Player entity ID |

**When it fires:** On login, mount/dismount, and equipment changes. The appearance string contains slot-keyed equipment data.

**Parsed** → `EquipmentChanged`. Extracts `entity_id`, full `appearance` string, and structured `equipment` slots. The three `System.Int32[]` arrays are opaque C# types (Unity prints type name only, not contents).

**Slot keys found in appearance string:**
- `@Chest`, `@Head`, `@Legs`, `@Feet`, `@Hands` — armor slots
- `@MainHand`, `MainHandEquip=Hammer` — main weapon + type
- `@OffHandShield`, `OffHandEquip=Shield` — off-hand + type
- `@Racial` — racial equipment slot
- `Mount=@Horse1(...)` — mount appearance with sub-slots (`@Saddle`, `@Saddlebag`, `@Reins`, `@MountCosmetic`)

### ProcessSetDisabledEquipment — Disabled equipment slots

```
[HH:MM:SS] LocalPlayer: ProcessSetDisabledEquipment(System.Int32[])
```

**When it fires:** After equipment changes. Indicates which equipment slots are currently disabled.

**NOT YET PARSED.**

### ProcessAddPlayer — Player appearance on login

```
[HH:MM:SS] LocalPlayer: ProcessAddPlayer(serverId, entityId, "appearanceString", "CharacterName", "description", ...)
```

**When it fires:** On login. Contains the player's full appearance string, name, and description.

**NOT YET PARSED.**

### ProcessSetString — String attribute

```
[HH:MM:SS] LocalPlayer: ProcessSetString(key, "value")
```

**When it fires:** Sets named string values. Known keys: `HUNTING_GROUP_TITLE`.

**NOT YET PARSED.**

### ProcessCombatModeStatus — Combat state

```
[HH:MM:SS] LocalPlayer: ProcessCombatModeStatus(status, System.Int32[])
```

| Field | Type | Meaning |
|---|---|---|
| `status` | enum | `NotInCombat` or `InCombat` |

**When it fires:** When entering or leaving combat.

### ProcessAttack — Attack action

```
[HH:MM:SS] LocalPlayer: ProcessAttack(attackType)
```

**When it fires:** Player initiates an attack.

**NOT YET PARSED.**

### ProcessDeathMessage — Player death

```
[HH:MM:SS] LocalPlayer: ProcessDeathMessage("causeOfDeath", deathPenalty1, bool1, deathPenalty2, bool2)
```

| Field | Type | Meaning |
|---|---|---|
| `causeOfDeath` | string | Description of how the player died (e.g., "Poisoned", "Mauled by a wild animal", "Splashed with acid") |
| `deathPenalty1` | u32 | Death penalty value |
| `bool1` | bool | Unknown flag |
| `deathPenalty2` | u32 | Second death penalty value |
| `bool2` | bool | Unknown flag |

**When it fires:** Player dies from any cause. Followed by ProcessRepsawn when the player respawns.

### ProcessRepsawn — Player respawn

```
[HH:MM:SS] LocalPlayer: ProcessRepsawn(position, rotation, timestamp, entityId)
```

| Field | Type | Meaning |
|---|---|---|
| `position` | vec3 | Respawn world position (x, y, z) |
| `rotation` | quat | Respawn orientation quaternion |
| `timestamp` | u64 | Server timestamp |
| `entityId` | u32 | Player entity ID |

**When it fires:** Player respawns after dying. Note the misspelling "Repsawn" is in the game client itself.

### ProcessSetCelestialInfo — Moon phase / celestial state

```
[HH:MM:SS] LocalPlayer: ProcessSetCelestialInfo(moonPhase)
```

| Field | Type | Meaning |
|---|---|---|
| `moonPhase` | enum | Current moon phase (e.g., `WaningCrescentMoon`, `FullMoon`) |

**When it fires:** On login and when the moon phase changes. Relevant for lunar-dependent game mechanics.

### ProcessAttachToFurniture — Player sits/lies on furniture

```
[HH:MM:SS] LocalPlayer: ProcessAttachToFurniture(entityId, slotIndex, furnitureType, param1, param2)
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Furniture entity ID |
| `slotIndex` | u32 | Seat/slot on the furniture |
| `furnitureType` | enum | Type of furniture (e.g., `Bed`, `Chair`) |

**When it fires:** Player interacts with world furniture (beds, chairs, etc.)

### ProcessSetHuntingGroup — Party/group state

```
[HH:MM:SS] LocalPlayer: ProcessSetHuntingGroup(groupId, "groupName", hash, memberIds, memberNames)
```

| Field | Type | Meaning |
|---|---|---|
| `groupId` | u32 | Group identifier |
| `groupName` | string | Group name |
| `hash` | i32 | Group state hash |

**When it fires:** Player joins, leaves, or group state changes (member joins/leaves).

### ProcessSetPetOwner — Pet ownership assigned

```
[HH:MM:SS] LocalPlayer: ProcessSetPetOwner(petEntityId, ownerEntityId, combatMode)
```

| Field | Type | Meaning |
|---|---|---|
| `petEntityId` | u32 | Pet entity ID |
| `ownerEntityId` | u32 | Owner entity ID (0 = pet dismissed) |
| `combatMode` | enum | Pet behavior: `AttackMyTargetsFollow`, `PassiveFollow` |

**When it fires:** A pet is summoned (ownerEntityId = player), dismissed (ownerEntityId = 0), or changes owners.

### ProcessSetPetCombatMode — Pet behavior mode changed

```
[HH:MM:SS] LocalPlayer: ProcessSetPetCombatMode(petEntityId, combatMode)
```

| Field | Type | Meaning |
|---|---|---|
| `petEntityId` | u32 | Pet entity ID |
| `combatMode` | enum | Pet behavior: `AttackMyTargetsFollow`, `PassiveFollow` |

**When it fires:** Player changes their pet's combat behavior mode.
