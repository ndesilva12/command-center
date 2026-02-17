const https = require('https');

// Map of school short name → ESPN team IDs (collected from barttorvik + ESPN)
const teamLookups = [
  { school: 'Gonzaga', id: 2250 },
  { school: 'Dayton', id: 2074 },
  { school: 'VCU', id: 2670 },
  { school: 'New Mexico', id: 167 },
  { school: 'UAB', id: 2429 },
  { school: 'Drake', id: 2116 },
  { school: 'Utah State', id: 328 },
  { school: 'George Mason', id: 2119 },
  { school: 'Fresno State', id: 278 },
  { school: 'Saint Marys', id: 2608 },
  { school: 'Southern Illinois', id: 79 },
  { school: 'East Carolina', id: 151 },
  { school: 'Washington State', id: 265 },
  { school: 'Indiana State', id: 282 },
  { school: 'South Florida', id: 58 },
  { school: 'Florida Atlantic', id: 2226 },
  { school: 'Rice', id: 242 },
  { school: 'St Bonaventure', id: 179 },
  { school: 'Lafayette', id: 322 },
  { school: 'James Madison', id: 256 },
  { school: 'Cornell', id: 172 },
  { school: 'George Washington', id: 2199 },
];

function fetchTeamRecord(teamId, teamName) {
  return new Promise((resolve) => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${teamId}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const record = json.team?.record?.items?.[0]?.summary || 'N/A';
          resolve({ school: teamName, id: teamId, record });
        } catch (e) {
          resolve({ school: teamName, id: teamId, record: 'ERROR' });
        }
      });
    }).on('error', () => resolve({ school: teamName, id: teamId, record: 'FETCH_ERROR' }));
  });
}

async function main() {
  const results = {};
  const promises = teamLookups.map(t => fetchTeamRecord(t.id, t.school));
  const resolved = await Promise.all(promises);
  for (const r of resolved) {
    results[r.school] = r.record;
    console.log(r.school + ':', r.record);
  }
  require('fs').writeFileSync('/tmp/team-records-v15.json', JSON.stringify(results, null, 2));
  console.log('\nSaved to /tmp/team-records-v15.json');
}

main().catch(e => { console.error(e.message); });
