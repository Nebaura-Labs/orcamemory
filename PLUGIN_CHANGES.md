# Orca Memory Plugin Token Tracking Changes

## Overview
Updated the Orca Memory plugin to extract token usage and model information from OpenClaw assistant messages, enabling accurate billing and usage analytics.

## File Modified
- `apps/dashboard/public/plugins/orca-memory/hooks/capture.ts`

---

## Changes in Detail

### 1. Added Helper Function: `findLastAssistantUsage()`
**Location:** Lines 18-28

**Purpose:** Extracts token usage data from the last assistant message in the conversation.

**Code Added:**
```typescript
function findLastAssistantUsage(messages: unknown[]): Record<string, unknown> | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") continue;
    const msgObj = msg as Record<string, unknown>;
    if (msgObj.role === "assistant" && msgObj.usage && typeof msgObj.usage === "object") {
      return msgObj.usage as Record<string, unknown>;
    }
  }
  return null;
}
```

**Why:** OpenClaw stores token usage data in assistant message `.usage` property, not at the event level.

---

### 2. Added Helper Function: `findModelFromMessages()`
**Location:** Lines 30-40

**Purpose:** Extracts the model name from assistant messages.

**Code Added:**
```typescript
function findModelFromMessages(messages: unknown[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") continue;
    const msgObj = msg as Record<string, unknown>;
    if (msgObj.role === "assistant" && typeof msgObj.model === "string") {
      return msgObj.model;
    }
  }
  return undefined;
}
```

**Why:** Needed to capture which AI model was used (e.g., "claude-opus-4.5") for analytics.

---

### 3. Extract Model and Usage from Messages
**Location:** Lines 100-115 (in buildCaptureHandler)

**Code Added:**
```typescript
// Extract model and usage from assistant messages (OpenClaw stores usage data there)
const assistantUsage = findLastAssistantUsage(event.messages);
const modelFromMessages = findModelFromMessages(event.messages);

log.info(`[orca-memory] assistantUsage: ${JSON.stringify(assistantUsage)}`);
log.info(`[orca-memory] modelFromMessages: ${modelFromMessages}`);

const model = 
  (typeof event.model === "string" ? event.model : undefined) ?? 
  modelFromMessages;

// Try event-level usage first (for future OpenClaw versions), fall back to assistant message usage
const usage =
  (event.usage as Record<string, unknown> | undefined) ??
  (event.metrics as Record<string, unknown> | undefined) ??
  (event.tokenUsage as Record<string, unknown> | undefined) ??
  assistantUsage;
```

**Why:** 
- OpenClaw 2026.1.31 doesn't expose usage at event level
- Must extract from assistant messages instead
- Provides fallback for future OpenClaw versions that might expose event-level usage
- Debug logging helps troubleshoot token tracking

---

### 4. Enhanced Token Field Support
**Location:** Lines 117-128

**Code Changed:**
```typescript
// BEFORE (old code):
const tokensPrompt =
  readNumber(usage?.input) ??
  readNumber(usage?.prompt) ??
  readNumber(usage?.inputTokens) ??
  readNumber(usage?.promptTokens);

// AFTER (new code):
const tokensPrompt =
  readNumber(usage?.input) ??
  readNumber(usage?.prompt) ??
  readNumber(usage?.inputTokens) ??
  readNumber(usage?.promptTokens) ??
  readNumber(usage?.input_tokens) ??
  readNumber(usage?.prompt_tokens);
```

**Similar changes for `tokensCompletion`** - added `output_tokens` and `completion_tokens` variants.

**Why:** Different AI providers use different naming conventions (camelCase vs snake_case).

---

### 5. Fixed Total Token Calculation
**Location:** Lines 129-132

**Code Changed:**
```typescript
// BEFORE (old code):
const tokensTotal =
  readNumber(usage?.total) ??
  readNumber(usage?.totalTokens) ??
  readNumber(usage?.tokensTotal) ??
  readNumber(usage?.total_tokens) ??
  (typeof tokensPrompt === "number" || typeof tokensCompletion === "number"
    ? (tokensPrompt ?? 0) + (tokensCompletion ?? 0)
    : undefined);

// AFTER (new code):
// Calculate total as input + output only (excludes cache reads which are typically free/discounted)
const tokensTotal =
  typeof tokensPrompt === "number" || typeof tokensCompletion === "number"
    ? (tokensPrompt ?? 0) + (tokensCompletion ?? 0)
    : undefined;
```

**Why:** 
- The old code used `usage?.total` which included cache-read tokens (67,687 in test)
- Cache reads are typically free or heavily discounted
- Total should only be billable tokens: **input + output** (7,187 + 59 = 7,246)
- This gives accurate usage metrics for billing purposes

---

### 6. Improved Logging
**Location:** Lines 134-135

**Code Changed:**
```typescript
// BEFORE:
log.debug(`capture: ${captured.length} texts (${content.length} chars)`);

// AFTER:
log.info(`[orca-memory] capture: ${captured.length} texts (${content.length} chars)`);
log.info(`[orca-memory] model=${model}, tokens: prompt=${tokensPrompt}, completion=${tokensCompletion}, total=${tokensTotal}`);
```

**Why:** 
- Changed from `debug` to `info` level for better visibility
- Added `[orca-memory]` prefix for easier log filtering
- Added token usage details to logs for monitoring

---

### 7. Removed Duplicate Session Event
**Location:** Lines 136-162

**Code Removed:**
```typescript
// REMOVED THIS SECTION:
if (sessionId) {
  await client.recordSessionEvent({
    sessionId,
    kind: "conversation",
    model,
    content,
    tokensPrompt,
    tokensCompletion,
    tokensTotal,
  });
}
```

**Why:** 
- `client.store()` already creates a session event internally when session logging is enabled
- Calling `recordSessionEvent()` again created duplicates in the database
- Now only saves once through `client.store()`

---

## Testing Results

**Before Changes:**
- Model: `undefined`
- Usage: `undefined`
- Token tracking: Not working

**After Changes:**
- Model: `claude-opus-4.5` ✅
- Prompt tokens: `7,187` ✅
- Completion tokens: `59` ✅
- Total tokens: `7,246` (input + output only) ✅
- Cache reads excluded: `67,687` (not billed) ✅

---

## Deployment

To deploy these changes to an OpenClaw installation:

1. Copy the updated file to the installed plugin location:
   ```bash
   cp apps/dashboard/public/plugins/orca-memory/hooks/capture.ts \
      ~/.clawdbot/extensions/orca-memory/hooks/capture.ts
   ```

2. Restart OpenClaw gateway:
   ```bash
   systemctl --user restart clawdbot-gateway
   ```

3. Monitor logs to verify token tracking:
   ```bash
   tail -f /tmp/clawdbot/clawdbot-*.log | grep "orca-memory"
   ```

---

## Notes

- **Compatible with:** OpenClaw 2026.1.31+
- **Works with:** Any AI provider that exposes token usage in assistant messages
- **Future-proof:** Falls back to event-level usage if OpenClaw adds it later
- **No source code changes needed:** Plugin works with vanilla OpenClaw installations
