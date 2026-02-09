import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const raindropToken = cookieStore.get('raindrop_access_token');
    
    if (raindropToken && raindropToken.value) {
      return NextResponse.json({ connected: true });
    }
    
    return NextResponse.json({ connected: false }, { status: 401 });
  } catch (error) {
    console.error('Error checking Raindrop auth status:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
