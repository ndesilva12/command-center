import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Load credentials from the token file
    const credentialsPath = path.resolve('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      'postmessage'
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });

    // Create Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Fetch Portal Big Board data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: 'Portal Big Board!A:Z' // Fetch all columns
    });

    // Process the data
    const rows = response.data.values || [];
    const headers = rows[0]; // First row is headers
    const data = rows.slice(1).map(row => {
      // Create an object mapping headers to row values
      const rowObj: any = {};
      headers.forEach((header, index) => {
        rowObj[header] = row[index] || '';
      });
      return rowObj;
    });

    // Return processed data
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Cinderella Portal data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}