import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRecentEmails } from '@/lib/gmail';
import { getValidAccessToken } from '@/lib/google-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const query = searchParams.get('q') || 'in:inbox';
    const all = searchParams.get('all') === 'true';
    const account = searchParams.get('account');

    // Get Google tokens from cookies
    const cookieStore = await cookies();
    const googleTokensCookie = cookieStore.get('google_tokens');
    const googleUserCookie = cookieStore.get('google_user');

    if (!googleTokensCookie || !googleTokensCookie.value) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      );
    }

    let tokens;
    let userInfo: { email: string; name?: string; picture?: string } | undefined;
    try {
      tokens = JSON.parse(googleTokensCookie.value);
      if (googleUserCookie && googleUserCookie.value) {
        userInfo = JSON.parse(googleUserCookie.value);
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Get valid access token (refreshes if needed)
    const accessToken = await getValidAccessToken(tokens);

    // Fetch emails from Gmail API
    const emails = await getRecentEmails(accessToken, limit, query);

    // Add account info to each email
    const emailsWithAccount = emails.map(email => ({
      ...email,
      accountEmail: userInfo?.email,
      accountName: userInfo?.name,
    }));

    return NextResponse.json({
      emails: emailsWithAccount,
      accounts: userInfo ? [{
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      }] : [],
    });
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
