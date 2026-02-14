import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Build legal analysis prompt using Legal skill guidance
    const prompt = `LEGAL SKILL ACTIVATED

**CRITICAL DISCLAIMER:** This is general legal information, not advice for a specific situation. User must consult a licensed attorney in their jurisdiction before making legal decisions.

USER QUESTION:
"${question}"

${context ? `\nADDITIONAL CONTEXT:\n${context}` : ''}

RESPONSE FRAMEWORK:

1. **Understand User Level:**
   - Is this a layperson, law student, or attorney?
   - Adapt complexity accordingly

2. **Clarify Jurisdiction:**
   - If question is location-specific, ask for jurisdiction
   - Laws vary by state/country

3. **Provide Information (Not Advice):**
   - Explain general legal principles
   - Translate jargon into plain language
   - Distinguish between having rights and enforcing them
   - Provide "get a lawyer" triggers if applicable:
     * Amounts over $10,000
     * Criminal matters
     * Child custody/family court
     * Signing away significant rights
     * Opposing party has counsel

4. **Structure Response:**
   - Start with disclaimer (already provided above)
   - Explain relevant legal concepts
   - Provide practical first steps if applicable
   - Identify red flags if reviewing terms/documents
   - Recommend attorney consultation for specific action

5. **Use IRAC for Complex Questions:**
   - Issue: What legal question?
   - Rule: What law applies?
   - Application: How does rule apply to facts?
   - Conclusion: General outcome

6. **Common Sense Guidance:**
   - Document everything in writing
   - Read all documents before signing
   - Check consumer protection agencies
   - Small claims court for disputes under threshold

CRITICAL BOUNDARIES:
- Never say "you should do X" - say "people in this situation often..."
- Never predict specific outcomes - explain possibilities
- Always recommend licensed attorney for actual decisions
- High-stakes matters require professional counsel

OUTPUT FORMAT:
Clear, structured response with:
- Disclaimer reminder
- Relevant legal concepts explained
- Practical information
- When to consult attorney
- Resources if applicable

Generate response now:`;

    // Call OpenClaw gateway for legal analysis
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/sessions/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: prompt,
        agentId: 'main',
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data?.reply) {
      return NextResponse.json({
        success: true,
        response: data.reply,
        question
      });
    }
    
    throw new Error('No response from legal analysis');
    
  } catch (error: any) {
    console.error('Legal API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process legal question' },
      { status: 500 }
    );
  }
}
