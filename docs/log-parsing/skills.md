# Skills & Abilities Events

### ProcessLoadSkills — Full skill snapshot

```
[HH:MM:SS] LocalPlayer: ProcessLoadSkills({type=SkillName,raw=R,bonus=B,xp=X,tnl=T,max=M}, ...)
```

A single line containing every skill the player has, each as a comma-separated struct:

| Field | Type | Meaning |
|---|---|---|
| `type` | string | Internal skill name (e.g., `Hammer`, `Mentalism`, `Anatomy_Cats`) |
| `raw` | u32 | Base skill level (without bonus) |
| `bonus` | u32 | Bonus levels from gear/buffs |
| `xp` | u32 | Current XP within the level |
| `tnl` | i32 | XP required to reach next level (-1 = cannot level further) |
| `max` | u32 | Maximum achievable level for this skill |

**When it fires:**
- Login — appears once alongside the ProcessAddItem inventory load
- Zone changes / reloads — fires again with a fresh snapshot

**Key behavior:** Every skill the player has ever touched is included, even at level 0. Meta-skills like `Anatomy` and `Phrenology` appear with `raw=0` and a `bonus` equal to the highest sub-skill (they are virtual roll-up skills, not directly trainable). Skills at their cap have `tnl=-1` (e.g., `Compassion` at 50/50).

**Example (abbreviated):**
```
[16:00:53] LocalPlayer: ProcessLoadSkills(
  {type=Hammer,raw=70,bonus=5,xp=0,tnl=1153715,max=70},
  {type=Mentalism,raw=76,bonus=0,xp=2353127,tnl=2502977,max=80},
  {type=Gourmand,raw=49,bonus=0,xp=835,tnl=2500,max=100},
  {type=Surveying,raw=60,bonus=3,xp=0,tnl=4000,max=60},
  ...
)
```

**Effective level** = `raw + bonus`. For Hammer above: effective level 75 (70 + 5).

### ProcessSetActiveSkills — Active skill bar

```
[HH:MM:SS] LocalPlayer: ProcessSetActiveSkills(Skill1, Skill2)
```

| Field | Type | Meaning |
|---|---|---|
| `Skill1` | string | Primary active skill (e.g., `Hammer`, `Riding`) |
| `Skill2` | string | Secondary active skill (e.g., `Mentalism`) |

**When it fires:** On login, mount/dismount (swaps to Riding), and manual skill bar changes.

**Examples:**
```
[23:33:22] LocalPlayer: ProcessSetActiveSkills(Riding, Mentalism)
[23:33:31] LocalPlayer: ProcessSetActiveSkills(Hammer, Mentalism)
```

### ProcessAddAbility — New ability learned

```
[HH:MM:SS] LocalPlayer: ProcessAddAbility(abilityId)
```

| Field | Type | Meaning |
|---|---|---|
| `abilityId` | u32 | Numeric ability identifier (maps to CDN `abilities.json`) |

**When it fires:** Player learns a new ability, typically from NPC training or a skill reward.

### ProcessLoadAbilities — Ability loadout on login

```
[HH:MM:SS] LocalPlayer: ProcessLoadAbilities(System.Int32[], Skill1, Skill2, AbilityBarContents[])
```

**When it fires:** On login. Contains ability IDs, active skill pair, and ability bar layout.

**Parsed** → `AbilitiesLoaded`. Extracts `skill1` and `skill2` (the active skill pair). The `System.Int32[]` and `AbilityBarContents[]` arguments are opaque C# types — Unity prints only the type name, not array contents.

### ProcessLoadRecipes — Recipe knowledge on login

```
[HH:MM:SS] LocalPlayer: ProcessLoadRecipes(System.Int32[], System.Int32[])
```

**When it fires:** On login. Contains known recipe IDs and completion counts.

**Parsed** → `RecipesLoaded`. Signal event (timestamp only). Both `System.Int32[]` arguments are opaque C# types — Unity prints only the type name, not array contents. Individual recipe updates are tracked via `ProcessUpdateRecipe`.

### ProcessUpdateRecipe — Recipe learned/completed

```
[HH:MM:SS] LocalPlayer: ProcessUpdateRecipe(recipeId, completionCount)
```

| Field | Type | Meaning |
|---|---|---|
| `recipeId` | u32 | Recipe ID (maps to CDN recipe data) |
| `completionCount` | u32 | Total times this recipe has been completed |

**When it fires:** After completing a recipe during crafting.

**Example:**
```
[16:10:13] LocalPlayer: ProcessUpdateRecipe(21052, 151)
```

### ProcessSetStarredRecipes — Favorited recipes

```
[HH:MM:SS] LocalPlayer: ProcessSetStarredRecipes(System.Collections.Generic.HashSet`1[System.Int32])
```

**When it fires:** On login. Contains the set of recipe IDs the player has starred/favorited.

**NOT YET PARSED.**

### ProcessSetRecipeReuseTimers — Recipe cooldowns

```
[HH:MM:SS] LocalPlayer: ProcessSetRecipeReuseTimers(entityId, System.Int32[], System.Single[])
```

**When it fires:** During play when recipe cooldowns are active. Contains recipe IDs and remaining cooldown times.

**NOT YET PARSED.**

### ProcessShowRecipes — Recipe UI opened

```
[HH:MM:SS] LocalPlayer: ProcessShowRecipes(SkillName)
```

**When it fires:** Player opens the crafting recipe list for a specific skill (e.g., `Teleportation`).

**NOT YET PARSED.**

### ProcessUpdateSkill — Skill XP/level update

```
[HH:MM:SS] LocalPlayer: ProcessUpdateSkill({type=SkillName,raw=R,bonus=B,xp=X,tnl=T,max=M}, isLevelUp, xpGained, bonusDelta, unknown)
```

| Field | Type | Meaning |
|---|---|---|
| `type` | string | Internal skill name (same struct format as ProcessLoadSkills) |
| `raw` | u32 | Current base skill level |
| `bonus` | u32 | Bonus levels from gear/buffs |
| `xp` | u32 | Current XP within the level after this update |
| `tnl` | i32 | XP to next level (-1 = at cap) |
| `max` | u32 | Maximum achievable level |
| `isLevelUp` | bool | True if this update caused a level-up |
| `xpGained` | u32 | Amount of XP gained in this update |

**When it fires:**
- Gaining XP from any source (combat, crafting, harvesting, etc.)
- Consuming XP items (skill books, etc.)

**Key behavior:** The skill struct is the same format as ProcessLoadSkills entries. The `xpGained` field shows how much XP was earned in this specific event, useful for tracking XP rates.

### ProcessTrainingScreen — NPC training screen opened

```
[HH:MM:SS] LocalPlayer: ProcessTrainingScreen(npcId, "dialogue", TrainingInfo[], System.Int32[], System.String[], cost, boolFlag)
```

| Field | Type | Meaning |
|---|---|---|
| `npcId` | u32 | NPC entity ID |
| `dialogue` | string | NPC's training dialogue text |
| `cost` | i32 | Training cost modifier (negative values observed) |

**When it fires:** Player opens a training/teaching screen with an NPC that can teach skills.

### ProcessTrainingScreenRemoveId — Training option consumed

```
[HH:MM:SS] LocalPlayer: ProcessTrainingScreenRemoveId(trainingId, slotIndex)
```

| Field | Type | Meaning |
|---|---|---|
| `trainingId` | u32 | Training option identifier |
| `slotIndex` | u32 | Slot index of the training option removed |

**When it fires:** After the player learns a skill or recipe from an NPC trainer, the consumed option is removed from the training screen.

### ProcessSetAbilityTimers — Ability cooldown timers set

```
[HH:MM:SS] LocalPlayer: ProcessSetAbilityTimers(entityId, System.Int32[], System.Single[], isLogin)
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Player entity ID |
| `isLogin` | bool | True on login/zone load, False during gameplay |

**When it fires:** Ability cooldowns are set or reset, typically on login or zone transitions.

### ProcessDeltaAbilityTimer — Ability cooldown adjustment

```
[HH:MM:SS] LocalPlayer: ProcessDeltaAbilityTimer(entityId, abilityId, delta)
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Player entity ID |
| `abilityId` | u32 | Ability identifier |
| `delta` | i32 | Cooldown adjustment in seconds (negative = reduced) |

**When it fires:** An ability's cooldown timer is modified, typically from gear effects or buffs that reduce cooldowns.

### ProcessDoDelayLoop — Timed action in progress

```
[HH:MM:SS] LocalPlayer: ProcessDoDelayLoop(duration, actionType, "description", actionId, abortCondition)
```

| Field | Type | Meaning |
|---|---|---|
| `duration` | u32 | Duration of the action in seconds |
| `actionType` | enum | Action type (e.g., `UseItem`, `UseTeleportationCircle`) |
| `description` | string | Human-readable description (e.g., "Distilling Phlogiston", "Surveying") |
| `actionId` | u32 | Action identifier |
| `abortCondition` | enum | When to abort (e.g., `AbortIfAttacked`) |

**When it fires:** Player begins a timed action such as crafting, surveying, using teleportation circles, or consuming items with a cast time. Fires repeatedly during the action.
