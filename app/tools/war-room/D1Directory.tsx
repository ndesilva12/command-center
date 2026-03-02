"use client";

import React, { useState, useMemo } from "react";
import { Search, ExternalLink, Users, ChevronDown, ChevronUp } from "lucide-react";

interface Team {
  name: string;
  mascot: string;
  conference: string;
  website: string;
  rosterUrl: string;
  staffUrl: string;
}

// Complete D1 Basketball Teams Directory - ALL 32 CONFERENCES (362 teams)
const D1_TEAMS: Team[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // POWER CONFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  // ACC (18 teams)
  { name: "Boston College", mascot: "Eagles", conference: "ACC", website: "bceagles.com", rosterUrl: "https://bceagles.com/sports/mens-basketball/roster", staffUrl: "https://bceagles.com/sports/mens-basketball/coaches" },
  { name: "California", mascot: "Golden Bears", conference: "ACC", website: "calbears.com", rosterUrl: "https://calbears.com/sports/mens-basketball/roster", staffUrl: "https://calbears.com/sports/mens-basketball/coaches" },
  { name: "Clemson", mascot: "Tigers", conference: "ACC", website: "clemsontigers.com", rosterUrl: "https://clemsontigers.com/sports/mens-basketball/roster", staffUrl: "https://clemsontigers.com/sports/mens-basketball/coaches" },
  { name: "Duke", mascot: "Blue Devils", conference: "ACC", website: "goduke.com", rosterUrl: "https://goduke.com/sports/mens-basketball/roster", staffUrl: "https://goduke.com/sports/mens-basketball/coaches" },
  { name: "Florida State", mascot: "Seminoles", conference: "ACC", website: "seminoles.com", rosterUrl: "https://seminoles.com/sports/mens-basketball/roster", staffUrl: "https://seminoles.com/sports/mens-basketball/coaches" },
  { name: "Georgia Tech", mascot: "Yellow Jackets", conference: "ACC", website: "ramblinwreck.com", rosterUrl: "https://ramblinwreck.com/sports/mens-basketball/roster", staffUrl: "https://ramblinwreck.com/sports/mens-basketball/coaches" },
  { name: "Louisville", mascot: "Cardinals", conference: "ACC", website: "gocards.com", rosterUrl: "https://gocards.com/sports/mens-basketball/roster", staffUrl: "https://gocards.com/sports/mens-basketball/coaches" },
  { name: "Miami", mascot: "Hurricanes", conference: "ACC", website: "miamihurricanes.com", rosterUrl: "https://miamihurricanes.com/sports/mens-basketball/roster", staffUrl: "https://miamihurricanes.com/sports/mens-basketball/coaches" },
  { name: "North Carolina", mascot: "Tar Heels", conference: "ACC", website: "goheels.com", rosterUrl: "https://goheels.com/sports/mens-basketball/roster", staffUrl: "https://goheels.com/sports/mens-basketball/coaches" },
  { name: "NC State", mascot: "Wolfpack", conference: "ACC", website: "gopack.com", rosterUrl: "https://gopack.com/sports/mens-basketball/roster", staffUrl: "https://gopack.com/sports/mens-basketball/coaches" },
  { name: "Notre Dame", mascot: "Fighting Irish", conference: "ACC", website: "und.com", rosterUrl: "https://und.com/sports/mens-basketball/roster", staffUrl: "https://und.com/sports/mens-basketball/coaches" },
  { name: "Pittsburgh", mascot: "Panthers", conference: "ACC", website: "pittsburghpanthers.com", rosterUrl: "https://pittsburghpanthers.com/sports/mens-basketball/roster", staffUrl: "https://pittsburghpanthers.com/sports/mens-basketball/coaches" },
  { name: "SMU", mascot: "Mustangs", conference: "ACC", website: "smumustangs.com", rosterUrl: "https://smumustangs.com/sports/mens-basketball/roster", staffUrl: "https://smumustangs.com/sports/mens-basketball/coaches" },
  { name: "Stanford", mascot: "Cardinal", conference: "ACC", website: "gostanford.com", rosterUrl: "https://gostanford.com/sports/mens-basketball/roster", staffUrl: "https://gostanford.com/sports/mens-basketball/coaches" },
  { name: "Syracuse", mascot: "Orange", conference: "ACC", website: "cuse.com", rosterUrl: "https://cuse.com/sports/mens-basketball/roster", staffUrl: "https://cuse.com/sports/mens-basketball/coaches" },
  { name: "Virginia", mascot: "Cavaliers", conference: "ACC", website: "virginiasports.com", rosterUrl: "https://virginiasports.com/sports/mens-basketball/roster", staffUrl: "https://virginiasports.com/sports/mens-basketball/coaches" },
  { name: "Virginia Tech", mascot: "Hokies", conference: "ACC", website: "hokiesports.com", rosterUrl: "https://hokiesports.com/sports/mens-basketball/roster", staffUrl: "https://hokiesports.com/sports/mens-basketball/coaches" },
  { name: "Wake Forest", mascot: "Demon Deacons", conference: "ACC", website: "godeacs.com", rosterUrl: "https://godeacs.com/sports/mens-basketball/roster", staffUrl: "https://godeacs.com/sports/mens-basketball/coaches" },

  // Big 12 (16 teams)
  { name: "Arizona", mascot: "Wildcats", conference: "Big 12", website: "arizonawildcats.com", rosterUrl: "https://arizonawildcats.com/sports/mens-basketball/roster", staffUrl: "https://arizonawildcats.com/sports/mens-basketball/coaches" },
  { name: "Arizona State", mascot: "Sun Devils", conference: "Big 12", website: "thesundevils.com", rosterUrl: "https://thesundevils.com/sports/mens-basketball/roster", staffUrl: "https://thesundevils.com/sports/mens-basketball/coaches" },
  { name: "Baylor", mascot: "Bears", conference: "Big 12", website: "baylorbears.com", rosterUrl: "https://baylorbears.com/sports/mens-basketball/roster", staffUrl: "https://baylorbears.com/sports/mens-basketball/coaches" },
  { name: "BYU", mascot: "Cougars", conference: "Big 12", website: "byucougars.com", rosterUrl: "https://byucougars.com/sports/m-basketball/roster", staffUrl: "https://byucougars.com/sports/m-basketball/coaches" },
  { name: "Cincinnati", mascot: "Bearcats", conference: "Big 12", website: "gobearcats.com", rosterUrl: "https://gobearcats.com/sports/mens-basketball/roster", staffUrl: "https://gobearcats.com/sports/mens-basketball/coaches" },
  { name: "Colorado", mascot: "Buffaloes", conference: "Big 12", website: "cubuffs.com", rosterUrl: "https://cubuffs.com/sports/mens-basketball/roster", staffUrl: "https://cubuffs.com/sports/mens-basketball/coaches" },
  { name: "Houston", mascot: "Cougars", conference: "Big 12", website: "uhcougars.com", rosterUrl: "https://uhcougars.com/sports/mens-basketball/roster", staffUrl: "https://uhcougars.com/sports/mens-basketball/coaches" },
  { name: "Iowa State", mascot: "Cyclones", conference: "Big 12", website: "cyclones.com", rosterUrl: "https://cyclones.com/sports/mens-basketball/roster", staffUrl: "https://cyclones.com/sports/mens-basketball/coaches" },
  { name: "Kansas", mascot: "Jayhawks", conference: "Big 12", website: "kuathletics.com", rosterUrl: "https://kuathletics.com/sports/mens-basketball/roster", staffUrl: "https://kuathletics.com/sports/mens-basketball/coaches" },
  { name: "Kansas State", mascot: "Wildcats", conference: "Big 12", website: "kstatesports.com", rosterUrl: "https://kstatesports.com/sports/mens-basketball/roster", staffUrl: "https://kstatesports.com/sports/mens-basketball/coaches" },
  { name: "Oklahoma State", mascot: "Cowboys", conference: "Big 12", website: "okstate.com", rosterUrl: "https://okstate.com/sports/mens-basketball/roster", staffUrl: "https://okstate.com/sports/mens-basketball/coaches" },
  { name: "TCU", mascot: "Horned Frogs", conference: "Big 12", website: "gofrogs.com", rosterUrl: "https://gofrogs.com/sports/mens-basketball/roster", staffUrl: "https://gofrogs.com/sports/mens-basketball/coaches" },
  { name: "Texas Tech", mascot: "Red Raiders", conference: "Big 12", website: "texastech.com", rosterUrl: "https://texastech.com/sports/mens-basketball/roster", staffUrl: "https://texastech.com/sports/mens-basketball/coaches" },
  { name: "UCF", mascot: "Knights", conference: "Big 12", website: "ucfknights.com", rosterUrl: "https://ucfknights.com/sports/mens-basketball/roster", staffUrl: "https://ucfknights.com/sports/mens-basketball/coaches" },
  { name: "Utah", mascot: "Utes", conference: "Big 12", website: "utahutes.com", rosterUrl: "https://utahutes.com/sports/mens-basketball/roster", staffUrl: "https://utahutes.com/sports/mens-basketball/coaches" },
  { name: "West Virginia", mascot: "Mountaineers", conference: "Big 12", website: "wvusports.com", rosterUrl: "https://wvusports.com/sports/mens-basketball/roster", staffUrl: "https://wvusports.com/sports/mens-basketball/coaches" },

  // Big East (11 teams)
  { name: "Butler", mascot: "Bulldogs", conference: "Big East", website: "butlersports.com", rosterUrl: "https://butlersports.com/sports/mens-basketball/roster", staffUrl: "https://butlersports.com/sports/mens-basketball/coaches" },
  { name: "UConn", mascot: "Huskies", conference: "Big East", website: "uconnhuskies.com", rosterUrl: "https://uconnhuskies.com/sports/mens-basketball/roster", staffUrl: "https://uconnhuskies.com/sports/mens-basketball/coaches" },
  { name: "Creighton", mascot: "Bluejays", conference: "Big East", website: "gocreighton.com", rosterUrl: "https://gocreighton.com/sports/mens-basketball/roster", staffUrl: "https://gocreighton.com/sports/mens-basketball/coaches" },
  { name: "DePaul", mascot: "Blue Demons", conference: "Big East", website: "depaulbluedemons.com", rosterUrl: "https://depaulbluedemons.com/sports/mens-basketball/roster", staffUrl: "https://depaulbluedemons.com/sports/mens-basketball/coaches" },
  { name: "Georgetown", mascot: "Hoyas", conference: "Big East", website: "guhoyas.com", rosterUrl: "https://guhoyas.com/sports/mens-basketball/roster", staffUrl: "https://guhoyas.com/sports/mens-basketball/coaches" },
  { name: "Marquette", mascot: "Golden Eagles", conference: "Big East", website: "gomarquette.com", rosterUrl: "https://gomarquette.com/sports/mens-basketball/roster", staffUrl: "https://gomarquette.com/sports/mens-basketball/coaches" },
  { name: "Providence", mascot: "Friars", conference: "Big East", website: "friars.com", rosterUrl: "https://friars.com/sports/mens-basketball/roster", staffUrl: "https://friars.com/sports/mens-basketball/coaches" },
  { name: "Seton Hall", mascot: "Pirates", conference: "Big East", website: "shupirates.com", rosterUrl: "https://shupirates.com/sports/mens-basketball/roster", staffUrl: "https://shupirates.com/sports/mens-basketball/coaches" },
  { name: "St. John's", mascot: "Red Storm", conference: "Big East", website: "redstormsports.com", rosterUrl: "https://redstormsports.com/sports/mens-basketball/roster", staffUrl: "https://redstormsports.com/sports/mens-basketball/coaches" },
  { name: "Villanova", mascot: "Wildcats", conference: "Big East", website: "villanova.com", rosterUrl: "https://villanova.com/sports/mens-basketball/roster", staffUrl: "https://villanova.com/sports/mens-basketball/coaches" },
  { name: "Xavier", mascot: "Musketeers", conference: "Big East", website: "goxavier.com", rosterUrl: "https://goxavier.com/sports/mens-basketball/roster", staffUrl: "https://goxavier.com/sports/mens-basketball/coaches" },

  // Big Ten (18 teams)
  { name: "Illinois", mascot: "Fighting Illini", conference: "Big Ten", website: "fightingillini.com", rosterUrl: "https://fightingillini.com/sports/mens-basketball/roster", staffUrl: "https://fightingillini.com/sports/mens-basketball/coaches" },
  { name: "Indiana", mascot: "Hoosiers", conference: "Big Ten", website: "iuhoosiers.com", rosterUrl: "https://iuhoosiers.com/sports/mens-basketball/roster", staffUrl: "https://iuhoosiers.com/sports/mens-basketball/coaches" },
  { name: "Iowa", mascot: "Hawkeyes", conference: "Big Ten", website: "hawkeyesports.com", rosterUrl: "https://hawkeyesports.com/sports/mens-basketball/roster", staffUrl: "https://hawkeyesports.com/sports/mens-basketball/coaches" },
  { name: "Maryland", mascot: "Terrapins", conference: "Big Ten", website: "umterps.com", rosterUrl: "https://umterps.com/sports/mens-basketball/roster", staffUrl: "https://umterps.com/sports/mens-basketball/coaches" },
  { name: "Michigan", mascot: "Wolverines", conference: "Big Ten", website: "mgoblue.com", rosterUrl: "https://mgoblue.com/sports/mens-basketball/roster", staffUrl: "https://mgoblue.com/sports/mens-basketball/coaches" },
  { name: "Michigan State", mascot: "Spartans", conference: "Big Ten", website: "msuspartans.com", rosterUrl: "https://msuspartans.com/sports/mens-basketball/roster", staffUrl: "https://msuspartans.com/sports/mens-basketball/coaches" },
  { name: "Minnesota", mascot: "Golden Gophers", conference: "Big Ten", website: "gophersports.com", rosterUrl: "https://gophersports.com/sports/mens-basketball/roster", staffUrl: "https://gophersports.com/sports/mens-basketball/coaches" },
  { name: "Nebraska", mascot: "Cornhuskers", conference: "Big Ten", website: "huskers.com", rosterUrl: "https://huskers.com/sports/mens-basketball/roster", staffUrl: "https://huskers.com/sports/mens-basketball/coaches" },
  { name: "Northwestern", mascot: "Wildcats", conference: "Big Ten", website: "nusports.com", rosterUrl: "https://nusports.com/sports/mens-basketball/roster", staffUrl: "https://nusports.com/sports/mens-basketball/coaches" },
  { name: "Ohio State", mascot: "Buckeyes", conference: "Big Ten", website: "ohiostatebuckeyes.com", rosterUrl: "https://ohiostatebuckeyes.com/sports/mens-basketball/roster", staffUrl: "https://ohiostatebuckeyes.com/sports/mens-basketball/coaches" },
  { name: "Oregon", mascot: "Ducks", conference: "Big Ten", website: "goducks.com", rosterUrl: "https://goducks.com/sports/mens-basketball/roster", staffUrl: "https://goducks.com/sports/mens-basketball/coaches" },
  { name: "Penn State", mascot: "Nittany Lions", conference: "Big Ten", website: "gopsusports.com", rosterUrl: "https://gopsusports.com/sports/mens-basketball/roster", staffUrl: "https://gopsusports.com/sports/mens-basketball/coaches" },
  { name: "Purdue", mascot: "Boilermakers", conference: "Big Ten", website: "purduesports.com", rosterUrl: "https://purduesports.com/sports/mens-basketball/roster", staffUrl: "https://purduesports.com/sports/mens-basketball/coaches" },
  { name: "Rutgers", mascot: "Scarlet Knights", conference: "Big Ten", website: "scarletknights.com", rosterUrl: "https://scarletknights.com/sports/mens-basketball/roster", staffUrl: "https://scarletknights.com/sports/mens-basketball/coaches" },
  { name: "UCLA", mascot: "Bruins", conference: "Big Ten", website: "uclabruins.com", rosterUrl: "https://uclabruins.com/sports/mens-basketball/roster", staffUrl: "https://uclabruins.com/sports/mens-basketball/coaches" },
  { name: "USC", mascot: "Trojans", conference: "Big Ten", website: "usctrojans.com", rosterUrl: "https://usctrojans.com/sports/mens-basketball/roster", staffUrl: "https://usctrojans.com/sports/mens-basketball/coaches" },
  { name: "Washington", mascot: "Huskies", conference: "Big Ten", website: "gohuskies.com", rosterUrl: "https://gohuskies.com/sports/mens-basketball/roster", staffUrl: "https://gohuskies.com/sports/mens-basketball/coaches" },
  { name: "Wisconsin", mascot: "Badgers", conference: "Big Ten", website: "uwbadgers.com", rosterUrl: "https://uwbadgers.com/sports/mens-basketball/roster", staffUrl: "https://uwbadgers.com/sports/mens-basketball/coaches" },

  // SEC (16 teams)
  { name: "Alabama", mascot: "Crimson Tide", conference: "SEC", website: "rolltide.com", rosterUrl: "https://rolltide.com/sports/mens-basketball/roster", staffUrl: "https://rolltide.com/sports/mens-basketball/coaches" },
  { name: "Arkansas", mascot: "Razorbacks", conference: "SEC", website: "arkansasrazorbacks.com", rosterUrl: "https://arkansasrazorbacks.com/roster/", staffUrl: "https://arkansasrazorbacks.com/staff/" },
  { name: "Auburn", mascot: "Tigers", conference: "SEC", website: "auburntigers.com", rosterUrl: "https://auburntigers.com/sports/mens-basketball/roster", staffUrl: "https://auburntigers.com/sports/mens-basketball/coaches" },
  { name: "Florida", mascot: "Gators", conference: "SEC", website: "floridagators.com", rosterUrl: "https://floridagators.com/sports/mens-basketball/roster", staffUrl: "https://floridagators.com/sports/mens-basketball/coaches" },
  { name: "Georgia", mascot: "Bulldogs", conference: "SEC", website: "georgiadogs.com", rosterUrl: "https://georgiadogs.com/sports/mens-basketball/roster", staffUrl: "https://georgiadogs.com/sports/mens-basketball/coaches" },
  { name: "Kentucky", mascot: "Wildcats", conference: "SEC", website: "ukathletics.com", rosterUrl: "https://ukathletics.com/sports/mens-basketball/roster", staffUrl: "https://ukathletics.com/sports/mens-basketball/coaches" },
  { name: "LSU", mascot: "Tigers", conference: "SEC", website: "lsusports.net", rosterUrl: "https://lsusports.net/sports/mens-basketball/roster", staffUrl: "https://lsusports.net/sports/mens-basketball/coaches" },
  { name: "Mississippi State", mascot: "Bulldogs", conference: "SEC", website: "hailstate.com", rosterUrl: "https://hailstate.com/sports/mens-basketball/roster", staffUrl: "https://hailstate.com/sports/mens-basketball/coaches" },
  { name: "Missouri", mascot: "Tigers", conference: "SEC", website: "mutigers.com", rosterUrl: "https://mutigers.com/sports/mens-basketball/roster", staffUrl: "https://mutigers.com/sports/mens-basketball/coaches" },
  { name: "Oklahoma", mascot: "Sooners", conference: "SEC", website: "soonersports.com", rosterUrl: "https://soonersports.com/sports/mens-basketball/roster", staffUrl: "https://soonersports.com/sports/mens-basketball/coaches" },
  { name: "Ole Miss", mascot: "Rebels", conference: "SEC", website: "olemisssports.com", rosterUrl: "https://olemisssports.com/sports/mens-basketball/roster", staffUrl: "https://olemisssports.com/sports/mens-basketball/coaches" },
  { name: "South Carolina", mascot: "Gamecocks", conference: "SEC", website: "gamecocksonline.com", rosterUrl: "https://gamecocksonline.com/sports/mens-basketball/roster", staffUrl: "https://gamecocksonline.com/sports/mens-basketball/coaches" },
  { name: "Tennessee", mascot: "Volunteers", conference: "SEC", website: "utsports.com", rosterUrl: "https://utsports.com/sports/mens-basketball/roster", staffUrl: "https://utsports.com/sports/mens-basketball/coaches" },
  { name: "Texas", mascot: "Longhorns", conference: "SEC", website: "texassports.com", rosterUrl: "https://texassports.com/sports/mens-basketball/roster", staffUrl: "https://texassports.com/sports/mens-basketball/coaches" },
  { name: "Texas A&M", mascot: "Aggies", conference: "SEC", website: "12thman.com", rosterUrl: "https://12thman.com/sports/mens-basketball/roster", staffUrl: "https://12thman.com/sports/mens-basketball/coaches" },
  { name: "Vanderbilt", mascot: "Commodores", conference: "SEC", website: "vucommodores.com", rosterUrl: "https://vucommodores.com/sports/mens-basketball/roster", staffUrl: "https://vucommodores.com/sports/mens-basketball/coaches" },

  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH-MAJOR CONFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  // American Athletic (14 teams)
  { name: "Charlotte", mascot: "49ers", conference: "American", website: "charlotte49ers.com", rosterUrl: "https://charlotte49ers.com/sports/mens-basketball/roster", staffUrl: "https://charlotte49ers.com/sports/mens-basketball/coaches" },
  { name: "East Carolina", mascot: "Pirates", conference: "American", website: "ecupirates.com", rosterUrl: "https://ecupirates.com/sports/mens-basketball/roster", staffUrl: "https://ecupirates.com/sports/mens-basketball/coaches" },
  { name: "FAU", mascot: "Owls", conference: "American", website: "fausports.com", rosterUrl: "https://fausports.com/sports/mens-basketball/roster", staffUrl: "https://fausports.com/sports/mens-basketball/coaches" },
  { name: "Memphis", mascot: "Tigers", conference: "American", website: "gotigersgo.com", rosterUrl: "https://gotigersgo.com/sports/mens-basketball/roster", staffUrl: "https://gotigersgo.com/sports/mens-basketball/coaches" },
  { name: "Navy", mascot: "Midshipmen", conference: "American", website: "navysports.com", rosterUrl: "https://navysports.com/sports/mens-basketball/roster", staffUrl: "https://navysports.com/sports/mens-basketball/coaches" },
  { name: "North Texas", mascot: "Mean Green", conference: "American", website: "meangreensports.com", rosterUrl: "https://meangreensports.com/sports/mens-basketball/roster", staffUrl: "https://meangreensports.com/sports/mens-basketball/coaches" },
  { name: "Rice", mascot: "Owls", conference: "American", website: "riceowls.com", rosterUrl: "https://riceowls.com/sports/mens-basketball/roster", staffUrl: "https://riceowls.com/sports/mens-basketball/coaches" },
  { name: "South Florida", mascot: "Bulls", conference: "American", website: "gousfbulls.com", rosterUrl: "https://gousfbulls.com/sports/mens-basketball/roster", staffUrl: "https://gousfbulls.com/sports/mens-basketball/coaches" },
  { name: "Temple", mascot: "Owls", conference: "American", website: "owlsports.com", rosterUrl: "https://owlsports.com/sports/mens-basketball/roster", staffUrl: "https://owlsports.com/sports/mens-basketball/coaches" },
  { name: "Tulane", mascot: "Green Wave", conference: "American", website: "tulanegreenwave.com", rosterUrl: "https://tulanegreenwave.com/sports/mens-basketball/roster", staffUrl: "https://tulanegreenwave.com/sports/mens-basketball/coaches" },
  { name: "Tulsa", mascot: "Golden Hurricane", conference: "American", website: "tulsahurricane.com", rosterUrl: "https://tulsahurricane.com/sports/mens-basketball/roster", staffUrl: "https://tulsahurricane.com/sports/mens-basketball/coaches" },
  { name: "UAB", mascot: "Blazers", conference: "American", website: "uabsports.com", rosterUrl: "https://uabsports.com/sports/mens-basketball/roster", staffUrl: "https://uabsports.com/sports/mens-basketball/coaches" },
  { name: "UTSA", mascot: "Roadrunners", conference: "American", website: "goutsa.com", rosterUrl: "https://goutsa.com/sports/mens-basketball/roster", staffUrl: "https://goutsa.com/sports/mens-basketball/coaches" },
  { name: "Wichita State", mascot: "Shockers", conference: "American", website: "goshockers.com", rosterUrl: "https://goshockers.com/sports/mens-basketball/roster", staffUrl: "https://goshockers.com/sports/mens-basketball/coaches" },

  // Mountain West (11 teams)
  { name: "Air Force", mascot: "Falcons", conference: "Mountain West", website: "goairforcefalcons.com", rosterUrl: "https://goairforcefalcons.com/sports/mens-basketball/roster", staffUrl: "https://goairforcefalcons.com/sports/mens-basketball/coaches" },
  { name: "Boise State", mascot: "Broncos", conference: "Mountain West", website: "broncosports.com", rosterUrl: "https://broncosports.com/sports/mens-basketball/roster", staffUrl: "https://broncosports.com/sports/mens-basketball/coaches" },
  { name: "Colorado State", mascot: "Rams", conference: "Mountain West", website: "csurams.com", rosterUrl: "https://csurams.com/sports/mens-basketball/roster", staffUrl: "https://csurams.com/sports/mens-basketball/coaches" },
  { name: "Fresno State", mascot: "Bulldogs", conference: "Mountain West", website: "gobulldogs.com", rosterUrl: "https://gobulldogs.com/sports/mens-basketball/roster", staffUrl: "https://gobulldogs.com/sports/mens-basketball/coaches" },
  { name: "Nevada", mascot: "Wolf Pack", conference: "Mountain West", website: "nevadawolfpack.com", rosterUrl: "https://nevadawolfpack.com/sports/mens-basketball/roster", staffUrl: "https://nevadawolfpack.com/sports/mens-basketball/coaches" },
  { name: "New Mexico", mascot: "Lobos", conference: "Mountain West", website: "golobos.com", rosterUrl: "https://golobos.com/sports/mens-basketball/roster", staffUrl: "https://golobos.com/sports/mens-basketball/coaches" },
  { name: "San Diego State", mascot: "Aztecs", conference: "Mountain West", website: "goaztecs.com", rosterUrl: "https://goaztecs.com/sports/mens-basketball/roster", staffUrl: "https://goaztecs.com/sports/mens-basketball/coaches" },
  { name: "San Jose State", mascot: "Spartans", conference: "Mountain West", website: "sjsuspartans.com", rosterUrl: "https://sjsuspartans.com/sports/mens-basketball/roster", staffUrl: "https://sjsuspartans.com/sports/mens-basketball/coaches" },
  { name: "UNLV", mascot: "Rebels", conference: "Mountain West", website: "unlvrebels.com", rosterUrl: "https://unlvrebels.com/sports/mens-basketball/roster", staffUrl: "https://unlvrebels.com/sports/mens-basketball/coaches" },
  { name: "Utah State", mascot: "Aggies", conference: "Mountain West", website: "utahstateaggies.com", rosterUrl: "https://utahstateaggies.com/sports/mens-basketball/roster", staffUrl: "https://utahstateaggies.com/sports/mens-basketball/coaches" },
  { name: "Wyoming", mascot: "Cowboys", conference: "Mountain West", website: "gowyo.com", rosterUrl: "https://gowyo.com/sports/mens-basketball/roster", staffUrl: "https://gowyo.com/sports/mens-basketball/coaches" },

  // WCC (10 teams)
  { name: "Gonzaga", mascot: "Bulldogs", conference: "WCC", website: "gozags.com", rosterUrl: "https://gozags.com/sports/mens-basketball/roster", staffUrl: "https://gozags.com/sports/mens-basketball/coaches" },
  { name: "Loyola Marymount", mascot: "Lions", conference: "WCC", website: "lmulions.com", rosterUrl: "https://lmulions.com/sports/mens-basketball/roster", staffUrl: "https://lmulions.com/sports/mens-basketball/coaches" },
  { name: "Oregon State", mascot: "Beavers", conference: "WCC", website: "osubeavers.com", rosterUrl: "https://osubeavers.com/sports/mens-basketball/roster", staffUrl: "https://osubeavers.com/sports/mens-basketball/coaches" },
  { name: "Pacific", mascot: "Tigers", conference: "WCC", website: "pacifictigers.com", rosterUrl: "https://pacifictigers.com/sports/mens-basketball/roster", staffUrl: "https://pacifictigers.com/sports/mens-basketball/coaches" },
  { name: "Pepperdine", mascot: "Waves", conference: "WCC", website: "pepperdinewaves.com", rosterUrl: "https://pepperdinewaves.com/sports/mens-basketball/roster", staffUrl: "https://pepperdinewaves.com/sports/mens-basketball/coaches" },
  { name: "Portland", mascot: "Pilots", conference: "WCC", website: "portlandpilots.com", rosterUrl: "https://portlandpilots.com/sports/mens-basketball/roster", staffUrl: "https://portlandpilots.com/sports/mens-basketball/coaches" },
  { name: "Saint Mary's", mascot: "Gaels", conference: "WCC", website: "smcgaels.com", rosterUrl: "https://smcgaels.com/sports/mens-basketball/roster", staffUrl: "https://smcgaels.com/sports/mens-basketball/coaches" },
  { name: "San Diego", mascot: "Toreros", conference: "WCC", website: "usdtoreros.com", rosterUrl: "https://usdtoreros.com/sports/mens-basketball/roster", staffUrl: "https://usdtoreros.com/sports/mens-basketball/coaches" },
  { name: "San Francisco", mascot: "Dons", conference: "WCC", website: "usfdons.com", rosterUrl: "https://usfdons.com/sports/mens-basketball/roster", staffUrl: "https://usfdons.com/sports/mens-basketball/coaches" },
  { name: "Santa Clara", mascot: "Broncos", conference: "WCC", website: "santaclarabroncos.com", rosterUrl: "https://santaclarabroncos.com/sports/mens-basketball/roster", staffUrl: "https://santaclarabroncos.com/sports/mens-basketball/coaches" },

  // Atlantic 10 (15 teams)
  { name: "Davidson", mascot: "Wildcats", conference: "A-10", website: "davidsonwildcats.com", rosterUrl: "https://davidsonwildcats.com/sports/mens-basketball/roster", staffUrl: "https://davidsonwildcats.com/sports/mens-basketball/coaches" },
  { name: "Dayton", mascot: "Flyers", conference: "A-10", website: "daytonflyers.com", rosterUrl: "https://daytonflyers.com/sports/mens-basketball/roster", staffUrl: "https://daytonflyers.com/sports/mens-basketball/coaches" },
  { name: "Duquesne", mascot: "Dukes", conference: "A-10", website: "goduquesne.com", rosterUrl: "https://goduquesne.com/sports/mens-basketball/roster", staffUrl: "https://goduquesne.com/sports/mens-basketball/coaches" },
  { name: "Fordham", mascot: "Rams", conference: "A-10", website: "fordhamsports.com", rosterUrl: "https://fordhamsports.com/sports/mens-basketball/roster", staffUrl: "https://fordhamsports.com/sports/mens-basketball/coaches" },
  { name: "George Mason", mascot: "Patriots", conference: "A-10", website: "gomason.com", rosterUrl: "https://gomason.com/sports/mens-basketball/roster", staffUrl: "https://gomason.com/sports/mens-basketball/coaches" },
  { name: "George Washington", mascot: "Revolutionaries", conference: "A-10", website: "gwsports.com", rosterUrl: "https://gwsports.com/sports/mens-basketball/roster", staffUrl: "https://gwsports.com/sports/mens-basketball/coaches" },
  { name: "La Salle", mascot: "Explorers", conference: "A-10", website: "goexplorers.com", rosterUrl: "https://goexplorers.com/sports/mens-basketball/roster", staffUrl: "https://goexplorers.com/sports/mens-basketball/coaches" },
  { name: "Loyola Chicago", mascot: "Ramblers", conference: "A-10", website: "loyolaramblers.com", rosterUrl: "https://loyolaramblers.com/sports/mens-basketball/roster", staffUrl: "https://loyolaramblers.com/sports/mens-basketball/coaches" },
  { name: "UMass", mascot: "Minutemen", conference: "A-10", website: "umassathletics.com", rosterUrl: "https://umassathletics.com/sports/mens-basketball/roster", staffUrl: "https://umassathletics.com/sports/mens-basketball/coaches" },
  { name: "Rhode Island", mascot: "Rams", conference: "A-10", website: "gorhody.com", rosterUrl: "https://gorhody.com/sports/mens-basketball/roster", staffUrl: "https://gorhody.com/sports/mens-basketball/coaches" },
  { name: "Richmond", mascot: "Spiders", conference: "A-10", website: "richmondspiders.com", rosterUrl: "https://richmondspiders.com/sports/mens-basketball/roster", staffUrl: "https://richmondspiders.com/sports/mens-basketball/coaches" },
  { name: "Saint Joseph's", mascot: "Hawks", conference: "A-10", website: "sjuhawks.com", rosterUrl: "https://sjuhawks.com/sports/mens-basketball/roster", staffUrl: "https://sjuhawks.com/sports/mens-basketball/coaches" },
  { name: "Saint Louis", mascot: "Billikens", conference: "A-10", website: "slubillikens.com", rosterUrl: "https://slubillikens.com/sports/mens-basketball/roster", staffUrl: "https://slubillikens.com/sports/mens-basketball/coaches" },
  { name: "St. Bonaventure", mascot: "Bonnies", conference: "A-10", website: "gobonnies.com", rosterUrl: "https://gobonnies.com/sports/mens-basketball/roster", staffUrl: "https://gobonnies.com/sports/mens-basketball/coaches" },
  { name: "VCU", mascot: "Rams", conference: "A-10", website: "vcuathletics.com", rosterUrl: "https://vcuathletics.com/sports/mens-basketball/roster", staffUrl: "https://vcuathletics.com/sports/mens-basketball/coaches" },

  // ═══════════════════════════════════════════════════════════════════════════
  // MID-MAJOR CONFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  // Missouri Valley (12 teams)
  { name: "Belmont", mascot: "Bruins", conference: "MVC", website: "belmontbruins.com", rosterUrl: "https://belmontbruins.com/sports/mens-basketball/roster", staffUrl: "https://belmontbruins.com/sports/mens-basketball/coaches" },
  { name: "Bradley", mascot: "Braves", conference: "MVC", website: "bradleybraves.com", rosterUrl: "https://bradleybraves.com/sports/mens-basketball/roster", staffUrl: "https://bradleybraves.com/sports/mens-basketball/coaches" },
  { name: "Drake", mascot: "Bulldogs", conference: "MVC", website: "godrakebulldogs.com", rosterUrl: "https://godrakebulldogs.com/sports/mens-basketball/roster", staffUrl: "https://godrakebulldogs.com/sports/mens-basketball/coaches" },
  { name: "Evansville", mascot: "Purple Aces", conference: "MVC", website: "gopurpleaces.com", rosterUrl: "https://gopurpleaces.com/sports/mens-basketball/roster", staffUrl: "https://gopurpleaces.com/sports/mens-basketball/coaches" },
  { name: "Illinois State", mascot: "Redbirds", conference: "MVC", website: "goredbirds.com", rosterUrl: "https://goredbirds.com/sports/mens-basketball/roster", staffUrl: "https://goredbirds.com/sports/mens-basketball/coaches" },
  { name: "Indiana State", mascot: "Sycamores", conference: "MVC", website: "gosycamores.com", rosterUrl: "https://gosycamores.com/sports/mens-basketball/roster", staffUrl: "https://gosycamores.com/sports/mens-basketball/coaches" },
  { name: "Missouri State", mascot: "Bears", conference: "MVC", website: "missouristatebears.com", rosterUrl: "https://missouristatebears.com/sports/mens-basketball/roster", staffUrl: "https://missouristatebears.com/sports/mens-basketball/coaches" },
  { name: "Murray State", mascot: "Racers", conference: "MVC", website: "goracers.com", rosterUrl: "https://goracers.com/sports/mens-basketball/roster", staffUrl: "https://goracers.com/sports/mens-basketball/coaches" },
  { name: "Northern Iowa", mascot: "Panthers", conference: "MVC", website: "unipanthers.com", rosterUrl: "https://unipanthers.com/sports/mens-basketball/roster", staffUrl: "https://unipanthers.com/sports/mens-basketball/coaches" },
  { name: "Southern Illinois", mascot: "Salukis", conference: "MVC", website: "siusalukis.com", rosterUrl: "https://siusalukis.com/sports/mens-basketball/roster", staffUrl: "https://siusalukis.com/sports/mens-basketball/coaches" },
  { name: "UIC", mascot: "Flames", conference: "MVC", website: "uicflames.com", rosterUrl: "https://uicflames.com/sports/mens-basketball/roster", staffUrl: "https://uicflames.com/sports/mens-basketball/coaches" },
  { name: "Valparaiso", mascot: "Beacons", conference: "MVC", website: "valpoathletics.com", rosterUrl: "https://valpoathletics.com/sports/mens-basketball/roster", staffUrl: "https://valpoathletics.com/sports/mens-basketball/coaches" },

  // MAC (12 teams)
  { name: "Akron", mascot: "Zips", conference: "MAC", website: "gozips.com", rosterUrl: "https://gozips.com/sports/mens-basketball/roster", staffUrl: "https://gozips.com/sports/mens-basketball/coaches" },
  { name: "Ball State", mascot: "Cardinals", conference: "MAC", website: "ballstatesports.com", rosterUrl: "https://ballstatesports.com/sports/mens-basketball/roster", staffUrl: "https://ballstatesports.com/sports/mens-basketball/coaches" },
  { name: "Bowling Green", mascot: "Falcons", conference: "MAC", website: "bgsufalcons.com", rosterUrl: "https://bgsufalcons.com/sports/mens-basketball/roster", staffUrl: "https://bgsufalcons.com/sports/mens-basketball/coaches" },
  { name: "Buffalo", mascot: "Bulls", conference: "MAC", website: "ubbulls.com", rosterUrl: "https://ubbulls.com/sports/mens-basketball/roster", staffUrl: "https://ubbulls.com/sports/mens-basketball/coaches" },
  { name: "Central Michigan", mascot: "Chippewas", conference: "MAC", website: "cmuchippewas.com", rosterUrl: "https://cmuchippewas.com/sports/mens-basketball/roster", staffUrl: "https://cmuchippewas.com/sports/mens-basketball/coaches" },
  { name: "Eastern Michigan", mascot: "Eagles", conference: "MAC", website: "emueagles.com", rosterUrl: "https://emueagles.com/sports/mens-basketball/roster", staffUrl: "https://emueagles.com/sports/mens-basketball/coaches" },
  { name: "Kent State", mascot: "Golden Flashes", conference: "MAC", website: "kentstatesports.com", rosterUrl: "https://kentstatesports.com/sports/mens-basketball/roster", staffUrl: "https://kentstatesports.com/sports/mens-basketball/coaches" },
  { name: "Miami (OH)", mascot: "RedHawks", conference: "MAC", website: "miamiredhawks.com", rosterUrl: "https://miamiredhawks.com/sports/mens-basketball/roster", staffUrl: "https://miamiredhawks.com/sports/mens-basketball/coaches" },
  { name: "Northern Illinois", mascot: "Huskies", conference: "MAC", website: "niuhuskies.com", rosterUrl: "https://niuhuskies.com/sports/mens-basketball/roster", staffUrl: "https://niuhuskies.com/sports/mens-basketball/coaches" },
  { name: "Ohio", mascot: "Bobcats", conference: "MAC", website: "ohiobobcats.com", rosterUrl: "https://ohiobobcats.com/sports/mens-basketball/roster", staffUrl: "https://ohiobobcats.com/sports/mens-basketball/coaches" },
  { name: "Toledo", mascot: "Rockets", conference: "MAC", website: "utrockets.com", rosterUrl: "https://utrockets.com/sports/mens-basketball/roster", staffUrl: "https://utrockets.com/sports/mens-basketball/coaches" },
  { name: "Western Michigan", mascot: "Broncos", conference: "MAC", website: "wmubroncos.com", rosterUrl: "https://wmubroncos.com/sports/mens-basketball/roster", staffUrl: "https://wmubroncos.com/sports/mens-basketball/coaches" },

  // Conference USA (10 teams)
  { name: "FIU", mascot: "Panthers", conference: "C-USA", website: "fiusports.com", rosterUrl: "https://fiusports.com/sports/mens-basketball/roster", staffUrl: "https://fiusports.com/sports/mens-basketball/coaches" },
  { name: "Jacksonville State", mascot: "Gamecocks", conference: "C-USA", website: "jsugamecocksports.com", rosterUrl: "https://jsugamecocksports.com/sports/mens-basketball/roster", staffUrl: "https://jsugamecocksports.com/sports/mens-basketball/coaches" },
  { name: "Kennesaw State", mascot: "Owls", conference: "C-USA", website: "ksuowls.com", rosterUrl: "https://ksuowls.com/sports/mens-basketball/roster", staffUrl: "https://ksuowls.com/sports/mens-basketball/coaches" },
  { name: "Liberty", mascot: "Flames", conference: "C-USA", website: "libertyflames.com", rosterUrl: "https://libertyflames.com/sports/mens-basketball/roster", staffUrl: "https://libertyflames.com/sports/mens-basketball/coaches" },
  { name: "Louisiana Tech", mascot: "Bulldogs", conference: "C-USA", website: "latechsports.com", rosterUrl: "https://latechsports.com/sports/mens-basketball/roster", staffUrl: "https://latechsports.com/sports/mens-basketball/coaches" },
  { name: "Middle Tennessee", mascot: "Blue Raiders", conference: "C-USA", website: "goblueraiders.com", rosterUrl: "https://goblueraiders.com/sports/mens-basketball/roster", staffUrl: "https://goblueraiders.com/sports/mens-basketball/coaches" },
  { name: "New Mexico State", mascot: "Aggies", conference: "C-USA", website: "nmstatesports.com", rosterUrl: "https://nmstatesports.com/sports/mens-basketball/roster", staffUrl: "https://nmstatesports.com/sports/mens-basketball/coaches" },
  { name: "Sam Houston", mascot: "Bearkats", conference: "C-USA", website: "gobearkats.com", rosterUrl: "https://gobearkats.com/sports/mens-basketball/roster", staffUrl: "https://gobearkats.com/sports/mens-basketball/coaches" },
  { name: "UTEP", mascot: "Miners", conference: "C-USA", website: "utepathletics.com", rosterUrl: "https://utepathletics.com/sports/mens-basketball/roster", staffUrl: "https://utepathletics.com/sports/mens-basketball/coaches" },
  { name: "Western Kentucky", mascot: "Hilltoppers", conference: "C-USA", website: "wkusports.com", rosterUrl: "https://wkusports.com/sports/mens-basketball/roster", staffUrl: "https://wkusports.com/sports/mens-basketball/coaches" },

  // Sun Belt (14 teams)
  { name: "Appalachian State", mascot: "Mountaineers", conference: "Sun Belt", website: "appstatesports.com", rosterUrl: "https://appstatesports.com/sports/mens-basketball/roster", staffUrl: "https://appstatesports.com/sports/mens-basketball/coaches" },
  { name: "Arkansas State", mascot: "Red Wolves", conference: "Sun Belt", website: "astateredwolves.com", rosterUrl: "https://astateredwolves.com/sports/mens-basketball/roster", staffUrl: "https://astateredwolves.com/sports/mens-basketball/coaches" },
  { name: "Coastal Carolina", mascot: "Chanticleers", conference: "Sun Belt", website: "goccusports.com", rosterUrl: "https://goccusports.com/sports/mens-basketball/roster", staffUrl: "https://goccusports.com/sports/mens-basketball/coaches" },
  { name: "Georgia Southern", mascot: "Eagles", conference: "Sun Belt", website: "gseagles.com", rosterUrl: "https://gseagles.com/sports/mens-basketball/roster", staffUrl: "https://gseagles.com/sports/mens-basketball/coaches" },
  { name: "Georgia State", mascot: "Panthers", conference: "Sun Belt", website: "georgiastatesports.com", rosterUrl: "https://georgiastatesports.com/sports/mens-basketball/roster", staffUrl: "https://georgiastatesports.com/sports/mens-basketball/coaches" },
  { name: "James Madison", mascot: "Dukes", conference: "Sun Belt", website: "jmusports.com", rosterUrl: "https://jmusports.com/sports/mens-basketball/roster", staffUrl: "https://jmusports.com/sports/mens-basketball/coaches" },
  { name: "Louisiana", mascot: "Ragin' Cajuns", conference: "Sun Belt", website: "ragincajuns.com", rosterUrl: "https://ragincajuns.com/sports/mens-basketball/roster", staffUrl: "https://ragincajuns.com/sports/mens-basketball/coaches" },
  { name: "Marshall", mascot: "Thundering Herd", conference: "Sun Belt", website: "herdzone.com", rosterUrl: "https://herdzone.com/sports/mens-basketball/roster", staffUrl: "https://herdzone.com/sports/mens-basketball/coaches" },
  { name: "Old Dominion", mascot: "Monarchs", conference: "Sun Belt", website: "odusports.com", rosterUrl: "https://odusports.com/sports/mens-basketball/roster", staffUrl: "https://odusports.com/sports/mens-basketball/coaches" },
  { name: "South Alabama", mascot: "Jaguars", conference: "Sun Belt", website: "usajaguars.com", rosterUrl: "https://usajaguars.com/sports/mens-basketball/roster", staffUrl: "https://usajaguars.com/sports/mens-basketball/coaches" },
  { name: "Southern Miss", mascot: "Golden Eagles", conference: "Sun Belt", website: "southernmiss.com", rosterUrl: "https://southernmiss.com/sports/mens-basketball/roster", staffUrl: "https://southernmiss.com/sports/mens-basketball/coaches" },
  { name: "Texas State", mascot: "Bobcats", conference: "Sun Belt", website: "txstatebobcats.com", rosterUrl: "https://txstatebobcats.com/sports/mens-basketball/roster", staffUrl: "https://txstatebobcats.com/sports/mens-basketball/coaches" },
  { name: "Troy", mascot: "Trojans", conference: "Sun Belt", website: "troytrojans.com", rosterUrl: "https://troytrojans.com/sports/mens-basketball/roster", staffUrl: "https://troytrojans.com/sports/mens-basketball/coaches" },
  { name: "ULM", mascot: "Warhawks", conference: "Sun Belt", website: "ulmwarhawks.com", rosterUrl: "https://ulmwarhawks.com/sports/mens-basketball/roster", staffUrl: "https://ulmwarhawks.com/sports/mens-basketball/coaches" },

  // CAA (13 teams)
  { name: "Campbell", mascot: "Fighting Camels", conference: "CAA", website: "gocamels.com", rosterUrl: "https://gocamels.com/sports/mens-basketball/roster", staffUrl: "https://gocamels.com/sports/mens-basketball/coaches" },
  { name: "Charleston", mascot: "Cougars", conference: "CAA", website: "cofcsports.com", rosterUrl: "https://cofcsports.com/sports/mens-basketball/roster", staffUrl: "https://cofcsports.com/sports/mens-basketball/coaches" },
  { name: "Delaware", mascot: "Blue Hens", conference: "CAA", website: "bluehens.com", rosterUrl: "https://bluehens.com/sports/mens-basketball/roster", staffUrl: "https://bluehens.com/sports/mens-basketball/coaches" },
  { name: "Drexel", mascot: "Dragons", conference: "CAA", website: "drexeldragons.com", rosterUrl: "https://drexeldragons.com/sports/mens-basketball/roster", staffUrl: "https://drexeldragons.com/sports/mens-basketball/coaches" },
  { name: "Elon", mascot: "Phoenix", conference: "CAA", website: "elonphoenix.com", rosterUrl: "https://elonphoenix.com/sports/mens-basketball/roster", staffUrl: "https://elonphoenix.com/sports/mens-basketball/coaches" },
  { name: "Hampton", mascot: "Pirates", conference: "CAA", website: "hamptonpirates.com", rosterUrl: "https://hamptonpirates.com/sports/mens-basketball/roster", staffUrl: "https://hamptonpirates.com/sports/mens-basketball/coaches" },
  { name: "Hofstra", mascot: "Pride", conference: "CAA", website: "gohofstra.com", rosterUrl: "https://gohofstra.com/sports/mens-basketball/roster", staffUrl: "https://gohofstra.com/sports/mens-basketball/coaches" },
  { name: "Monmouth", mascot: "Hawks", conference: "CAA", website: "monmouthhawks.com", rosterUrl: "https://monmouthhawks.com/sports/mens-basketball/roster", staffUrl: "https://monmouthhawks.com/sports/mens-basketball/coaches" },
  { name: "North Carolina A&T", mascot: "Aggies", conference: "CAA", website: "ncataggies.com", rosterUrl: "https://ncataggies.com/sports/mens-basketball/roster", staffUrl: "https://ncataggies.com/sports/mens-basketball/coaches" },
  { name: "Northeastern", mascot: "Huskies", conference: "CAA", website: "gonu.com", rosterUrl: "https://gonu.com/sports/mens-basketball/roster", staffUrl: "https://gonu.com/sports/mens-basketball/coaches" },
  { name: "Stony Brook", mascot: "Seawolves", conference: "CAA", website: "stonybrookathletics.com", rosterUrl: "https://stonybrookathletics.com/sports/mens-basketball/roster", staffUrl: "https://stonybrookathletics.com/sports/mens-basketball/coaches" },
  { name: "Towson", mascot: "Tigers", conference: "CAA", website: "towsontigers.com", rosterUrl: "https://towsontigers.com/sports/mens-basketball/roster", staffUrl: "https://towsontigers.com/sports/mens-basketball/coaches" },
  { name: "William & Mary", mascot: "Tribe", conference: "CAA", website: "tribeathletics.com", rosterUrl: "https://tribeathletics.com/sports/mens-basketball/roster", staffUrl: "https://tribeathletics.com/sports/mens-basketball/coaches" },

  // Ivy League (8 teams)
  { name: "Brown", mascot: "Bears", conference: "Ivy", website: "brownbears.com", rosterUrl: "https://brownbears.com/sports/mens-basketball/roster", staffUrl: "https://brownbears.com/sports/mens-basketball/coaches" },
  { name: "Columbia", mascot: "Lions", conference: "Ivy", website: "gocolumbialions.com", rosterUrl: "https://gocolumbialions.com/sports/mens-basketball/roster", staffUrl: "https://gocolumbialions.com/sports/mens-basketball/coaches" },
  { name: "Cornell", mascot: "Big Red", conference: "Ivy", website: "cornellbigred.com", rosterUrl: "https://cornellbigred.com/sports/mens-basketball/roster", staffUrl: "https://cornellbigred.com/sports/mens-basketball/coaches" },
  { name: "Dartmouth", mascot: "Big Green", conference: "Ivy", website: "dartmouthsports.com", rosterUrl: "https://dartmouthsports.com/sports/mens-basketball/roster", staffUrl: "https://dartmouthsports.com/sports/mens-basketball/coaches" },
  { name: "Harvard", mascot: "Crimson", conference: "Ivy", website: "gocrimson.com", rosterUrl: "https://gocrimson.com/sports/mens-basketball/roster", staffUrl: "https://gocrimson.com/sports/mens-basketball/coaches" },
  { name: "Penn", mascot: "Quakers", conference: "Ivy", website: "pennathletics.com", rosterUrl: "https://pennathletics.com/sports/mens-basketball/roster", staffUrl: "https://pennathletics.com/sports/mens-basketball/coaches" },
  { name: "Princeton", mascot: "Tigers", conference: "Ivy", website: "goprincetontigers.com", rosterUrl: "https://goprincetontigers.com/sports/mens-basketball/roster", staffUrl: "https://goprincetontigers.com/sports/mens-basketball/coaches" },
  { name: "Yale", mascot: "Bulldogs", conference: "Ivy", website: "yalebulldogs.com", rosterUrl: "https://yalebulldogs.com/sports/mens-basketball/roster", staffUrl: "https://yalebulldogs.com/sports/mens-basketball/coaches" },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOW-MAJOR CONFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  // Horizon League (12 teams)
  { name: "Cleveland State", mascot: "Vikings", conference: "Horizon", website: "csvikings.com", rosterUrl: "https://csvikings.com/sports/mens-basketball/roster", staffUrl: "https://csvikings.com/sports/mens-basketball/coaches" },
  { name: "Detroit Mercy", mascot: "Titans", conference: "Horizon", website: "detroittitans.com", rosterUrl: "https://detroittitans.com/sports/mens-basketball/roster", staffUrl: "https://detroittitans.com/sports/mens-basketball/coaches" },
  { name: "Green Bay", mascot: "Phoenix", conference: "Horizon", website: "greenbayphoenix.com", rosterUrl: "https://greenbayphoenix.com/sports/mens-basketball/roster", staffUrl: "https://greenbayphoenix.com/sports/mens-basketball/coaches" },
  { name: "IUPUI", mascot: "Jaguars", conference: "Horizon", website: "iupuijags.com", rosterUrl: "https://iupuijags.com/sports/mens-basketball/roster", staffUrl: "https://iupuijags.com/sports/mens-basketball/coaches" },
  { name: "Milwaukee", mascot: "Panthers", conference: "Horizon", website: "mkepanthers.com", rosterUrl: "https://mkepanthers.com/sports/mens-basketball/roster", staffUrl: "https://mkepanthers.com/sports/mens-basketball/coaches" },
  { name: "Northern Kentucky", mascot: "Norse", conference: "Horizon", website: "nkunorse.com", rosterUrl: "https://nkunorse.com/sports/mens-basketball/roster", staffUrl: "https://nkunorse.com/sports/mens-basketball/coaches" },
  { name: "Oakland", mascot: "Golden Grizzlies", conference: "Horizon", website: "goldengrizzlies.com", rosterUrl: "https://goldengrizzlies.com/sports/mens-basketball/roster", staffUrl: "https://goldengrizzlies.com/sports/mens-basketball/coaches" },
  { name: "Purdue Fort Wayne", mascot: "Mastodons", conference: "Horizon", website: "gomastodons.com", rosterUrl: "https://gomastodons.com/sports/mens-basketball/roster", staffUrl: "https://gomastodons.com/sports/mens-basketball/coaches" },
  { name: "Robert Morris", mascot: "Colonials", conference: "Horizon", website: "rmucolonials.com", rosterUrl: "https://rmucolonials.com/sports/mens-basketball/roster", staffUrl: "https://rmucolonials.com/sports/mens-basketball/coaches" },
  { name: "Wright State", mascot: "Raiders", conference: "Horizon", website: "wsuraiders.com", rosterUrl: "https://wsuraiders.com/sports/mens-basketball/roster", staffUrl: "https://wsuraiders.com/sports/mens-basketball/coaches" },
  { name: "Youngstown State", mascot: "Penguins", conference: "Horizon", website: "ysusports.com", rosterUrl: "https://ysusports.com/sports/mens-basketball/roster", staffUrl: "https://ysusports.com/sports/mens-basketball/coaches" },

  // MAAC (11 teams)
  { name: "Canisius", mascot: "Golden Griffins", conference: "MAAC", website: "gogriffs.com", rosterUrl: "https://gogriffs.com/sports/mens-basketball/roster", staffUrl: "https://gogriffs.com/sports/mens-basketball/coaches" },
  { name: "Fairfield", mascot: "Stags", conference: "MAAC", website: "fairfieldstags.com", rosterUrl: "https://fairfieldstags.com/sports/mens-basketball/roster", staffUrl: "https://fairfieldstags.com/sports/mens-basketball/coaches" },
  { name: "Iona", mascot: "Gaels", conference: "MAAC", website: "icgaels.com", rosterUrl: "https://icgaels.com/sports/mens-basketball/roster", staffUrl: "https://icgaels.com/sports/mens-basketball/coaches" },
  { name: "Manhattan", mascot: "Jaspers", conference: "MAAC", website: "gojaspers.com", rosterUrl: "https://gojaspers.com/sports/mens-basketball/roster", staffUrl: "https://gojaspers.com/sports/mens-basketball/coaches" },
  { name: "Marist", mascot: "Red Foxes", conference: "MAAC", website: "goredfoxes.com", rosterUrl: "https://goredfoxes.com/sports/mens-basketball/roster", staffUrl: "https://goredfoxes.com/sports/mens-basketball/coaches" },
  { name: "Mount St. Mary's", mascot: "Mountaineers", conference: "MAAC", website: "msmounties.com", rosterUrl: "https://msmounties.com/sports/mens-basketball/roster", staffUrl: "https://msmounties.com/sports/mens-basketball/coaches" },
  { name: "Niagara", mascot: "Purple Eagles", conference: "MAAC", website: "purpleeagles.com", rosterUrl: "https://purpleeagles.com/sports/mens-basketball/roster", staffUrl: "https://purpleeagles.com/sports/mens-basketball/coaches" },
  { name: "Quinnipiac", mascot: "Bobcats", conference: "MAAC", website: "quinnipiacbobcats.com", rosterUrl: "https://quinnipiacbobcats.com/sports/mens-basketball/roster", staffUrl: "https://quinnipiacbobcats.com/sports/mens-basketball/coaches" },
  { name: "Rider", mascot: "Broncs", conference: "MAAC", website: "gobroncs.com", rosterUrl: "https://gobroncs.com/sports/mens-basketball/roster", staffUrl: "https://gobroncs.com/sports/mens-basketball/coaches" },
  { name: "Sacred Heart", mascot: "Pioneers", conference: "MAAC", website: "sacredheartpioneers.com", rosterUrl: "https://sacredheartpioneers.com/sports/mens-basketball/roster", staffUrl: "https://sacredheartpioneers.com/sports/mens-basketball/coaches" },
  { name: "Siena", mascot: "Saints", conference: "MAAC", website: "sienasaints.com", rosterUrl: "https://sienasaints.com/sports/mens-basketball/roster", staffUrl: "https://sienasaints.com/sports/mens-basketball/coaches" },

  // Patriot League (10 teams)
  { name: "American", mascot: "Eagles", conference: "Patriot", website: "aueagles.com", rosterUrl: "https://aueagles.com/sports/mens-basketball/roster", staffUrl: "https://aueagles.com/sports/mens-basketball/coaches" },
  { name: "Army", mascot: "Black Knights", conference: "Patriot", website: "goarmywestpoint.com", rosterUrl: "https://goarmywestpoint.com/sports/mens-basketball/roster", staffUrl: "https://goarmywestpoint.com/sports/mens-basketball/coaches" },
  { name: "Boston University", mascot: "Terriers", conference: "Patriot", website: "goterriers.com", rosterUrl: "https://goterriers.com/sports/mens-basketball/roster", staffUrl: "https://goterriers.com/sports/mens-basketball/coaches" },
  { name: "Bucknell", mascot: "Bison", conference: "Patriot", website: "bucknellbison.com", rosterUrl: "https://bucknellbison.com/sports/mens-basketball/roster", staffUrl: "https://bucknellbison.com/sports/mens-basketball/coaches" },
  { name: "Colgate", mascot: "Raiders", conference: "Patriot", website: "gocolgateraiders.com", rosterUrl: "https://gocolgateraiders.com/sports/mens-basketball/roster", staffUrl: "https://gocolgateraiders.com/sports/mens-basketball/coaches" },
  { name: "Holy Cross", mascot: "Crusaders", conference: "Patriot", website: "goholycross.com", rosterUrl: "https://goholycross.com/sports/mens-basketball/roster", staffUrl: "https://goholycross.com/sports/mens-basketball/coaches" },
  { name: "Lafayette", mascot: "Leopards", conference: "Patriot", website: "goleopards.com", rosterUrl: "https://goleopards.com/sports/mens-basketball/roster", staffUrl: "https://goleopards.com/sports/mens-basketball/coaches" },
  { name: "Lehigh", mascot: "Mountain Hawks", conference: "Patriot", website: "lehighsports.com", rosterUrl: "https://lehighsports.com/sports/mens-basketball/roster", staffUrl: "https://lehighsports.com/sports/mens-basketball/coaches" },
  { name: "Loyola Maryland", mascot: "Greyhounds", conference: "Patriot", website: "loyolagreyhounds.com", rosterUrl: "https://loyolagreyhounds.com/sports/mens-basketball/roster", staffUrl: "https://loyolagreyhounds.com/sports/mens-basketball/coaches" },
  { name: "Navy", mascot: "Midshipmen", conference: "Patriot", website: "navysports.com", rosterUrl: "https://navysports.com/sports/mens-basketball/roster", staffUrl: "https://navysports.com/sports/mens-basketball/coaches" },

  // Southern Conference (10 teams)
  { name: "Chattanooga", mascot: "Mocs", conference: "SoCon", website: "gomocs.com", rosterUrl: "https://gomocs.com/sports/mens-basketball/roster", staffUrl: "https://gomocs.com/sports/mens-basketball/coaches" },
  { name: "ETSU", mascot: "Buccaneers", conference: "SoCon", website: "etsubucs.com", rosterUrl: "https://etsubucs.com/sports/mens-basketball/roster", staffUrl: "https://etsubucs.com/sports/mens-basketball/coaches" },
  { name: "Furman", mascot: "Paladins", conference: "SoCon", website: "furmanpaladins.com", rosterUrl: "https://furmanpaladins.com/sports/mens-basketball/roster", staffUrl: "https://furmanpaladins.com/sports/mens-basketball/coaches" },
  { name: "Mercer", mascot: "Bears", conference: "SoCon", website: "mercerbears.com", rosterUrl: "https://mercerbears.com/sports/mens-basketball/roster", staffUrl: "https://mercerbears.com/sports/mens-basketball/coaches" },
  { name: "Samford", mascot: "Bulldogs", conference: "SoCon", website: "samfordsports.com", rosterUrl: "https://samfordsports.com/sports/mens-basketball/roster", staffUrl: "https://samfordsports.com/sports/mens-basketball/coaches" },
  { name: "The Citadel", mascot: "Bulldogs", conference: "SoCon", website: "citadelsports.com", rosterUrl: "https://citadelsports.com/sports/mens-basketball/roster", staffUrl: "https://citadelsports.com/sports/mens-basketball/coaches" },
  { name: "UNC Greensboro", mascot: "Spartans", conference: "SoCon", website: "uncgspartans.com", rosterUrl: "https://uncgspartans.com/sports/mens-basketball/roster", staffUrl: "https://uncgspartans.com/sports/mens-basketball/coaches" },
  { name: "VMI", mascot: "Keydets", conference: "SoCon", website: "vmikeydets.com", rosterUrl: "https://vmikeydets.com/sports/mens-basketball/roster", staffUrl: "https://vmikeydets.com/sports/mens-basketball/coaches" },
  { name: "Western Carolina", mascot: "Catamounts", conference: "SoCon", website: "catamountsports.com", rosterUrl: "https://catamountsports.com/sports/mens-basketball/roster", staffUrl: "https://catamountsports.com/sports/mens-basketball/coaches" },
  { name: "Wofford", mascot: "Terriers", conference: "SoCon", website: "woffordterriers.com", rosterUrl: "https://woffordterriers.com/sports/mens-basketball/roster", staffUrl: "https://woffordterriers.com/sports/mens-basketball/coaches" },

  // America East (10 teams)
  { name: "Albany", mascot: "Great Danes", conference: "America East", website: "ualbanysports.com", rosterUrl: "https://ualbanysports.com/sports/mens-basketball/roster", staffUrl: "https://ualbanysports.com/sports/mens-basketball/coaches" },
  { name: "Binghamton", mascot: "Bearcats", conference: "America East", website: "bubearcats.com", rosterUrl: "https://bubearcats.com/sports/mens-basketball/roster", staffUrl: "https://bubearcats.com/sports/mens-basketball/coaches" },
  { name: "Bryant", mascot: "Bulldogs", conference: "America East", website: "bryantbulldogs.com", rosterUrl: "https://bryantbulldogs.com/sports/mens-basketball/roster", staffUrl: "https://bryantbulldogs.com/sports/mens-basketball/coaches" },
  { name: "Maine", mascot: "Black Bears", conference: "America East", website: "goblackbears.com", rosterUrl: "https://goblackbears.com/sports/mens-basketball/roster", staffUrl: "https://goblackbears.com/sports/mens-basketball/coaches" },
  { name: "New Hampshire", mascot: "Wildcats", conference: "America East", website: "unhwildcats.com", rosterUrl: "https://unhwildcats.com/sports/mens-basketball/roster", staffUrl: "https://unhwildcats.com/sports/mens-basketball/coaches" },
  { name: "NJIT", mascot: "Highlanders", conference: "America East", website: "njithighlanders.com", rosterUrl: "https://njithighlanders.com/sports/mens-basketball/roster", staffUrl: "https://njithighlanders.com/sports/mens-basketball/coaches" },
  { name: "UMass Lowell", mascot: "River Hawks", conference: "America East", website: "goriverhawks.com", rosterUrl: "https://goriverhawks.com/sports/mens-basketball/roster", staffUrl: "https://goriverhawks.com/sports/mens-basketball/coaches" },
  { name: "UMBC", mascot: "Retrievers", conference: "America East", website: "umbcretrievers.com", rosterUrl: "https://umbcretrievers.com/sports/mens-basketball/roster", staffUrl: "https://umbcretrievers.com/sports/mens-basketball/coaches" },
  { name: "Vermont", mascot: "Catamounts", conference: "America East", website: "uvmathletics.com", rosterUrl: "https://uvmathletics.com/sports/mens-basketball/roster", staffUrl: "https://uvmathletics.com/sports/mens-basketball/coaches" },

  // ASUN (12 teams)
  { name: "Austin Peay", mascot: "Governors", conference: "ASUN", website: "letsgopeay.com", rosterUrl: "https://letsgopeay.com/sports/mens-basketball/roster", staffUrl: "https://letsgopeay.com/sports/mens-basketball/coaches" },
  { name: "Bellarmine", mascot: "Knights", conference: "ASUN", website: "bellarmineknights.com", rosterUrl: "https://bellarmineknights.com/sports/mens-basketball/roster", staffUrl: "https://bellarmineknights.com/sports/mens-basketball/coaches" },
  { name: "Central Arkansas", mascot: "Bears", conference: "ASUN", website: "ucasports.com", rosterUrl: "https://ucasports.com/sports/mens-basketball/roster", staffUrl: "https://ucasports.com/sports/mens-basketball/coaches" },
  { name: "Eastern Kentucky", mascot: "Colonels", conference: "ASUN", website: "ekusports.com", rosterUrl: "https://ekusports.com/sports/mens-basketball/roster", staffUrl: "https://ekusports.com/sports/mens-basketball/coaches" },
  { name: "Florida Gulf Coast", mascot: "Eagles", conference: "ASUN", website: "fgcuathletics.com", rosterUrl: "https://fgcuathletics.com/sports/mens-basketball/roster", staffUrl: "https://fgcuathletics.com/sports/mens-basketball/coaches" },
  { name: "Jacksonville", mascot: "Dolphins", conference: "ASUN", website: "judolphins.com", rosterUrl: "https://judolphins.com/sports/mens-basketball/roster", staffUrl: "https://judolphins.com/sports/mens-basketball/coaches" },
  { name: "Lipscomb", mascot: "Bisons", conference: "ASUN", website: "lipscombsports.com", rosterUrl: "https://lipscombsports.com/sports/mens-basketball/roster", staffUrl: "https://lipscombsports.com/sports/mens-basketball/coaches" },
  { name: "North Alabama", mascot: "Lions", conference: "ASUN", website: "roarlions.com", rosterUrl: "https://roarlions.com/sports/mens-basketball/roster", staffUrl: "https://roarlions.com/sports/mens-basketball/coaches" },
  { name: "North Florida", mascot: "Ospreys", conference: "ASUN", website: "unfospreys.com", rosterUrl: "https://unfospreys.com/sports/mens-basketball/roster", staffUrl: "https://unfospreys.com/sports/mens-basketball/coaches" },
  { name: "Queens", mascot: "Royals", conference: "ASUN", website: "queensathletics.com", rosterUrl: "https://queensathletics.com/sports/mens-basketball/roster", staffUrl: "https://queensathletics.com/sports/mens-basketball/coaches" },
  { name: "Stetson", mascot: "Hatters", conference: "ASUN", website: "gohatters.com", rosterUrl: "https://gohatters.com/sports/mens-basketball/roster", staffUrl: "https://gohatters.com/sports/mens-basketball/coaches" },

  // Big Sky (11 teams)
  { name: "Eastern Washington", mascot: "Eagles", conference: "Big Sky", website: "goeags.com", rosterUrl: "https://goeags.com/sports/mens-basketball/roster", staffUrl: "https://goeags.com/sports/mens-basketball/coaches" },
  { name: "Idaho", mascot: "Vandals", conference: "Big Sky", website: "govandals.com", rosterUrl: "https://govandals.com/sports/mens-basketball/roster", staffUrl: "https://govandals.com/sports/mens-basketball/coaches" },
  { name: "Idaho State", mascot: "Bengals", conference: "Big Sky", website: "isubengals.com", rosterUrl: "https://isubengals.com/sports/mens-basketball/roster", staffUrl: "https://isubengals.com/sports/mens-basketball/coaches" },
  { name: "Montana", mascot: "Grizzlies", conference: "Big Sky", website: "gogriz.com", rosterUrl: "https://gogriz.com/sports/mens-basketball/roster", staffUrl: "https://gogriz.com/sports/mens-basketball/coaches" },
  { name: "Montana State", mascot: "Bobcats", conference: "Big Sky", website: "msubobcats.com", rosterUrl: "https://msubobcats.com/sports/mens-basketball/roster", staffUrl: "https://msubobcats.com/sports/mens-basketball/coaches" },
  { name: "Northern Arizona", mascot: "Lumberjacks", conference: "Big Sky", website: "nauathletics.com", rosterUrl: "https://nauathletics.com/sports/mens-basketball/roster", staffUrl: "https://nauathletics.com/sports/mens-basketball/coaches" },
  { name: "Northern Colorado", mascot: "Bears", conference: "Big Sky", website: "uncbears.com", rosterUrl: "https://uncbears.com/sports/mens-basketball/roster", staffUrl: "https://uncbears.com/sports/mens-basketball/coaches" },
  { name: "Portland State", mascot: "Vikings", conference: "Big Sky", website: "goviks.com", rosterUrl: "https://goviks.com/sports/mens-basketball/roster", staffUrl: "https://goviks.com/sports/mens-basketball/coaches" },
  { name: "Sacramento State", mascot: "Hornets", conference: "Big Sky", website: "hornetsports.com", rosterUrl: "https://hornetsports.com/sports/mens-basketball/roster", staffUrl: "https://hornetsports.com/sports/mens-basketball/coaches" },
  { name: "Weber State", mascot: "Wildcats", conference: "Big Sky", website: "weberstatesports.com", rosterUrl: "https://weberstatesports.com/sports/mens-basketball/roster", staffUrl: "https://weberstatesports.com/sports/mens-basketball/coaches" },

  // Big South (10 teams)
  { name: "Charleston Southern", mascot: "Buccaneers", conference: "Big South", website: "csusports.com", rosterUrl: "https://csusports.com/sports/mens-basketball/roster", staffUrl: "https://csusports.com/sports/mens-basketball/coaches" },
  { name: "Gardner-Webb", mascot: "Runnin' Bulldogs", conference: "Big South", website: "gwusports.com", rosterUrl: "https://gwusports.com/sports/mens-basketball/roster", staffUrl: "https://gwusports.com/sports/mens-basketball/coaches" },
  { name: "High Point", mascot: "Panthers", conference: "Big South", website: "highpointpanthers.com", rosterUrl: "https://highpointpanthers.com/sports/mens-basketball/roster", staffUrl: "https://highpointpanthers.com/sports/mens-basketball/coaches" },
  { name: "Longwood", mascot: "Lancers", conference: "Big South", website: "longwoodlancers.com", rosterUrl: "https://longwoodlancers.com/sports/mens-basketball/roster", staffUrl: "https://longwoodlancers.com/sports/mens-basketball/coaches" },
  { name: "Presbyterian", mascot: "Blue Hose", conference: "Big South", website: "gobluehose.com", rosterUrl: "https://gobluehose.com/sports/mens-basketball/roster", staffUrl: "https://gobluehose.com/sports/mens-basketball/coaches" },
  { name: "Radford", mascot: "Highlanders", conference: "Big South", website: "radfordathletics.com", rosterUrl: "https://radfordathletics.com/sports/mens-basketball/roster", staffUrl: "https://radfordathletics.com/sports/mens-basketball/coaches" },
  { name: "UNC Asheville", mascot: "Bulldogs", conference: "Big South", website: "uncabulldogs.com", rosterUrl: "https://uncabulldogs.com/sports/mens-basketball/roster", staffUrl: "https://uncabulldogs.com/sports/mens-basketball/coaches" },
  { name: "USC Upstate", mascot: "Spartans", conference: "Big South", website: "upstatespartans.com", rosterUrl: "https://upstatespartans.com/sports/mens-basketball/roster", staffUrl: "https://upstatespartans.com/sports/mens-basketball/coaches" },
  { name: "Winthrop", mascot: "Eagles", conference: "Big South", website: "winthropeagles.com", rosterUrl: "https://winthropeagles.com/sports/mens-basketball/roster", staffUrl: "https://winthropeagles.com/sports/mens-basketball/coaches" },

  // Big West (11 teams)
  { name: "Cal Poly", mascot: "Mustangs", conference: "Big West", website: "gopoly.com", rosterUrl: "https://gopoly.com/sports/mens-basketball/roster", staffUrl: "https://gopoly.com/sports/mens-basketball/coaches" },
  { name: "Cal State Bakersfield", mascot: "Roadrunners", conference: "Big West", website: "gorunners.com", rosterUrl: "https://gorunners.com/sports/mens-basketball/roster", staffUrl: "https://gorunners.com/sports/mens-basketball/coaches" },
  { name: "Cal State Fullerton", mascot: "Titans", conference: "Big West", website: "fullertontitans.com", rosterUrl: "https://fullertontitans.com/sports/mens-basketball/roster", staffUrl: "https://fullertontitans.com/sports/mens-basketball/coaches" },
  { name: "Cal State Northridge", mascot: "Matadors", conference: "Big West", website: "gomatadors.com", rosterUrl: "https://gomatadors.com/sports/mens-basketball/roster", staffUrl: "https://gomatadors.com/sports/mens-basketball/coaches" },
  { name: "Hawaii", mascot: "Rainbow Warriors", conference: "Big West", website: "hawaiiathletics.com", rosterUrl: "https://hawaiiathletics.com/sports/mens-basketball/roster", staffUrl: "https://hawaiiathletics.com/sports/mens-basketball/coaches" },
  { name: "Long Beach State", mascot: "Beach", conference: "Big West", website: "longbeachstate.com", rosterUrl: "https://longbeachstate.com/sports/mens-basketball/roster", staffUrl: "https://longbeachstate.com/sports/mens-basketball/coaches" },
  { name: "UC Davis", mascot: "Aggies", conference: "Big West", website: "ucdavisaggies.com", rosterUrl: "https://ucdavisaggies.com/sports/mens-basketball/roster", staffUrl: "https://ucdavisaggies.com/sports/mens-basketball/coaches" },
  { name: "UC Irvine", mascot: "Anteaters", conference: "Big West", website: "ucirvinesports.com", rosterUrl: "https://ucirvinesports.com/sports/mens-basketball/roster", staffUrl: "https://ucirvinesports.com/sports/mens-basketball/coaches" },
  { name: "UC Riverside", mascot: "Highlanders", conference: "Big West", website: "gohighlanders.com", rosterUrl: "https://gohighlanders.com/sports/mens-basketball/roster", staffUrl: "https://gohighlanders.com/sports/mens-basketball/coaches" },
  { name: "UC San Diego", mascot: "Tritons", conference: "Big West", website: "ucsdtritons.com", rosterUrl: "https://ucsdtritons.com/sports/mens-basketball/roster", staffUrl: "https://ucsdtritons.com/sports/mens-basketball/coaches" },
  { name: "UC Santa Barbara", mascot: "Gauchos", conference: "Big West", website: "ucsbgauchos.com", rosterUrl: "https://ucsbgauchos.com/sports/mens-basketball/roster", staffUrl: "https://ucsbgauchos.com/sports/mens-basketball/coaches" },

  // NEC (10 teams)
  { name: "Central Connecticut", mascot: "Blue Devils", conference: "NEC", website: "ccsubluedevils.com", rosterUrl: "https://ccsubluedevils.com/sports/mens-basketball/roster", staffUrl: "https://ccsubluedevils.com/sports/mens-basketball/coaches" },
  { name: "Fairleigh Dickinson", mascot: "Knights", conference: "NEC", website: "fduknights.com", rosterUrl: "https://fduknights.com/sports/mens-basketball/roster", staffUrl: "https://fduknights.com/sports/mens-basketball/coaches" },
  { name: "Le Moyne", mascot: "Dolphins", conference: "NEC", website: "lemoynedolphins.com", rosterUrl: "https://lemoynedolphins.com/sports/mens-basketball/roster", staffUrl: "https://lemoynedolphins.com/sports/mens-basketball/coaches" },
  { name: "LIU", mascot: "Sharks", conference: "NEC", website: "liuathletics.com", rosterUrl: "https://liuathletics.com/sports/mens-basketball/roster", staffUrl: "https://liuathletics.com/sports/mens-basketball/coaches" },
  { name: "Merrimack", mascot: "Warriors", conference: "NEC", website: "merrimackathletics.com", rosterUrl: "https://merrimackathletics.com/sports/mens-basketball/roster", staffUrl: "https://merrimackathletics.com/sports/mens-basketball/coaches" },
  { name: "St. Francis Brooklyn", mascot: "Terriers", conference: "NEC", website: "sfbkathletics.com", rosterUrl: "https://sfbkathletics.com/sports/mens-basketball/roster", staffUrl: "https://sfbkathletics.com/sports/mens-basketball/coaches" },
  { name: "Saint Francis", mascot: "Red Flash", conference: "NEC", website: "sfuathletics.com", rosterUrl: "https://sfuathletics.com/sports/mens-basketball/roster", staffUrl: "https://sfuathletics.com/sports/mens-basketball/coaches" },
  { name: "Stonehill", mascot: "Skyhawks", conference: "NEC", website: "stonehillskyhawks.com", rosterUrl: "https://stonehillskyhawks.com/sports/mens-basketball/roster", staffUrl: "https://stonehillskyhawks.com/sports/mens-basketball/coaches" },
  { name: "Wagner", mascot: "Seahawks", conference: "NEC", website: "wagnerathletics.com", rosterUrl: "https://wagnerathletics.com/sports/mens-basketball/roster", staffUrl: "https://wagnerathletics.com/sports/mens-basketball/coaches" },

  // OVC (9 teams)
  { name: "Eastern Illinois", mascot: "Panthers", conference: "OVC", website: "eiupanthers.com", rosterUrl: "https://eiupanthers.com/sports/mens-basketball/roster", staffUrl: "https://eiupanthers.com/sports/mens-basketball/coaches" },
  { name: "Lindenwood", mascot: "Lions", conference: "OVC", website: "lindenwoodlions.com", rosterUrl: "https://lindenwoodlions.com/sports/mens-basketball/roster", staffUrl: "https://lindenwoodlions.com/sports/mens-basketball/coaches" },
  { name: "Little Rock", mascot: "Trojans", conference: "OVC", website: "lrtrojans.com", rosterUrl: "https://lrtrojans.com/sports/mens-basketball/roster", staffUrl: "https://lrtrojans.com/sports/mens-basketball/coaches" },
  { name: "Morehead State", mascot: "Eagles", conference: "OVC", website: "msueagles.com", rosterUrl: "https://msueagles.com/sports/mens-basketball/roster", staffUrl: "https://msueagles.com/sports/mens-basketball/coaches" },
  { name: "SE Missouri State", mascot: "Redhawks", conference: "OVC", website: "gosoutheast.com", rosterUrl: "https://gosoutheast.com/sports/mens-basketball/roster", staffUrl: "https://gosoutheast.com/sports/mens-basketball/coaches" },
  { name: "SIU Edwardsville", mascot: "Cougars", conference: "OVC", website: "siuecougars.com", rosterUrl: "https://siuecougars.com/sports/mens-basketball/roster", staffUrl: "https://siuecougars.com/sports/mens-basketball/coaches" },
  { name: "Tennessee State", mascot: "Tigers", conference: "OVC", website: "tsutigers.com", rosterUrl: "https://tsutigers.com/sports/mens-basketball/roster", staffUrl: "https://tsutigers.com/sports/mens-basketball/coaches" },
  { name: "Tennessee Tech", mascot: "Golden Eagles", conference: "OVC", website: "ttusports.com", rosterUrl: "https://ttusports.com/sports/mens-basketball/roster", staffUrl: "https://ttusports.com/sports/mens-basketball/coaches" },
  { name: "UT Martin", mascot: "Skyhawks", conference: "OVC", website: "utmsports.com", rosterUrl: "https://utmsports.com/sports/mens-basketball/roster", staffUrl: "https://utmsports.com/sports/mens-basketball/coaches" },

  // Southland (9 teams)
  { name: "Houston Christian", mascot: "Huskies", conference: "Southland", website: "hcuhuskies.com", rosterUrl: "https://hcuhuskies.com/sports/mens-basketball/roster", staffUrl: "https://hcuhuskies.com/sports/mens-basketball/coaches" },
  { name: "Incarnate Word", mascot: "Cardinals", conference: "Southland", website: "uiwcardinals.com", rosterUrl: "https://uiwcardinals.com/sports/mens-basketball/roster", staffUrl: "https://uiwcardinals.com/sports/mens-basketball/coaches" },
  { name: "Lamar", mascot: "Cardinals", conference: "Southland", website: "lamarcardinals.com", rosterUrl: "https://lamarcardinals.com/sports/mens-basketball/roster", staffUrl: "https://lamarcardinals.com/sports/mens-basketball/coaches" },
  { name: "McNeese", mascot: "Cowboys", conference: "Southland", website: "mcneesesports.com", rosterUrl: "https://mcneesesports.com/sports/mens-basketball/roster", staffUrl: "https://mcneesesports.com/sports/mens-basketball/coaches" },
  { name: "New Orleans", mascot: "Privateers", conference: "Southland", website: "unoprivateers.com", rosterUrl: "https://unoprivateers.com/sports/mens-basketball/roster", staffUrl: "https://unoprivateers.com/sports/mens-basketball/coaches" },
  { name: "Nicholls", mascot: "Colonels", conference: "Southland", website: "geauxcolonels.com", rosterUrl: "https://geauxcolonels.com/sports/mens-basketball/roster", staffUrl: "https://geauxcolonels.com/sports/mens-basketball/coaches" },
  { name: "Northwestern State", mascot: "Demons", conference: "Southland", website: "naborssportsmedia.com", rosterUrl: "https://nsudemons.com/sports/mens-basketball/roster", staffUrl: "https://nsudemons.com/sports/mens-basketball/coaches" },
  { name: "Southeastern Louisiana", mascot: "Lions", conference: "Southland", website: "lionsports.net", rosterUrl: "https://lionsports.net/sports/mens-basketball/roster", staffUrl: "https://lionsports.net/sports/mens-basketball/coaches" },
  { name: "Texas A&M-CC", mascot: "Islanders", conference: "Southland", website: "goislanders.com", rosterUrl: "https://goislanders.com/sports/mens-basketball/roster", staffUrl: "https://goislanders.com/sports/mens-basketball/coaches" },

  // Summit League (10 teams)
  { name: "Denver", mascot: "Pioneers", conference: "Summit", website: "denverpioneers.com", rosterUrl: "https://denverpioneers.com/sports/mens-basketball/roster", staffUrl: "https://denverpioneers.com/sports/mens-basketball/coaches" },
  { name: "Kansas City", mascot: "Roos", conference: "Summit", website: "umkcroos.com", rosterUrl: "https://umkcroos.com/sports/mens-basketball/roster", staffUrl: "https://umkcroos.com/sports/mens-basketball/coaches" },
  { name: "North Dakota", mascot: "Fighting Hawks", conference: "Summit", website: "undfightinghawks.com", rosterUrl: "https://undfightinghawks.com/sports/mens-basketball/roster", staffUrl: "https://undfightinghawks.com/sports/mens-basketball/coaches" },
  { name: "North Dakota State", mascot: "Bison", conference: "Summit", website: "gobison.com", rosterUrl: "https://gobison.com/sports/mens-basketball/roster", staffUrl: "https://gobison.com/sports/mens-basketball/coaches" },
  { name: "Omaha", mascot: "Mavericks", conference: "Summit", website: "omavs.com", rosterUrl: "https://omavs.com/sports/mens-basketball/roster", staffUrl: "https://omavs.com/sports/mens-basketball/coaches" },
  { name: "Oral Roberts", mascot: "Golden Eagles", conference: "Summit", website: "orugoldeneagles.com", rosterUrl: "https://orugoldeneagles.com/sports/mens-basketball/roster", staffUrl: "https://orugoldeneagles.com/sports/mens-basketball/coaches" },
  { name: "South Dakota", mascot: "Coyotes", conference: "Summit", website: "goyotes.com", rosterUrl: "https://goyotes.com/sports/mens-basketball/roster", staffUrl: "https://goyotes.com/sports/mens-basketball/coaches" },
  { name: "South Dakota State", mascot: "Jackrabbits", conference: "Summit", website: "gojacks.com", rosterUrl: "https://gojacks.com/sports/mens-basketball/roster", staffUrl: "https://gojacks.com/sports/mens-basketball/coaches" },
  { name: "St. Thomas", mascot: "Tommies", conference: "Summit", website: "tommiesports.com", rosterUrl: "https://tommiesports.com/sports/mens-basketball/roster", staffUrl: "https://tommiesports.com/sports/mens-basketball/coaches" },
  { name: "Western Illinois", mascot: "Leathernecks", conference: "Summit", website: "goleathernecks.com", rosterUrl: "https://goleathernecks.com/sports/mens-basketball/roster", staffUrl: "https://goleathernecks.com/sports/mens-basketball/coaches" },

  // WAC (10 teams)
  { name: "Abilene Christian", mascot: "Wildcats", conference: "WAC", website: "acusports.com", rosterUrl: "https://acusports.com/sports/mens-basketball/roster", staffUrl: "https://acusports.com/sports/mens-basketball/coaches" },
  { name: "California Baptist", mascot: "Lancers", conference: "WAC", website: "cbulancers.com", rosterUrl: "https://cbulancers.com/sports/mens-basketball/roster", staffUrl: "https://cbulancers.com/sports/mens-basketball/coaches" },
  { name: "Grand Canyon", mascot: "Antelopes", conference: "WAC", website: "gcuathletics.com", rosterUrl: "https://gcuathletics.com/sports/mens-basketball/roster", staffUrl: "https://gcuathletics.com/sports/mens-basketball/coaches" },
  { name: "Seattle", mascot: "Redhawks", conference: "WAC", website: "goseattleu.com", rosterUrl: "https://goseattleu.com/sports/mens-basketball/roster", staffUrl: "https://goseattleu.com/sports/mens-basketball/coaches" },
  { name: "Southern Utah", mascot: "Thunderbirds", conference: "WAC", website: "suutbirds.com", rosterUrl: "https://suutbirds.com/sports/mens-basketball/roster", staffUrl: "https://suutbirds.com/sports/mens-basketball/coaches" },
  { name: "Stephen F. Austin", mascot: "Lumberjacks", conference: "WAC", website: "sfajacks.com", rosterUrl: "https://sfajacks.com/sports/mens-basketball/roster", staffUrl: "https://sfajacks.com/sports/mens-basketball/coaches" },
  { name: "Tarleton State", mascot: "Texans", conference: "WAC", website: "tarletonsports.com", rosterUrl: "https://tarletonsports.com/sports/mens-basketball/roster", staffUrl: "https://tarletonsports.com/sports/mens-basketball/coaches" },
  { name: "UT Arlington", mascot: "Mavericks", conference: "WAC", website: "utamavs.com", rosterUrl: "https://utamavs.com/sports/mens-basketball/roster", staffUrl: "https://utamavs.com/sports/mens-basketball/coaches" },
  { name: "Utah Tech", mascot: "Trailblazers", conference: "WAC", website: "utahtech.com", rosterUrl: "https://utahtechathletics.com/sports/mens-basketball/roster", staffUrl: "https://utahtechathletics.com/sports/mens-basketball/coaches" },
  { name: "Utah Valley", mascot: "Wolverines", conference: "WAC", website: "gouvu.com", rosterUrl: "https://gouvu.com/sports/mens-basketball/roster", staffUrl: "https://gouvu.com/sports/mens-basketball/coaches" },

  // ═══════════════════════════════════════════════════════════════════════════
  // HBCU CONFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  // SWAC (12 teams)
  { name: "Alabama A&M", mascot: "Bulldogs", conference: "SWAC", website: "aamusports.com", rosterUrl: "https://aamusports.com/sports/mens-basketball/roster", staffUrl: "https://aamusports.com/sports/mens-basketball/coaches" },
  { name: "Alabama State", mascot: "Hornets", conference: "SWAC", website: "bamastatesports.com", rosterUrl: "https://bamastatesports.com/sports/mens-basketball/roster", staffUrl: "https://bamastatesports.com/sports/mens-basketball/coaches" },
  { name: "Alcorn State", mascot: "Braves", conference: "SWAC", website: "alcornsports.com", rosterUrl: "https://alcornsports.com/sports/mens-basketball/roster", staffUrl: "https://alcornsports.com/sports/mens-basketball/coaches" },
  { name: "Arkansas-Pine Bluff", mascot: "Golden Lions", conference: "SWAC", website: "uapblionsroar.com", rosterUrl: "https://uapblionsroar.com/sports/mens-basketball/roster", staffUrl: "https://uapblionsroar.com/sports/mens-basketball/coaches" },
  { name: "Bethune-Cookman", mascot: "Wildcats", conference: "SWAC", website: "bcuathletics.com", rosterUrl: "https://bcuathletics.com/sports/mens-basketball/roster", staffUrl: "https://bcuathletics.com/sports/mens-basketball/coaches" },
  { name: "Florida A&M", mascot: "Rattlers", conference: "SWAC", website: "famuathletics.com", rosterUrl: "https://famuathletics.com/sports/mens-basketball/roster", staffUrl: "https://famuathletics.com/sports/mens-basketball/coaches" },
  { name: "Grambling State", mascot: "Tigers", conference: "SWAC", website: "gikinogu.com", rosterUrl: "https://gikinogu.com/sports/mens-basketball/roster", staffUrl: "https://gikinogu.com/sports/mens-basketball/coaches" },
  { name: "Jackson State", mascot: "Tigers", conference: "SWAC", website: "jsutigers.com", rosterUrl: "https://jsutigers.com/sports/mens-basketball/roster", staffUrl: "https://jsutigers.com/sports/mens-basketball/coaches" },
  { name: "Mississippi Valley State", mascot: "Delta Devils", conference: "SWAC", website: "mikinogu.com", rosterUrl: "https://mikinogu.com/sports/mens-basketball/roster", staffUrl: "https://mikinogu.com/sports/mens-basketball/coaches" },
  { name: "Prairie View A&M", mascot: "Panthers", conference: "SWAC", website: "pvamu.com", rosterUrl: "https://pvamupanthers.com/sports/mens-basketball/roster", staffUrl: "https://pvamupanthers.com/sports/mens-basketball/coaches" },
  { name: "Southern", mascot: "Jaguars", conference: "SWAC", website: "gojagsports.com", rosterUrl: "https://gojagsports.com/sports/mens-basketball/roster", staffUrl: "https://gojagsports.com/sports/mens-basketball/coaches" },
  { name: "Texas Southern", mascot: "Tigers", conference: "SWAC", website: "tsutigers.com", rosterUrl: "https://tsutigers.com/sports/mens-basketball/roster", staffUrl: "https://tsutigers.com/sports/mens-basketball/coaches" },

  // MEAC (8 teams)
  { name: "Coppin State", mascot: "Eagles", conference: "MEAC", website: "coppinstatesports.com", rosterUrl: "https://coppinstatesports.com/sports/mens-basketball/roster", staffUrl: "https://coppinstatesports.com/sports/mens-basketball/coaches" },
  { name: "Delaware State", mascot: "Hornets", conference: "MEAC", website: "dsuhornets.com", rosterUrl: "https://dsuhornets.com/sports/mens-basketball/roster", staffUrl: "https://dsuhornets.com/sports/mens-basketball/coaches" },
  { name: "Howard", mascot: "Bison", conference: "MEAC", website: "hubison.com", rosterUrl: "https://hubison.com/sports/mens-basketball/roster", staffUrl: "https://hubison.com/sports/mens-basketball/coaches" },
  { name: "Maryland Eastern Shore", mascot: "Hawks", conference: "MEAC", website: "umeshawks.com", rosterUrl: "https://umeshawks.com/sports/mens-basketball/roster", staffUrl: "https://umeshawks.com/sports/mens-basketball/coaches" },
  { name: "Morgan State", mascot: "Bears", conference: "MEAC", website: "mikinogu.com", rosterUrl: "https://morganstatebears.com/sports/mens-basketball/roster", staffUrl: "https://morganstatebears.com/sports/mens-basketball/coaches" },
  { name: "Norfolk State", mascot: "Spartans", conference: "MEAC", website: "nsuspartans.com", rosterUrl: "https://nsuspartans.com/sports/mens-basketball/roster", staffUrl: "https://nsuspartans.com/sports/mens-basketball/coaches" },
  { name: "North Carolina Central", mascot: "Eagles", conference: "MEAC", website: "nccueaglepride.com", rosterUrl: "https://nccueaglepride.com/sports/mens-basketball/roster", staffUrl: "https://nccueaglepride.com/sports/mens-basketball/coaches" },
  { name: "South Carolina State", mascot: "Bulldogs", conference: "MEAC", website: "scstateathletics.com", rosterUrl: "https://scstateathletics.com/sports/mens-basketball/roster", staffUrl: "https://scstateathletics.com/sports/mens-basketball/coaches" },
];

// Get unique conferences with sorting by tier
const CONF_ORDER = [
  "ACC", "Big 12", "Big East", "Big Ten", "SEC",  // Power 5
  "American", "Mountain West", "WCC", "A-10",      // High-Major
  "MVC", "MAC", "C-USA", "Sun Belt", "CAA", "Ivy", // Mid-Major
  "Horizon", "MAAC", "Patriot", "SoCon",           // Low-Major
  "America East", "ASUN", "Big Sky", "Big South", "Big West",
  "NEC", "OVC", "Southland", "Summit", "WAC",
  "SWAC", "MEAC"                                   // HBCU
];

const CONFERENCES = [...new Set(D1_TEAMS.map(t => t.conference))].sort((a, b) => {
  const aIdx = CONF_ORDER.indexOf(a);
  const bIdx = CONF_ORDER.indexOf(b);
  if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
  if (aIdx === -1) return 1;
  if (bIdx === -1) return -1;
  return aIdx - bIdx;
});

interface D1DirectoryProps {
  isMobile: boolean;
}

export function D1Directory({ isMobile }: D1DirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConference, setSelectedConference] = useState<string>("all");
  // Default to ALL COLLAPSED
  const [expandedConferences, setExpandedConferences] = useState<Set<string>>(new Set());

  const filteredTeams = useMemo(() => {
    let teams = D1_TEAMS;
    
    if (selectedConference !== "all") {
      teams = teams.filter(t => t.conference === selectedConference);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      teams = teams.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.mascot.toLowerCase().includes(q) ||
        t.conference.toLowerCase().includes(q)
      );
    }
    
    return teams;
  }, [searchQuery, selectedConference]);

  const teamsByConference = useMemo(() => {
    const grouped: Record<string, Team[]> = {};
    filteredTeams.forEach(team => {
      if (!grouped[team.conference]) grouped[team.conference] = [];
      grouped[team.conference].push(team);
    });
    return grouped;
  }, [filteredTeams]);

  const toggleConference = (conf: string) => {
    setExpandedConferences(prev => {
      const next = new Set(prev);
      if (next.has(conf)) next.delete(conf);
      else next.add(conf);
      return next;
    });
  };

  const expandAll = () => setExpandedConferences(new Set(Object.keys(teamsByConference)));
  const collapseAll = () => setExpandedConferences(new Set());

  // Sort conferences by tier order
  const sortedConferences = Object.entries(teamsByConference).sort(([a], [b]) => {
    const aIdx = CONF_ORDER.indexOf(a);
    const bIdx = CONF_ORDER.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "4px" }}>
          School Directory
        </div>
        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
          {D1_TEAMS.length} teams · {CONFERENCES.length} conferences · Links to roster & staff pages
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "#f3f4f6",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
        <select
          value={selectedConference}
          onChange={(e) => setSelectedConference(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            color: "#f3f4f6",
            fontSize: "13px",
            cursor: "pointer",
            minWidth: "150px",
          }}
        >
          <option value="all">All Conferences</option>
          {CONFERENCES.map(conf => (
            <option key={conf} value={conf}>{conf}</option>
          ))}
        </select>
        <button onClick={expandAll} style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}>
          Expand All
        </button>
        <button onClick={collapseAll} style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.3)", color: "#9ca3af", fontSize: "12px", cursor: "pointer" }}>
          Collapse All
        </button>
      </div>

      {/* Results count */}
      <div style={{ fontSize: "12px", color: "#6b7280" }}>
        Showing {filteredTeams.length} teams across {Object.keys(teamsByConference).length} conferences
      </div>

      {/* Teams by Conference */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sortedConferences.map(([conf, teams]) => (
          <div key={conf} style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
            {/* Conference Header */}
            <button
              onClick={() => toggleConference(conf)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                color: "#f3f4f6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>{conf}</span>
                <span style={{ fontSize: "12px", color: "#6b7280", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px" }}>
                  {teams.length} teams
                </span>
              </div>
              {expandedConferences.has(conf) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Teams List */}
            {expandedConferences.has(conf) && (
              <div style={{ padding: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#9ca3af", fontWeight: 500 }}>Team</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#9ca3af", fontWeight: 500 }}>Mascot</th>
                      <th style={{ textAlign: "center", padding: "8px 12px", color: "#9ca3af", fontWeight: 500 }}>Roster/Staff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.sort((a, b) => a.name.localeCompare(b.name)).map((team, idx) => (
                      <tr key={team.name} style={{ borderBottom: idx < teams.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                        <td style={{ padding: "10px 12px", color: "#f3f4f6", fontWeight: 500 }}>{team.name}</td>
                        <td style={{ padding: "10px 12px", color: "#9ca3af" }}>{team.mascot}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <a
                            href={team.rosterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: "rgba(139, 92, 246, 0.12)",
                              border: "1px solid rgba(139, 92, 246, 0.3)",
                              color: "#a78bfa",
                              fontSize: "12px",
                              textDecoration: "none",
                              fontWeight: 500,
                            }}
                          >
                            <Users size={12} />
                            View
                            <ExternalLink size={10} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default D1Directory;
