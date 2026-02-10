import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

async function getValidAccessToken(tokens: any): Promise<string> {
  if (!tokens.expires_at || Date.now() < tokens.expires_at) {
    return tokens.access_token;
  }

  // Refresh the token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function fetchDriveFiles(accessToken: string, pageSize: number = 50): Promise<any[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.append('pageSize', pageSize.toString());
  url.searchParams.append('fields', 'files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink)');
  url.searchParams.append('orderBy', 'modifiedTime desc');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Drive files');
  }

  const data = await response.json();
  return data.files || [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get('account');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get('google_accounts');

    if (!accountsCookie || !accountsCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const accountEmails: string[] = JSON.parse(accountsCookie.value);

    if (accountEmails.length === 0) {
      return NextResponse.json({ error: 'No Google accounts connected' }, { status: 401 });
    }

    // Fetch files from all accounts (or specific account if requested)
    const accountsToFetch = account ? accountEmails.filter(email => email === account) : accountEmails;

    const filesFromAllAccounts = await Promise.all(
      accountsToFetch.map(async (email) => {
        try {
          const accountId = email.replace(/[^a-zA-Z0-9@.]/g, "_");
          const doc = await adminDb.collection("google-accounts").doc(accountId).get();

          if (!doc.exists) {
            return { files: [], account: { email, name: email } };
          }

          const data = doc.data();
          const tokens = {
            access_token: data?.access_token,
            refresh_token: data?.refresh_token,
            expires_at: data?.expires_at,
          };

          const accessToken = await getValidAccessToken(tokens);
          const files = await fetchDriveFiles(accessToken, pageSize);

          return {
            files: files.map(file => ({
              ...file,
              accountEmail: data?.email,
              accountName: data?.name,
            })),
            account: {
              email: data?.email,
              name: data?.name,
            },
          };
        } catch (error) {
          console.error(`Error fetching Drive files for ${email}:`, error);
          return { files: [], account: { email, name: email } };
        }
      })
    );

    // Merge all files and sort by modified time
    const allFiles = filesFromAllAccounts.flatMap(result => result.files);
    allFiles.sort((a, b) => {
      const aTime = new Date(a.modifiedTime || 0).getTime();
      const bTime = new Date(b.modifiedTime || 0).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({
      files: allFiles,
      accounts: filesFromAllAccounts.map(r => r.account),
    });
  } catch (error) {
    console.error('Drive files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Drive files' },
      { status: 500 }
    );
  }
}
