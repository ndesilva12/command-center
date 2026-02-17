import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

// Type for player data
interface PlayerData {
  Name: string;
  School: string;
  Pos: string;
  Yr: string;
  Grade: string;
  Role: string;
  PPG: string;
  APG: string;
  Conf: string;
  'Team Rec': string;
  Notes: string;
  Tier: string;
}

// Tier color mapping
const TIER_COLORS: { [key: string]: string } = {
  'T1': 'bg-green-100 dark:bg-green-900',
  'T2': 'bg-blue-100 dark:bg-blue-900',
  'T3': 'bg-amber-100 dark:bg-amber-900',
  'T4-RF': 'bg-red-100 dark:bg-red-900',
  'NR': 'bg-gray-100 dark:bg-gray-700'
};

export default function CinderellaPortal() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [filters, setFilters] = useState({
    position: '',
    tier: '',
    conference: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cinderella-portal');
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Failed to fetch players:', error);
      }
    };
    fetchData();
  }, []);

  // Memoized filtered players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const positionMatch = !filters.position || player.Pos === filters.position;
      const tierMatch = !filters.tier || player.Tier === filters.tier;
      const conferenceMatch = !filters.conference || player.Conf === filters.conference;
      
      return positionMatch && tierMatch && conferenceMatch;
    });
  }, [players, filters]);

  // Get unique filter options
  const positionOptions = [...new Set(players.map(p => p.Pos))];
  const tierOptions = [...new Set(players.map(p => p.Tier))];
  const conferenceOptions = [...new Set(players.map(p => p.Conf))];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <Head>
        <title>Cinderella Project War Room</title>
      </Head>
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Cinderella Project Portal</h1>
        
        {/* Filters */}
        <div className="mb-6 flex space-x-4">
          <select 
            className="p-2 bg-white dark:bg-gray-700 rounded"
            value={filters.position} 
            onChange={(e) => setFilters(f => ({ ...f, position: e.target.value }))}
          >
            <option value="">All Positions</option>
            {positionOptions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          <select 
            className="p-2 bg-white dark:bg-gray-700 rounded"
            value={filters.tier} 
            onChange={(e) => setFilters(f => ({ ...f, tier: e.target.value }))}
          >
            <option value="">All Tiers</option>
            {tierOptions.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>

          <select 
            className="p-2 bg-white dark:bg-gray-700 rounded"
            value={filters.conference} 
            onChange={(e) => setFilters(f => ({ ...f, conference: e.target.value }))}
          >
            <option value="">All Conferences</option>
            {conferenceOptions.map(conf => (
              <option key={conf} value={conf}>{conf}</option>
            ))}
          </select>
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-800">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">School</th>
                <th className="p-2 border">Pos</th>
                <th className="p-2 border">Yr</th>
                <th className="p-2 border">Grade</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">PPG</th>
                <th className="p-2 border">APG</th>
                <th className="p-2 border">Conf</th>
                <th className="p-2 border">Team Rec</th>
                <th className="p-2 border">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr 
                  key={index} 
                  className={`${TIER_COLORS[player.Tier] || ''} hover:bg-opacity-75 transition`}
                >
                  <td className="p-2 border">{player.Name}</td>
                  <td className="p-2 border">{player.School}</td>
                  <td className="p-2 border">{player.Pos}</td>
                  <td className="p-2 border">{player.Yr}</td>
                  <td className="p-2 border">{player.Grade}</td>
                  <td className="p-2 border">{player.Role}</td>
                  <td className="p-2 border">{player.PPG}</td>
                  <td className="p-2 border">{player.APG}</td>
                  <td className="p-2 border">{player.Conf}</td>
                  <td className="p-2 border">{player['Team Rec']}</td>
                  <td className="p-2 border">{player.Notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}