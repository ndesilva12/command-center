import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const googleUser = cookieStore.get('google_user');

    if (googleUser && googleUser.value) {
      try {
        const userInfo = JSON.parse(googleUser.value);
        return NextResponse.json({
          connected: true,
          accounts: [
            {
              email: userInfo.email,
              name: userInfo.name || userInfo.email.split('@')[0],
              picture: userInfo.picture,
            }
          ]
        });
      } catch (parseError) {
        console.error('Error parsing google_user cookie:', parseError);
        return NextResponse.json({ connected: false, accounts: [] }, { status: 401 });
      }
    }

    return NextResponse.json({ connected: false, accounts: [] }, { status: 401 });
  } catch (error) {
    console.error('Error checking Google accounts:', error);
    return NextResponse.json({ connected: false, accounts: [] }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const response = NextResponse.json({ success: true, remainingAccounts: 0 });

    // Clear Google cookies
    response.cookies.delete('google_tokens');
    response.cookies.delete('google_user');

    return response;
  } catch (error) {
    console.error('Error removing Google account:', error);
    return NextResponse.json({ error: 'Failed to remove account' }, { status: 500 });
  }
}
