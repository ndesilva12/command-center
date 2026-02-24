import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ESPN team IDs for D1 basketball (we'll build this list dynamically)
const ESPN_BASE = "https://www.espn.com/mens-college-basketball/team/roster/_/id/";

interface Player {
  name: string;
  position: string;
  height: string;
  weight: string;
  year: string;
  hometown: string;
  highSchool: string;
  lat?: number;
  lng?: number;
}

interface Team {
  id: string;
  name: string;
  conference: string;
  players: Player[];
}

// Cache for geocoded locations
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  if (!location || location === "--" || location === "N/A") return null;
  
  // Check cache first
  const cacheKey = location.toLowerCase().trim();
  if (cacheKey in geocodeCache) {
    return geocodeCache[cacheKey];
  }
  
  try {
    // Use OpenStreetMap Nominatim (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      {
        headers: {
          'User-Agent': 'CommandCenter/1.0 (basketball roster mapper)'
        }
      }
    );
    
    if (!response.ok) {
      geocodeCache[cacheKey] = null;
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[cacheKey] = result;
      return result;
    }
    
    geocodeCache[cacheKey] = null;
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    geocodeCache[cacheKey] = null;
    return null;
  }
}

async function scrapeTeamRoster(teamId: string): Promise<Team | null> {
  try {
    const url = `${ESPN_BASE}${teamId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch team ${teamId}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Get team name
    const teamName = $('h1.ClubhouseHeader__Name').text().trim() || 
                     $('h1.TeamHeader__Name').text().trim() ||
                     $('title').text().split(' Roster')[0].trim();
    
    // Get conference
    const conference = $('.ClubhouseHeader__Record').text().trim() || "";
    
    const players: Player[] = [];
    
    // ESPN roster table structure
    $('table.Table tbody tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        // Try to extract player data
        const nameCell = cells.eq(1).text().trim();
        const posCell = cells.eq(2).text().trim();
        const heightCell = cells.eq(3).text().trim();
        const weightCell = cells.eq(4).text().trim();
        const yearCell = cells.eq(5).text().trim();
        const hometownCell = cells.eq(6).text().trim();
        
        if (nameCell && nameCell !== "Name") {
          players.push({
            name: nameCell,
            position: posCell || "--",
            height: heightCell || "--",
            weight: weightCell || "--",
            year: yearCell || "--",
            hometown: hometownCell || "--",
            highSchool: "--"
          });
        }
      }
    });
    
    // Alternative: Try athlete-row structure
    if (players.length === 0) {
      $('.Roster__Player, .athlete-row, [data-player-id]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('.Roster__Player__Name, .AnchorLink, a').first().text().trim();
        const details = $el.find('.Roster__Player__Info, .player-details').text();
        
        if (name) {
          // Parse hometown from details if available
          const hometownMatch = details.match(/([A-Za-z\s]+,\s*[A-Z]{2})/);
          
          players.push({
            name,
            position: $el.find('[class*="Position"]').text().trim() || "--",
            height: $el.find('[class*="Height"]').text().trim() || "--",
            weight: $el.find('[class*="Weight"]').text().trim() || "--",
            year: $el.find('[class*="Year"], [class*="Class"]').text().trim() || "--",
            hometown: hometownMatch ? hometownMatch[1] : "--",
            highSchool: "--"
          });
        }
      });
    }
    
    return {
      id: teamId,
      name: teamName || `Team ${teamId}`,
      conference,
      players
    };
  } catch (error) {
    console.error(`Error scraping team ${teamId}:`, error);
    return null;
  }
}

// List of major D1 teams with ESPN IDs
const TEAMS: { id: string; name: string; conference: string }[] = [
  // ACC
  { id: "150", name: "Duke", conference: "ACC" },
  { id: "153", name: "North Carolina", conference: "ACC" },
  { id: "154", name: "NC State", conference: "ACC" },
  { id: "259", name: "Wake Forest", conference: "ACC" },
  { id: "2305", name: "Clemson", conference: "ACC" },
  { id: "103", name: "Boston College", conference: "ACC" },
  { id: "59", name: "Florida State", conference: "ACC" },
  { id: "2294", name: "Georgia Tech", conference: "ACC" },
  { id: "2390", name: "Louisville", conference: "ACC" },
  { id: "367", name: "Miami", conference: "ACC" },
  { id: "2507", name: "Notre Dame", conference: "ACC" },
  { id: "2579", name: "Pittsburgh", conference: "ACC" },
  { id: "2628", name: "SMU", conference: "ACC" },
  { id: "258", name: "Syracuse", conference: "ACC" },
  { id: "2678", name: "Stanford", conference: "ACC" },
  { id: "252", name: "Virginia", conference: "ACC" },
  { id: "259", name: "Virginia Tech", conference: "ACC" },
  { id: "2116", name: "Cal", conference: "ACC" },
  
  // Big Ten
  { id: "356", name: "Illinois", conference: "Big Ten" },
  { id: "84", name: "Indiana", conference: "Big Ten" },
  { id: "2294", name: "Iowa", conference: "Big Ten" },
  { id: "127", name: "Maryland", conference: "Big Ten" },
  { id: "130", name: "Michigan", conference: "Big Ten" },
  { id: "127", name: "Michigan State", conference: "Big Ten" },
  { id: "135", name: "Minnesota", conference: "Big Ten" },
  { id: "158", name: "Nebraska", conference: "Big Ten" },
  { id: "77", name: "Northwestern", conference: "Big Ten" },
  { id: "194", name: "Ohio State", conference: "Big Ten" },
  { id: "2509", name: "Oregon", conference: "Big Ten" },
  { id: "213", name: "Penn State", conference: "Big Ten" },
  { id: "2509", name: "Purdue", conference: "Big Ten" },
  { id: "275", name: "Rutgers", conference: "Big Ten" },
  { id: "43", name: "UCLA", conference: "Big Ten" },
  { id: "2638", name: "USC", conference: "Big Ten" },
  { id: "264", name: "Washington", conference: "Big Ten" },
  { id: "275", name: "Wisconsin", conference: "Big Ten" },
  
  // SEC
  { id: "2", name: "Alabama", conference: "SEC" },
  { id: "8", name: "Arkansas", conference: "SEC" },
  { id: "96", name: "Auburn", conference: "SEC" },
  { id: "57", name: "Florida", conference: "SEC" },
  { id: "61", name: "Georgia", conference: "SEC" },
  { id: "96", name: "Kentucky", conference: "SEC" },
  { id: "99", name: "LSU", conference: "SEC" },
  { id: "145", name: "Mississippi State", conference: "SEC" },
  { id: "142", name: "Missouri", conference: "SEC" },
  { id: "145", name: "Ole Miss", conference: "SEC" },
  { id: "164", name: "Oklahoma", conference: "SEC" },
  { id: "197", name: "South Carolina", conference: "SEC" },
  { id: "2633", name: "Tennessee", conference: "SEC" },
  { id: "245", name: "Texas", conference: "SEC" },
  { id: "2628", name: "Texas A&M", conference: "SEC" },
  { id: "238", name: "Vanderbilt", conference: "SEC" },
  
  // Big 12
  { id: "239", name: "Arizona", conference: "Big 12" },
  { id: "9", name: "Arizona State", conference: "Big 12" },
  { id: "68", name: "Baylor", conference: "Big 12" },
  { id: "2181", name: "BYU", conference: "Big 12" },
  { id: "2132", name: "Cincinnati", conference: "Big 12" },
  { id: "2142", name: "Colorado", conference: "Big 12" },
  { id: "2305", name: "Houston", conference: "Big 12" },
  { id: "2306", name: "Iowa State", conference: "Big 12" },
  { id: "2305", name: "Kansas", conference: "Big 12" },
  { id: "2306", name: "Kansas State", conference: "Big 12" },
  { id: "2641", name: "Oklahoma State", conference: "Big 12" },
  { id: "2628", name: "TCU", conference: "Big 12" },
  { id: "2628", name: "Texas Tech", conference: "Big 12" },
  { id: "2628", name: "UCF", conference: "Big 12" },
  { id: "254", name: "Utah", conference: "Big 12" },
  { id: "277", name: "West Virginia", conference: "Big 12" },
  
  // Big East
  { id: "41", name: "UConn", conference: "Big East" },
  { id: "2250", name: "Creighton", conference: "Big East" },
  { id: "2166", name: "DePaul", conference: "Big East" },
  { id: "2294", name: "Georgetown", conference: "Big East" },
  { id: "2275", name: "Marquette", conference: "Big East" },
  { id: "2572", name: "Providence", conference: "Big East" },
  { id: "139", name: "Seton Hall", conference: "Big East" },
  { id: "2608", name: "St. John's", conference: "Big East" },
  { id: "2739", name: "Villanova", conference: "Big East" },
  { id: "2752", name: "Xavier", conference: "Big East" },
  { id: "2086", name: "Butler", conference: "Big East" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const teamId = searchParams.get("teamId");
    
    if (action === "teams") {
      // Return list of available teams
      return NextResponse.json({ 
        teams: TEAMS.map(t => ({ id: t.id, name: t.name, conference: t.conference })),
        conferences: [...new Set(TEAMS.map(t => t.conference))]
      });
    }
    
    if (action === "roster" && teamId) {
      // Fetch and return roster for a specific team
      const team = await scrapeTeamRoster(teamId);
      
      if (!team) {
        return NextResponse.json({ error: "Failed to fetch team roster" }, { status: 500 });
      }
      
      // Geocode player hometowns (with rate limiting)
      const geocodedPlayers = await Promise.all(
        team.players.map(async (player, index) => {
          // Rate limit: wait 100ms between requests
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const coords = await geocodeLocation(player.hometown);
          return {
            ...player,
            lat: coords?.lat,
            lng: coords?.lng
          };
        })
      );
      
      return NextResponse.json({
        ...team,
        players: geocodedPlayers
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Roster map API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamIds } = body;
    
    if (!teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json({ error: "teamIds array required" }, { status: 400 });
    }
    
    // Fetch multiple teams
    const results = await Promise.all(
      teamIds.slice(0, 5).map(id => scrapeTeamRoster(id)) // Limit to 5 teams
    );
    
    return NextResponse.json({
      teams: results.filter(Boolean)
    });
  } catch (error) {
    console.error("Roster map POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
