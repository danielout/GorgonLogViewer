# Startup & System Lines

Lines that appear without `[HH:MM:SS]` timestamps. These are engine initialization, system info, stack traces, and other non-event output. They appear at the top of the log (startup) and interspersed throughout (errors, warnings).

## Engine Initialization

Lines at the very start of the log, before any timestamped events.

### Input System

```
Input System module state changed to: Initialized.
```

Unity input system initialization.

### Physics Module

```
[Physics::Module] Initialized fallback backend.
[Physics::Module] Id: 0xdecafbad
[Physics::Module] Selected backend.
[Physics::Module] Name: PhysX
[Physics::Module] SDK Version: 4.1.2
[Physics::Module] Threading Mode: Multi-Threaded
```

Physics engine initialization. Includes the PhysX SDK version.

### Engine Version

```
Initialize engine version: 6000.3.11f1 (0707b6d1e918)
```

Unity engine version. The number before the hash is the Unity version, the hash is the build.

### Graphics Device

```
GfxDevice: creating device client; kGfxThreadingModeClientWorkerJobs
Direct3D:
    Version:  Direct3D 11.0 [level 11.1]
    Renderer: NVIDIA GeForce RTX 3090 (ID=0x2204)
    Vendor:   NVIDIA
    VRAM:     24326 MB
    Driver:   32.0.15.9174
```

GPU info: API version, card name, VRAM, and driver version. Useful for diagnosing rendering issues.

### D3D12 Device Filter

```
[D3D12 Device Filter] Vendor Name: NVIDIA
[D3D12 Device Filter] Device Name: NVIDIA GeForce RTX 3090
[D3D12 Device Filter] Driver Version: 32.0.15.9174
[D3D12 Device Filter] Feature Level: 12.1
[D3D12 Device Filter] Graphics Memory: 24326 MB
[D3D12 Device Filter] Processor Count: 24
[D3D12 Device Filter] Device Type: Discrete
```

Extended GPU/system info from the DirectX 12 device filter.

### System Info

```
OS: Windows 11  (10.0.26200) : Microsoft Windows NT 10.0.26200.0
Graphics Device: NVIDIA GeForce RTX 3090
Mem: 63062 system, 24326 gfx
```

OS version, GPU name, and memory (system RAM in MB, GPU VRAM in MB). Timestamped — appears early in the log.

### Settings

```
Loading preferences from C:/Users/.../AppData/LocalLow/Elder Game/Project Gorgon/GorgonSettings.txt
Applying special settings:
Setting quality level to 6: 4: Great
```

Game settings loaded from the user's preferences file.

## Network & Authentication

### Steam Authentication

```
Steam auth succeeded. We are using ticket #N
************** Logged into Steam as username
Steam Build ID = N
Game owned? True
```

Steam integration. Shows the Steam username and build ID.

### Server List

```
Servers: [ { "AllowGuests" : true, "Port" : 9002, "Description" : "...", "Url" : "s0.projectgorgon.com", "ID" : "s0", "Name" : "Arisetsu" }, ... ]
Entry #0: { ... }
Entry #1: { ... }
```

The server list retrieved from the client config. Each entry contains server name, URL, port, and description.

### Config Downloads

```
Parsed http://client.projectgorgon.com/fileversion.txt's contents of "466". File version is now 466
Downloading config file http://client.projectgorgon.com/clientconfig.json?ts=N
Loading news file http://client.projectgorgon.com/news.txt?ts=N
```

Client configuration and news file downloads during startup.

### SSL Errors

```
Curl error 60: Cert verify failed. Certificate is not correctly signed by a trusted CA. UnityTls error code: 7
```

SSL certificate verification failures. These are common and usually non-fatal — the game continues to function.

## Zone Loading

### Loading Level

```
LOADING LEVEL ChooseCharacter
LOADING LEVEL AreaSerbule
```

Zone transition initiated. Followed by asset loading lines and then `!!! Initializing area!` (timestamped).

### Map Textures

```
>> Map_AreaSerbule (UnityEngine.Texture2D) UnityEngine.Texture2D
```

Map texture loaded for a zone.

### Factory Init

```
Factories are initialized! Version: 0.5.15
EVENT(Ok): factoriesInitialized
AppearanceFactory has disabled unloading
```

Game data factories initialized. The version number is the game's data version.

## Asset Loading

### Unload Cycles

```
Unloading 6 Unused Serialized files (Serialized files now loaded: 0)
UnloadTime: 0.345700 ms
Unloading 100 unused Assets to reduce memory usage. Loaded Objects now: 104887.
Total: 50.905700 ms (FindLiveObjects: 4.179600 ms CreateObjectMapping: 3.016100 ms MarkObjects: 43.490800 ms  DeleteObjects: 0.218800 ms)
```

Unity asset garbage collection. Shows timing info for memory cleanup operations.

### Shader Warnings

```
Shader 'NeatWolf/NW_Particle Rim AddSmooth 2S': fallback shader 'Particles/Additive (Soft)' not found
```

Missing shader fallback warnings. Non-fatal rendering issue.

## Stack Traces

Stack traces appear as multi-line blocks after errors. They use C# format:

```
  at ClassName.MethodName (ParameterTypes) [0x00000] in <00000000000000000000000000000000>:0
```

Common stack trace sources:
- `AreaCmdProcessor_NewGui` — area command processing errors
- `ServerCmdProcessor` — server command processing errors
- `UnityEngine.EventSystems.StandaloneInputModule` — UI input errors
- `GameAssembly` — compiled game code (addresses only, no symbols)
- `UnityPlayer` — Unity engine code

Stack traces also include raw memory addresses:

```
0x00007ff85900f3d2 (UnityPlayer) UnityMain
0x00007ff856a301b2 (GameAssembly)
```

These appear after native crashes or Unity internal errors and are not human-readable without debug symbols.

## Miscellaneous

### Music Control

```
<color=pink>Disable regular music: N</color>
<color=pink>Enable regular music: N</color>
```

Music system toggling. Uses Unity rich text color tags — the numbers are internal track/state identifiers.

### Animation Warnings

```
Animator.GotoState: State could not be found
Animator was null but no longer is. Our appearance is: EntityName
"Stop" can only be called on an active agent that has been placed on a NavMesh.
```

Non-fatal animation and pathfinding warnings.

### Weapon State

```
Bow was active, turning off now, due to Attack_Druid_Blast
```

Weapon visibility toggling when switching to abilities that don't use the current weapon model.

### Entity Movement

```
Aborting previous walk-to for entity_N Distance left was N
Aborting turn-to entity_N
```

Pathfinding cancellation for entities that started moving but were interrupted.

### Audio Warnings

```
AudioSource not fully 3D! Fixing
```

Audio positioning correction.
