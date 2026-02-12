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

    // Call Python script on EC2
    const saveFlag = save ? '--save' : '';
    const command = `python3 /home/ubuntu/openclaw/skills/one-pager/one_pager.py ${saveFlag} --json "${topic.replace(/"/g, '\\"')}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 180000, // 3 minutes (AI generation takes longer)
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });

    // Parse JSON output
    const result = JSON.parse(stdout);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('One-pager error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate one-pager' },
      { status: 500 }
    );
  }
}
