import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { BusinessAnalysis, BusinessSearchResult } from './types/business';

// Cache duration: 7 days for detailed reports, 1 day for search results
const REPORT_CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SEARCH_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

function normalizeBusinessKey(name: string, city: string, state: string): string {
  return `${name}-${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export async function getCachedBusinessReport(
  name: string,
  city: string,
  state: string
): Promise<BusinessAnalysis | null> {
  try {
    const key = normalizeBusinessKey(name, city, state);
    const docRef = adminDb.collection('business_reports').doc(key);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data();
    if (!data) return null;

    const searchedAt = data.searchedAt?.toDate?.() || new Date(data.searchedAt);
    const now = new Date();

    // Check if cache is still valid
    if (now.getTime() - searchedAt.getTime() > REPORT_CACHE_DURATION_MS) {
      return null;
    }

    return {
      ...data,
      searchedAt: searchedAt,
    } as BusinessAnalysis;
  } catch (error) {
    console.error('Error getting cached business report:', error);
    return null;
  }
}

export async function cacheBusinessReport(report: BusinessAnalysis): Promise<void> {
  try {
    const key = normalizeBusinessKey(report.businessName, report.city, report.state);
    const docRef = adminDb.collection('business_reports').doc(key);

    await docRef.set({
      ...report,
      searchedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error caching business report:', error);
  }
}

export async function getCachedBusinessSearchResults(
  query: string,
  city: string,
  state: string
): Promise<BusinessSearchResult[] | null> {
  try {
    const key = normalizeBusinessKey(query, city, state);
    const docRef = adminDb.collection('business_search_results').doc(key);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    const data = docSnap.data();
    if (!data) return null;

    const cachedAt = data.cachedAt?.toDate?.() || new Date(data.cachedAt);
    const now = new Date();

    if (now.getTime() - cachedAt.getTime() > SEARCH_CACHE_DURATION_MS) {
      return null;
    }

    return data.results as BusinessSearchResult[];
  } catch (error) {
    console.error('Error getting cached search results:', error);
    return null;
  }
}

export async function cacheBusinessSearchResults(
  query: string,
  city: string,
  state: string,
  results: BusinessSearchResult[]
): Promise<void> {
  try {
    const key = normalizeBusinessKey(query, city, state);
    const docRef = adminDb.collection('business_search_results').doc(key);

    await docRef.set({
      query,
      city,
      state,
      results,
      cachedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error caching search results:', error);
  }
}
