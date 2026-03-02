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

// Comprehensive D1 Basketball Teams Directory
const D1_TEAMS: Team[] = [
  // ACC (15 teams)
  { name: "Boston College", mascot: "Eagles", conference: "ACC", website: "bceeagles.com", rosterUrl: "https://bceeagles.com/sports/mens-basketball/roster", staffUrl: "https://bceeagles.com/sports/mens-basketball/roster" },
  { name: "California", mascot: "Golden Bears", conference: "ACC", website: "calbears.com", rosterUrl: "https://calbears.com/sports/mens-basketball/roster", staffUrl: "https://calbears.com/sports/mens-basketball/roster" },
  { name: "Clemson", mascot: "Tigers", conference: "ACC", website: "clemsontigers.com", rosterUrl: "https://clemsontigers.com/sports/mens-basketball/roster", staffUrl: "https://clemsontigers.com/sports/mens-basketball/roster" },
  { name: "Duke", mascot: "Blue Devils", conference: "ACC", website: "goduke.com", rosterUrl: "https://goduke.com/sports/mens-basketball/roster", staffUrl: "https://goduke.com/sports/mens-basketball/roster" },
  { name: "Florida State", mascot: "Seminoles", conference: "ACC", website: "seminoles.com", rosterUrl: "https://seminoles.com/sports/mens-basketball/roster", staffUrl: "https://seminoles.com/sports/mens-basketball/roster" },
  { name: "Georgia Tech", mascot: "Yellow Jackets", conference: "ACC", website: "ramblinwreck.com", rosterUrl: "https://ramblinwreck.com/sports/mens-basketball/roster", staffUrl: "https://ramblinwreck.com/sports/mens-basketball/roster" },
  { name: "Louisville", mascot: "Cardinals", conference: "ACC", website: "gocards.com", rosterUrl: "https://gocards.com/sports/mens-basketball/roster", staffUrl: "https://gocards.com/sports/mens-basketball/roster" },
  { name: "Miami", mascot: "Hurricanes", conference: "ACC", website: "miamihurricanes.com", rosterUrl: "https://miamihurricanes.com/sports/mens-basketball/roster", staffUrl: "https://miamihurricanes.com/sports/mens-basketball/roster" },
  { name: "North Carolina", mascot: "Tar Heels", conference: "ACC", website: "goheels.com", rosterUrl: "https://goheels.com/sports/mens-basketball/roster", staffUrl: "https://goheels.com/sports/mens-basketball/roster" },
  { name: "NC State", mascot: "Wolfpack", conference: "ACC", website: "gopack.com", rosterUrl: "https://gopack.com/sports/mens-basketball/roster", staffUrl: "https://gopack.com/sports/mens-basketball/roster" },
  { name: "Notre Dame", mascot: "Fighting Irish", conference: "ACC", website: "und.com", rosterUrl: "https://und.com/sports/mens-basketball/roster", staffUrl: "https://und.com/sports/mens-basketball/roster" },
  { name: "Pittsburgh", mascot: "Panthers", conference: "ACC", website: "pittsburghpanthers.com", rosterUrl: "https://pittsburghpanthers.com/sports/mens-basketball/roster", staffUrl: "https://pittsburghpanthers.com/sports/mens-basketball/roster" },
  { name: "SMU", mascot: "Mustangs", conference: "ACC", website: "smumustangs.com", rosterUrl: "https://smumustangs.com/sports/mens-basketball/roster", staffUrl: "https://smumustangs.com/sports/mens-basketball/roster" },
  { name: "Stanford", mascot: "Cardinal", conference: "ACC", website: "gostanford.com", rosterUrl: "https://gostanford.com/sports/mens-basketball/roster", staffUrl: "https://gostanford.com/sports/mens-basketball/roster" },
  { name: "Syracuse", mascot: "Orange", conference: "ACC", website: "cuse.com", rosterUrl: "https://cuse.com/sports/mens-basketball/roster", staffUrl: "https://cuse.com/sports/mens-basketball/roster" },
  { name: "Virginia", mascot: "Cavaliers", conference: "ACC", website: "virginiasports.com", rosterUrl: "https://virginiasports.com/sports/mens-basketball/roster", staffUrl: "https://virginiasports.com/sports/mens-basketball/roster" },
  { name: "Virginia Tech", mascot: "Hokies", conference: "ACC", website: "hokiesports.com", rosterUrl: "https://hokiesports.com/sports/mens-basketball/roster", staffUrl: "https://hokiesports.com/sports/mens-basketball/roster" },
  { name: "Wake Forest", mascot: "Demon Deacons", conference: "ACC", website: "godeacs.com", rosterUrl: "https://godeacs.com/sports/mens-basketball/roster", staffUrl: "https://godeacs.com/sports/mens-basketball/roster" },

  // Big 12 (16 teams)
  { name: "Arizona", mascot: "Wildcats", conference: "Big 12", website: "arizonawildcats.com", rosterUrl: "https://arizonawildcats.com/sports/mens-basketball/roster", staffUrl: "https://arizonawildcats.com/sports/mens-basketball/roster" },
  { name: "Arizona State", mascot: "Sun Devils", conference: "Big 12", website: "thesundevils.com", rosterUrl: "https://thesundevils.com/sports/mens-basketball/roster", staffUrl: "https://thesundevils.com/sports/mens-basketball/roster" },
  { name: "Baylor", mascot: "Bears", conference: "Big 12", website: "baylorbears.com", rosterUrl: "https://baylorbears.com/sports/mens-basketball/roster", staffUrl: "https://baylorbears.com/sports/mens-basketball/roster" },
  { name: "BYU", mascot: "Cougars", conference: "Big 12", website: "byucougars.com", rosterUrl: "https://byucougars.com/sports/mens-basketball/roster", staffUrl: "https://byucougars.com/sports/mens-basketball/roster" },
  { name: "Cincinnati", mascot: "Bearcats", conference: "Big 12", website: "gobearcats.com", rosterUrl: "https://gobearcats.com/sports/mens-basketball/roster", staffUrl: "https://gobearcats.com/sports/mens-basketball/roster" },
  { name: "Colorado", mascot: "Buffaloes", conference: "Big 12", website: "cubuffs.com", rosterUrl: "https://cubuffs.com/sports/mens-basketball/roster", staffUrl: "https://cubuffs.com/sports/mens-basketball/roster" },
  { name: "Houston", mascot: "Cougars", conference: "Big 12", website: "uhcougars.com", rosterUrl: "https://uhcougars.com/sports/mens-basketball/roster", staffUrl: "https://uhcougars.com/sports/mens-basketball/roster" },
  { name: "Iowa State", mascot: "Cyclones", conference: "Big 12", website: "cyclones.com", rosterUrl: "https://cyclones.com/sports/mens-basketball/roster", staffUrl: "https://cyclones.com/sports/mens-basketball/roster" },
  { name: "Kansas", mascot: "Jayhawks", conference: "Big 12", website: "kuathletics.com", rosterUrl: "https://kuathletics.com/sports/mens-basketball/roster", staffUrl: "https://kuathletics.com/sports/mens-basketball/roster" },
  { name: "Kansas State", mascot: "Wildcats", conference: "Big 12", website: "kstatesports.com", rosterUrl: "https://kstatesports.com/sports/mens-basketball/roster", staffUrl: "https://kstatesports.com/sports/mens-basketball/roster" },
  { name: "Oklahoma State", mascot: "Cowboys", conference: "Big 12", website: "okstate.com", rosterUrl: "https://okstate.com/sports/mens-basketball/roster", staffUrl: "https://okstate.com/sports/mens-basketball/roster" },
  { name: "TCU", mascot: "Horned Frogs", conference: "Big 12", website: "gofrogs.com", rosterUrl: "https://gofrogs.com/sports/mens-basketball/roster", staffUrl: "https://gofrogs.com/sports/mens-basketball/roster" },
  { name: "Texas Tech", mascot: "Red Raiders", conference: "Big 12", website: "texastech.com", rosterUrl: "https://texastech.com/sports/mens-basketball/roster", staffUrl: "https://texastech.com/sports/mens-basketball/roster" },
  { name: "UCF", mascot: "Knights", conference: "Big 12", website: "ucfknights.com", rosterUrl: "https://ucfknights.com/sports/mens-basketball/roster", staffUrl: "https://ucfknights.com/sports/mens-basketball/roster" },
  { name: "Utah", mascot: "Utes", conference: "Big 12", website: "utahutes.com", rosterUrl: "https://utahutes.com/sports/mens-basketball/roster", staffUrl: "https://utahutes.com/sports/mens-basketball/roster" },
  { name: "West Virginia", mascot: "Mountaineers", conference: "Big 12", website: "wvusports.com", rosterUrl: "https://wvusports.com/sports/mens-basketball/roster", staffUrl: "https://wvusports.com/sports/mens-basketball/roster" },

  // Big East (11 teams)
  { name: "Butler", mascot: "Bulldogs", conference: "Big East", website: "butlersports.com", rosterUrl: "https://butlersports.com/sports/mens-basketball/roster", staffUrl: "https://butlersports.com/sports/mens-basketball/roster" },
  { name: "UConn", mascot: "Huskies", conference: "Big East", website: "uconnhuskies.com", rosterUrl: "https://uconnhuskies.com/sports/mens-basketball/roster", staffUrl: "https://uconnhuskies.com/sports/mens-basketball/roster" },
  { name: "Creighton", mascot: "Bluejays", conference: "Big East", website: "gocreighton.com", rosterUrl: "https://gocreighton.com/sports/mens-basketball/roster", staffUrl: "https://gocreighton.com/sports/mens-basketball/roster" },
  { name: "DePaul", mascot: "Blue Demons", conference: "Big East", website: "depaulbluedemons.com", rosterUrl: "https://depaulbluedemons.com/sports/mens-basketball/roster", staffUrl: "https://depaulbluedemons.com/sports/mens-basketball/roster" },
  { name: "Georgetown", mascot: "Hoyas", conference: "Big East", website: "guhoyas.com", rosterUrl: "https://guhoyas.com/sports/mens-basketball/roster", staffUrl: "https://guhoyas.com/sports/mens-basketball/roster" },
  { name: "Marquette", mascot: "Golden Eagles", conference: "Big East", website: "gomarquette.com", rosterUrl: "https://gomarquette.com/sports/mens-basketball/roster", staffUrl: "https://gomarquette.com/sports/mens-basketball/roster" },
  { name: "Providence", mascot: "Friars", conference: "Big East", website: "friars.com", rosterUrl: "https://friars.com/sports/mens-basketball/roster", staffUrl: "https://friars.com/sports/mens-basketball/roster" },
  { name: "Seton Hall", mascot: "Pirates", conference: "Big East", website: "shupirates.com", rosterUrl: "https://shupirates.com/sports/mens-basketball/roster", staffUrl: "https://shupirates.com/sports/mens-basketball/roster" },
  { name: "St. John's", mascot: "Red Storm", conference: "Big East", website: "redstormsports.com", rosterUrl: "https://redstormsports.com/sports/mens-basketball/roster", staffUrl: "https://redstormsports.com/sports/mens-basketball/roster" },
  { name: "Villanova", mascot: "Wildcats", conference: "Big East", website: "villanova.com", rosterUrl: "https://villanova.com/sports/mens-basketball/roster", staffUrl: "https://villanova.com/sports/mens-basketball/roster" },
  { name: "Xavier", mascot: "Musketeers", conference: "Big East", website: "goxavier.com", rosterUrl: "https://goxavier.com/sports/mens-basketball/roster", staffUrl: "https://goxavier.com/sports/mens-basketball/roster" },

  // Big Ten (18 teams)
  { name: "Illinois", mascot: "Fighting Illini", conference: "Big Ten", website: "fightingillini.com", rosterUrl: "https://fightingillini.com/sports/mens-basketball/roster", staffUrl: "https://fightingillini.com/sports/mens-basketball/roster" },
  { name: "Indiana", mascot: "Hoosiers", conference: "Big Ten", website: "iuhoosiers.com", rosterUrl: "https://iuhoosiers.com/sports/mens-basketball/roster", staffUrl: "https://iuhoosiers.com/sports/mens-basketball/roster" },
  { name: "Iowa", mascot: "Hawkeyes", conference: "Big Ten", website: "hawkeyesports.com", rosterUrl: "https://hawkeyesports.com/sports/mens-basketball/roster", staffUrl: "https://hawkeyesports.com/sports/mens-basketball/roster" },
  { name: "Maryland", mascot: "Terrapins", conference: "Big Ten", website: "umterps.com", rosterUrl: "https://umterps.com/sports/mens-basketball/roster", staffUrl: "https://umterps.com/sports/mens-basketball/roster" },
  { name: "Michigan", mascot: "Wolverines", conference: "Big Ten", website: "mgoblue.com", rosterUrl: "https://mgoblue.com/sports/mens-basketball/roster", staffUrl: "https://mgoblue.com/sports/mens-basketball/roster" },
  { name: "Michigan State", mascot: "Spartans", conference: "Big Ten", website: "msuspartans.com", rosterUrl: "https://msuspartans.com/sports/mens-basketball/roster", staffUrl: "https://msuspartans.com/sports/mens-basketball/roster" },
  { name: "Minnesota", mascot: "Golden Gophers", conference: "Big Ten", website: "gophersports.com", rosterUrl: "https://gophersports.com/sports/mens-basketball/roster", staffUrl: "https://gophersports.com/sports/mens-basketball/roster" },
  { name: "Nebraska", mascot: "Cornhuskers", conference: "Big Ten", website: "huskers.com", rosterUrl: "https://huskers.com/sports/mens-basketball/roster", staffUrl: "https://huskers.com/sports/mens-basketball/roster" },
  { name: "Northwestern", mascot: "Wildcats", conference: "Big Ten", website: "nusports.com", rosterUrl: "https://nusports.com/sports/mens-basketball/roster", staffUrl: "https://nusports.com/sports/mens-basketball/roster" },
  { name: "Ohio State", mascot: "Buckeyes", conference: "Big Ten", website: "ohiostatebuckeyes.com", rosterUrl: "https://ohiostatebuckeyes.com/sports/mens-basketball/roster", staffUrl: "https://ohiostatebuckeyes.com/sports/mens-basketball/roster" },
  { name: "Oregon", mascot: "Ducks", conference: "Big Ten", website: "goducks.com", rosterUrl: "https://goducks.com/sports/mens-basketball/roster", staffUrl: "https://goducks.com/sports/mens-basketball/roster" },
  { name: "Penn State", mascot: "Nittany Lions", conference: "Big Ten", website: "gopsusports.com", rosterUrl: "https://gopsusports.com/sports/mens-basketball/roster", staffUrl: "https://gopsusports.com/sports/mens-basketball/roster" },
  { name: "Purdue", mascot: "Boilermakers", conference: "Big Ten", website: "purduesports.com", rosterUrl: "https://purduesports.com/sports/mens-basketball/roster", staffUrl: "https://purduesports.com/sports/mens-basketball/roster" },
  { name: "Rutgers", mascot: "Scarlet Knights", conference: "Big Ten", website: "scarletknights.com", rosterUrl: "https://scarletknights.com/sports/mens-basketball/roster", staffUrl: "https://scarletknights.com/sports/mens-basketball/roster" },
  { name: "UCLA", mascot: "Bruins", conference: "Big Ten", website: "uclabruins.com", rosterUrl: "https://uclabruins.com/sports/mens-basketball/roster", staffUrl: "https://uclabruins.com/sports/mens-basketball/roster" },
  { name: "USC", mascot: "Trojans", conference: "Big Ten", website: "usctrojans.com", rosterUrl: "https://usctrojans.com/sports/mens-basketball/roster", staffUrl: "https://usctrojans.com/sports/mens-basketball/roster" },
  { name: "Washington", mascot: "Huskies", conference: "Big Ten", website: "gohuskies.com", rosterUrl: "https://gohuskies.com/sports/mens-basketball/roster", staffUrl: "https://gohuskies.com/sports/mens-basketball/roster" },
  { name: "Wisconsin", mascot: "Badgers", conference: "Big Ten", website: "uwbadgers.com", rosterUrl: "https://uwbadgers.com/sports/mens-basketball/roster", staffUrl: "https://uwbadgers.com/sports/mens-basketball/roster" },

  // SEC (16 teams)
  { name: "Alabama", mascot: "Crimson Tide", conference: "SEC", website: "rolltide.com", rosterUrl: "https://rolltide.com/sports/mens-basketball/roster", staffUrl: "https://rolltide.com/sports/mens-basketball/roster" },
  { name: "Arkansas", mascot: "Razorbacks", conference: "SEC", website: "arkansasrazorbacks.com", rosterUrl: "https://arkansasrazorbacks.com/sports/mens-basketball/roster", staffUrl: "https://arkansasrazorbacks.com/sports/mens-basketball/roster" },
  { name: "Auburn", mascot: "Tigers", conference: "SEC", website: "auburntigers.com", rosterUrl: "https://auburntigers.com/sports/mens-basketball/roster", staffUrl: "https://auburntigers.com/sports/mens-basketball/roster" },
  { name: "Florida", mascot: "Gators", conference: "SEC", website: "floridagators.com", rosterUrl: "https://floridagators.com/sports/mens-basketball/roster", staffUrl: "https://floridagators.com/sports/mens-basketball/roster" },
  { name: "Georgia", mascot: "Bulldogs", conference: "SEC", website: "georgiadogs.com", rosterUrl: "https://georgiadogs.com/sports/mens-basketball/roster", staffUrl: "https://georgiadogs.com/sports/mens-basketball/roster" },
  { name: "Kentucky", mascot: "Wildcats", conference: "SEC", website: "ukathletics.com", rosterUrl: "https://ukathletics.com/sports/mens-basketball/roster", staffUrl: "https://ukathletics.com/sports/mens-basketball/roster" },
  { name: "LSU", mascot: "Tigers", conference: "SEC", website: "lsusports.net", rosterUrl: "https://lsusports.net/sports/mens-basketball/roster", staffUrl: "https://lsusports.net/sports/mens-basketball/roster" },
  { name: "Mississippi State", mascot: "Bulldogs", conference: "SEC", website: "hailstate.com", rosterUrl: "https://hailstate.com/sports/mens-basketball/roster", staffUrl: "https://hailstate.com/sports/mens-basketball/roster" },
  { name: "Missouri", mascot: "Tigers", conference: "SEC", website: "mutigers.com", rosterUrl: "https://mutigers.com/sports/mens-basketball/roster", staffUrl: "https://mutigers.com/sports/mens-basketball/roster" },
  { name: "Oklahoma", mascot: "Sooners", conference: "SEC", website: "soonersports.com", rosterUrl: "https://soonersports.com/sports/mens-basketball/roster", staffUrl: "https://soonersports.com/sports/mens-basketball/roster" },
  { name: "Ole Miss", mascot: "Rebels", conference: "SEC", website: "olemisssports.com", rosterUrl: "https://olemisssports.com/sports/mens-basketball/roster", staffUrl: "https://olemisssports.com/sports/mens-basketball/roster" },
  { name: "South Carolina", mascot: "Gamecocks", conference: "SEC", website: "gamecocksonline.com", rosterUrl: "https://gamecocksonline.com/sports/mens-basketball/roster", staffUrl: "https://gamecocksonline.com/sports/mens-basketball/roster" },
  { name: "Tennessee", mascot: "Volunteers", conference: "SEC", website: "utsports.com", rosterUrl: "https://utsports.com/sports/mens-basketball/roster", staffUrl: "https://utsports.com/sports/mens-basketball/roster" },
  { name: "Texas", mascot: "Longhorns", conference: "SEC", website: "texassports.com", rosterUrl: "https://texassports.com/sports/mens-basketball/roster", staffUrl: "https://texassports.com/sports/mens-basketball/roster" },
  { name: "Texas A&M", mascot: "Aggies", conference: "SEC", website: "12thman.com", rosterUrl: "https://12thman.com/sports/mens-basketball/roster", staffUrl: "https://12thman.com/sports/mens-basketball/roster" },
  { name: "Vanderbilt", mascot: "Commodores", conference: "SEC", website: "vucommodores.com", rosterUrl: "https://vucommodores.com/sports/mens-basketball/roster", staffUrl: "https://vucommodores.com/sports/mens-basketball/roster" },

  // American Athletic (14 teams)
  { name: "Charlotte", mascot: "49ers", conference: "American", website: "charlotte49ers.com", rosterUrl: "https://charlotte49ers.com/sports/mens-basketball/roster", staffUrl: "https://charlotte49ers.com/sports/mens-basketball/roster" },
  { name: "East Carolina", mascot: "Pirates", conference: "American", website: "ecupirates.com", rosterUrl: "https://ecupirates.com/sports/mens-basketball/roster", staffUrl: "https://ecupirates.com/sports/mens-basketball/roster" },
  { name: "FAU", mascot: "Owls", conference: "American", website: "fausports.com", rosterUrl: "https://fausports.com/sports/mens-basketball/roster", staffUrl: "https://fausports.com/sports/mens-basketball/roster" },
  { name: "Memphis", mascot: "Tigers", conference: "American", website: "gotigersgo.com", rosterUrl: "https://gotigersgo.com/sports/mens-basketball/roster", staffUrl: "https://gotigersgo.com/sports/mens-basketball/roster" },
  { name: "Navy", mascot: "Midshipmen", conference: "American", website: "navysports.com", rosterUrl: "https://navysports.com/sports/mens-basketball/roster", staffUrl: "https://navysports.com/sports/mens-basketball/roster" },
  { name: "North Texas", mascot: "Mean Green", conference: "American", website: "meangreensports.com", rosterUrl: "https://meangreensports.com/sports/mens-basketball/roster", staffUrl: "https://meangreensports.com/sports/mens-basketball/roster" },
  { name: "Rice", mascot: "Owls", conference: "American", website: "riceowls.com", rosterUrl: "https://riceowls.com/sports/mens-basketball/roster", staffUrl: "https://riceowls.com/sports/mens-basketball/roster" },
  { name: "South Florida", mascot: "Bulls", conference: "American", website: "gousfbulls.com", rosterUrl: "https://gousfbulls.com/sports/mens-basketball/roster", staffUrl: "https://gousfbulls.com/sports/mens-basketball/roster" },
  { name: "Temple", mascot: "Owls", conference: "American", website: "owlsports.com", rosterUrl: "https://owlsports.com/sports/mens-basketball/roster", staffUrl: "https://owlsports.com/sports/mens-basketball/roster" },
  { name: "Tulane", mascot: "Green Wave", conference: "American", website: "tulanegreenwave.com", rosterUrl: "https://tulanegreenwave.com/sports/mens-basketball/roster", staffUrl: "https://tulanegreenwave.com/sports/mens-basketball/roster" },
  { name: "Tulsa", mascot: "Golden Hurricane", conference: "American", website: "tulsahurricane.com", rosterUrl: "https://tulsahurricane.com/sports/mens-basketball/roster", staffUrl: "https://tulsahurricane.com/sports/mens-basketball/roster" },
  { name: "UAB", mascot: "Blazers", conference: "American", website: "uabsports.com", rosterUrl: "https://uabsports.com/sports/mens-basketball/roster", staffUrl: "https://uabsports.com/sports/mens-basketball/roster" },
  { name: "UTSA", mascot: "Roadrunners", conference: "American", website: "goutsa.com", rosterUrl: "https://goutsa.com/sports/mens-basketball/roster", staffUrl: "https://goutsa.com/sports/mens-basketball/roster" },
  { name: "Wichita State", mascot: "Shockers", conference: "American", website: "goshockers.com", rosterUrl: "https://goshockers.com/sports/mens-basketball/roster", staffUrl: "https://goshockers.com/sports/mens-basketball/roster" },

  // Mountain West (12 teams)
  { name: "Air Force", mascot: "Falcons", conference: "Mountain West", website: "goairforcefalcons.com", rosterUrl: "https://goairforcefalcons.com/sports/mens-basketball/roster", staffUrl: "https://goairforcefalcons.com/sports/mens-basketball/roster" },
  { name: "Boise State", mascot: "Broncos", conference: "Mountain West", website: "broncosports.com", rosterUrl: "https://broncosports.com/sports/mens-basketball/roster", staffUrl: "https://broncosports.com/sports/mens-basketball/roster" },
  { name: "Colorado State", mascot: "Rams", conference: "Mountain West", website: "csurams.com", rosterUrl: "https://csurams.com/sports/mens-basketball/roster", staffUrl: "https://csurams.com/sports/mens-basketball/roster" },
  { name: "Fresno State", mascot: "Bulldogs", conference: "Mountain West", website: "gobulldogs.com", rosterUrl: "https://gobulldogs.com/sports/mens-basketball/roster", staffUrl: "https://gobulldogs.com/sports/mens-basketball/roster" },
  { name: "Nevada", mascot: "Wolf Pack", conference: "Mountain West", website: "nevadawolfpack.com", rosterUrl: "https://nevadawolfpack.com/sports/mens-basketball/roster", staffUrl: "https://nevadawolfpack.com/sports/mens-basketball/roster" },
  { name: "New Mexico", mascot: "Lobos", conference: "Mountain West", website: "golobos.com", rosterUrl: "https://golobos.com/sports/mens-basketball/roster", staffUrl: "https://golobos.com/sports/mens-basketball/roster" },
  { name: "San Diego State", mascot: "Aztecs", conference: "Mountain West", website: "goaztecs.com", rosterUrl: "https://goaztecs.com/sports/mens-basketball/roster", staffUrl: "https://goaztecs.com/sports/mens-basketball/roster" },
  { name: "San Jose State", mascot: "Spartans", conference: "Mountain West", website: "sjsuspartans.com", rosterUrl: "https://sjsuspartans.com/sports/mens-basketball/roster", staffUrl: "https://sjsuspartans.com/sports/mens-basketball/roster" },
  { name: "UNLV", mascot: "Rebels", conference: "Mountain West", website: "unlvrebels.com", rosterUrl: "https://unlvrebels.com/sports/mens-basketball/roster", staffUrl: "https://unlvrebels.com/sports/mens-basketball/roster" },
  { name: "Utah State", mascot: "Aggies", conference: "Mountain West", website: "utahstateaggies.com", rosterUrl: "https://utahstateaggies.com/sports/mens-basketball/roster", staffUrl: "https://utahstateaggies.com/sports/mens-basketball/roster" },
  { name: "Wyoming", mascot: "Cowboys", conference: "Mountain West", website: "gowyo.com", rosterUrl: "https://gowyo.com/sports/mens-basketball/roster", staffUrl: "https://gowyo.com/sports/mens-basketball/roster" },

  // WCC (12 teams)
  { name: "BYU", mascot: "Cougars", conference: "WCC", website: "byucougars.com", rosterUrl: "https://byucougars.com/sports/mens-basketball/roster", staffUrl: "https://byucougars.com/sports/mens-basketball/roster" },
  { name: "Gonzaga", mascot: "Bulldogs", conference: "WCC", website: "gozags.com", rosterUrl: "https://gozags.com/sports/mens-basketball/roster", staffUrl: "https://gozags.com/sports/mens-basketball/roster" },
  { name: "Loyola Marymount", mascot: "Lions", conference: "WCC", website: "lmulions.com", rosterUrl: "https://lmulions.com/sports/mens-basketball/roster", staffUrl: "https://lmulions.com/sports/mens-basketball/roster" },
  { name: "Pacific", mascot: "Tigers", conference: "WCC", website: "pacifictigers.com", rosterUrl: "https://pacifictigers.com/sports/mens-basketball/roster", staffUrl: "https://pacifictigers.com/sports/mens-basketball/roster" },
  { name: "Pepperdine", mascot: "Waves", conference: "WCC", website: "pepperdinewaves.com", rosterUrl: "https://pepperdinewaves.com/sports/mens-basketball/roster", staffUrl: "https://pepperdinewaves.com/sports/mens-basketball/roster" },
  { name: "Portland", mascot: "Pilots", conference: "WCC", website: "portlandpilots.com", rosterUrl: "https://portlandpilots.com/sports/mens-basketball/roster", staffUrl: "https://portlandpilots.com/sports/mens-basketball/roster" },
  { name: "Saint Mary's", mascot: "Gaels", conference: "WCC", website: "smcgaels.com", rosterUrl: "https://smcgaels.com/sports/mens-basketball/roster", staffUrl: "https://smcgaels.com/sports/mens-basketball/roster" },
  { name: "San Diego", mascot: "Toreros", conference: "WCC", website: "usdtoreros.com", rosterUrl: "https://usdtoreros.com/sports/mens-basketball/roster", staffUrl: "https://usdtoreros.com/sports/mens-basketball/roster" },
  { name: "San Francisco", mascot: "Dons", conference: "WCC", website: "usfdons.com", rosterUrl: "https://usfdons.com/sports/mens-basketball/roster", staffUrl: "https://usfdons.com/sports/mens-basketball/roster" },
  { name: "Santa Clara", mascot: "Broncos", conference: "WCC", website: "santaclarabroncos.com", rosterUrl: "https://santaclarabroncos.com/sports/mens-basketball/roster", staffUrl: "https://santaclarabroncos.com/sports/mens-basketball/roster" },

  // Atlantic 10 (15 teams)
  { name: "Davidson", mascot: "Wildcats", conference: "A-10", website: "davidsonwildcats.com", rosterUrl: "https://davidsonwildcats.com/sports/mens-basketball/roster", staffUrl: "https://davidsonwildcats.com/sports/mens-basketball/roster" },
  { name: "Dayton", mascot: "Flyers", conference: "A-10", website: "daytonflyers.com", rosterUrl: "https://daytonflyers.com/sports/mens-basketball/roster", staffUrl: "https://daytonflyers.com/sports/mens-basketball/roster" },
  { name: "Duquesne", mascot: "Dukes", conference: "A-10", website: "goduquesne.com", rosterUrl: "https://goduquesne.com/sports/mens-basketball/roster", staffUrl: "https://goduquesne.com/sports/mens-basketball/roster" },
  { name: "Fordham", mascot: "Rams", conference: "A-10", website: "fordhamsports.com", rosterUrl: "https://fordhamsports.com/sports/mens-basketball/roster", staffUrl: "https://fordhamsports.com/sports/mens-basketball/roster" },
  { name: "George Mason", mascot: "Patriots", conference: "A-10", website: "gomason.com", rosterUrl: "https://gomason.com/sports/mens-basketball/roster", staffUrl: "https://gomason.com/sports/mens-basketball/roster" },
  { name: "George Washington", mascot: "Colonials", conference: "A-10", website: "gwsports.com", rosterUrl: "https://gwsports.com/sports/mens-basketball/roster", staffUrl: "https://gwsports.com/sports/mens-basketball/roster" },
  { name: "La Salle", mascot: "Explorers", conference: "A-10", website: "goexplorers.com", rosterUrl: "https://goexplorers.com/sports/mens-basketball/roster", staffUrl: "https://goexplorers.com/sports/mens-basketball/roster" },
  { name: "Loyola Chicago", mascot: "Ramblers", conference: "A-10", website: "loyolaramblers.com", rosterUrl: "https://loyolaramblers.com/sports/mens-basketball/roster", staffUrl: "https://loyolaramblers.com/sports/mens-basketball/roster" },
  { name: "UMass", mascot: "Minutemen", conference: "A-10", website: "umassathletics.com", rosterUrl: "https://umassathletics.com/sports/mens-basketball/roster", staffUrl: "https://umassathletics.com/sports/mens-basketball/roster" },
  { name: "Rhode Island", mascot: "Rams", conference: "A-10", website: "gorhody.com", rosterUrl: "https://gorhody.com/sports/mens-basketball/roster", staffUrl: "https://gorhody.com/sports/mens-basketball/roster" },
  { name: "Richmond", mascot: "Spiders", conference: "A-10", website: "richmondspiders.com", rosterUrl: "https://richmondspiders.com/sports/mens-basketball/roster", staffUrl: "https://richmondspiders.com/sports/mens-basketball/roster" },
  { name: "Saint Joseph's", mascot: "Hawks", conference: "A-10", website: "sjuhawks.com", rosterUrl: "https://sjuhawks.com/sports/mens-basketball/roster", staffUrl: "https://sjuhawks.com/sports/mens-basketball/roster" },
  { name: "Saint Louis", mascot: "Billikens", conference: "A-10", website: "slubillikens.com", rosterUrl: "https://slubillikens.com/sports/mens-basketball/roster", staffUrl: "https://slubillikens.com/sports/mens-basketball/roster" },
  { name: "St. Bonaventure", mascot: "Bonnies", conference: "A-10", website: "gobonnies.com", rosterUrl: "https://gobonnies.com/sports/mens-basketball/roster", staffUrl: "https://gobonnies.com/sports/mens-basketball/roster" },
  { name: "VCU", mascot: "Rams", conference: "A-10", website: "vcuathletics.com", rosterUrl: "https://vcuathletics.com/sports/mens-basketball/roster", staffUrl: "https://vcuathletics.com/sports/mens-basketball/roster" },

  // Ivy League (8 teams)
  { name: "Brown", mascot: "Bears", conference: "Ivy", website: "brownbears.com", rosterUrl: "https://brownbears.com/sports/mens-basketball/roster", staffUrl: "https://brownbears.com/sports/mens-basketball/roster" },
  { name: "Columbia", mascot: "Lions", conference: "Ivy", website: "gocolumbialions.com", rosterUrl: "https://gocolumbialions.com/sports/mens-basketball/roster", staffUrl: "https://gocolumbialions.com/sports/mens-basketball/roster" },
  { name: "Cornell", mascot: "Big Red", conference: "Ivy", website: "cornellbigred.com", rosterUrl: "https://cornellbigred.com/sports/mens-basketball/roster", staffUrl: "https://cornellbigred.com/sports/mens-basketball/roster" },
  { name: "Dartmouth", mascot: "Big Green", conference: "Ivy", website: "dartmouthsports.com", rosterUrl: "https://dartmouthsports.com/sports/mens-basketball/roster", staffUrl: "https://dartmouthsports.com/sports/mens-basketball/roster" },
  { name: "Harvard", mascot: "Crimson", conference: "Ivy", website: "gocrimson.com", rosterUrl: "https://gocrimson.com/sports/mens-basketball/roster", staffUrl: "https://gocrimson.com/sports/mens-basketball/roster" },
  { name: "Penn", mascot: "Quakers", conference: "Ivy", website: "pennathletics.com", rosterUrl: "https://pennathletics.com/sports/mens-basketball/roster", staffUrl: "https://pennathletics.com/sports/mens-basketball/roster" },
  { name: "Princeton", mascot: "Tigers", conference: "Ivy", website: "goprincetontigers.com", rosterUrl: "https://goprincetontigers.com/sports/mens-basketball/roster", staffUrl: "https://goprincetontigers.com/sports/mens-basketball/roster" },
  { name: "Yale", mascot: "Bulldogs", conference: "Ivy", website: "yalebulldogs.com", rosterUrl: "https://yalebulldogs.com/sports/mens-basketball/roster", staffUrl: "https://yalebulldogs.com/sports/mens-basketball/roster" },

  // Missouri Valley (12 teams)
  { name: "Belmont", mascot: "Bruins", conference: "MVC", website: "belmontbruins.com", rosterUrl: "https://belmontbruins.com/sports/mens-basketball/roster", staffUrl: "https://belmontbruins.com/sports/mens-basketball/roster" },
  { name: "Bradley", mascot: "Braves", conference: "MVC", website: "bradleybraves.com", rosterUrl: "https://bradleybraves.com/sports/mens-basketball/roster", staffUrl: "https://bradleybraves.com/sports/mens-basketball/roster" },
  { name: "Drake", mascot: "Bulldogs", conference: "MVC", website: "godrakebulldogs.com", rosterUrl: "https://godrakebulldogs.com/sports/mens-basketball/roster", staffUrl: "https://godrakebulldogs.com/sports/mens-basketball/roster" },
  { name: "Evansville", mascot: "Purple Aces", conference: "MVC", website: "gopurpleaces.com", rosterUrl: "https://gopurpleaces.com/sports/mens-basketball/roster", staffUrl: "https://gopurpleaces.com/sports/mens-basketball/roster" },
  { name: "Illinois State", mascot: "Redbirds", conference: "MVC", website: "goredbirds.com", rosterUrl: "https://goredbirds.com/sports/mens-basketball/roster", staffUrl: "https://goredbirds.com/sports/mens-basketball/roster" },
  { name: "Indiana State", mascot: "Sycamores", conference: "MVC", website: "gosycamores.com", rosterUrl: "https://gosycamores.com/sports/mens-basketball/roster", staffUrl: "https://gosycamores.com/sports/mens-basketball/roster" },
  { name: "Missouri State", mascot: "Bears", conference: "MVC", website: "missouristatebears.com", rosterUrl: "https://missouristatebears.com/sports/mens-basketball/roster", staffUrl: "https://missouristatebears.com/sports/mens-basketball/roster" },
  { name: "Murray State", mascot: "Racers", conference: "MVC", website: "goracers.com", rosterUrl: "https://goracers.com/sports/mens-basketball/roster", staffUrl: "https://goracers.com/sports/mens-basketball/roster" },
  { name: "Northern Iowa", mascot: "Panthers", conference: "MVC", website: "unipanthers.com", rosterUrl: "https://unipanthers.com/sports/mens-basketball/roster", staffUrl: "https://unipanthers.com/sports/mens-basketball/roster" },
  { name: "Southern Illinois", mascot: "Salukis", conference: "MVC", website: "siusalukis.com", rosterUrl: "https://siusalukis.com/sports/mens-basketball/roster", staffUrl: "https://siusalukis.com/sports/mens-basketball/roster" },
  { name: "UIC", mascot: "Flames", conference: "MVC", website: "uicflames.com", rosterUrl: "https://uicflames.com/sports/mens-basketball/roster", staffUrl: "https://uicflames.com/sports/mens-basketball/roster" },
  { name: "Valparaiso", mascot: "Beacons", conference: "MVC", website: "valpoathletics.com", rosterUrl: "https://valpoathletics.com/sports/mens-basketball/roster", staffUrl: "https://valpoathletics.com/sports/mens-basketball/roster" },

  // MAC (12 teams)
  { name: "Akron", mascot: "Zips", conference: "MAC", website: "gozips.com", rosterUrl: "https://gozips.com/sports/mens-basketball/roster", staffUrl: "https://gozips.com/sports/mens-basketball/roster" },
  { name: "Ball State", mascot: "Cardinals", conference: "MAC", website: "ballstatesports.com", rosterUrl: "https://ballstatesports.com/sports/mens-basketball/roster", staffUrl: "https://ballstatesports.com/sports/mens-basketball/roster" },
  { name: "Bowling Green", mascot: "Falcons", conference: "MAC", website: "bgsufalcons.com", rosterUrl: "https://bgsufalcons.com/sports/mens-basketball/roster", staffUrl: "https://bgsufalcons.com/sports/mens-basketball/roster" },
  { name: "Buffalo", mascot: "Bulls", conference: "MAC", website: "ubbulls.com", rosterUrl: "https://ubbulls.com/sports/mens-basketball/roster", staffUrl: "https://ubbulls.com/sports/mens-basketball/roster" },
  { name: "Central Michigan", mascot: "Chippewas", conference: "MAC", website: "cmuchippewas.com", rosterUrl: "https://cmuchippewas.com/sports/mens-basketball/roster", staffUrl: "https://cmuchippewas.com/sports/mens-basketball/roster" },
  { name: "Eastern Michigan", mascot: "Eagles", conference: "MAC", website: "emueagles.com", rosterUrl: "https://emueagles.com/sports/mens-basketball/roster", staffUrl: "https://emueagles.com/sports/mens-basketball/roster" },
  { name: "Kent State", mascot: "Golden Flashes", conference: "MAC", website: "kentstatesports.com", rosterUrl: "https://kentstatesports.com/sports/mens-basketball/roster", staffUrl: "https://kentstatesports.com/sports/mens-basketball/roster" },
  { name: "Miami (OH)", mascot: "RedHawks", conference: "MAC", website: "miamiredhawks.com", rosterUrl: "https://miamiredhawks.com/sports/mens-basketball/roster", staffUrl: "https://miamiredhawks.com/sports/mens-basketball/roster" },
  { name: "Northern Illinois", mascot: "Huskies", conference: "MAC", website: "niuhuskies.com", rosterUrl: "https://niuhuskies.com/sports/mens-basketball/roster", staffUrl: "https://niuhuskies.com/sports/mens-basketball/roster" },
  { name: "Ohio", mascot: "Bobcats", conference: "MAC", website: "ohiobobcats.com", rosterUrl: "https://ohiobobcats.com/sports/mens-basketball/roster", staffUrl: "https://ohiobobcats.com/sports/mens-basketball/roster" },
  { name: "Toledo", mascot: "Rockets", conference: "MAC", website: "utrockets.com", rosterUrl: "https://utrockets.com/sports/mens-basketball/roster", staffUrl: "https://utrockets.com/sports/mens-basketball/roster" },
  { name: "Western Michigan", mascot: "Broncos", conference: "MAC", website: "wmubroncos.com", rosterUrl: "https://wmubroncos.com/sports/mens-basketball/roster", staffUrl: "https://wmubroncos.com/sports/mens-basketball/roster" },
];

// Get unique conferences
const CONFERENCES = [...new Set(D1_TEAMS.map(t => t.conference))].sort();

interface D1DirectoryProps {
  isMobile: boolean;
}

export function D1Directory({ isMobile }: D1DirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConference, setSelectedConference] = useState<string>("all");
  const [expandedConferences, setExpandedConferences] = useState<Set<string>>(new Set(CONFERENCES));

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "4px" }}>
          D1 Basketball Directory
        </div>
        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
          {D1_TEAMS.length} teams · {CONFERENCES.length} conferences · Links to roster & staff pages
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
      </div>

      {/* Results count */}
      <div style={{ fontSize: "12px", color: "#6b7280" }}>
        Showing {filteredTeams.length} teams
      </div>

      {/* Teams by Conference */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Object.entries(teamsByConference).sort(([a], [b]) => a.localeCompare(b)).map(([conf, teams]) => (
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
