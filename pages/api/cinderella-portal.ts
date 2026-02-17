import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getCinderellaAuth } from '@/lib/cinderella-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: 'Portal Big Board!A:Z'
    });

    const rows = response.data.values || [];
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const rowObj: any = {};
      headers.forEach((header: string, index: number) => {
        rowObj[header] = row[index] || '';
      });
      return rowObj;
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Cinderella Portal data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
