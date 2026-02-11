import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, mode = 'balanced', days = 30 } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Create a "running" record immediately in Firestore
    const docRef = await adminDb.collection('l3d_history').add({
      query: topic.trim(),
      mode,
      days,
      status: 'running',
      timestamp: Timestamp.now(),
      userId: 'default', // TODO: Add auth when multi-user
    });

    // Start research asynchronously (fire and forget)
    runResearchAsync(docRef.id, topic.trim(), mode, days);

    // Return immediately with success
    return NextResponse.json({
      success: true,
      message: 'Research started',
      id: docRef.id,
    });

  } catch (error) {
    console.error('Error starting L3D research:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function runResearchAsync(docId: string, topic: string, mode: string, days: number) {
  try {
    // Build command
    const modeFlag = mode === 'quick' ? '--quick' : mode === 'deep' ? '--deep' : '';
    const daysFlag = `--days=${days}`;
    const scriptPath = '/home/ubuntu/openclaw/skills/l3d/scripts/last30days.py';
    const command = `python3 "${scriptPath}" "${topic}" --emit=json ${modeFlag} ${daysFlag}`.trim();

    console.log(`[L3D] Running: ${command}`);

    // Execute Python script
    const { stdout, stderr } = await execAsync(command, {
      timeout: 300000, // 5 minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        XAI_API_KEY: process.env.XAI_API_KEY,
        BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
      }
    });

    if (stderr) {
      console.error(`[L3D] stderr: ${stderr}`);
    }

    // Parse JSON output
    let results;
    try {
      results = JSON.parse(stdout);
    } catch (parseError) {
      console.error('[L3D] Failed to parse JSON:', parseError);
      results = { rawOutput: stdout };
    }

    // Update Firestore with completed results
    await adminDb.collection('l3d_history').doc(docId).update({
      status: 'completed',
      results,
      completed_at: Timestamp.now(),
    });

    console.log(`[L3D] Research completed: ${docId}`);

  } catch (error) {
    console.error('[L3D] Research failed:', error);
    
    // Update Firestore with error
    await adminDb.collection('l3d_history').doc(docId).update({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completed_at: Timestamp.now(),
    });
  }
}
