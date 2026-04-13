# Engine & Rendering Events

Low-level events from the game engine. These are entity position/animation updates and rendering system calls. Most appear at high frequency and are typically filtered out for gameplay analysis.

Some of these events only appear in **stack traces** (error logs) rather than as timestamped event lines — these are marked accordingly.

## Entity State Events

These fire as timestamped lines but do NOT have the `LocalPlayer:` prefix.

### ProcessNewPosition — Entity position update

```
[HH:MM:SS] LocalPlayer: ProcessNewPosition(position, rotation, moveState, groundState, speedState, animState, targetId, bool1, bool2, timestamp, entityId)
```

| Field | Type | Meaning |
|---|---|---|
| `position` | vec3 | World position (x, y, z) |
| `rotation` | quat | Orientation quaternion (x, y, z, w) |
| `moveState` | enum | Movement type: `Walk` |
| `groundState` | enum | Ground contact: `OnLand` |
| `speedState` | enum | Speed: `Walk`, `Run` |
| `animState` | enum | Animation state: `Standing` |
| `targetId` | i32 | Target entity ID (0 = no target) |
| `bool1` | bool | Unknown |
| `bool2` | bool | Unknown |
| `timestamp` | u64 | Server timestamp |
| `entityId` | u32 | Entity this position applies to |

**When it fires:** Fires at high frequency for all visible entities as they move. Multiple entities can fire in the same timestamp. Useful for position tracking but very noisy.

### ProcessEmote — Entity animation/emote

```
[HH:MM:SS] ProcessEmote(entityId, "", emoteType, animState, boolFlag)
```

| Field | Type | Meaning |
|---|---|---|
| `entityId` | u32 | Entity performing the emote |
| `emoteType` | enum | Animation type: `Pickup`, `Backflip`, `UseItem`, etc. |
| `animState` | enum | Animation state: `Standing`, `Unset` |
| `boolFlag` | bool | Unknown |

**When it fires:** An entity performs an animation. Includes player-initiated emotes (/bow, /wave) and game-triggered animations (picking up items, using objects).

**Note:** This event does NOT have the `LocalPlayer:` prefix.

## Stack Trace Only Events

These events appear only in C# stack traces within error logs, not as timestamped event lines. They represent internal method calls that appear when the game encounters an error during processing.

### ProcessDepuppetEntity — Entity despawn (stack trace only)

```
AreaCmdProcessor_NewGui:ProcessDepuppetEntity(Int32)
```

Internal engine method for removing ("depuppeting") an entity from the scene. Appears in stack traces when entity removal encounters an error.

### ProcessEntitySpeech — Entity speech (stack trace only)

```
ServerCmdProcessor:ProcessEntitySpeech(Int32, String, ChatFlair, Int32, String, Boolean, Int32[], List`1)
```

Internal server command processor for entity speech/dialogue. Appears in stack traces when speech processing encounters an error.

### ProcessMouseEvent — Input system mouse event (stack trace only)

```
UnityEngine.EventSystems.StandaloneInputModule:ProcessMouseEvent(Int32)
```

Unity's input system processing a mouse event. Appears in stack traces when a UI click triggers an error in a handler.

### ProcessMousePress — Input system mouse press (stack trace only)

```
UnityEngine.EventSystems.StandaloneInputModule:ProcessMousePress(MouseButtonEventData)
```

Unity's input system processing a mouse button press. Appears in stack traces alongside ProcessMouseEvent.

### ProcessNewAnimation — Entity animation change (stack trace only)

```
AreaCmdProcessor_NewGui.ProcessNewAnimation(AnimationMode anim, AnimationStyle style, System.Int32 entityId)
```

Internal method for changing an entity's animation state. Appears in stack traces when animation transitions encounter errors.

### ProcessWalkTo — Entity pathfinding (stack trace only)

```
AreaCmdProcessor_NewGui:ProcessWalkTo(Int32, String, Vector3, Single, Single, Single, Boolean, Boolean, Quaternion)
```

Internal method for commanding an entity to walk to a position. Appears in stack traces when pathfinding or movement encounters errors.
