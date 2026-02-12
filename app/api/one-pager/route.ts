import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { topic, save = true } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic or question is required' },
        { status: 400 }
      );
    }

    // Call one-pager skill directly
    const skillPath = '/home/ubuntu/openclaw/skills/one-pager/one_pager.py';
    const command = `python3 ${skillPath} "${topic.replace(/"/g, '\\"')}" ${save ? '--save' : ''} --json`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,  // 60 second timeout
      maxBuffer: 5 * 1024 * 1024  // 5MB buffer
    });

    // Parse JSON output from skill
    const result = JSON.parse(stdout);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('One-pager error:', error);
    
    // Handle timeout
    if (error.killed || error.signal === 'SIGTERM') {
      return NextResponse.json(
        { error: 'Request timed out - try a simpler topic' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate one-pager' },
      { status: 500 }
    );
  }
}
