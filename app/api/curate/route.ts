import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, source, count, minScore } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Build curate.py command
    const scriptPath = '/home/ubuntu/openclaw/skills/curate/curate.py';
    const args: string[] = [
      '--topic', `"${topic.trim()}"`,
      '--count', String(count || 12),
      '--min-score', String(minScore || 5.0),
      '--mode', 'manual',
      '--triggered-by', 'cc_tool',
      '--output', 'json',
    ];

    if (source && source !== 'mixed') {
      args.push('--source', source);
    }

    const command = `python3 ${scriptPath} ${args.join(' ')}`;

    // Execute command in background (fire-and-forget)
    // The script saves to Firestore, so we just trigger it and return immediately
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Curate script error: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`Curate script output: ${stdout}`);
    });

    // Return immediately - the frontend will poll history for results
    return NextResponse.json({
      success: true,
      message: 'Curation started. Check history for results.',
    });

  } catch (error) {
    console.error('Curate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
