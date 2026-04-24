import { NextResponse } from 'next/server';
import { getXAccessToken } from '@/lib/x-auth';

interface XPost {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  relativeTime: string;
  url: string;
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function GET() {
  try {
    const accessToken = await getXAccessToken();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'X account not connected or token expired' },
        { status: 401 }
      );
    }

    // Get user's reverse chronological timeline (For You equivalent)
    const timelineResponse = await fetch(
      'https://api.twitter.com/2/users/me/timelines/reverse_chronological?' + new URLSearchParams({
        max_results: '20',
        'tweet.fields': 'created_at,public_metrics,entities,author_id',
        'user.fields': 'name,username,profile_image_url',
        'expansions': 'author_id',
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!timelineResponse.ok) {
      const errorText = await timelineResponse.text();
      console.error('X API timeline error:', timelineResponse.status, errorText);
      
      if (timelineResponse.status === 401) {
        return NextResponse.json(
          { error: 'Token expired, please reconnect' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `X API error: ${timelineResponse.status}` },
        { status: 500 }
      );
    }

    const timelineData = await timelineResponse.json();
    
    // Build user lookup map from includes
    const userMap = new Map<string, { name: string; username: string; profileImageUrl?: string }>();
    for (const user of timelineData.includes?.users || []) {
      userMap.set(user.id, {
        name: user.name,
        username: user.username,
        profileImageUrl: user.profile_image_url?.replace('_normal', '_bigger'),
      });
    }

    // Transform tweets to our format
    const posts: XPost[] = [];
    for (const tweet of timelineData.data || []) {
      const author = userMap.get(tweet.author_id) || {
        name: 'Unknown',
        username: 'unknown',
      };

      posts.push({
        id: tweet.id,
        text: tweet.text,
        author,
        createdAt: tweet.created_at,
        relativeTime: getRelativeTime(tweet.created_at),
        url: `https://x.com/${author.username}/status/${tweet.id}`,
        metrics: tweet.public_metrics ? {
          likes: tweet.public_metrics.like_count,
          retweets: tweet.public_metrics.retweet_count,
          replies: tweet.public_metrics.reply_count,
        } : undefined,
      });
    }

    return NextResponse.json({
      posts,
      source: 'x-api',
    });
  } catch (error) {
    console.error('X For You error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}
