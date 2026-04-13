# Quest Events

### ProcessUpdateQuest — Quest state change

```
[HH:MM:SS] LocalPlayer: ProcessUpdateQuest(entityId, TransitionalQuestState)
```

**When it fires:** A quest objective was completed or quest state changed. In the gift-giving context, this fires after a favor threshold is crossed (e.g., giving enough gifts unlocks a quest step).

**NOT YET PARSED.**

### ProcessLoadQuests — Quest state on login

```
[HH:MM:SS] LocalPlayer: ProcessLoadQuests(entityId, TransitionalQuestState[], System.Int32[], System.Int32[])
```

**When it fires:** On login. Full quest state including active quests, completed objectives, etc.

**NOT YET PARSED.**

### ProcessAddQuest — New quest acquired

```
[HH:MM:SS] LocalPlayer: ProcessAddQuest(entityId, TransitionalQuestState)
```

**When it fires:** Player accepts or triggers a new quest.

**NOT YET PARSED.**

### ProcessCompleteQuest — Quest completed

```
[HH:MM:SS] LocalPlayer: ProcessCompleteQuest(entityId, questId)
```

**When it fires:** Player completes a quest objective or turns in a quest.

**NOT YET PARSED.**

**Example:**
```
[16:25:49] LocalPlayer: ProcessCompleteQuest(1145895, 25216)
```

### ProcessSelectQuest — Quest tracking selection

```
[HH:MM:SS] LocalPlayer: ProcessSelectQuest(questId)
```

**When it fires:** Player selects a quest to track in the quest tracker UI.

**NOT YET PARSED.**

### ProcessCompleteDirectedGoals — Tutorial/directed goal completion

```
[HH:MM:SS] LocalPlayer: ProcessCompleteDirectedGoals(System.Int32[])
```

**When it fires:** On login. List of completed tutorial/directed goals.

**NOT YET PARSED.**
