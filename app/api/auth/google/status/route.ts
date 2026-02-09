import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const googleTokens = cookieStore.get('google_tokens');
    const googleUser = cookieStore.get('google_user');

    if ((googleTokens && googleTokens.value) || (googleUser && googleUser.value)) {
      return NextResponse.json({ connected: true });
    }

    return NextResponse.json({ connected: false }, { status: 401 });
  } catch (error) {
    console.error('Error checking Google auth status:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
