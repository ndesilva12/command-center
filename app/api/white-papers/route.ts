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

    // Call Python script on EC2
    const saveFlag = save ? '--save' : '';
    const command = `python3 /home/ubuntu/openclaw/skills/white-papers/white_papers.py ${saveFlag} --json "${topic.replace(/"/g, '\\"')}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minutes
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });

    // Parse JSON output
    const result = JSON.parse(stdout);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('White papers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate white papers' },
      { status: 500 }
    );
  }
}
