/**
 * Ultra-deep football video analysis prompts.
 *
 * The full analysis is split across three passes over the same uploaded video so
 * that each pass gets the model's whole output budget instead of being truncated
 * mid-JSON:
 *   A. SCAN    — video info, teams, per-player detection / tracking / ratings, keeper analysis
 *   B. EVENTS  — touches, passes, kicks, shots, goals, defensive actions, referee calls,
 *                timeline and clip windows
 *   C. REPORT  — tactics, team statistics, coaching feedback and the final match report,
 *                grounded in the JSON produced by passes A and B.
 */

export interface SportsPromptContext {
  sourceHint?: string;
  durationLabel?: string;
}

const ROLE = `You are an elite AI Football Performance Analyst, Computer Vision Engineer, Tactical Analyst, Sports Scientist and Video Editor combined. You analyse match footage frame-by-frame with maximum achievable accuracy.`;

const RULES = `GLOBAL RULES — follow every one of them:
- Work through the footage in time order and account for the ENTIRE clip, from the first frame to the last. Never stop early.
- Read shirt numbers whenever they become legible, even for a single frame; carry that identity across the rest of the clip.
- Track every player you can see continuously; a player who leaves and re-enters frame is the SAME player, not a new one.
- Estimate physical quantities (speed, distance, angle, force, xG) from the visible geometry using pitch landmarks and normal football physics. Never leave a numeric field blank — give your best physical estimate and list the field in "dataQuality.estimatedFields".
- Anything you are not certain about must be flagged: prefix the relevant text field with "Estimated: " and mention the uncertainty in the nearest "notes" field. Never invent a jersey number you never saw.
- Jersey numbers: use the digits when they are legible. When a number is never legible, use a SHORT stable placeholder of the form "unk1", "unk2", … (max 8 characters, one per player, reused for that player in every event) and describe the player's appearance in "notes". Do not build long descriptive ids — they are rendered inside a small badge.
- All timestamps are playback time in MM:SS (or HH:MM:SS beyond one hour) and must line up with the real video, because they are used to programmatically cut clips. Accuracy matters more than style.
- Pitch coordinates are normalised: x = 0 at the left goal line, x = 100 at the right goal line, y = 0 at the top touchline, y = 100 at the bottom touchline, from the broadcast camera's point of view. Keep the same orientation for the whole analysis.
- Ratings are 0-10 with one decimal. Percentages are 0-100. Confidence is 0-100. Speeds are km/h, distances metres, times seconds, angles degrees.
- Output ONLY a single valid JSON object. No markdown, no code fences, no commentary before or after. Use null only where the schema explicitly allows it, [] for empty lists, "" for unknown text and 0 for unknown numbers.
- Never truncate the JSON. If the footage contains more events than you can fit, keep the highest-value ones (goals, shots, key passes, defensive actions, cards) complete rather than emitting a broken object, and say what you dropped in "dataQuality.caveats".

DEPTH REQUIREMENTS — thin output is a failed analysis:
- Never answer a descriptive text field with one word or a bare label. Every "description", "notes", "summary", "justification", "reason" and "positioning" field is a full sentence at minimum, and the longer-form ones (summaries, justifications, tactical fields, coaching feedback) are 2-4 sentences that say WHAT happened, WHEN (timestamp), WHO (jersey number) and WHY it mattered.
- Cite concrete evidence constantly: timestamps, jersey numbers, distances, areas of the pitch. "Good passing" is worthless; "#8 switched play twice from the left half space at 03:12 and 07:44, both over 30 m" is what is wanted.
- Fill every array the schema asks for. An empty array is only acceptable when that thing genuinely never happens on screen — and then say so in the nearest notes field.
- Cover the whole clip evenly. Do not analyse the first minute in detail and then summarise the rest.`;

function sourceLine(context: SportsPromptContext): string {
  const parts: string[] = [];
  if (context.sourceHint) parts.push(`Video source: ${context.sourceHint}`);
  if (context.durationLabel) parts.push(`Known clip duration: ${context.durationLabel} — every timestamp you output must fall inside it.`);
  return parts.length > 0 ? `\n${parts.join("\n")}\n` : "\n";
}

/** PASS A — sections 1, 2, 3, 11 of the analysis brief. */
export function buildScanPrompt(context: SportsPromptContext): string {
  return `${ROLE}
${sourceLine(context)}
TASK — PASS 1 of 3: VIDEO INFORMATION, PLAYER DETECTION, PLAYER TRACKING, GOALKEEPER ANALYSIS.

1. VIDEO INFORMATION — duration, frame rate, resolution, camera type (broadcast / tactical / handheld / phone / drone), camera movement, weather, day or night, stadium or pitch type, estimated pitch dimensions, video quality score (0-10) and visibility score (0-10).

2. PLAYER DETECTION — detect every player who appears on the pitch, both teams, goalkeepers included. For each one: temporary player id, team (label teams by kit colour, e.g. "Red Team"), jersey number, jersey / shorts / socks colour, captain flag, goalkeeper flag, estimated height, estimated preferred foot, position on the pitch, and a detection confidence 0-100. Do not merge two different players into one entry and do not split one player into two.

3. PLAYER TRACKING — for every player estimate distance covered, top and average speed, sprint count, ball possession time, time on screen, walking and standing time, plus a heatmap (up to 8 zones with normalised x/y and 0-100 intensity) and a movement path (up to 10 chronological points). Also give each player's counting stats and a full performance rating card with a written justification.

SCOUTING REPORT — every player also gets a written scouting block: a 2-4 sentence summary of their game, at least 2 strengths, at least 2 weaknesses, a coaching note aimed at that individual, and the specific moments (with timestamps) that stood out. Ground all of it in what is visible; if a player is barely on screen, say that and score confidence low instead of inventing detail.

11. GOALKEEPER ANALYSIS — for every goalkeeper: saves, goals conceded, save difficulty, reflex time, distribution accuracy, catch success, punches, errors and positioning. The positioning and notes fields are 2-3 sentences each, referencing specific moments.

MATCH SUMMARY — besides the short and detailed summary, break the clip into 3-6 phases of play. Each phase gets a time range, a title and 2-3 sentences on what changed in that stretch.

${RULES}

Return exactly this JSON shape:
{
  "videoInfo": { "duration": "MM:SS", "fps": string, "resolution": string, "cameraType": string, "cameraMovement": string, "weather": string, "timeOfDay": string, "stadium": string, "pitchDimensions": string, "videoQualityScore": number, "visibilityScore": number, "notes": string },
  "sport": "Football (Soccer)",
  "matchSummary": {
    "short": "2-3 sentence summary",
    "detailed": "3-6 sentence paragraph on flow of play, momentum and key moments, with timestamps",
    "phases": [ { "range": "MM:SS-MM:SS", "title": "what defined this stretch", "description": "2-3 sentences on what changed and why" } ]
  },
  "playerCount": {
    "total": number,
    "teamA": { "id": "A", "name": string, "shirtColor": string, "shortsColor": string, "playerCount": number, "formation": string },
    "teamB": { "id": "B", "name": string, "shirtColor": string, "shortsColor": string, "playerCount": number, "formation": string },
    "notes": "explain any counting uncertainty, e.g. players off camera"
  },
  "players": [
    {
      "id": "p1",
      "jerseyNumber": "digits when legible, otherwise a short placeholder like \"unk1\" (max 8 chars)",
      "team": string,
      "teamId": "A" | "B",
      "role": "goalkeeper" | "outfield",
      "position": string,
      "jerseyColor": string,
      "shortsColor": string,
      "socksColor": string,
      "isCaptain": boolean,
      "isGoalkeeper": boolean,
      "estimatedHeight": string,
      "footPreference": string,
      "confidence": number,
      "notes": "how you identified this player and how confident you are — a full sentence",
      "scouting": {
        "summary": "2-4 sentences on how this player played, with timestamps",
        "strengths": ["at least 2, each evidenced"],
        "weaknesses": ["at least 2, each evidenced"],
        "coachingNote": "1-2 sentences of individual coaching advice",
        "standoutMoments": ["MM:SS — what they did"]
      },
      "tracking": {
        "distanceCoveredM": number, "topSpeedKmh": number, "avgSpeedKmh": number, "sprintCount": number,
        "possessionTimeSec": number, "timeOnScreenSec": number, "walkingTimeSec": number, "standingTimeSec": number,
        "heatmapZones": [{ "x": number, "y": number, "intensity": number }],
        "movementPath": [{ "timestamp": "MM:SS", "x": number, "y": number }]
      },
      "stats": { "touches": number, "passesAttempted": number, "passesCompleted": number, "passAccuracy": number, "shots": number, "shotsOnTarget": number, "goals": number, "assists": number, "tackles": number, "interceptions": number, "clearances": number, "duelsWon": number, "foulsCommitted": number, "foulsWon": number },
      "ratings": { "attack": number, "passing": number, "defending": number, "positioning": number, "movement": number, "vision": number, "decisionMaking": number, "ballControl": number, "workRate": number, "overall": number, "justification": "2-4 sentences on why this player earned these numbers, citing what happened and when" }
    }
  ],
  "goalkeepers": [
    { "jerseyNumber": string, "team": string, "saves": number, "goalsConceded": number, "saveDifficulty": "describe the hardest saves and how difficult they were", "reflexTimeSec": number, "distributionAccuracy": number, "catchSuccess": number, "punches": number, "errors": ["MM:SS — what went wrong"], "positioning": "2-3 sentences on starting position, line height and reading of crosses", "notes": "2-3 sentences on distribution, command of the area and communication" }
  ],
  "ballAnalysis": { "avgSpeedKmh": number, "maxSpeedKmh": number, "maxHeightM": number, "longestPassM": number, "longestShotM": number, "bounceCount": number, "airTimeSec": number, "groundContacts": number, "trajectoryNotes": string },
  "dataQuality": { "coverage": "what fraction of the clip and of the pitch you could actually analyse", "estimatedFields": [string], "caveats": [string] }
}

If the footage is not football, still name the correct sport in "sport" and fill the closest equivalent fields.`;
}

/** PASS B — sections 5, 6, 7, 8, 9, 10, 14, 15, 16, 17 of the analysis brief. */
export function buildEventPrompt(context: SportsPromptContext, roster: string): string {
  return `${ROLE}
${sourceLine(context)}
TASK — PASS 2 of 3: EVENT-LEVEL ANALYSIS. Log what physically happens in the footage, moment by moment.

Players already identified in pass 1 (reuse these jersey numbers and team labels exactly):
${roster}

5. EVERY TOUCH — every meaningful ball contact: timestamp, player, team, touch type, first-touch quality, direction, pressure on the player, distance carried after the touch.
6. PASSES — passer, receiver (null if the pass fails), distance, ground/lofted/driven, speed, direction, angle in degrees, accuracy score 0-100, success, and the progressive / through-ball / cross / long-ball / back-pass flags, plus normalised start and end coordinates so a pass map can be drawn.
7. KICKS — every strike of the ball: kick type, foot, contact point on the ball, ball speed, launch speed, launch angle, angle with respect to the ground, elevation angle, direction in degrees, power %, estimated force in newtons, follow-through and accuracy score.
8. SHOTS — shot type, distance, speed, angle, estimated xG, on/off target, outcome, block and deflection flags, and the normalised shot location.
9. GOALS — scorer, assist, build-up, the pass sequence that led to it, defensive errors, goalkeeper position, goal probability and the timestamp where the celebration starts.
10. DEFENSIVE ACTIONS — tackles, interceptions, blocks, clearances, pressures, duels and errors.
14. REFEREE — fouls, yellow cards, red cards, handballs, offsides, advantages, free kicks and penalties.
15. TIMELINE — one chronological entry for every important event in the match.
16/17. CLIP WINDOWS — a highlight entry for every moment worth cutting into its own clip: goals, shots, key passes, long passes, crosses, skill moves, dribbles, tackles, interceptions, saves, cards, corners, free kicks, penalties, celebrations, fast breaks and mistakes. Give a TIGHT window: start 1-2 s before the action begins and end 1-2 s after it ends, 3-15 s total, never longer. List every jersey number involved so per-player highlight reels can be assembled, and rate importance 0-100.

VOLUME — this pass is judged on completeness:
- Log every event you can actually see, in time order, across the WHOLE clip.
- As a floor for any clip with real gameplay: at least 40 touches, 40 passes, 15 kicks, every single shot, every goal, at least 15 defensive actions, every referee decision, at least 20 timeline entries and at least 12 highlight windows. If the footage genuinely contains fewer (short clip, few players, ball out of play), record what exists and explain the shortfall in "dataQuality.caveats" — do not pad with invented events.
- Ceiling, so the JSON stays complete: at most 150 touches and 200 passes. If you hit the ceiling, keep the consequential ones and note it in "dataQuality.caveats".
- Priority when the clip is long: goals, shots, cards and referee calls first, then defensive actions and key passes, then routine passes, then routine touches.
- Every timeline entry and highlight needs a real description — what happened, who was involved and why it mattered, not just a label.

${RULES}

Return exactly this JSON shape:
{
  "touches": [ { "timestamp": "MM:SS", "jerseyNumber": string, "team": string, "touchType": string, "firstTouchQuality": string, "direction": string, "pressure": string, "distanceAfterM": number, "notes": "one sentence on what the touch achieved or cost" } ],
  "passes": [ { "timestamp": "MM:SS", "passerJerseyNumber": string, "receiverJerseyNumber": string | null, "team": string, "distanceM": number, "passHeight": "ground" | "lofted" | "driven" | "chipped", "speedKmh": number, "direction": "forward" | "backward" | "sideways" | "diagonal", "angleDeg": number, "accuracyScore": number, "successful": boolean, "progressive": boolean, "throughBall": boolean, "cross": boolean, "longBall": boolean, "backPass": boolean, "start": { "x": number, "y": number }, "end": { "x": number, "y": number } } ],
  "kicks": [ { "timestamp": "MM:SS", "jerseyNumber": string, "team": string, "kickType": string, "foot": "left" | "right" | "unknown", "contactPoint": string, "ballSpeedKmh": number, "launchSpeedKmh": number, "launchAngleDeg": number, "groundAngleDeg": number, "elevationAngleDeg": number, "directionDeg": number, "powerPercent": number, "estimatedForceN": number, "followThrough": string, "accuracyScore": number } ],
  "shots": [ { "timestamp": "MM:SS", "shooterJerseyNumber": string, "team": string, "shotType": string, "description": "one or two sentences: how the chance was created, the strike itself and the outcome", "assistJerseyNumber": string | null, "distanceM": number, "speedKmh": number, "angleDeg": number, "xG": number, "onTarget": boolean, "outcome": "goal" | "saved" | "blocked" | "off-target" | "post" | "deflected", "blocked": boolean, "deflection": boolean, "location": { "x": number, "y": number } } ],
  "goals": [ { "timestamp": "MM:SS", "scorerJerseyNumber": string, "scorerTeam": string, "assistJerseyNumber": string | null, "kickType": string, "kickAngle": "body/foot position and angle relative to goal", "description": "2-3 sentences telling the goal", "buildUp": "2-3 sentences on the move that created it, starting from where possession was won", "passSequence": ["#4", "#8", "#10"], "defensiveErrors": ["who was beaten and how"], "goalkeeperPosition": "where the keeper was and whether he could have done better", "goalProbability": number, "celebrationTimestamp": "MM:SS" | null } ],
  "defensiveActions": [ { "timestamp": "MM:SS", "jerseyNumber": string, "team": string, "actionType": "tackle" | "interception" | "block" | "clearance" | "pressure" | "duel" | "error", "successful": boolean, "description": "one sentence: who was stopped, where on the pitch, and what it prevented" } ],
  "refereeDecisions": [ { "timestamp": "MM:SS", "type": "foul" | "yellow-card" | "red-card" | "handball" | "offside" | "advantage" | "free-kick" | "penalty", "jerseyNumber": string, "team": string, "description": "one sentence on the incident and whether the call looks correct" } ],
  "timeline": [ { "timestamp": "MM:SS", "type": string, "title": string, "description": "one or two sentences on the event", "team": string, "jerseyNumber": string | null } ],
  "highlights": [ { "id": "h1", "type": "goal" | "shot-on-target" | "shot-off-target" | "key-pass" | "long-pass" | "cross" | "save" | "foul" | "card" | "skill" | "dribble" | "tackle" | "interception" | "corner" | "free-kick" | "penalty" | "celebration" | "fast-break" | "mistake" | "other", "startTimestamp": "MM:SS", "endTimestamp": "MM:SS", "title": "specific title, e.g. \\"#9 spins his marker and forces a save\\"", "description": "1-2 sentences on the action inside this window", "playersInvolved": [string], "team": string, "importance": number } ],
  "dataQuality": { "coverage": string, "estimatedFields": [string], "caveats": [string] }
}

Order every array chronologically.`;
}

/** PASS C — sections 12, 13, 18, 19, 20 of the analysis brief. */
export function buildReportPrompt(
  context: SportsPromptContext,
  scanSummary: string,
  eventSummary: string
): string {
  return `${ROLE}
${sourceLine(context)}
TASK — PASS 3 of 3: TACTICS, TEAM STATISTICS, AWARDS AND THE FINAL MATCH REPORT.

You already produced this factual base from the same video. Stay consistent with it — the numbers below are the ground truth for scorelines, jersey numbers and team labels:

--- PASS 1 (players & tracking) ---
${scanSummary}

--- PASS 2 (events) ---
${eventSummary}

Now watch the footage again with a tactical eye and produce:

12. TACTICAL ANALYSIS — per team: formation, shape, team width in metres, defensive line height, pressing height, compactness, build-up pattern, counter-attacking behaviour, wing play, central attack and transition speed. Every one of those text fields is 1-3 sentences describing what you actually saw, with timestamps — not a single adjective.
13. AWARDS — Man of the Match, Best Defender, Best Midfielder, Best Forward, Best Goalkeeper, Most Creative Player, Fastest Player, Most Accurate Passer and Most Dangerous Attacker. Every award needs a 2-3 sentence reason tied to specific moments on screen.
18/19. TEAM STATISTICS — per team: goals, possession %, shots, shots on target, big chances, xG, passes attempted/completed, pass accuracy, crosses, through balls, tackles, interceptions, clearances, saves, duels won, fouls, corners, offsides, cards, distance covered and sprints. Possession of the two teams must add up to 100.
20. FINAL MATCH REPORT — final score, tactical summary, each team's strengths and weaknesses (at least 3 each), an estimated Best XI from the players on screen, and specific coaching improvements.

THEMED ANALYSIS — write a substantial paragraph (3-5 sentences each, with timestamps and jersey numbers) on each of: attacking play, defending, passing and ball circulation, physical output, goalkeeping, set pieces, refereeing, and how momentum swung across the clip.

TURNING POINTS — the 3-6 moments that changed the game, each with a timestamp, what happened, and what it changed.

KEY BATTLES — the individual duels that shaped the match (e.g. "#9 vs #4 in behind the last line"), who came out on top and why.

COACHING IMPROVEMENTS — at least 12, each as a structured object: the area, the player (jersey number and team, or "team" for a collective issue), the timestamp that shows it, the issue, the recommendation, and a concrete training drill that fixes it. Cover positioning, finishing, decision-making, defensive tracking, passing accuracy, pressing coordination, transitions and set-piece execution.

${RULES}

Return exactly this JSON shape:
{
  "tactics": [ { "teamId": "A" | "B", "teamName": string, "formation": "e.g. 4-3-3 shifting to 4-4-2 out of possession", "shape": string, "teamWidthM": number, "defensiveLine": string, "pressingHeight": string, "compactness": string, "buildUpPattern": string, "counterAttack": string, "wingPlay": string, "centralAttack": string, "transitionSpeed": string } ],
  "teamStats": [ { "teamId": "A" | "B", "teamName": string, "goals": number, "possessionPercent": number, "shots": number, "shotsOnTarget": number, "bigChances": number, "xG": number, "passesAttempted": number, "passesCompleted": number, "passAccuracy": number, "crosses": number, "throughBalls": number, "tackles": number, "interceptions": number, "clearances": number, "saves": number, "duelsWon": number, "fouls": number, "corners": number, "offsides": number, "yellowCards": number, "redCards": number, "distanceCoveredKm": number, "sprints": number } ],
  "awards": [ { "category": "Man of the Match" | "Best Defender" | "Best Midfielder" | "Best Forward" | "Best Goalkeeper" | "Most Creative Player" | "Fastest Player" | "Most Accurate Passer" | "Most Dangerous Attacker", "jerseyNumber": string, "team": string, "reason": "2-3 sentences citing specific moments" } ],
  "narratives": {
    "attacking": "3-5 sentences", "defending": "3-5 sentences", "passing": "3-5 sentences", "physical": "3-5 sentences",
    "goalkeeping": "3-5 sentences", "setPieces": "3-5 sentences", "refereeing": "3-5 sentences", "momentum": "3-5 sentences"
  },
  "turningPoints": [ { "timestamp": "MM:SS", "title": string, "description": "what happened", "impact": "what it changed for the rest of the clip" } ],
  "keyBattles": [ { "matchup": "#9 (Red Team) vs #4 (Blue Team)", "description": "2-3 sentences on how the duel went", "winner": "who came out on top" } ],
  "report": {
    "finalScore": "Team A 2 - 1 Team B",
    "teamAGoals": number,
    "teamBGoals": number,
    "tacticalSummary": "4-6 sentences on how the match was won and lost",
    "teamAStrengths": [string], "teamAWeaknesses": [string],
    "teamBStrengths": [string], "teamBWeaknesses": [string],
    "bestXI": [ { "jerseyNumber": string, "team": string, "position": string, "reason": "why they make the XI" } ]
  },
  "improvements": [
    { "area": "e.g. Defensive transition", "jerseyNumber": "4 or team", "team": string, "timestamp": "MM:SS", "issue": "what went wrong, described concretely", "recommendation": "what to do instead", "drill": "a training exercise that fixes it" }
  ],
  "tacticalInsights": ["at least 8, each a full sentence with evidence"],
  "dataQuality": { "coverage": string, "estimatedFields": [string], "caveats": [string] }
}`;
}
