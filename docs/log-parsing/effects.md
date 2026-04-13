# Effects & Buffs Events

### ProcessAddEffects — Effects/buffs applied

```
[HH:MM:SS] LocalPlayer: ProcessAddEffects(entityId, sourceEntityId, "[effectId1, effectId2, ...]", boolFlag)
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Target entity (player) |
| `sourceEntityId` | u32 | Source of effects (0 = system/login, self = self-applied buff) |
| `effectIds` | u32[] | List of numeric effect IDs |
| `boolFlag` | bool | False on login batch, True during gameplay |

**When it fires:**
- **Login** — large batch of all active effects with `sourceEntityId=0`, `boolFlag=False`
- **During play** — smaller batches when buffs are applied, with `sourceEntityId=self`, `boolFlag=True`

**Note:** Effect IDs are numeric — `ProcessUpdateEffectName` provides display names.

**Examples:**
```
# Login batch (many effect IDs, source=0)
[23:32:46] LocalPlayer: ProcessAddEffects(11921435, 0, "[302, 303, 13330, 26297, 26142, 26304, 44086019, ...]", False)

# In-play buff application (source=self)
[23:32:47] LocalPlayer: ProcessAddEffects(11921435, 11921435, "[13304, ]", True)
[23:32:47] LocalPlayer: ProcessAddEffects(11921435, 11921435, "[9024, ]", True)
```

### ProcessRemoveEffects — Effects/buffs removed

```
[HH:MM:SS] LocalPlayer: ProcessRemoveEffects(entityId, System.Int32[])
```

**When it fires:** When buffs expire or are dispelled. Fires on dismount and other state changes.

**Note:** The `System.Int32[]` is C#'s opaque ToString() output, so individual effect IDs cannot be extracted from this event.

### ProcessUpdateEffectName — Effect display name

```
[HH:MM:SS] LocalPlayer: ProcessUpdateEffectName(entityId, effectInstanceId, "Effect Name, Level N")
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Player entity ID |
| `effectInstanceId` | u32 | Instance ID of the effect |
| `displayName` | string | Human-readable name with level (e.g., `"Performance Appreciation, Level 0"`) |

**When it fires:** After an effect is applied, providing its display name.

