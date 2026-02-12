# Intelligence Tool Architecture Pattern

**Author:** Jimmy  
**Date:** 2026-02-13  
**Reference Implementation:** White Papers tool

## The Problem

Intelligence tools (white papers, one-pager, curate, L3D) were originally built as:
- Standalone Python scripts with keyword matching
- No real understanding or context
- Mechanical outputs ("Austrian Economics" → searches "Austria the country")
- No worldview application

**Result:** Tools felt mechanical, not intelligent.

## The Solution: Sub-Agent Spawning

Use `sessions_spawn` to spawn intelligent agent clones that:
- Understand context ("Austrian Economics" = Mises/Hayek school of thought)
- Apply Norman's worldview correctly
- Synthesize and validate results
- Return truly intelligent research

## Architecture

```
Command Center UI
  ↓
Next.js API Route (/api/white-papers)
  ↓
sessions_spawn via OpenClaw gateway
  ↓
Spawned Sub-Agent (Intelligent Jimmy Clone)
  - Understands context
  - Uses tools (web_search, etc.)
  - Applies worldview
  - Synthesizes results
  ↓
Returns JSON results
  ↓
API Route polls for completion
  ↓
Results displayed in UI + saved to Firestore
  ↓
History shown when idle
```

## Implementation Steps

### 1. API Route (`/app/api/[tool]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';  // Use EC2 public IP (Vercel can't access localhost)
const OPENCLAW_TOKEN = 'your-token';

export async function POST(request: NextRequest) {
  const { topic, save = true } = await request.json();

  // Build intelligent prompt
  const prompt = `[Task description with context and worldview guidance]
  
  CRITICAL CONTEXT UNDERSTANDING:
  - "Austrian Economics" = Mises/Hayek school of thought (NOT Austria the country)
  - "Iran-Contra" = Reagan scandal (NOT Iranian economics)
  - Apply intelligence and context, not keyword matching
  
  [Specific task instructions]
  
  OUTPUT FORMAT (JSON):
  {
    "topic": "${topic}",
    "timestamp": "ISO-8601",
    [tool-specific fields]
  }
  
  IMPORTANT: Just output the JSON. Do NOT try to save to Firestore yourself.
  The API will handle saving after you return results.
  `;

  // Spawn sub-agent
  const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'sessions_spawn',
      args: {
        task: prompt,
        label: `[tool]-${topic.slice(0, 30)}`,
        cleanup: 'keep',
        runTimeoutSeconds: 120
      }
    })
  });

  const data = await response.json();
  
  // Poll for completion
  // Note: /tools/invoke wraps result in data.result.details
  const spawnResult = data?.result?.details || data?.result;
  
  if (spawnResult?.status === 'accepted') {
    const childSessionKey = spawnResult.childSessionKey;
    
    // Poll session history for results (example polling logic)
    const maxWaitTime = 120000; // 2 minutes
    const pollInterval = 3000; // 3 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      // Fetch session history
      const historyResponse = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'sessions_history',
          args: {
            sessionKey: childSessionKey,
            limit: 5,
            includeTools: false
          }
        })
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        // Handle /tools/invoke wrapper structure
        const historyResult = historyData?.result?.details || historyData?.result || {};
        const messages = historyResult?.messages || [];
        
        // Find last assistant message
        const lastAssistant = messages.reverse().find((m: any) => m.role === 'assistant');
        
        if (lastAssistant && lastAssistant.content) {
          const content = Array.isArray(lastAssistant.content) 
            ? lastAssistant.content.map((c: any) => c.text || c).join('\n')
            : lastAssistant.content;
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*"[field]"[\s\S]*\}/);
          
          if (jsonMatch) {
            try {
              const result = JSON.parse(jsonMatch[0]);
              
              // Save to Firestore if requested (API handles this, not sub-agent)
              if (save) {
                try {
                  const db = getAdminDb();
                  await db.collection('[tool]_history').add({
                    ...result,
                    timestamp: new Date().toISOString()
                  });
                } catch (saveError) {
                  console.error('Failed to save to Firestore:', saveError);
                  // Continue anyway - return results even if save fails
                }
              }
              
              return NextResponse.json(result);
            } catch (e) {
              // Continue polling
            }
          }
        }
      }
    }
    
    // Timeout
    return NextResponse.json(
      { error: 'Research timed out' },
      { status: 504 }
    );
  }
  
  return NextResponse.json(
    { error: 'Unexpected response' },
    { status: 500 }
  );
}
```

### 2. UI Component (`/app/tools/[tool]/page.tsx`)

Key patterns:
- **Show history by default when idle**: `{!result && history.length > 0 && (...)`
- **Single "Research" button** (no separate "Show History" button)
- **Load history on mount**: `useEffect(() => { loadHistory(historyLimit); }, [historyLimit]);`
- **Auto-reload history after new request**: `loadHistory(historyLimit)` after successful research
- **Searchable history**: Filter by topic with client-side search
- **Pagination**: Start with 10, load +25 more with "Show More" button (up to 50)
- **Hide "Show More" when searching**: Only show pagination controls when viewing full list

```typescript
export default function ToolPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);

  useEffect(() => {
    loadHistory(historyLimit);
  }, [historyLimit]);

  const loadHistory = async (limitCount: number = 10) => {
    const q = query(
      collection(db, "[tool]_history"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHistory(items);
  };
  
  // Filter history based on search
  const filteredHistory = historySearch.trim()
    ? history.filter(item => 
        item.topic?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const response = await fetch("/api/[tool]", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, save: true })
    });

    const data = await response.json();
    
    if (response.ok) {
      setResult(data);
      loadHistory(); // Reload history
    }
    
    setLoading(false);
  };

  return (
    <>
      <TopNav />
      <ToolNav currentToolId="[tool]" />
      
      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" disabled={loading}>
          {loading ? "Researching..." : "Research"}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div>[Display results]</div>
      )}

      {/* History - Show by default when no result */}
      {!result && history.length > 0 && (
        <div>
          <h3>History</h3>
          
          {/* Search Input */}
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search history..."
          />
          
          {/* History Items */}
          {filteredHistory.length > 0 ? (
            <>
              {filteredHistory.map((item) => (
                <div key={item.id} onClick={() => setResult(item)}>
                  [Display history item]
                </div>
              ))}
              
              {/* Show More Button (shows +25 when clicked) */}
              {!historySearch && historyLimit < 50 && (
                <button onClick={() => setHistoryLimit(historyLimit + 25)}>
                  Show More
                </button>
              )}
            </>
          ) : (
            <div>No results found</div>
          )}
        </div>
      )}
      
      <BottomNav />
    </>
  );
}
```

### 3. Firestore Collection

Collection name: `[tool]_history`

Schema:
```javascript
{
  topic: string,
  timestamp: ISO-8601 string,
  [tool-specific fields],
  total: number (optional)
}
```

### 4. Firestore Security Rules

Add to `firestore.rules`:
```
match /[tool]_history/{document} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

## Quality vs Speed Trade-off

**Intelligence Tools** (use this pattern):
- White Papers, One-Pager, Curate, L3D, Deep Search, Dark Search
- Quality > Speed
- 30-120 second response time is acceptable
- Real understanding and synthesis required

**Productivity Tools** (do NOT use this pattern):
- Calendar, Emails, People, Meals, Shopping List
- Speed > Intelligence
- Direct operations, minimal AI involvement
- Sub-second to few-second response times

## Prompt Engineering Best Practices

1. **Context Understanding Block**
   - Explain common misinterpretations
   - Provide examples of correct understanding
   - "Austrian Economics" = school of thought, NOT geography

2. **Worldview Guidance**
   - **POLITICS: Think like Dr. Ron Paul** - This is the primary reference for Norman's political beliefs
   - **Nuance beyond politics**: Michael Malice, Milton Friedman, Jordan Peterson, Ayn Rand, Rothbard, Hayek, Mises, Aristotle
   - Austrian economics, anarcho-capitalist lens
   - First-principles thinking
   - Skepticism of centralized power and government narratives

3. **Output Format**
   - Always request JSON
   - Provide exact schema
   - Include examples if needed

4. **Firestore Saving**
   - Do NOT ask sub-agent to save to Firestore
   - Sub-agents trying to save burn tokens on Firebase setup/credentials
   - API route handles saving after receiving JSON
   - Keeps sub-agent focused on research only

5. **Quality Focus**
   - "Better to return 8 excellent results than 10 mediocre ones"
   - "Validate relevance before including"
   - "Think step by step"

## Testing Checklist

- [ ] Sub-agent spawns successfully
- [ ] Results are contextually correct (not keyword matching)
- [ ] Worldview is applied correctly
- [ ] JSON is properly extracted from response
- [ ] Results save to Firestore (when save=true)
- [ ] History loads on page mount
- [ ] History displays when no result shown
- [ ] Clicking history item loads that result
- [ ] UI handles errors gracefully
- [ ] Timeout handling works (120s default)

## Next Tools to Migrate

Priority order:
1. ✅ White Papers (reference implementation)
2. One-Pager
3. Curate (upgrade existing)
4. L3D (upgrade existing)
5. Any future intelligence tools

## Common Pitfalls

1. **Don't use keyword matching** - Let AI understand context
2. **Don't timeout too quickly** - Intelligence takes time (use 180s)
3. **Don't skip worldview guidance** - Norman's perspective is critical
4. **Don't forget history UI** - Show by default when idle
5. **Don't use standalone scripts** - Use sub-agent spawning
6. **Don't ask sub-agent to save to Firestore** - It will burn tokens on setup; let API route handle saving
7. **Don't over-research** - Tell sub-agent to output after 2-4 searches, not exhaustive investigation

## Performance Notes

- **Spawning overhead:** ~1-2 seconds
- **Research time:** 30-90 seconds typically
- **Polling overhead:** ~3-6 seconds total (3s intervals)
- **Total time:** Usually 45-120 seconds
- **This is acceptable for intelligence tools**

## Debugging

Check sub-agent transcript:
```bash
# Find session ID from response
openclaw sessions list --kinds subagent --limit 5

# Read transcript
cat /home/ubuntu/.openclaw/agents/main/sessions/[sessionId].jsonl | jq
```

## Success Criteria

A properly implemented intelligence tool:
1. Understands context (not just keywords)
2. Applies Norman's worldview correctly
3. Returns high-quality, relevant results
4. Saves to Firestore history
5. Shows history by default when idle
6. Feels intelligent, not mechanical

---

**This is the standard for all intelligence tools going forward.**
