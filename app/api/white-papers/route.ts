import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { topic, save = true } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Call white-papers skill directly
    const skillPath = '/home/ubuntu/openclaw/skills/white-papers/white_papers.py';
    const command = `python3 ${skillPath} "${topic.replace(/"/g, '\\"')}" --count 10 ${save ? '--save' : ''} --json`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,  // 60 second timeout
      maxBuffer: 5 * 1024 * 1024  // 5MB buffer
    });

    // Parse JSON output from skill
    const result = JSON.parse(stdout);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('White papers error:', error);
    
    // Handle timeout
    if (error.killed || error.signal === 'SIGTERM') {
      return NextResponse.json(
        { error: 'Request timed out - try a more specific topic' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to find white papers' },
      { status: 500 }
    );
  }
}
