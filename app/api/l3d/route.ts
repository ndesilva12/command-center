import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, targetTool, mode, days } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Build command with flags
    const modeFlag = mode === 'quick' ? '--quick' : mode === 'deep' ? '--deep' : '';
    const daysFlag = days ? `--days=${days}` : '--days=30';
    const targetToolArg = targetTool ? `--target="${targetTool.trim()}"` : '';

    const scriptPath = '/home/ubuntu/openclaw/skills/l3d/scripts/last30days.py';
    const command = `python3 "${scriptPath}" "${topic.trim()}" --emit=json ${modeFlag} ${daysFlag} ${targetToolArg}`.trim();

    console.log('L3D: Executing command:', command);

    // Execute Python script
    const { stdout, stderr } = await execAsync(command, {
      timeout: 180000, // 3 minutes
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        XAI_API_KEY: process.env.XAI_API_KEY,
        BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
      },
    });

    if (stderr) {
      console.log('L3D stderr:', stderr);
    }

    // Parse JSON output
    let jsonOutput;
    try {
      jsonOutput = JSON.parse(stdout);
    } catch (parseError) {
      console.error('L3D: Failed to parse JSON output:', stdout);
      return NextResponse.json(
        { error: 'Failed to parse research results', details: stdout },
        { status: 500 }
      );
    }

    // Build results object
    const results = {
      topic: jsonOutput.topic || topic.trim(),
      targetTool: jsonOutput.targetTool || targetTool || null,
      queryType: jsonOutput.parsed?.queryType || jsonOutput.queryType || 'GENERAL',
      parsed: jsonOutput.parsed || {
        topic: topic.trim(),
        targetTool: targetTool || '',
        queryType: jsonOutput.queryType || 'GENERAL',
      },
      learned: jsonOutput.learned || [],
      keyPatterns: jsonOutput.keyPatterns || [],
      stats: jsonOutput.stats || {
        reddit: { threads: 0, upvotes: 0, comments: 0 },
        x: { posts: 0, likes: 0, reposts: 0 },
        web: { pages: 0 },
        topVoices: [],
      },
      sources: jsonOutput.sources || {
        reddit: [],
        x: [],
        web: [],
      },
      invitation: jsonOutput.invitation || '',
      rawOutput: stdout,
    };

    // Save to Firestore
    const docRef = await adminDb.collection('l3d_history').add({
      topic: topic.trim(),
      targetTool: targetTool || null,
      mode: mode || 'balanced',
      days: days || 30,
      queryType: results.queryType,
      results: results,
      userId: 'default', // TODO: Get from auth when multi-user
      status: 'completed',
      createdAt: Timestamp.now(),
      completedAt: Timestamp.now(),
    });

    console.log('L3D: Saved to Firestore with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      results,
      timestamp: Date.now(),
      id: docRef.id,
    });
  } catch (error) {
    console.error('L3D error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Research timed out. Try using quick mode or a shorter time period.' },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to execute research' },
      { status: 500 }
    );
  }
}
