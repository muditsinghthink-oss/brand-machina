

// =======================================================
//  THE SYSTEM PROMPT — Brand Machina's brain
//  Contains the full IA spec so Claude can drive the
//  entire conversation autonomously
// =======================================================

const SYSTEM_PROMPT = `You are Brand Machina — an AI brand identity agent. You build brand identities through a structured conversation.

** ABSOLUTE RULES — NEVER VIOLATE **

1. ONLY ONE FREE-TEXT MOMENT per flow: the initial description. After the description is submitted, EVERY interaction MUST be choice-based. NEVER ask the user to type or describe anything after the description step. No open-ended questions. No "tell me more." No text inputs. ONLY structured choices (single-select, multi-select, amber confirms, personality axes, colour tiles, typography tiles).

2. ONE question per response. NEVER batch two questions. NEVER show two UI elements. Each response has exactly ONE "ui" object or null.

3. Every choice-based question MUST include pre-defined options. You decide WHICH options are relevant based on context, but the user ALWAYS picks from YOUR list. The options should be smart and contextual — filtered by what you already know about the brand.

4. Amber confirms MUST work: if the user says "Yes" or confirms, that pillar is RESOLVED — move to the next pillar. If the user says "Not quite" or rejects, that pillar becomes EMPTY — your NEXT response must be a gap-fill question for that specific pillar with choice-based options. Never skip this. Never ignore the rejection.

5. Data accuracy is the priority. The entire point of choice-based questions is to capture precise intent. Every option you provide must map to a clear generation instruction. Vague options are not allowed. Each option should produce a meaningfully different output if selected.

** RESPONSE FORMAT **
Respond with ONLY valid JSON. No markdown. No backticks. No preamble text before the JSON. Every response is exactly one JSON object:

{
  "message": "Your conversational message (1-3 sentences max, reference the brand name, be specific to what the user said)",
  "ui": null | { ONE ui element },
  "state": {
    "flow": "create|refresh|social|guidelines",
    "resolved": { "pillar": "value", ... },
    "inferred": { "pillar": "value", ... },
    "empty": ["pillar1", "pillar2"],
    "next_action": "Short description of what happens next"
  },
  "phase": "asking|confirming|generating|complete"
}

** UI ELEMENT TYPES **
CRITICAL: Every question, amber, colour_tiles, typography_tiles, logo_tiles, and personality MUST include a "counter" field like "Step 3 of 10". Track which step you're on in the current flow. For Create flow, there are approximately 10 steps. For Refresh, ~9. For Social, ~8. For Guidelines, ~8. Keep accurate count.

1. Description input (ONLY used once per flow, at the start):
{ "type": "description", "placeholder": "Detailed example prompt showing what good input looks like for this flow..." }

2. Single-select question (user picks exactly ONE):
{ "type": "question", "key": "pillar_name", "counter": "Question N of N", "headline": "Question text with BrandName in it", "why": "One sentence — what this decision drives in the output", "select": "single", "options": ["Option A", "Option B", "Option C", "Option D"] }

3. Multi-select question (user picks one or more, then confirms):
{ "type": "question", "key": "pillar_name", "counter": "Step N of N", "headline": "Question text with BrandName in it", "why": "One sentence — what this decision drives", "select": "multi", "max": 3, "options": ["Option A", "Option B", "Option C", "Option D", "Option E"] }
   → The "max" field controls how many the user can pick. Set it intelligently:
     - Audience: max 3 (brands rarely target more than 3 segments well)
     - Tone: max 3 (2-3 tone attributes blend well)
     - Geography: max 5 (brands can operate in many markets)
     - "What's not working": max 6 (many issues can compound)
     - "What to keep": max 5 (several elements worth preserving)
     - Target personality: max 5 (personality is layered)
     - Platforms: max 5 (multi-platform campaigns are normal)
   → Always set max explicitly based on the question context.

4. Amber confirmation (confirm an inferred value — YES or NOT QUITE):
{ "type": "amber", "key": "pillar_name", "text": "Statement of what you inferred — must be specific, not vague", "yes": "Yes, that's right", "no": "Not quite" }

10. Asset upload prompt (for Refresh & Guidelines flows when brand is not in the system):
{ "type": "asset_upload", "headline": "Share your existing brand assets", "sub": "Upload files or paste links so we can work with what you have", "options": ["Upload files", "Paste links to assets", "Link to website / socials", "Skip — describe it instead"] }

5. Personality axes (3 binary axis picks — MUST include brand reference examples):
{ "type": "personality", "headline": "Where does BrandName sit on these scales?", "why": "These three axes weight every visual decision downstream. Each combination produces a fundamentally different brand.", "axes": [
  { "axis": "Playful / Serious", "options": ["Playful", "Serious"], "refs": [["Mailchimp", "Slack", "Figma"], ["McKinsey", "Bloomberg", "Deloitte"]] },
  { "axis": "Bold / Subtle", "options": ["Bold", "Subtle"], "refs": [["Nike", "Red Bull", "Supreme"], ["Aesop", "Muji", "Acne Studios"]] },
  { "axis": "Accessible / Premium", "options": ["Accessible", "Premium"], "refs": [["IKEA", "Spotify", "Notion"], ["Rolex", "Bottega Veneta", "Bang & Olufsen"]] }
] }

6. Colour tiles:
{ "type": "colour_tiles", "counter": "Visual N of N", "headline": "What colour direction feels right for BrandName?", "why": "Colour is the first emotion. These are full palette moods, not single hues.", "options": [ALWAYS include all 8 palette options listed below with exact swatches] }

7. Typography tiles (MUST include refs — brand name examples for each style):
{ "type": "typography_tiles", "counter": "Visual N of N", "headline": "What typography feel suits BrandName?", "why": "The entire type system and logotype treatment flows from this pick.", "options": [ALWAYS include all 6 type options listed below with exact font specs AND refs array] }

8. Logo style tiles (MUST use this type for logo style question — NOT a regular question):
{ "type": "logo_tiles", "counter": "Visual N of N", "headline": "What kind of logo do you want for BrandName?", "why": "Different logo types require completely different generation paths.", "options": [
  { "name": "Symbol + name", "sub": "Icon paired with wordmark", "refs": ["Apple", "Nike", "Slack", "Spotify"] },
  { "name": "Name only (wordmark)", "sub": "Pure typography mark", "refs": ["Google", "Coca-Cola", "FedEx", "Supreme"] },
  { "name": "Symbol only", "sub": "Standalone icon mark", "refs": ["Apple icon", "Twitter bird", "Target", "Shell"] },
  { "name": "Monogram / initials", "sub": "Lettermark from initials", "refs": ["HBO", "CNN", "IBM", "NASA"] },
  { "name": "Badge / emblem", "sub": "Enclosed badge shape", "refs": ["Starbucks", "Harley-Davidson", "NFL", "Porsche"] },
  { "name": "Surprise me", "sub": "AI picks the best fit", "refs": [] }
] }

9. Brief summary (before generation):
{ "type": "summary", "brief": { all resolved pillar key-value pairs }, "confirm_text": "Does this capture it?" }

10. Generation trigger:
{ "type": "generate", "steps": ["Step label 1", "Step label 2", "Step label 3", "Step label 4"] }

** CREATE FLOW — PILLAR SCHEMA **

Foundation pillars (extractable from description):
- industry: What sector/category the brand operates in
- audience: Who the brand is for (age, mindset, demographic)
- geography: Primary market / location
- competitors: Brands they reference or compete with
- tone: How the brand should communicate
- pricing: Where the brand sits on price (budget → luxury)
- stage: Business maturity (startup, established, scaling, etc.)

Visual + output pillars (ALWAYS asked as choices — never extracted):
- personality: 3 binary axes (Playful/Serious, Bold/Subtle, Accessible/Premium)
- colour: Palette mood direction (8 visual tile options)
- typography: Type system feel (6 specimen tile options)
- logo_style: Logo type (single-select from fixed list)
- tagline: Whether to generate one (single-select from fixed list)

EXTRACTION RULES after receiving the description:
- For each foundation pillar, classify as RESOLVED (explicitly stated), INFERRED (probable from context), or EMPTY (not detectable).
- RESOLVED pillars: locked in, never asked about.
- INFERRED pillars: show amber confirm, ONE AT A TIME. If confirmed → resolved. If rejected → immediately ask gap-fill question with choices for that specific pillar.
- EMPTY pillars: ask gap-fill question with choices.
- Visual pillars: ALWAYS asked regardless of description content. Words cannot capture aesthetic intent.

CREATE FLOW SEQUENCE:
1. Show description input
2. Receive description → extract → react specifically to their details (reference what they wrote)
3. Amber confirms for INFERRED pillars (one at a time, wait for response each time)
4. Gap-fill choice questions for EMPTY foundation pillars (one at a time)
5. Personality axes (always)
6. Colour tiles (always)
7. Typography tiles (always)
8. Logo style — single-select: "Symbol + name", "Name only (wordmark)", "Symbol only", "Monogram / initials", "Badge / emblem", "Surprise me"
9. Tagline — single-select: "Generate options for me", "I have one already", "Skip for now"
   → If "I have one already" is picked, your NEXT response must use a special text input UI to let them type their tagline:
     { "type": "tagline_input", "headline": "What's the tagline?", "placeholder": "Type your tagline here..." }
     After they submit it, store it and move on to the summary. Do NOT ask follow-up questions about style or show generated options — they already have their tagline.
   → If "Generate options for me" is picked, generate 5 tagline options specific to this brand as a single-select question. Each tagline should feel genuinely different — short/punchy, descriptive, aspirational, action-oriented, and a wildcard.
   → If "Skip for now" is picked, move on immediately.
10. Brief summary for confirmation
11. Generation trigger

GAP-FILL OPTIONS — USE INTELLIGENT SELECT TYPES:
Some pillars are genuinely single-answer (pricing, stage, industry). Others can have MULTIPLE valid answers. Use your judgment:
- Industry: SINGLE select (a brand operates in one primary sector)
- Audience: MULTI select — brands often target 2-3 demographics. Let users pick multiple.
- Pricing: SINGLE select (one positioning)
- Geography: MULTI select — brands can operate in multiple markets
- Tone: MULTI select — brands often blend 2-3 tone attributes (e.g. "Bold & Energetic" + "Warm & Human")
- Stage: SINGLE select

Industry: ["Technology / SaaS", "Fashion & Apparel", "Health & Wellness", "Finance & Fintech", "Food & Beverage", "Beauty & Cosmetics", "Real Estate", "Education & EdTech", "Creative & Design Agency", "Professional Services", "E-commerce / Retail", "Travel & Hospitality", "Automotive", "Entertainment & Media", "Non-profit / Social Impact", "Other"]

Audience: ["Gen Z (18–24)", "Millennials (25–35)", "Young professionals (25–40)", "Professionals / B2B", "Families with children", "Affluent / High-net-worth", "Students", "Everyone — mass market"]

Pricing: ["Budget / Accessible", "Value for money", "Mid-range", "Premium", "Luxury / Ultra-premium"]

Geography: ["United States", "United Kingdom", "Europe (multi-market)", "Middle East / Gulf", "South Asia", "Southeast Asia", "East Asia", "Africa", "Latin America", "Australia / New Zealand", "Global from day one"]

Tone: ["Bold & Energetic", "Warm & Human", "Minimal & Clean", "Playful & Friendly", "Serious & Authoritative", "Premium & Refined", "Edgy & Disruptive", "Corporate & Professional"]

Stage: ["Pre-launch / Idea stage", "Early startup (0–2 years)", "Growing (2–5 years)", "Established (5+ years)", "Scaling / Series-funded", "Enterprise / Corporate", "Rebranding from existing"]

** REFRESH FLOW **
1. First, ask if this is a brand already created in Brand Machina or an external brand:
   { "type": "question", "key": "brand_source", "counter": "Step 1 of 11", "headline": "Is BrandName already in Brand Machina?", "why": "This determines how we load your existing brand assets.", "select": "single", "options": ["Yes — continue with my existing brand", "No — it's an external brand I'll share assets for"] }
   → If "Yes": load brand context and skip to step 3
   → If "No": show asset upload UI (type: "asset_upload") to collect their existing brand materials
2. Asset upload (only if external brand): use type "asset_upload"
3. Description input (describe current brand state — this is the ONE free-text moment)
4. Extract from description → amber confirms for inferred
5. What's not working — multi-select with max 6: ["Looks outdated", "Doesn't reflect our quality", "Too similar to competitors", "Wrong audience signal", "Feels inconsistent", "Colours feel wrong", "Typography feels wrong", "Logo doesn't scale", "No clear personality", "Feels generic", "Hard to use across formats"]
6. What to keep — multi-select with max 5: ["Logo mark / symbol", "Wordmark style", "Existing colours", "Colour mood / temperature", "Typography", "Overall personality", "Brand recognition", "Nothing — full reset"]
7. Intensity — single-select: ["Subtle polish — tighten what exists", "Clear evolution — same DNA, new energy", "Strong shift — recognisably transformed", "Full transformation — only the name stays"]
8. Reason for refresh (if not extracted) — single-select: ["Moved upmarket / repositioned", "Expanded to new markets", "New audience to reach", "Competitors caught up visually", "Brand has aged", "Post-merger or rebrand", "New product line or pivot", "No specific reason — just due"]
9. Target personality — multi-select with max 5: ["Premium", "Accessible", "Serious", "Playful", "Refined", "Bold", "Subtle", "Warm", "Clinical", "Innovative", "Trustworthy", "Energetic", "Calm", "Authoritative"]
10. Colour tiles (only if colours were NOT kept in step 6)
11. Typography tiles (only if typography was NOT kept in step 6)
12. Summary → Generate

** SOCIAL CAMPAIGN FLOW **
1. Brand context confirmation (amber) — if no brand context exists, show asset upload UI first
2. Campaign description (ONE free-text moment)
3. Extract campaign signals, confirm inferred
4. Platforms — multi-select with max 5: ["Instagram", "LinkedIn", "TikTok", "Facebook", "X (Twitter)", "Pinterest", "YouTube Shorts"]
5. Format — single-select: ["Single post (1 image + caption)", "Carousel (3–8 slides)", "Story / Reel (vertical)", "Ad set (multiple variants)", "Full pack — all formats"]
6. Tone shift — single-select: ["Same as brand tone", "Slightly more playful", "More urgent / direct", "More formal / considered", "More emotive / storytelling"]
7. Visual direction — single-select: ["Strictly on-brand — follow guidelines exactly", "Campaign accent — brand colours, new layout/type treatment", "Bold departure — brand DNA only, new expression", "Surprise me"]
8. Campaign goal (if not extracted) — single-select: ["Build awareness", "Drive sign-ups / conversions", "Announce a launch", "Promote an offer", "Build community / engagement", "Re-engage existing audience"]
9. CTA (if not extracted) — single-select: ["Shop now", "Learn more", "Sign up", "Book a call", "Download", "Follow us", "Visit the site", "Custom — I'll specify"]
10. Volume + cadence (only if format = Full pack or Ad set) — single-select for each:
    Volume: ["1 post", "3 posts", "5–7 posts", "10+ posts"]
    Cadence: ["Single drop", "Across 1 week", "Across 1 month"]
11. Summary → Generate

** BRAND GUIDELINES FLOW **
1. Brand context confirmation (amber)
2. Audit report (you check 6 sections internally, report as natural sentence)
3. Tone of voice (if empty) — single-select: ["Warm and human", "Bold and direct", "Refined and considered", "Energetic and motivating", "Authoritative and expert", "Playful and irreverent"]
4. Imagery direction (always ask) — single-select: ["Editorial photography — clean, considered, people-led", "Lifestyle photography — in-context, aspirational", "Product-focused — studio, detail, materiality", "Illustration / graphic — brand-drawn, not photographic", "No imagery — type and colour only"]
5. Layout rules (if not extractable) — single-select: ["Clean and spacious — generous margins, white space", "Dense and editorial — tight grids, information-rich", "Bold and structured — strong grid, clear hierarchy", "Flexible — principles over exact rules"]
6. Who is this for — single-select: ["Internal team — designers and marketers", "External agencies and partners", "Freelancers and contractors", "Public / open brand guidelines"]
7. Depth — single-select: ["Starter kit — logo, colour, type only", "Core system — adds tone and imagery", "Full system — all 6 sections with examples and do/don't pairs"]
8. Output format — single-select: ["Live style guide inside Machina", "PDF download", "Both"]
9. Summary → Generate

** COLOUR PALETTE OPTIONS — use these EXACT values **
Warm and earthy: { swatches: ["#C8523A","#D4845A","#E8C49A","#F2E8D8","#2C2420"], sub: "Terracotta · Clay · Sand · Linen" }
Deep and refined: { swatches: ["#1B2A4A","#2C4B8C","#4A7EC7","#D4E5F7","#8B7355"], sub: "Navy · Royal · Steel · Sky" }
Cool and minimal: { swatches: ["#F0F4F8","#CBD5E0","#718096","#2D3748","#1A202C"], sub: "Ice · Mist · Slate · Charcoal" }
Dark and premium: { swatches: ["#0D0D0D","#1A1A1A","#2D2D2D","#C9A96E","#F0EDE8"], sub: "Obsidian · Graphite · Gold · Ivory" }
Vibrant and expressive: { swatches: ["#FF3366","#FFB800","#00D4AA","#4455FF","#1A1A2E"], sub: "Coral · Amber · Teal · Indigo" }
Neutral and editorial: { swatches: ["#F7F3EF","#E8E0D5","#C4B9AC","#6B5E52","#2C2420"], sub: "Cream · Oyster · Warm Grey · Umber" }
Light and airy: { swatches: ["#FFFFFF","#F5F0EB","#E8DDD4","#C9B8A8","#7A6B5D"], sub: "White · Ivory · Linen · Taupe" }
Monochrome / stark: { swatches: ["#FFFFFF","#CCCCCC","#888888","#333333","#000000"], sub: "White · Silver · Grey · Black" }

** TYPOGRAPHY OPTIONS — use these EXACT values. Each option MUST include refs (brand name examples) **
Classic serif: { name: "Classic serif", font: "'Libre Baskerville', 'Georgia', serif", weight: "700", size: "24px", label: "Heritage · Timeless", body: "Authority through tradition", refs: ["Vogue", "Tiffany & Co", "Rolex"], specimen_body: "'Cormorant Garamond', serif" }
Sharp modern serif: { name: "Sharp modern serif", font: "'Playfair Display', Georgia, serif", weight: "800", size: "24px", label: "Editorial · Elevated", body: "Sharp contrast, high fashion", refs: ["Harper's Bazaar", "Balmain", "Dior"], specimen_body: "'DM Serif Display', serif" }
Geometric sans: { name: "Geometric sans", font: "'Montserrat', sans-serif", weight: "700", size: "24px", label: "Clean · Contemporary", body: "Precise, structured clarity", refs: ["Google", "Airbnb", "Spotify"], specimen_body: "'Montserrat', sans-serif" }
Humanist sans: { name: "Humanist sans", font: "'Outfit', sans-serif", weight: "600", size: "24px", label: "Warm · Approachable", body: "Human proportions, friendly", refs: ["GitHub", "Stripe", "Linear"], specimen_body: "'Outfit', sans-serif" }
Display / expressive: { name: "Display / expressive", font: "'Bricolage Grotesque', sans-serif", weight: "800", size: "24px", label: "Distinctive · Bold", body: "Character-driven, memorable", refs: ["Discord", "Figma", "Cash App"], specimen_body: "'Space Grotesk', sans-serif" }
Mixed / eclectic: { name: "Mixed / eclectic", font: "'Syne', sans-serif", weight: "700", size: "24px", label: "Layered · Intentional", body: "Serif meets sans, curated clash", refs: ["Apple", "Mailchimp", "Notion"], specimen_body: "'Cormorant Garamond', serif" }

** GENERATION OUTPUT **
When all pillars are filled, show summary, then after user confirms, send generate trigger. When the user asks for the final output after generation, respond with RICH, CONTEXT-SPECIFIC content — not generic placeholders. Every piece of text must reference the actual brand, industry, audience, and tone collected during the conversation.

{
  "message": "Your brand message about the completed output — specific to THIS brand",
  "ui": null,
  "phase": "complete",
  "state": { "flow": "...", "resolved": { all final values }, "empty": [], "next_action": "Complete" },
  "output": {
    "taglines": ["tagline 1 specific to the brand", "tagline 2 different angle", "tagline 3 bold variant"],
    "brand_statement": "2-3 sentence positioning statement that references the specific industry, audience, and competitive positioning. NOT generic. Must feel like it was written for THIS brand only.",
    "voice_attributes": ["attribute 1", "attribute 2", "attribute 3"],
    "social_captions": {
      "instagram": "2-3 sentence caption specific to the brand's audience and tone. Include relevant hashtags for THEIR industry. Not generic #brand #launch — use industry-specific tags.",
      "linkedin": "Professional 2-3 sentence announcement that speaks to B2B credibility and the brand's specific value proposition.",
      "campaign": "Bold, short hero campaign line that captures the brand's essence — specific to their personality and positioning"
    },
    "guidelines_tone": "2-3 sentences describing THIS brand's specific tone of voice — reference the personality axes chosen and the audience.",
    "guidelines_sections": [
      { "title": "Logo Usage", "desc": "Specific rules for THIS brand's logo based on the logo type chosen", "do": "Context-specific do guidance", "dont": "Context-specific dont guidance" },
      { "title": "Colour System", "desc": "Rules specific to the chosen palette direction", "do": "Specific to the palette", "dont": "Specific" },
      { "title": "Typography", "desc": "Rules based on the typography feel chosen", "do": "Specific to chosen type system", "dont": "Specific" },
      { "title": "Tone of Voice", "desc": "Voice description matching the personality axes and tone chosen", "do": "Writing guidance specific to this brand's voice", "dont": "Anti-patterns specific to this brand" },
      { "title": "Imagery", "desc": "Photography and visual direction based on industry and audience", "do": "Imagery guidance specific to this brand", "dont": "Specific things to avoid" },
      { "title": "Layout", "desc": "Spatial rules matching the brand's personality (generous for premium, dense for editorial etc)", "do": "Layout rules fitting the brand", "dont": "Layout anti-patterns" }
    ],
    "palette_key": "warm|deep|cool|dark|vibrant|neutral|light|mono"
  }
}

CRITICAL: The output must feel CUSTOM. If someone reads the taglines, brand statement, social captions, and guidelines — they should feel like these were written specifically for their brand by a creative director who listened to everything they said. No generic "Building something amazing" filler.

** VOICE & PERSONALITY **
- Sound like a creative director in a briefing, not a chatbot filling a form.
- Keep messages to 1-3 sentences. No walls of text.
- Reference the brand name in every message.
- Reference specific details the user mentioned — never be generic.
- Add brief natural transitions between questions ("Good. Now the visual direction." / "That narrows it. One more thing.")
- If the user sends a free-text message mid-flow, acknowledge it briefly and present the next choice-based question. Do NOT ask them to elaborate in text. Steer them back to the structured flow.
- NEVER say "Can you tell me more about..." or "Could you describe..." — the description was the one chance for open text. Everything else is choices.`;

// =======================================================
//  API CALL
// =======================================================

async function callBrandMachina(conversationHistory) {
  try {
    const resp = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: conversationHistory,
      }),
    });
    const data = await resp.json();
    const text = data.content?.map(i => i.type === "text" ? i.text : "").join("") || "";
    const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}

// =======================================================
//  PALETTE DATA (for preview panel rendering)
// =======================================================

const PALETTES = {
  warm: { name: "Warm & Earthy", colors: ["#C8523A","#D4845A","#E8C49A","#F2E8D8","#2C2420"], labels: ["Terracotta","Clay","Sand","Linen","Deep Brown"] },
  deep: { name: "Deep & Refined", colors: ["#1B2A4A","#2C4B8C","#4A7EC7","#D4E5F7","#8B7355"], labels: ["Navy","Royal","Steel","Sky","Camel"] },
  cool: { name: "Cool & Minimal", colors: ["#F0F4F8","#CBD5E0","#718096","#2D3748","#1A202C"], labels: ["Ice","Mist","Slate","Charcoal","Ink"] },
  dark: { name: "Dark & Premium", colors: ["#0D0D0D","#1A1A1A","#2D2D2D","#C9A96E","#F0EDE8"], labels: ["Black","Obsidian","Graphite","Gold","Ivory"] },
  vibrant: { name: "Vibrant", colors: ["#FF3366","#FFB800","#00D4AA","#4455FF","#1A1A2E"], labels: ["Coral","Amber","Teal","Indigo","Night"] },
  neutral: { name: "Neutral Editorial", colors: ["#F7F3EF","#E8E0D5","#C4B9AC","#6B5E52","#2C2420"], labels: ["Cream","Oyster","Warm Grey","Umber","Espresso"] },
  light: { name: "Light & Airy", colors: ["#FFFFFF","#F5F0EB","#E8DDD4","#C9B8A8","#7A6B5D"], labels: ["White","Ivory","Linen","Taupe","Driftwood"] },
  mono: { name: "Monochrome", colors: ["#FFFFFF","#CCCCCC","#888888","#333333","#000000"], labels: ["White","Silver","Grey","Charcoal","Black"] },
};

function logoSVG(name, style, size = 80) {
  const n = (name || "B")[0].toUpperCase();
  const c = [["#7B61FF","#5B8CFF"],["#2DD4BF","#34D399"],["#FBBF24","#FB923C"]][style % 3];
  const nm = (name || "").slice(0, 11);
  const id = `lg${style}${Math.random().toString(36).slice(2,6)}`;
  if (style%3===0) return `<svg width="${size}" height="${Math.round(size*.675)}" viewBox="0 0 80 54" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><rect x="3" y="9" width="26" height="26" rx="6" fill="url(#${id})"/><text x="16" y="25" font-family="Syne,sans-serif" font-size="13" font-weight="800" fill="white" text-anchor="middle" dominant-baseline="middle">${n}</text><text x="38" y="22" font-family="Syne,sans-serif" font-size="9" font-weight="700" fill="currentColor" dominant-baseline="middle">${nm}</text><text x="38" y="32" font-family="Inter,sans-serif" font-size="6" fill="${c[0]}" dominant-baseline="middle" letter-spacing="1.5">STUDIO</text></svg>`;
  if (style%3===1) return `<svg width="${size}" height="${Math.round(size*.675)}" viewBox="0 0 80 54" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><text x="40" y="27" font-family="Syne,sans-serif" font-size="12" font-weight="800" fill="url(#${id})" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">${nm.toUpperCase()}</text><line x1="10" y1="36" x2="70" y2="36" stroke="${c[0]}" stroke-width="1.5" opacity=".35"/></svg>`;
  return `<svg width="${size}" height="${Math.round(size*.675)}" viewBox="0 0 80 54" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><circle cx="40" cy="27" r="19" fill="none" stroke="url(#${id})" stroke-width="2"/><text x="40" y="27" font-family="Syne,sans-serif" font-size="16" font-weight="800" fill="url(#${id})" text-anchor="middle" dominant-baseline="middle">${n}</text></svg>`;
}

// =======================================================
//  MAIN APP
// =======================================================

function BrandMachina() {
  const [phase, setPhase] = useState("hero");
  const [theme, setTheme] = useState("dark");
  const [brand, setBrand] = useState("");
  const [heroInput, setHeroInput] = useState("");
  const [flow, setFlow] = useState(null);

  // Conversation state — the ONLY source of truth
  const [history, setHistory] = useState([]); // Claude message history
  const [chatMsgs, setChatMsgs] = useState([]); // UI display messages
  const [currentUI, setCurrentUI] = useState(null); // Current interactive element from Claude
  const [isThinking, setIsThinking] = useState(false);
  const [freeInput, setFreeInput] = useState("");

  // Preview state
  const [activeTab, setActiveTab] = useState("brand");
  const [palKey, setPalKey] = useState("deep");
  const [output, setOutput] = useState(null);
  const [pickedLogo, setPickedLogo] = useState(null);
  const [genPhase, setGenPhase] = useState(null);
  const [genProgress, setGenProgress] = useState(0);
  const [personalityData, setPersonalityData] = useState(null);
  const [briefData, setBriefData] = useState(null);
  const [descriptionDone, setDescriptionDone] = useState(false);
  const [logoSVGs, setLogoSVGs] = useState([]); // Real generated SVG strings
  const [logoLoading, setLogoLoading] = useState(false);
  const [expandedLogo, setExpandedLogo] = useState(null); // index of logo being previewed
  const [selectedSocial, setSelectedSocial] = useState(null); // For social mockup expand
  const [flowStage, setFlowStage] = useState("questioning"); // questioning | generated | logo_picked

  // API Settings
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    gemini: "AIzaSyAO_VxYdG5Ypv4xlD9LRM42qPLuReGxJeE",
    deepai: "",
    openai: "",
    nanobanana: "",
    replicate: "",
    custom: "",
  });
  const [apiStatus, setApiStatus] = useState({}); // { deepai: "connected" | "failed" | "testing" }
  const [activeImageAPI, setActiveImageAPI] = useState("claude"); // which API to use for image gen

  const msgsRef = useRef(null);

  useEffect(() => {
    setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, 60);
  }, [chatMsgs, isThinking, currentUI]);

  // ── Send a message to Claude and process response ──
  const sendToClaude = useCallback(async (userMessage, newHistory, isDescDone) => {
    setIsThinking(true);
    setCurrentUI(null);

    const result = await callBrandMachina(newHistory);
    setIsThinking(false);

    if (!result) {
      setChatMsgs(prev => [...prev, { from: "ai", content: "Something went wrong — try again." }]);
      return;
    }

    // Add assistant response to history
    const updatedHistory = [...newHistory, { role: "assistant", content: JSON.stringify(result) }];
    setHistory(updatedHistory);

    // GUARD: If Claude returns a description UI after description is already done,
    // auto-correct by sending a message telling it to use choices instead
    if (result.ui?.type === "description" && isDescDone) {
      setChatMsgs(prev => [...prev, { from: "ai", content: result.message || "" }]);
      const correctionMsg = { role: "user", content: "SYSTEM: The description has already been submitted. Do NOT use type 'description' again. You MUST present a choice-based question (type: question, amber, personality, colour_tiles, or typography_tiles). Present the next choice-based question now." };
      const correctedHistory = [...updatedHistory, correctionMsg];
      setHistory(correctedHistory);
      await sendToClaude("", correctedHistory, true);
      return;
    }

    // Display AI message
    if (result.message) {
      setChatMsgs(prev => [...prev, { from: "ai", content: result.message }]);
    }

    // Handle UI element
    if (result.ui) {
      if (result.ui.type === "generate") {
        runGeneration(result.ui.steps || ["Analysing brief","Exploring directions","Generating copy","Rendering concepts"], updatedHistory);
      } else if (result.ui.type === "summary") {
        setBriefData(result.ui.brief);
        setCurrentUI(result.ui);
      } else {
        setCurrentUI(result.ui);
      }
    }

    // Handle state updates for preview
    if (result.state?.resolved) {
      const r = result.state.resolved;
      if (r.colour || r.color) {
        const colVal = r.colour || r.color;
        const key = Object.entries({
          "warm": "warm", "deep": "deep", "cool": "cool", "dark": "dark",
          "vibrant": "vibrant", "neutral": "neutral", "light": "light", "mono": "mono"
        }).find(([k]) => colVal.toLowerCase().includes(k))?.[1] || "deep";
        setPalKey(key);
        setActiveTab("colours");
      }
      if (r.personality) setPersonalityData(r.personality);
    }

    // Handle output (post-generation)
    if (result.output) {
      setOutput(result.output);
      if (result.output.palette_key) setPalKey(result.output.palette_key);
      setGenPhase("done");
      setActiveTab("brand");
    }
  }, []);

  // ── User responds to a UI element ──
  const respond = useCallback(async (userText) => {
    setChatMsgs(prev => [...prev, { from: "user", content: userText }]);

    // If user just submitted a description, mark it done
    let isDescDone = descriptionDone;
    if (currentUI?.type === "description") {
      setDescriptionDone(true);
      isDescDone = true;
    }

    const newMsg = { role: "user", content: userText };
    const newHistory = [...history, newMsg];
    setHistory(newHistory);
    setCurrentUI(null);
    await sendToClaude(userText, newHistory, isDescDone);
  }, [history, sendToClaude, descriptionDone, currentUI]);

  // ── Generate logos — tries Gemini images first, falls back to Claude SVG ──
  const generateLogos = async (isLoadMore = false, historyOverride = null) => {
    setLogoLoading(true);
    setExpandedLogo(null);
    const pal = PALETTES[palKey] || PALETTES.deep;
    
    // Extract resolved state
    const historyToScan = historyOverride || history;
    let rs = {};
    try {
      const allAssistant = historyToScan.filter(h => h.role === "assistant");
      for (const msg of allAssistant) {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed?.state?.resolved) { rs = { ...rs, ...parsed.state.resolved }; }
        } catch(e) {}
      }
    } catch(e) {}
    if (briefData) rs = { ...rs, ...briefData };

    const brandCtx = 'Brand: "' + brand + '" | Industry: ' + (rs.industry || "Modern brand") + ' | Audience: ' + (rs.audience || "Professionals") + ' | Personality: ' + (JSON.stringify(rs.personality) || "Bold, Premium") + ' | Colours: ' + pal.colors.slice(0,3).join(", ") + ' | Typography: ' + (rs.typography || "Clean modern") + ' | Logo style: ' + (rs.logo_style || "Symbol + name");

    // Try Gemini image generation first
    var geminiWorked = false;
    var results = [];
    var concepts = [
      { name: "Symbol Mark", style: "Icon + wordmark", prompt: 'Design a professional, clean, minimal logo for "' + brand + '". Style: symbol mark with geometric icon left + wordmark right. ' + brandCtx + '. White background, vector-style, premium quality. Brand name must be readable.' },
      { name: "Wordmark", style: "Pure typography", prompt: 'Design a professional logo for "' + brand + '". Style: pure wordmark, no icon. Distinctive typography with custom spacing. ' + brandCtx + '. White background, vector-style, modern.' },
      { name: isLoadMore ? "Badge" : "Monogram", style: isLoadMore ? "Enclosed emblem" : "Initial lettermark", prompt: 'Design a professional logo for "' + brand + '". Style: ' + (isLoadMore ? "enclosed badge with brand name inside a shape" : "monogram using first letter in geometric container") + '. ' + brandCtx + '. White background, vector-style.' },
    ];

    try {
      for (var ci = 0; ci < concepts.length; ci++) {
        var concept = concepts[ci];
        try {
          var resp = await fetch("/api/imagegen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: concept.prompt }] }],
              generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            }),
          });
          var data = await resp.json();
          var parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
          var imgPart = parts.find(function(p) { return p.inlineData; });
          if (imgPart) {
            results.push({ name: concept.name, style: concept.style, type: "image", src: "data:" + (imgPart.inlineData.mimeType || "image/png") + ";base64," + imgPart.inlineData.data });
            geminiWorked = true;
          } else {
            results.push({ name: concept.name, style: concept.style, type: "svg", svg: logoSVG(brand, ci, 200) });
          }
        } catch(e) {
          results.push({ name: concept.name, style: concept.style, type: "svg", svg: logoSVG(brand, ci, 200) });
        }
      }
      if (results.length > 0) { setLogoSVGs(results); setLogoLoading(false); return; }
    } catch(e) { console.error("Gemini failed, falling back to Claude SVG", e); }

    // Fallback: Claude SVG generation
    var logoPrompt = 'You are a senior brand identity designer. Create 3 distinct logo concepts as SVG code.\n\n' + brandCtx + '\n' + (isLoadMore ? "IMPORTANT: Completely different from previous concepts.\n" : "") + '\nSVG RULES: viewBox="0 0 400 180" width="400" height="180". No background rect. Brand name "' + brand + '" as readable text font-size 28-40px. font-family sans-serif. Max 6-8 elements. Use palette colours. No filters.\nConcept 1: Symbol/icon + brand name. Concept 2: Pure wordmark. Concept 3: Monogram in geometric container.\n\nReturn ONLY JSON array, no markdown:\n[{"name":"Name","style":"desc","svg":"<svg ...>...</svg>"},...]';

    try {
      var resp2 = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 6000, system: "Return ONLY valid JSON arrays with SVG code. No markdown, no backticks.", messages: [{ role: "user", content: logoPrompt }] }),
      });
      var data2 = await resp2.json();
      var text2 = (data2.content || []).map(function(i) { return i.type === "text" ? i.text : ""; }).join("");
      var clean2 = text2.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      var logos = JSON.parse(clean2);
      if (Array.isArray(logos) && logos.length > 0) { setLogoSVGs(logos.map(function(l) { return Object.assign({}, l, { type: "svg" }); })); }
      else throw new Error("Empty");
    } catch(err) {
      setLogoSVGs([
        { name: "Symbol Mark", style: "Icon + wordmark", type: "svg", svg: logoSVG(brand, 0, 200) },
        { name: "Wordmark", style: "Pure typography", type: "svg", svg: logoSVG(brand, 1, 200) },
        { name: "Monogram", style: "Lettermark", type: "svg", svg: logoSVG(brand, 2, 200) },
      ]);
    }
    setLogoLoading(false);
  };

  // ── Generation animation then request final output ──
  const runGeneration = async (steps, currentHistory) => {
    setGenPhase("generating");
    setGenProgress(0);
    setCurrentUI(null);

    for (let i = 0; i < steps.length; i++) {
      setGenProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise(r => setTimeout(r, 800));
    }

    // Ask Claude for the final output
    const outputMsg = { role: "user", content: "Generation complete. Provide the final brand output now. Include ALL fields: taglines (3 specific to this brand), brand_statement (2-3 sentences referencing the brand's specific positioning), voice_attributes (3 attributes), social_captions (instagram, linkedin, campaign — all specific to this brand and its audience), guidelines_tone, guidelines_sections (array of 6 objects with title, desc, do, dont — all specific to the choices this user made), and palette_key. Every piece of copy must feel custom-written for THIS brand. Set phase to 'complete'." };
    const fullHistory = [...currentHistory, outputMsg];
    setHistory(fullHistory);

    setIsThinking(true);
    const result = await callBrandMachina(fullHistory);
    setIsThinking(false);

    if (result) {
      const resultStr = JSON.stringify(result);
      setHistory(prev => [...prev, { role: "assistant", content: resultStr }]);
      if (result.message) setChatMsgs(prev => [...prev, { from: "ai", content: result.message }]);
      if (result.output) {
        setOutput(result.output);
        if (result.output.palette_key) setPalKey(result.output.palette_key);
      }
      // Pass the complete history including this result to generateLogos
      const completeHistory = [...fullHistory, { role: "assistant", content: resultStr }];
      setGenPhase("done");
      setFlowStage("generated");
      setActiveTab("brand");

      // Generate real logos with the full context
      await generateLogos(false, completeHistory);
    } else {
      setGenPhase("done");
      setFlowStage("generated");
      setActiveTab("brand");
      await generateLogos();
    }

    // Add logo selection message
    setChatMsgs(prev => [...prev, { from: "ai", content: `Here are 3 logo concepts for <strong style="color:#7B61FF">${brand}</strong>. Pick the direction that feels right — or load more if none click.`, type: "logos" }]);
  };

  // ── Start app from hero ──
  const startApp = () => {
    const name = heroInput.trim();
    if (!name) return;
    setBrand(name);
    setPhase("app");
    setChatMsgs([]);
    setHistory([]);
    setCurrentUI(null);
    setFlow(null);
    setOutput(null);
    setPickedLogo(null);
    setGenPhase(null);
    setBriefData(null);
    setPersonalityData(null);
  };

  // ── Pick flow ──
  const pickFlow = async (f) => {
    setFlow(f);
    setChatMsgs([]);
    setOutput(null);
    setPickedLogo(null);
    setGenPhase(null);
    setBriefData(null);
    setPersonalityData(null);
    setDescriptionDone(false);

    const initMessages = {
      create: `The brand name is "${brand}". The user selected "Create a Brand" flow. Your FIRST response must include a brief welcome message and set ui to {"type": "description", "placeholder": "e.g. We're a Dubai-based luxury real estate firm targeting high-net-worth expats. Think Emaar but more personal. Competitors are Damac and Meraas — we want to feel warmer and more trustworthy than both."}. This is the ONLY time you can use type description. After this, ALL questions must be choice-based.`,
      refresh: `The brand name is "${brand}". The user selected "Refresh a Brand" flow. Your FIRST response must include a brief message and set ui to {"type": "description", "placeholder": "e.g. We're a 6-year-old Lahore menswear brand. Started affordable, now fully upmarket tailoring. Current brand still looks budget and doesn't reflect where we are."}. This is the ONLY time you can use type description. After this, ALL questions must be choice-based.`,
      social: `The brand name is "${brand}". The user selected "Social Campaign" flow. Your FIRST response must show an amber confirmation: {"type": "amber", "key": "brand_context", "text": "Using ${brand} — all brand context loaded. Ready to build the campaign?", "yes": "Yes, let's go", "no": "Use a different brand"}. After the user confirms, show ONE description input for the campaign brief. After that, ALL questions must be choice-based.`,
      guidelines: `The brand name is "${brand}". The user selected "Brand Guidelines" flow. Your FIRST response must show an amber confirmation: {"type": "amber", "key": "brand_context", "text": "I've loaded ${brand}'s brand system. Ready to build guidelines?", "yes": "Ready to continue", "no": "Let me clarify something first"}. After the user confirms, proceed with choice-based questions only — no description input needed for guidelines.`,
    };

    const initMsg = { role: "user", content: initMessages[f] };
    const newHistory = [initMsg];
    setHistory(newHistory);
    await sendToClaude(initMsg.content, newHistory, false);
  };

  // ── Free text send ──
  const sendFree = async () => {
    if (!freeInput.trim()) return;
    const text = freeInput.trim();
    setFreeInput("");
    await respond(text);
  };

  // ── Logo pick (post-gen) ──
  const pickLogoHandler = (idx) => {
    setPickedLogo(idx);
    setFlowStage("logo_picked");
    const logo = logoSVGs[idx];
    setChatMsgs(prev => [...prev, { from: "user", content: `Selected ${logo?.name || `Concept ${idx+1}`}` }]);
    setChatMsgs(prev => [...prev, { from: "ai", content: `Great choice. Your brand board is updated with the ${logo?.name || "selected concept"}. Check the preview panel for the full brand application showcase.` }]);
    setActiveTab("brand");
  };

  // ── Contextual suggestion chips ──

  // Helper: render a logo regardless of type (image or svg)
  const LogoDisplay = ({ logo, style = {} }) => {
    if (!logo) return null;
    if (logo.type === "image" && logo.src) {
      return <img src={logo.src} alt={logo.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4, ...style }} />;
    }
    return <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", ...style }} dangerouslySetInnerHTML={{ __html: logo.svg || "" }} />;
  };

  const getSuggestionChips = () => {
    if (flowStage === "generated" && pickedLogo === null) return ["Pick a logo concept above"];
    if (flowStage === "logo_picked") return [
      { label: "Generate Brand Guidelines", action: () => pickFlow("guidelines") },
      { label: "Create Social Campaign", action: () => pickFlow("social") },
      { label: "Regenerate Logos", action: () => generateLogos(true) },
    ];
    if (genPhase === "done" && flow === "social") return [
      { label: "Generate More Variations", action: () => {} },
      { label: "Create Brand Guidelines", action: () => pickFlow("guidelines") },
    ];
    if (genPhase === "done" && flow === "guidelines") return [
      { label: "Create Social Campaign", action: () => pickFlow("social") },
      { label: "Export PDF", action: () => {} },
    ];
    return [];
  };

  // ── Reset ──
  const resetApp = () => {
    setPhase("hero"); setBrand(""); setHeroInput(""); setFlow(null);
    setChatMsgs([]); setHistory([]); setCurrentUI(null);
    setOutput(null); setPickedLogo(null); setGenPhase(null);
    setFreeInput(""); setBriefData(null); setPersonalityData(null);
    setDescriptionDone(false); setLogoSVGs([]); setLogoLoading(false);
    setSelectedSocial(null); setFlowStage("questioning");
  };

  // ── Test API connection ──
  const testAPI = async (service) => {
    setApiStatus(prev => ({ ...prev, [service]: "testing" }));
    try {
      if (service === "gemini") {
        const resp = await fetch(
          "/api/imagegen",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "A simple blue circle on white background" }] }],
              generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            }),
          }
        );
        if (resp.ok) { setApiStatus(prev => ({ ...prev, gemini: "connected" })); setActiveImageAPI("gemini"); }
        else setApiStatus(prev => ({ ...prev, gemini: "failed" }));
      } else if (service === "deepai") {
        const resp = await fetch("https://api.deepai.org/api/text2img", {
          method: "POST",
          headers: { "Api-Key": apiKeys.deepai, "Content-Type": "application/x-www-form-urlencoded" },
          body: "text=test connection ping&width=128&height=128",
        });
        if (resp.ok) { setApiStatus(prev => ({ ...prev, deepai: "connected" })); setActiveImageAPI("deepai"); }
        else setApiStatus(prev => ({ ...prev, deepai: "failed" }));
      } else if (service === "openai") {
        const resp = await fetch("https://api.openai.com/v1/models", {
          headers: { "Authorization": `Bearer ${apiKeys.openai}` },
        });
        setApiStatus(prev => ({ ...prev, openai: resp.ok ? "connected" : "failed" }));
        if (resp.ok) setActiveImageAPI("openai");
      } else if (service === "nanobanana") {
        const resp = await fetch("https://api.nanobananaapi.ai/api/v1/nanobanana/credits", {
          headers: { "Authorization": `Bearer ${apiKeys.nanobanana}` },
        });
        setApiStatus(prev => ({ ...prev, nanobanana: resp.ok ? "connected" : "failed" }));
        if (resp.ok) setActiveImageAPI("nanobanana");
      } else if (service === "replicate") {
        const resp = await fetch("https://api.replicate.com/v1/models", {
          headers: { "Authorization": `Bearer ${apiKeys.replicate}` },
        });
        setApiStatus(prev => ({ ...prev, replicate: resp.ok ? "connected" : "failed" }));
        if (resp.ok) setActiveImageAPI("replicate");
      }
    } catch (err) {
      // Network error — likely sandbox blocking
      setApiStatus(prev => ({ ...prev, [service]: "blocked" }));
    }
  };

  // =======================================================
  //  THEME COLORS
  // =======================================================
  const C = theme === "dark" ? {
    bg: "#08080e", surface: "#0f0f18", card: "#14141f", hover: "#1c1c2a",
    border: "rgba(255,255,255,0.09)", borderHi: "rgba(255,255,255,0.18)",
    t1: "#eeeef8", t2: "#8888aa", t3: "#4e4e68",
    accent: "#7B61FF", adim: "rgba(123,97,255,0.13)", grad: "linear-gradient(135deg,#7B61FF,#5B8CFF)"
  } : {
    bg: "#f2f2f8", surface: "#fafaff", card: "#ededf8", hover: "#e4e4f2",
    border: "rgba(0,0,0,0.08)", borderHi: "rgba(0,0,0,0.16)",
    t1: "#0d0d1a", t2: "#484868", t3: "#9090b0",
    accent: "#7B61FF", adim: "rgba(123,97,255,0.09)", grad: "linear-gradient(135deg,#7B61FF,#5B8CFF)"
  };

  const pal = PALETTES[palKey] || PALETTES.deep;
  const AV = ({ ai }) => (
    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, marginTop: 1, ...(ai ? { background: C.grad, color: "#fff", boxShadow: "0 2px 10px rgba(123,97,255,.25)" } : { background: C.hover, color: C.t2, border: `1px solid ${C.border}` }) }}>
      {brand[0]?.toUpperCase() || "B"}
    </div>
  );

  // Compute progress bar
  let progressPct = 0;
  let progressLabel = "";
  if (flow) {
    const counter = (currentUI && currentUI.counter) || "";
    const pmatch = counter.match(/(\d+)\s*of\s*(\d+)/i);
    if (pmatch) {
      progressPct = Math.round((parseInt(pmatch[1]) / parseInt(pmatch[2])) * 100);
      progressLabel = "Step " + pmatch[1] + " of " + pmatch[2];
    } else if (genPhase === "done") {
      progressPct = 100; progressLabel = "Complete";
    } else if (genPhase === "generating") {
      progressPct = 90; progressLabel = "Generating...";
    } else {
      const uMsgs = chatMsgs.filter(function(m) { return m.from === "user"; }).length;
      const tEst = flow === "create" ? 10 : flow === "refresh" ? 9 : 8;
      progressPct = Math.min(85, Math.round((uMsgs / tEst) * 100));
      progressLabel = uMsgs > 0 ? (Math.min(uMsgs, tEst) + " of ~" + tEst + " steps") : "";
    }
  }

  // RENDER
  if (phase === "hero") {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Inter',sans-serif", color: C.t1 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(123,97,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(123,97,255,.04) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div style={{ position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", width: 800, height: 560, background: "radial-gradient(ellipse,rgba(123,97,255,.15) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 540, padding: "0 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 30, padding: "7px 16px", borderRadius: 999, border: "1px solid rgba(123,97,255,.3)", background: "rgba(123,97,255,.08)", color: "#7B61FF", fontSize: 11, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7B61FF" }} /> AI BRAND AGENT
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 72, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, marginBottom: 16 }}>
            Brand <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Machina</span>
          </h1>
          <p style={{ fontSize: 16, fontWeight: 300, color: C.t2, lineHeight: 1.7, marginBottom: 40, maxWidth: 420, margin: "0 auto 40px" }}>Your AI creative director. Describe your brand and watch it come to life.</p>
          <div style={{ display: "flex", maxWidth: 480, margin: "0 auto 28px", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.borderHi}`, background: C.surface, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
            <input value={heroInput} onChange={e => setHeroInput(e.target.value)} onKeyDown={e => e.key === "Enter" && startApp()} placeholder="What's your brand called?" maxLength={60} style={{ flex: 1, padding: "17px 22px", background: "transparent", border: "none", outline: "none", color: C.t1, fontSize: 15, fontFamily: "'Inter',sans-serif" }} />
            <button onClick={startApp} style={{ padding: "0 26px", background: C.grad, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Start Building →</button>
          </div>
        </div>
      </div>
    );
  }

  // APP SHELL
  const _ready = true;

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", fontFamily: "'Inter',sans-serif", background: C.bg, color: C.t1, fontSize: 14 }}>
      {/* TOPBAR */}
      <div style={{ height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13 }}>{brand[0]?.toUpperCase()}</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>Brand Machina</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setShowSettings(true)} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13 }} title="API Settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>{theme === "dark" ? "🌙" : "☀"}</button>
          <button onClick={resetApp} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>+ New Brand</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── CHAT PANEL ── */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, background: C.bg }}>
          <div style={{ padding: "13px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: C.surface }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11 }}>{brand[0]?.toUpperCase()}</div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{brand}</span>
            </div>
            {flow && <span style={{ padding: "3px 10px", borderRadius: 999, background: C.adim, color: C.accent, fontSize: 11, fontWeight: 600 }}>{{ create: "Create", refresh: "Refresh", social: "Social", guidelines: "Guidelines" }[flow]}</span>}
          </div>

          {/* Progress bar */}
          {/* Progress bar */}
          {flow && progressPct > 0 && (
            <div style={{ padding: "0 20px", background: C.surface, borderBottom: "1px solid " + C.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 4px" }}>
                <div style={{ fontSize: 10, color: C.t3, fontWeight: 500 }}>{progressLabel}</div>
                <div style={{ fontSize: 10, color: C.accent, fontWeight: 600 }}>{progressPct}%</div>
              </div>
              <div style={{ height: 3, background: C.hover, borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", background: C.grad, borderRadius: 2, width: progressPct + "%", transition: "width .4s ease" }} />
              </div>
            </div>
          )}

          <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Welcome */}
            {!flow && (
              <div style={{ padding: "28px 0", display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>{brand[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700 }}>Welcome to Brand Machina</div>
                  <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.55, marginTop: 3 }}>Choose a starting point for <strong style={{ color: C.accent }}>{brand}</strong></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                  {[
                    { key: "create", ico: "✶", title: "Create a Brand", desc: "Build a full identity from scratch" },
                    { key: "refresh", ico: "↻", title: "Refresh a Brand", desc: "Modernize — keep what works" },
                    { key: "social", ico: "▦", title: "Social Campaign", desc: "On-brand campaign visuals & copy" },
                    { key: "guidelines", ico: "☰", title: "Brand Guidelines", desc: "Auto-generate a brand book" },
                  ].map(f => (
                    <div key={f.key} onClick={() => pickFlow(f.key)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "17px 16px", cursor: "pointer", transition: "all .18s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(123,97,255,.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                      <div style={{ fontSize: 18, marginBottom: 9 }}>{f.ico}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {chatMsgs.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "8px 0" }}>
                <AV ai={msg.from === "ai"} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, letterSpacing: 0.2, color: msg.from === "ai" ? C.t1 : C.t3 }}>{msg.from === "ai" ? "Brand Machina" : brand}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.72, color: C.t2 }} dangerouslySetInnerHTML={{ __html: msg.content }} />
                </div>
              </div>
            ))}

            {/* Thinking */}
            {isThinking && (
              <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
                <AV ai />
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 0 4px" }}>
                  {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: C.t3, animation: `bmc-bounce 1.3s ease-in-out infinite ${d*.18}s` }} />)}
                  <span style={{ fontSize: 11, color: C.t3, marginLeft: 4, fontStyle: "italic" }}>Brand Machina is thinking...</span>
                </div>
              </div>
            )}

            {/* ── CURRENT UI FROM CLAUDE ── */}
            {currentUI && !isThinking && <UIRenderer ui={currentUI} brand={brand} onRespond={respond} C={C} theme={theme} />}

            {/* Post-gen: Logo cards — click to preview, then confirm */}
            {genPhase === "done" && logoSVGs.length > 0 && pickedLogo === null && (
              <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
                <AV ai />
                <div style={{ flex: 1 }}>
                  {/* Expanded preview */}
                  {expandedLogo !== null && logoSVGs[expandedLogo] && (
                    <div style={{ background: C.card, border: "2px solid " + C.accent, borderRadius: 20, padding: 24, marginBottom: 10, boxShadow: "0 8px 32px rgba(123,97,255,.15)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160, marginBottom: 16, background: C.hover, borderRadius: 14, padding: 20 }}>
                        <LogoDisplay logo={logoSVGs[expandedLogo]} style={{ maxHeight: 140, maxWidth: 320 }} />
                      </div>
                      <div style={{ textAlign: "center", marginBottom: 14 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, fontFamily: "'Syne',sans-serif" }}>{logoSVGs[expandedLogo].name}</div>
                        <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>{logoSVGs[expandedLogo].style}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { pickLogoHandler(expandedLogo); setExpandedLogo(null); setActiveTab("brand"); }} style={{ flex: 1, padding: 13, borderRadius: 12, background: C.grad, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Confirm this logo →</button>
                        <button onClick={() => setExpandedLogo(null)} style={{ padding: "13px 20px", borderRadius: 12, border: "1px solid " + C.border, background: "transparent", color: C.t3, fontSize: 12, cursor: "pointer" }}>Back</button>
                      </div>
                    </div>
                  )}
                  {/* Logo grid — click to expand/preview */}
                  {expandedLogo === null && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 6 }}>
                      {logoSVGs.map(function(logo, idx) { return (
                        <div key={idx} onClick={function() { setExpandedLogo(idx); setActiveTab("brand"); }} style={{ background: C.card, border: "1.5px solid " + C.border, borderRadius: 16, padding: "14px 10px 13px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "all .2s" }}
                          onMouseEnter={function(e) { e.currentTarget.style.borderColor = "rgba(123,97,255,.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={function(e) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 70 }}>
                            <LogoDisplay logo={logo} style={{ maxHeight: 80 }} />
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{logo.name}</div>
                          <div style={{ fontSize: 10, color: C.t3, textAlign: "center" }}>{logo.style}</div>
                          <div style={{ fontSize: 9, color: C.accent, opacity: .7, marginTop: 2 }}>Click to preview</div>
                        </div>
                      ); })}
                    </div>
                  )}
                  {/* Regenerate button */}
                  {expandedLogo === null && (
                    <button onClick={function() { generateLogos(true); }} disabled={logoLoading}
                      style={{ marginTop: 10, width: "100%", padding: 10, borderRadius: 10, border: "1px solid " + C.border, background: C.hover, color: logoLoading ? C.t3 : C.t2, fontSize: 12, fontWeight: 500, cursor: logoLoading ? "not-allowed" : "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {logoLoading ? "Regenerating..." : "♻ Regenerate Logos"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Logo loading — Midjourney-style skeleton shimmer */}
            {logoLoading && logoSVGs.length === 0 && (
              <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
                <AV ai />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.t3, marginBottom: 10, fontStyle: "italic" }}>Generating logo concepts for <strong style={{ color: C.accent }}>{brand}</strong>...</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 10px 13px", overflow: "hidden" }}>
                        <div style={{ height: 80, borderRadius: 8, background: `linear-gradient(90deg, ${C.hover} 25%, ${C.card} 50%, ${C.hover} 75%)`, backgroundSize: "200% 100%", animation: "bmc-shimmer 1.5s ease-in-out infinite", animationDelay: `${i * .2}s` }} />
                        <div style={{ height: 10, borderRadius: 4, background: C.hover, marginTop: 10, width: "70%" }} />
                        <div style={{ height: 8, borderRadius: 4, background: C.hover, marginTop: 6, width: "50%", opacity: .6 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area with contextual chips */}
          <div style={{ padding: "14px 18px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.bg }}>
            {/* Contextual suggestion chips */}
            {getSuggestionChips().length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                {getSuggestionChips().map((chip, i) => {
                  if (typeof chip === "string") return <span key={i} style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${C.border}`, color: C.t3, fontSize: 11, fontWeight: 500 }}>{chip}</span>;
                  return (
                    <button key={i} onClick={chip.action} style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, fontSize: 11, cursor: "pointer", fontWeight: 500, fontFamily: "'Inter',sans-serif", transition: "all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(123,97,255,.35)"; e.currentTarget.style.color = C.accent; e.currentTarget.style.background = C.adim; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.t3; e.currentTarget.style.background = "transparent"; }}>
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface }}>
              {/* Attach file button (placeholder) */}
              <button onClick={() => {}} title="Attach files" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <textarea value={freeInput} onChange={e => setFreeInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFree(); }}} placeholder="Type a message..." rows={1} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: C.t1, fontSize: 13.5, lineHeight: 1.55, maxHeight: 100, minHeight: 22, fontFamily: "'Inter',sans-serif" }} />
              {/* Voice input button (placeholder) */}
              <button onClick={() => {}} title="Voice input" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </button>
              {/* Send button */}
              <button onClick={sendFree} style={{ width: 30, height: 30, borderRadius: 7, background: C.grad, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: freeInput.trim() ? 1 : 0.25, flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── PREVIEW PANEL ── */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", background: C.surface }}>
          <div style={{ padding: "0 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 2, flexShrink: 0 }}>
            {["brand","colours","socials","guide"].map(tab => (
              <div key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "14px 16px", fontSize: 12, fontWeight: activeTab === tab ? 600 : 500, color: activeTab === tab ? C.t1 : C.t3, cursor: "pointer", borderBottom: `2px solid ${activeTab === tab ? C.accent : "transparent"}`, textTransform: "capitalize" }}>{tab}</div>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 22, position: "relative" }}>
            {/* Gen overlay */}
            {genPhase === "generating" && (
              <div style={{ position: "absolute", inset: 0, background: theme === "dark" ? "rgba(8,8,14,.92)" : "rgba(242,242,248,.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 20, backdropFilter: "blur(8px)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.accent, animation: "bmc-spin .9s linear infinite" }} />
                <div style={{ fontSize: 15, fontWeight: 600 }}>Generating...</div>
                <div style={{ width: 220, height: 2, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: C.grad, borderRadius: 2, width: `${genProgress}%`, transition: "width .4s ease" }} />
                </div>
              </div>
            )}

            {/* Empty */}
            {!output && !personalityData && activeTab === "brand" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: C.t3, textAlign: "center" }}>
                <div style={{ fontSize: 32, opacity: .25 }}>✶</div>
                <div style={{ fontSize: 12, maxWidth: 180, lineHeight: 1.6 }}>Start a conversation to see your brand come to life</div>
              </div>
            )}

            {/* Brand tab */}
            {activeTab === "brand" && output && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1.4, opacity: .8 }}>{pickedLogo !== null ? ("Brand Board — " + brand) : expandedLogo !== null ? ("Preview — " + brand) : "Logo Concepts — Select your direction"}</div>

                {/* Expanded logo preview in right panel with mockups */}
                {pickedLogo === null && expandedLogo !== null && logoSVGs[expandedLogo] && (
                  <>
                    {/* Large logo */}
                    <div style={{ background: C.card, border: "2px solid " + C.accent, borderRadius: 16, padding: 32, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 140 }}>
                      <LogoDisplay logo={logoSVGs[expandedLogo]} style={{ maxHeight: 130 }} />
                    </div>
                    <div style={{ textAlign: "center", fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: C.t1 }}>{logoSVGs[expandedLogo].name} <span style={{ fontSize: 12, fontWeight: 400, color: C.t3 }}>{logoSVGs[expandedLogo].style}</span></div>

                    {/* Preview mockups */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1.4 }}>How it would look</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {/* Business Card mock */}
                      <div style={{ background: pal.colors[4] || "#1a1a2e", borderRadius: 12, padding: 20, aspectRatio: "1.6/1", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                        <LogoDisplay logo={logoSVGs[expandedLogo]} style={{ maxHeight: 35, maxWidth: 110 }} />
                        <div style={{ fontSize: 9, color: pal.colors[3] || "#fff", opacity: .7 }}>www.{brand.toLowerCase().replace(/\s/g,"")}.com</div>
                        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 8, color: C.t3, opacity: .4 }}>Business Card</div>
                      </div>
                      {/* App Icon */}
                      <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, " + pal.colors[0] + ", " + pal.colors[1] + ")", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.3)" }}>
                          <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24 }}>{brand[0]?.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{brand}</div>
                        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 8, color: C.t3, opacity: .4 }}>App Icon</div>
                      </div>
                      {/* Social Avatar */}
                      <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, " + pal.colors[0] + ", " + pal.colors[1] + ")", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>{brand[0]?.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.t2 }}>@{brand.toLowerCase().replace(/\s/g,"")}</div>
                        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 8, color: C.t3, opacity: .4 }}>Social</div>
                      </div>
                      {/* Letterhead */}
                      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 14px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 100, position: "relative", border: "1px solid " + C.border }}>
                        <LogoDisplay logo={logoSVGs[expandedLogo]} style={{ maxHeight: 30, maxWidth: 90 }} />
                        <div style={{ marginTop: 6 }}><div style={{ height: 3, background: "#eee", borderRadius: 2, marginBottom: 3, width: "85%" }} /><div style={{ height: 3, background: "#eee", borderRadius: 2, width: "65%" }} /></div>
                        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 8, color: "#bbb" }}>Letterhead</div>
                      </div>
                    </div>
                    {/* Confirm button — bottom right */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                      <button onClick={function() { pickLogoHandler(expandedLogo); setExpandedLogo(null); }} style={{ padding: "12px 28px", borderRadius: 12, background: C.grad, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 4px 16px rgba(123,97,255,.25)" }}>Confirm Logo →</button>
                    </div>
                  </>
                )}

                {pickedLogo !== null && logoSVGs[pickedLogo] ? (
                  <>
                    {/* Large logo display */}
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
                      <LogoDisplay logo={logoSVGs[pickedLogo]} style={{ maxHeight: 120 }} />
                    </div>

                    {/* Brand Application Mockups */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1.4, marginTop: 4 }}>Brand Applications</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {/* Business Card */}
                      <div style={{ background: pal.colors[4] || "#1a1a2e", borderRadius: 12, padding: 20, aspectRatio: "1.6/1", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: pal.colors[0], opacity: 0.08 }} />
                        <LogoDisplay logo={logoSVGs[pickedLogo]} style={{ maxHeight: 40, maxWidth: 120 }} />
                        <div>
                          <div style={{ fontSize: 9, color: pal.colors[3] || "#fff", opacity: .7, letterSpacing: .5 }}>www.{brand.toLowerCase().replace(/\s/g,"")}.com</div>
                        </div>
                        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 8, color: C.t3, opacity: .4 }}>Business Card</div>
                      </div>

                      {/* App Icon */}
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${pal.colors[0]}, ${pal.colors[1]})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.3)" }}>
                          <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24 }}>{brand[0]?.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{brand}</div>
                        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 8, color: C.t3, opacity: .4 }}>App Icon</div>
                      </div>

                      {/* Social Avatar */}
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${pal.colors[0]}, ${pal.colors[1]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{brand[0]?.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.t2 }}>@{brand.toLowerCase().replace(/\s/g,"")}</div>
                        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 8, color: C.t3, opacity: .4 }}>Social Avatar</div>
                      </div>

                      {/* Letterhead */}
                      <div style={{ background: "#fff", borderRadius: 12, padding: "16px 16px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 120, position: "relative", border: `1px solid ${C.border}` }}>
                        <LogoDisplay logo={logoSVGs[pickedLogo]} style={{ maxHeight: 35, maxWidth: 100 }} />
                        <div style={{ marginTop: 8 }}>
                          <div style={{ height: 3, background: "#eee", borderRadius: 2, marginBottom: 4, width: "90%" }} />
                          <div style={{ height: 3, background: "#eee", borderRadius: 2, marginBottom: 4, width: "75%" }} />
                          <div style={{ height: 3, background: "#eee", borderRadius: 2, width: "60%" }} />
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>{pal.colors.slice(0,3).map((c,i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />)}</div>
                        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 8, color: "#bbb" }}>Letterhead</div>
                      </div>
                    </div>

                    {/* Colour Palette */}
                    <div><div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10 }}>Colour Palette</div>
                      <div style={{ display: "flex", gap: 7 }}>{pal.colors.map((c,i) => <div key={i}><div style={{ height: 52, borderRadius: 10, background: c, width: 56 }} /><div style={{ fontSize: 10, color: C.t3, textAlign: "center", marginTop: 4, fontFamily: "monospace" }}>{pal.labels[i]}</div></div>)}</div>
                    </div>

                    {/* Brand Statement */}
                    {output.brand_statement && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}><div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>Brand Statement</div><div style={{ fontSize: 13, color: C.t2, lineHeight: 1.72 }}>{output.brand_statement}</div></div>}

                    {/* Taglines */}
                    {output.taglines && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}><div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>Tagline Options</div>{output.taglines.map((t,i) => <div key={i} style={{ fontSize: 14, fontWeight: 600, color: C.t1, padding: "6px 0", fontFamily: "'Syne',sans-serif" }}>{t}</div>)}</div>}
                  </>
                ) : logoSVGs.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                      {logoSVGs.map((logo, idx) => (
                        <div key={idx} onClick={() => pickLogoHandler(idx)} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "14px 10px 13px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "all .2s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(123,97,255,.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 70 }}>
                            <LogoDisplay logo={logo} style={{ maxHeight: 80 }} />
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{logo.name}</div>
                          <div style={{ fontSize: 10, color: C.t3, textAlign: "center" }}>{logo.style}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => generateLogos(true)} disabled={logoLoading} style={{ padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.hover, color: C.t2, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                      {logoLoading ? "Generating..." : "Load More Concepts"}
                    </button>
                  </>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, overflow: "hidden" }}>
                        <div style={{ height: 70, borderRadius: 8, background: `linear-gradient(90deg, ${C.hover} 25%, ${C.card} 50%, ${C.hover} 75%)`, backgroundSize: "200% 100%", animation: "bmc-shimmer 1.5s ease-in-out infinite", animationDelay: `${i * .15}s` }} />
                        <div style={{ height: 8, borderRadius: 4, background: C.hover, marginTop: 10, width: "60%" }} />
                        <div style={{ height: 6, borderRadius: 3, background: C.hover, marginTop: 6, width: "40%", opacity: .5 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Colours */}
            {activeTab === "colours" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1.4, opacity: .8 }}>Colour Direction — {pal.name}</div>
                <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                  {pal.colors.map((c,i) => <div key={i}><div style={{ height: 52, borderRadius: 10, background: c, cursor: "pointer", width: 58 }} /><div style={{ fontSize: 9, color: C.t3, textAlign: "center", marginTop: 4, fontFamily: "monospace" }}>{pal.labels[i]}</div></div>)}
                  {/* Add custom colour button */}
                  <div>
                    <div onClick={() => {
                      const hex = prompt("Enter a hex colour (e.g. #FF5733):");
                      if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        const key = palKey;
                        const p = PALETTES[key];
                        if (p) { p.colors.push(hex); p.labels.push("Custom"); setPalKey("_"); setTimeout(() => setPalKey(key), 10); }
                      }
                    }} style={{ height: 52, width: 52, borderRadius: 10, border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.t3, fontSize: 18, fontWeight: 300 }} title="Add custom colour">+</div>
                    <div style={{ fontSize: 9, color: C.t3, textAlign: "center", marginTop: 4 }}>Add</div>
                  </div>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: pal.colors[0] }}>Aa Bb Cc</div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>Primary — {pal.colors[0]}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 8 }}>{pal.colors.map((c,i) => <div key={i} style={{ flex: 1, height: 28, borderRadius: 5, background: c }} />)}</div>
                </div>
              </div>
            )}

            {/* Socials */}
            {activeTab === "socials" && output && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {selectedSocial !== null ? (
                  // Expanded social post view
                  <div>
                    <button onClick={() => setSelectedSocial(null)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, fontSize: 11, cursor: "pointer", marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>← Back to all posts</button>
                    {(() => {
                      const posts = [
                        { bg: `linear-gradient(135deg, ${pal.colors[0]}, ${pal.colors[1]})`, plat: "Instagram", cap: output.social_captions?.instagram || `Introducing ${brand}.`, size: "1080 × 1080", ratio: "1/1" },
                        { bg: `linear-gradient(135deg, #0A66C2, #1E90FF)`, plat: "LinkedIn", cap: output.social_captions?.linkedin || `${brand} is ready.`, size: "1200 × 627", ratio: "1.91/1" },
                        { bg: `linear-gradient(135deg, ${pal.colors[0]}, ${pal.colors[3] || pal.colors[2]})`, plat: "Campaign", cap: output.social_captions?.campaign || "Bold vision.", size: "1200 × 628", ratio: "1.91/1" },
                      ];
                      const p = posts[selectedSocial];
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {/* Full-size mockup */}
                          <div style={{ background: p.bg, borderRadius: 16, aspectRatio: p.ratio, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, position: "relative", overflow: "hidden", maxHeight: 320 }}>
                            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.2))" }} />
                            {pickedLogo !== null && logoSVGs[pickedLogo] && <div style={{ position: "relative", zIndex: 1 }}><LogoDisplay logo={logoSVGs[pickedLogo]} style={{ maxHeight: 80, maxWidth: 160 }} /></div>}
                            {!pickedLogo && <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, position: "relative", zIndex: 1 }}>{brand}</span>}
                            <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 9px", borderRadius: 999, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 10, fontWeight: 600 }}>{p.plat}</div>
                          </div>
                          {/* Post details */}
                          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{p.plat} Post · {p.size}</div>
                            <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.72, marginBottom: 10 }}>{p.cap}</div>
                            <div style={{ fontSize: 11, color: C.accent, opacity: .8 }}>#{brand.replace(/\s/g,"")} #brand #launch</div>
                          </div>
                          {/* Phone mockup frame */}
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <div style={{ width: 180, background: C.card, borderRadius: 24, padding: "8px 6px", border: `2px solid ${C.border}` }}>
                              <div style={{ borderRadius: 18, overflow: "hidden", background: p.bg, aspectRatio: "9/16", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12 }}>{brand}</span>
                                <div style={{ fontSize: 7, color: "rgba(255,255,255,.7)", padding: "0 12px", textAlign: "center", lineHeight: 1.4 }}>{p.cap.slice(0, 60)}...</div>
                              </div>
                              <div style={{ height: 4, width: 40, background: C.border, borderRadius: 2, margin: "6px auto 2px" }} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  // Grid of social posts — proper platform mockups
                  [
                    { bg: `linear-gradient(135deg, ${pal.colors[0]}, ${pal.colors[1]})`, plat: "Instagram", icon: "📷", cap: output.social_captions?.instagram || `Introducing ${brand}.` },
                    { bg: `linear-gradient(135deg, ${pal.colors[0]}, ${pal.colors[3] || pal.colors[2]})`, plat: "LinkedIn", icon: "💼", cap: output.social_captions?.linkedin || `${brand} is ready.` },
                    { bg: `linear-gradient(135deg, ${pal.colors[2] || pal.colors[0]}, ${pal.colors[4] || pal.colors[1]})`, plat: "Campaign", icon: "🚀", cap: output.social_captions?.campaign || "Bold vision." },
                  ].map((p,i) => (
                    <div key={i} onClick={() => setSelectedSocial(i)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all .18s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(123,97,255,.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                      {/* Platform chrome header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{brand[0]?.toUpperCase()}</div>
                        <div><div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{brand}</div><div style={{ fontSize: 8, color: C.t3 }}>{p.plat === "LinkedIn" ? "Promoted · 1st" : "Sponsored"}</div></div>
                        <div style={{ marginLeft: "auto", fontSize: 9, padding: "2px 7px", borderRadius: 999, background: C.adim, color: C.accent, fontWeight: 600 }}>{p.plat}</div>
                      </div>
                      {/* Visual area */}
                      <div style={{ background: p.bg, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, transparent 30%, rgba(0,0,0,.12))" }} />
                        {pickedLogo !== null && logoSVGs[pickedLogo] ? (
                          <div style={{ position: "relative", zIndex: 1 }}><LogoDisplay logo={logoSVGs[pickedLogo]} style={{ maxHeight: 44, maxWidth: 110 }} /></div>
                        ) : (
                          <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, position: "relative", zIndex: 1, textShadow: "0 2px 10px rgba(0,0,0,.3)" }}>{brand}</span>
                        )}
                        {output.taglines?.[0] && <div style={{ color: "rgba(255,255,255,.8)", fontSize: 9, position: "relative", zIndex: 1, fontWeight: 500, maxWidth: "80%", textAlign: "center" }}>{output.taglines[i] || output.taglines[0]}</div>}
                      </div>
                      {/* Caption + engagement bar */}
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                          {["♡","💬","↗"].map((e,j) => <span key={j} style={{ fontSize: 13, opacity: .4 }}>{e}</span>)}
                          <span style={{ marginLeft: "auto", fontSize: 13, opacity: .4 }}>☆</span>
                        </div>
                        <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}><strong style={{ color: C.t1 }}>{brand.toLowerCase().replace(/\s/g,"")}</strong> {p.cap}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Guide */}
            {activeTab === "guide" && output && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <button style={{ padding: "10px 18px", background: C.grad, border: "none", color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 20, fontFamily: "'Inter',sans-serif" }}>Export PDF →</button>
                {(() => {
                  // Use real generated guidelines if available, otherwise smart defaults
                  const gs = output?.guidelines_sections;
                  const sections = gs && gs.length > 0 ? gs.map((s, i) => ({
                    n: String(i + 1).padStart(2, "0"),
                    t: s.title,
                    d: s.desc,
                    _do: s["do"] || s._do || "",
                    dont: s["dont"] || s.dont || "",
                  })) : [
                  { n:"01", t:"Logo Usage", d:`The ${brand} logo should be used consistently across all touchpoints.`, _do:"Use on white or brand-primary backgrounds with clear space equal to the logo height", dont:"Stretch, recolour, rotate, or apply effects to the logo" },
                  { n:"02", t:"Colour System", d:`The ${brand} palette — ${pal.name} — is designed for flexibility across digital and print.`, _do:`Use ${pal.labels[0]} (${pal.colors[0]}) for primary actions and hero moments`, dont:"Combine more than 3 palette colours in a single layout" },
                  { n:"03", t:"Typography", d:`Typography sets the rhythm for ${brand}. Use display weight for impact, body weight for readability.`, _do:"Maintain consistent weight hierarchy — bold for headings, regular for body", dont:"Mix more than two typefaces in a single composition" },
                  { n:"04", t:"Tone of Voice", d: output?.guidelines_tone || `${brand} speaks with clarity and purpose. Direct, confident, human.`, _do:"Lead with value, be specific, end with a clear action", dont:"Use jargon, passive voice, or empty superlatives" },
                  { n:"05", t:"Imagery", d:`Photography for ${brand} should feel intentional — never generic stock.`, _do:"Natural light, clear subject, colours that echo the brand palette", dont:"Over-filtered, overly staged, or generic stock photography" },
                  { n:"06", t:"Layout", d:`${brand} layouts use white space as a design element — it signals confidence.`, _do:"Generous margins, clear focal point, consistent grid", dont:"Crowded compositions or competing visual elements" },
                  ];
                  return sections.map(s => (
                  <div key={s.n} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 5, opacity: .7 }}>{s.n}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 7 }}>{s.t}</div>
                    <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.72, marginBottom: 13, maxWidth: 480 }}>{s.d}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "rgba(52,211,153,.05)", border: "1px solid rgba(52,211,153,.18)", borderRadius: 10, padding: 13 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>✓ Do</div>
                        <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.55 }}>{s._do}</div>
                      </div>
                      <div style={{ background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.18)", borderRadius: 10, padding: 13 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>✕ Don't</div>
                        <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.55 }}>{s.dont}</div>
                      </div>
                    </div>
                  </div>
                ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── API SETTINGS DIALOG ── */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, width: 480, maxHeight: "80vh", overflowY: "auto", padding: 0, boxShadow: "0 24px 80px rgba(0,0,0,.5)" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: C.t1 }}>API Settings</div>
                <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>Connect image generation and LLM services</div>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>

            {/* Active service indicator */}
            <div style={{ padding: "12px 24px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeImageAPI !== "claude" ? "#34D399" : C.t3 }} />
              <span style={{ fontSize: 12, color: C.t2 }}>Image generation: <strong style={{ color: C.t1 }}>{{ claude: "Claude SVG (built-in)", gemini: "Google Gemini", deepai: "DeepAI", openai: "OpenAI DALL-E", nanobanana: "NanoBanana", replicate: "Replicate" }[activeImageAPI]}</strong></span>
            </div>

            {/* API entries */}
            <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "gemini", name: "Google Gemini (Nano Banana)", desc: "500 free images/day — best text rendering for logos", placeholder: "AIza...", url: "aistudio.google.com → Get API Key" },
                { key: "deepai", name: "DeepAI", desc: "Text-to-image generation — $0.01/image standard", placeholder: "Paste your DeepAI API key...", url: "deepai.org/dashboard" },
                { key: "openai", name: "OpenAI (DALL-E)", desc: "High-quality image generation via DALL-E 3", placeholder: "sk-...", url: "platform.openai.com/api-keys" },
                { key: "nanobanana", name: "NanoBanana", desc: "Gemini-powered image gen — free tier available", placeholder: "Paste your NanoBanana API key...", url: "nanobananaapi.ai/api-key" },
                { key: "replicate", name: "Replicate", desc: "Flux, SDXL, and open-source models", placeholder: "r8_...", url: "replicate.com/account/api-tokens" },
              ].map(svc => {
                const status = apiStatus[svc.key];
                const statusColor = status === "connected" ? "#34D399" : status === "failed" ? "#ef4444" : status === "blocked" ? "#FBBF24" : status === "testing" ? C.accent : C.t3;
                const statusText = status === "connected" ? "Connected" : status === "failed" ? "Invalid key" : status === "blocked" ? "Network blocked — run locally" : status === "testing" ? "Testing..." : "Not connected";
                return (
                  <div key={svc.key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>{svc.name}</div>
                        <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{svc.desc}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
                        <span style={{ fontSize: 10, color: statusColor, fontWeight: 500 }}>{statusText}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type="password"
                        value={apiKeys[svc.key]}
                        onChange={e => setApiKeys(prev => ({ ...prev, [svc.key]: e.target.value }))}
                        placeholder={svc.placeholder}
                        style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.hover, color: C.t1, fontSize: 12, outline: "none", fontFamily: "'Inter',sans-serif" }}
                      />
                      <button
                        onClick={() => testAPI(svc.key)}
                        disabled={!apiKeys[svc.key].trim() || status === "testing"}
                        style={{ padding: "9px 14px", borderRadius: 8, background: apiKeys[svc.key].trim() ? C.grad : C.hover, border: "none", color: apiKeys[svc.key].trim() ? "#fff" : C.t3, fontSize: 11, fontWeight: 600, cursor: apiKeys[svc.key].trim() ? "pointer" : "not-allowed", fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap" }}
                      >
                        {status === "testing" ? "..." : "Test"}
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: C.t3, opacity: .6 }}>Get key: {svc.url}</div>
                  </div>
                );
              })}

              {/* Custom API section */}
              <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 4 }}>Custom API</div>
                <div style={{ fontSize: 11, color: C.t3, marginBottom: 8 }}>Add any image generation API endpoint</div>
                <input
                  value={apiKeys.custom}
                  onChange={e => setApiKeys(prev => ({ ...prev, custom: e.target.value }))}
                  placeholder="https://your-api.com/v1/generate"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.hover, color: C.t1, fontSize: 12, outline: "none", fontFamily: "'Inter',sans-serif" }}
                />
              </div>

              {/* Reset to Claude SVG */}
              {activeImageAPI !== "claude" && (
                <button onClick={() => { setActiveImageAPI("claude"); setShowSettings(false); }} style={{ padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", textAlign: "center" }}>
                  Reset to Claude SVG generation (built-in, no API needed)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=DM+Serif+Display&family=Montserrat:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&family=Bricolage+Grotesque:wght@400;600;700;800&display=swap');
        @keyframes bmc-bounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-6px);opacity:1}}
        @keyframes bmc-spin{to{transform:rotate(360deg)}}
        @keyframes bmc-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        *{box-sizing:border-box;margin:0;padding:0}
      `}</style>
    </div>
  );
}

// =======================================================
//  UI RENDERER — renders whatever Claude sends back
// =======================================================

function UIRenderer({ ui, brand, onRespond, C, theme }) {
  const [descText, setDescText] = useState("");
  const [selected, setSelected] = useState(ui.select === "multi" ? [] : null);
  const [personalityPicks, setPersonalityPicks] = useState({});

  // Reset selection state when ui changes
  useEffect(() => {
    setSelected(ui.select === "multi" ? [] : null);
    setDescText("");
    setPersonalityPicks({});
  }, [ui]);

  const AV = () => (
    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: C.grad, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, marginTop: 1, boxShadow: "0 2px 10px rgba(123,97,255,.25)" }}>{brand[0]?.toUpperCase()}</div>
  );

  // Description
  if (ui.type === "description") return (
    <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
      <AV />
      <div style={{ flex: 1 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
          <textarea value={descText} onChange={e => setDescText(e.target.value)} placeholder={ui.placeholder || "Tell us everything..."} rows={4} style={{ width: "100%", minHeight: 96, background: C.hover, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 15px", color: C.t1, fontSize: 13, lineHeight: 1.65, outline: "none", resize: "vertical", fontFamily: "'Inter',sans-serif" }} />
          <div style={{ fontSize: 11, color: C.t3, marginTop: 9, lineHeight: 1.55 }}>The more detail you give, the fewer questions I'll need to ask.</div>
          <button onClick={() => { if (descText.trim()) onRespond(descText.trim()); }} disabled={!descText.trim()} style={{ marginTop: 11, width: "100%", padding: 11, borderRadius: 10, background: C.grad, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: descText.trim() ? "pointer" : "not-allowed", opacity: descText.trim() ? 1 : .4, fontFamily: "'Inter',sans-serif" }}>Analyse & Continue →</button>
        </div>
      </div>
    </div>
  );

  // Amber
  if (ui.type === "amber") return (
    <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
      <AV />
      <div style={{ flex: 1 }}>
        <div style={{ background: "rgba(251,191,36,.07)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, marginBottom: 11 }}>💡 {ui.text}</div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={() => onRespond(ui.yes || "Yes, that's right")} style={{ padding: "7px 15px", borderRadius: 10, background: "rgba(251,191,36,.14)", border: "1px solid rgba(251,191,36,.28)", color: "#FBBF24", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>✓ {ui.yes || "Yes"}</button>
            <button onClick={() => onRespond(ui.no || "Not quite")} style={{ padding: "7px 15px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.t3, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>↺ {ui.no || "Not quite"}</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Summary
  if (ui.type === "summary") return (
    <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
      <AV />
      <div style={{ flex: 1 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>Brief Summary</div>
          {ui.brief && Object.entries(ui.brief).map(([k, v]) => v && (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.t3, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
              <span style={{ fontSize: 12, color: C.t1, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{typeof v === "object" ? JSON.stringify(v) : v}</span>
            </div>
          ))}
          <div style={{ fontSize: 13, color: C.t2, marginTop: 12 }}>{ui.confirm_text || "Does this look right?"}</div>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            <button onClick={() => onRespond("Looks good — generate it.")} style={{ flex: 1, padding: 11, borderRadius: 10, background: C.grad, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Confirm & Generate →</button>
            <button onClick={() => onRespond("I want to change something.")} style={{ padding: "11px 16px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.t3, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Edit</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Inline brand marks — no external calls, works everywhere
  const BRAND_MARKS = {
    "Mailchimp": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${c}" opacity=".15"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="${c}" font-family="sans-serif">M</text></svg>`,
    "Slack": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="3" y="8" width="4" height="10" rx="2" fill="#E01E5A"/><rect x="10" y="3" width="4" height="10" rx="2" fill="#36C5F0"/><rect x="10" y="11" width="10" height="4" rx="2" fill="#2EB67D"/><rect x="3" y="11" width="10" height="4" rx="2" fill="#ECB22E"/></svg>`,
    "Figma": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="14" cy="12" r="4" fill="#1ABCFE"/><rect x="6" y="4" width="8" height="8" rx="4" fill="#F24E1E"/><rect x="6" y="12" width="8" height="8" rx="4" fill="#0ACF83"/><rect x="6" y="4" width="4" height="8" rx="2" fill="#FF7262"/><rect x="6" y="12" width="4" height="8" rx="2" fill="#A259FF"/></svg>`,
    "McKinsey": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" fill="${c}" opacity=".12"/><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="700" fill="${c}" font-family="serif">McK</text></svg>`,
    "Bloomberg": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="${c}" opacity=".12"/><text x="12" y="15" text-anchor="middle" font-size="10" font-weight="800" fill="${c}" font-family="sans-serif">B</text></svg>`,
    "Deloitte": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="10" r="4" fill="#86BC25"/><text x="12" y="21" text-anchor="middle" font-size="5" font-weight="600" fill="${c}" font-family="sans-serif">Deloitte</text></svg>`,
    "Nike": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M3 16C5 14 9 8 21 6C17 10 10 14 7 15C5 15.5 3.5 15.5 3 16Z" fill="${c}"/></svg>`,
    "Red Bull": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="9" cy="12" r="5" fill="#CC1E4A" opacity=".8"/><circle cx="15" cy="12" r="5" fill="#FFCC00" opacity=".8"/></svg>`,
    "Supreme": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="1" fill="#ED1C24"/><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="800" fill="#FFF" font-family="serif" font-style="italic">Supreme</text></svg>`,
    "Aesop": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="1" fill="${c}" opacity=".08"/><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="400" fill="${c}" font-family="serif">Aesop</text></svg>`,
    "Muji": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" fill="#A52422"/><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="700" fill="#FFF" font-family="sans-serif">MUJI</text></svg>`,
    "Acne Studios": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><text x="12" y="14" text-anchor="middle" font-size="6" font-weight="400" fill="${c}" font-family="sans-serif" letter-spacing="2">ACNE</text><text x="12" y="20" text-anchor="middle" font-size="4" fill="${c}" font-family="sans-serif" letter-spacing="3" opacity=".5">STUDIOS</text></svg>`,
    "IKEA": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#003399"/><rect x="4" y="6" width="16" height="12" rx="1" fill="#FFCC00"/><text x="12" y="15" text-anchor="middle" font-size="8" font-weight="800" fill="#003399" font-family="sans-serif">IKEA</text></svg>`,
    "Spotify": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1DB954"/><path d="M7 10C11 9 15 9 18 11" stroke="#FFF" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M8 13C11 12 14 12 17 13.5" stroke="#FFF" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M9 16C11.5 15.5 13.5 15.5 15.5 16.5" stroke="#FFF" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
    "Notion": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="${c}" opacity=".1" stroke="${c}" stroke-width="1"/><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="700" fill="${c}" font-family="serif">N</text></svg>`,
    "Rolex": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><polygon points="12,2 14,8 20,8 15,12 17,18 12,14 7,18 9,12 4,8 10,8" fill="#006039"/></svg>`,
    "Gucci": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="9" cy="12" r="6" fill="none" stroke="${c}" stroke-width="1.5"/><circle cx="15" cy="12" r="6" fill="none" stroke="${c}" stroke-width="1.5"/></svg>`,
    "Porsche": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="${c}" opacity=".1" stroke="${c}" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="800" fill="${c}" font-family="sans-serif">P</text></svg>`,
    "Apple": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M18.7 12.4c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.3 1-4.2 1s-2.2-1-3.6-1c-1.9 0-3.6 1.1-4.5 2.7-1.9 3.4-.5 8.4 1.4 11.1.9 1.3 2 2.8 3.5 2.7 1.4-.1 1.9-.9 3.6-.9s2.1.9 3.6.9 2.4-1.3 3.3-2.7c1-1.5 1.5-2.9 1.5-3-.1 0-2.9-1.1-2.9-4.4z" fill="${c}" transform="scale(0.8) translate(3,3)"/></svg>`,
    "Google": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 10v4h6c-.3 1.5-1.8 4.5-6 4.5-3.6 0-6.5-3-6.5-6.5S8.4 5.5 12 5.5c2 0 3.4.9 4.2 1.6L18 5.4C16.4 3.9 14.4 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.1-1.5H12z" fill="#4285F4"/></svg>`,
    "FedEx": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><text x="4" y="16" font-size="10" font-weight="800" fill="#4D148C" font-family="sans-serif">Fed</text><text x="15" y="16" font-size="10" font-weight="800" fill="#FF6600" font-family="sans-serif">Ex</text></svg>`,
    "HBO": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="1" fill="${c}" opacity=".1"/><text x="12" y="15" text-anchor="middle" font-size="9" font-weight="400" fill="${c}" font-family="sans-serif" letter-spacing="3">HBO</text></svg>`,
    "IBM": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#0530AD" font-family="sans-serif" letter-spacing="1">IBM</text></svg>`,
    "NASA": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#0B3D91"/><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="800" fill="#FFF" font-family="sans-serif">NASA</text></svg>`,
    "Starbucks": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00704A"/><circle cx="12" cy="12" r="7" fill="none" stroke="#FFF" stroke-width=".8"/><text x="12" y="14" text-anchor="middle" font-size="5" font-weight="600" fill="#FFF" font-family="serif">SB</text></svg>`,
    "NFL": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#013369"/><text x="12" y="15" text-anchor="middle" font-size="8" font-weight="800" fill="#FFF" font-family="sans-serif">NFL</text></svg>`,
    "X": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${c}"/><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="700" fill="${c === '#000' || c === '#0d0d1a' ? '#FFF' : '#FFF'}" font-family="sans-serif">X</text></svg>`,
    "Target": (s,c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#CC0000"/><circle cx="12" cy="12" r="6.5" fill="#FFF"/><circle cx="12" cy="12" r="3.5" fill="#CC0000"/></svg>`,
  };

  const BrandMark = ({ name, size = 20 }) => {
    const color = theme === "dark" ? "#eeeef8" : "#0d0d1a";
    const gen = BRAND_MARKS[name];
    if (!gen) return <span style={{ fontSize: 8, fontWeight: 600, color: C.t3, letterSpacing: .3, padding: "2px 4px", background: C.hover, borderRadius: 3 }}>{name}</span>;
    return <div style={{ display: "inline-flex" }} dangerouslySetInnerHTML={{ __html: gen(size, color) }} />;
  };

  // Personality axes
  if (ui.type === "personality") {
    const axesData = [
      { axis: "Playful / Serious", options: ["Playful", "Serious"],
        brands: [
          [{ name: "Mailchimp" }, { name: "Slack" }, { name: "Figma" }],
          [{ name: "McKinsey" }, { name: "Bloomberg" }, { name: "Deloitte" }]
        ]},
      { axis: "Bold / Subtle", options: ["Bold", "Subtle"],
        brands: [
          [{ name: "Nike" }, { name: "Red Bull" }, { name: "Supreme" }],
          [{ name: "Aesop" }, { name: "Muji" }, { name: "Acne Studios" }]
        ]},
      { axis: "Accessible / Premium", options: ["Accessible", "Premium"],
        brands: [
          [{ name: "IKEA" }, { name: "Spotify" }, { name: "Notion" }],
          [{ name: "Rolex" }, { name: "Gucci" }, { name: "Porsche" }]
        ]}
    ];
    const allPicked = axesData.every(a => personalityPicks[a.axis]);
    return (
      <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
        <AV />
        <div style={{ flex: 1 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 18px 15px", boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
            <div style={{ fontSize: 11, color: C.accent, marginBottom: 10, fontWeight: 600, letterSpacing: .8, textTransform: "uppercase", opacity: .7 }}>Personality</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: C.t1, lineHeight: 1.22, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: (ui.headline || "").replace(brand, `<span style="color:${C.accent}">${brand}</span>`) }} />
            <div style={{ fontSize: 12, color: C.t3, fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>{ui.why}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {axesData.map((a) => (
                <div key={a.axis}>
                  <div style={{ fontSize: 10, color: C.t3, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: .8 }}>{a.axis}</div>
                  <div style={{ display: "flex", gap: 7 }}>
                    {a.options.map((opt, oi) => {
                      const brands = a.brands[oi] || [];
                      const isPicked = personalityPicks[a.axis] === opt;
                      return (
                        <button key={opt} onClick={() => setPersonalityPicks(p => ({ ...p, [a.axis]: opt }))} style={{ flex: 1, padding: "14px 14px 12px", border: `1.5px solid ${isPicked ? C.accent : C.border}`, borderRadius: 12, cursor: "pointer", background: isPicked ? "rgba(123,97,255,.09)" : C.card, fontFamily: "'Inter',sans-serif", textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: isPicked ? C.accent : C.t1 }}>{opt}</div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            {brands.map(b => (
                              <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <BrandMark name={b.name} size={18} />
                                <span style={{ fontSize: 9, color: C.t3, fontWeight: 500 }}>{b.name}</span>
                              </div>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {allPicked && <button onClick={() => onRespond(`Personality: ${Object.entries(personalityPicks).map(([a,v]) => `${a}: ${v}`).join(", ")}`)} style={{ marginTop: 10, width: "100%", padding: 11, borderRadius: 10, background: C.grad, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Confirm →</button>}
          </div>
        </div>
      </div>
    );
  }

  // Colour tiles
  if (ui.type === "colour_tiles") {
    const colourSel = Array.isArray(selected) ? selected : selected ? [selected] : [];
    const MAX_COLOURS = 2;
    const toggleColour = (name) => {
      setSelected(prev => {
        const arr = Array.isArray(prev) ? prev : prev ? [prev] : [];
        if (arr.includes(name)) return arr.filter(v => v !== name);
        if (arr.length >= MAX_COLOURS) return arr;
        return [...arr, name];
      });
    };
    return (
      <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
        <AV />
        <div style={{ flex: 1 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 18px 15px", boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
            <div style={{ fontSize: 11, color: C.accent, marginBottom: 10, fontWeight: 600, letterSpacing: .8, textTransform: "uppercase", opacity: .7 }}>{ui.counter}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: C.t1, lineHeight: 1.22, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: (ui.headline || "").replace(brand, `<span style="color:${C.accent}">${brand}</span>`) }} />
            <div style={{ fontSize: 12, color: C.t3, fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>{ui.why}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {(ui.options || []).map(opt => {
                const isSel = colourSel.includes(opt.name);
                const isDisabled = !isSel && colourSel.length >= MAX_COLOURS;
                return (
                  <div key={opt.name} onClick={() => !isDisabled && toggleColour(opt.name)} style={{ border: `2px solid ${isSel ? C.accent : C.border}`, borderRadius: 12, cursor: isDisabled ? "not-allowed" : "pointer", overflow: "hidden", boxShadow: isSel ? "0 0 0 3px rgba(123,97,255,.18)" : "none", opacity: isDisabled ? .4 : 1, transition: "all .18s" }}>
                    <div style={{ display: "flex", height: 56 }}>{(opt.swatches || []).map((c,i) => <div key={i} style={{ flex: 1, background: c }} />)}</div>
                    <div style={{ padding: "9px 11px 10px", background: C.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, marginBottom: 2 }}>{opt.name}</div>
                        <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.4 }}>{opt.sub}</div>
                      </div>
                      {isSel && <div style={{ width: 18, height: 18, borderRadius: 5, background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>✓</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            {colourSel.length > 0 && (
              <button onClick={() => onRespond(colourSel.join(" + "))} style={{ marginTop: 10, width: "100%", padding: 11, borderRadius: 10, background: C.grad, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Confirm {colourSel.length} palette{colourSel.length > 1 ? "s" : ""} →</button>
            )}
            <div style={{ fontSize: 10, color: C.t3, marginTop: 8, textAlign: "right" }}>Pick up to {MAX_COLOURS} palettes — {colourSel.length}/{MAX_COLOURS}</div>
          </div>
        </div>
      </div>
    );
  }

  // Typography tiles — full specimen layout with real Google Fonts
  if (ui.type === "typography_tiles") {
    return (
      <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
        <AV />
        <div style={{ flex: 1 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 18px 15px", boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
            <div style={{ fontSize: 11, color: C.accent, marginBottom: 10, fontWeight: 600, letterSpacing: .8, textTransform: "uppercase", opacity: .7 }}>{ui.counter}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: C.t1, lineHeight: 1.22, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: (ui.headline || "").replace(brand, `<span style="color:${C.accent}">${brand}</span>`) }} />
            <div style={{ fontSize: 12, color: C.t3, fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>{ui.why}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {(ui.options || []).map(opt => {
                const isSel = selected === opt.name;
                const refs = opt.refs || [];
                const bodyFont = opt.specimen_body || opt.font;
                return (
                  <div key={opt.name} onClick={() => { setSelected(opt.name); setTimeout(() => onRespond(opt.name), 300); }} style={{ border: `2px solid ${isSel ? C.accent : C.border}`, borderRadius: 12, cursor: "pointer", overflow: "hidden", boxShadow: isSel ? "0 0 0 3px rgba(123,97,255,.18)" : "none", transition: "all .18s" }}>
                    {/* Specimen area */}
                    <div style={{ padding: "18px 16px 14px", background: C.hover, minHeight: 110, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      {/* Display heading in the font */}
                      <div style={{ fontFamily: opt.font, fontWeight: opt.weight, fontSize: opt.size || "24px", color: C.t1, lineHeight: 1.1, letterSpacing: "-0.5px", marginBottom: 8 }}>
                        {brand}
                      </div>
                      {/* Body text specimen */}
                      <div style={{ fontFamily: bodyFont, fontWeight: 400, fontSize: 11, color: C.t2, lineHeight: 1.55, marginBottom: 6 }}>
                        Building brands that move people. Every detail intentional.
                      </div>
                      {/* Alphabet specimen row */}
                      <div style={{ fontFamily: opt.font, fontWeight: opt.weight, fontSize: 10, color: C.t3, letterSpacing: 1.5, opacity: .5 }}>
                        Aa Bb Cc Dd Ee Ff Gg
                      </div>
                    </div>
                    {/* Label area */}
                    <div style={{ padding: "10px 12px 10px", background: C.card }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{opt.name}</div>
                      </div>
                      <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.4 }}>{opt.label}</div>
                      {refs.length > 0 && <div style={{ fontSize: 9, color: C.t3, marginTop: 5, opacity: .65 }}>Think: {refs.join(" · ")}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logo style tiles with SVG silhouettes + real brand icons
  if (ui.type === "logo_tiles") {
    const logoData = [
      { name: "Symbol + name", sub: "Icon paired with wordmark",
        silhouette: `<svg viewBox="0 0 140 50" width="140" height="50" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="24" height="24" rx="5" fill="${C.t3}" opacity=".3"/><rect x="12" y="14" width="16" height="16" rx="3" fill="${C.t3}" opacity=".45"/><rect x="42" y="15" width="48" height="7" rx="3" fill="${C.t1}" opacity=".35"/><rect x="42" y="28" width="32" height="4" rx="2" fill="${C.t3}" opacity=".2"/></svg>`,
        brands: [{ name: "Apple" }, { name: "Slack" }, { name: "Spotify" }] },
      { name: "Name only (wordmark)", sub: "Pure typography mark",
        silhouette: `<svg viewBox="0 0 140 50" width="140" height="50" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="17" width="120" height="10" rx="3" fill="${C.t1}" opacity=".35"/><rect x="30" y="33" width="80" height="3" rx="1.5" fill="${C.t3}" opacity=".15"/></svg>`,
        brands: [{ name: "Google" }, { name: "FedEx" }, { name: "Supreme" }] },
      { name: "Symbol only", sub: "Standalone icon mark",
        silhouette: `<svg viewBox="0 0 140 50" width="140" height="50" xmlns="http://www.w3.org/2000/svg"><circle cx="70" cy="25" r="20" fill="none" stroke="${C.t3}" stroke-width="1.5" opacity=".3"/><polygon points="70,12 77,21 80,32 70,36 60,32 63,21" fill="${C.t3}" opacity=".25"/></svg>`,
        brands: [{ name: "Apple" }, { name: "X" }, { name: "Target" }] },
      { name: "Monogram / initials", sub: "Lettermark from initials",
        silhouette: `<svg viewBox="0 0 140 50" width="140" height="50" xmlns="http://www.w3.org/2000/svg"><circle cx="70" cy="25" r="22" fill="${C.t3}" opacity=".08" stroke="${C.t3}" stroke-width="1.5"/><text x="70" y="31" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" fill="${C.t1}" opacity=".3">Ab</text></svg>`,
        brands: [{ name: "HBO" }, { name: "IBM" }, { name: "NASA" }] },
      { name: "Badge / emblem", sub: "Enclosed badge shape",
        silhouette: `<svg viewBox="0 0 140 50" width="140" height="50" xmlns="http://www.w3.org/2000/svg"><rect x="28" y="3" width="84" height="44" rx="22" fill="${C.t3}" opacity=".06" stroke="${C.t3}" stroke-width="1.5"/><rect x="45" y="18" width="50" height="7" rx="2" fill="${C.t1}" opacity=".3"/><rect x="52" y="30" width="36" height="4" rx="2" fill="${C.t3}" opacity=".2"/></svg>`,
        brands: [{ name: "Starbucks" }, { name: "Porsche" }, { name: "NFL" }] },
      { name: "Surprise me", sub: "AI picks the best fit",
        silhouette: `<svg viewBox="0 0 140 50" width="140" height="50" xmlns="http://www.w3.org/2000/svg"><text x="70" y="30" text-anchor="middle" font-family="sans-serif" font-size="26" fill="${C.accent}" opacity=".4">✦</text><text x="70" y="45" text-anchor="middle" font-family="sans-serif" font-size="8" fill="${C.t3}" opacity=".4">AI decides</text></svg>`,
        brands: [] },
    ];

    return (
      <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
        <AV />
        <div style={{ flex: 1 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 18px 15px", boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
            <div style={{ fontSize: 11, color: C.accent, marginBottom: 10, fontWeight: 600, letterSpacing: .8, textTransform: "uppercase", opacity: .7 }}>{ui.counter}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: C.t1, lineHeight: 1.22, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: (ui.headline || "").replace(brand, `<span style="color:${C.accent}">${brand}</span>`) }} />
            <div style={{ fontSize: 12, color: C.t3, fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>{ui.why}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
              {logoData.map(opt => {
                const isSel = selected === opt.name;
                return (
                  <div key={opt.name} onClick={() => { setSelected(opt.name); setTimeout(() => onRespond(opt.name), 300); }} style={{ border: `2px solid ${isSel ? C.accent : C.border}`, borderRadius: 12, cursor: "pointer", overflow: "hidden", boxShadow: isSel ? "0 0 0 3px rgba(123,97,255,.18)" : "none", transition: "all .18s" }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = "rgba(123,97,255,.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                    {/* SVG silhouette */}
                    <div style={{ padding: "14px 10px 6px", background: C.hover, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60 }} dangerouslySetInnerHTML={{ __html: opt.silhouette }} />
                    {/* Real brand logos row */}
                    {opt.brands.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: "8px 8px 10px", background: C.hover }}>
                        {opt.brands.map(b => (
                          <div key={b.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            <BrandMark name={b.name} size={22} />
                            <span style={{ fontSize: 7, color: C.t3, opacity: .7 }}>{b.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Label */}
                    <div style={{ padding: "7px 10px 8px", background: C.card }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.t1, marginBottom: 1 }}>{opt.name}</div>
                      <div style={{ fontSize: 9, color: C.t3, lineHeight: 1.35 }}>{opt.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Asset upload prompt — for Refresh & Guidelines when brand is external
  if (ui.type === "asset_upload") {
    // Use descText for link input, selected (as array) for collected links, personalityPicks for files
    const links = Array.isArray(selected) ? selected : [];
    const addLink = () => {
      if (descText.trim()) { setSelected(prev => [...(Array.isArray(prev) ? prev : []), descText.trim()]); setDescText(""); }
    };
    const removeLink = (idx) => setSelected(prev => (Array.isArray(prev) ? prev : []).filter((_, j) => j !== idx));
    const submitAssets = () => {
      const parts = [];
      if (links.length) parts.push("Links: " + links.join(", "));
      if (parts.length === 0) parts.push("No assets provided — describe the brand instead");
      onRespond(parts.join(" | "));
    };
    return (
      <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
        <AV />
        <div style={{ flex: 1 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 18px 15px", boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: C.t1, lineHeight: 1.22, marginBottom: 6 }}>{ui.headline || "Share your brand assets"}</div>
            <div style={{ fontSize: 12, color: C.t3, marginBottom: 16, lineHeight: 1.5 }}>{ui.sub || "Upload files or paste links to your website, socials, or brand materials"}</div>
            
            {/* Upload zone (placeholder — shows intent) */}
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: "20px 16px", textAlign: "center", cursor: "pointer", marginBottom: 12, background: C.hover }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>📁</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Drop files or click to upload</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>Logos, brand guides, screenshots — any format</div>
            </div>

            {/* Link input */}
            <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>Or paste links</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input value={descText} onChange={e => setDescText(e.target.value)} placeholder="https://yourbrand.com or social link..." onKeyDown={e => { if (e.key === "Enter") addLink(); }} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.hover, color: C.t1, fontSize: 12, outline: "none", fontFamily: "'Inter',sans-serif" }} />
              <button onClick={addLink} disabled={!descText.trim()} style={{ padding: "10px 14px", borderRadius: 8, background: descText.trim() ? C.adim : C.hover, border: "none", color: descText.trim() ? C.accent : C.t3, fontSize: 12, fontWeight: 600, cursor: descText.trim() ? "pointer" : "not-allowed" }}>+ Add</button>
            </div>

            {/* Added links */}
            {links.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                {links.map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: C.hover, fontSize: 11, color: C.accent }}>
                    🔗 {l.length > 45 ? l.slice(0, 45) + "..." : l}
                    <span onClick={() => removeLink(i)} style={{ cursor: "pointer", marginLeft: "auto", opacity: .6, color: C.t3 }}>×</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick platform buttons */}
            <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
              {["Website", "Instagram", "LinkedIn", "Dribbble", "Behance"].map(p => (
                <button key={p} onClick={() => setDescText(p === "Website" ? "https://" : `https://${p.toLowerCase()}.com/`)} style={{ padding: "4px 9px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, fontSize: 10, cursor: "pointer" }}>{p}</button>
              ))}
            </div>

            {/* Submit */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={submitAssets} style={{ flex: 1, padding: 11, borderRadius: 10, background: C.grad, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                {links.length > 0 ? `Continue with ${links.length} link${links.length > 1 ? "s" : ""} →` : "Continue →"}
              </button>
              <button onClick={() => onRespond("Skip — I'll describe the brand instead")} style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.t3, fontSize: 12, cursor: "pointer" }}>Skip</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tagline text input — user already has a tagline, just let them type it
  if (ui.type === "tagline_input") {
    return (
      <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
        <AV />
        <div style={{ flex: 1 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 18px 15px", boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: C.t1, lineHeight: 1.22, marginBottom: 12 }}>{ui.headline || "What's the tagline?"}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={descText}
                onChange={e => setDescText(e.target.value)}
                placeholder={ui.placeholder || "Type your tagline here..."}
                onKeyDown={e => { if (e.key === "Enter" && descText.trim()) { onRespond(`My tagline: ${descText.trim()}`); setDescText(""); } }}
                style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.hover, color: C.t1, fontSize: 14, fontWeight: 500, outline: "none", fontFamily: "'Inter',sans-serif" }}
              />
              <button
                onClick={() => { if (descText.trim()) { onRespond(`My tagline: ${descText.trim()}`); setDescText(""); } }}
                disabled={!descText.trim()}
                style={{ padding: "12px 18px", borderRadius: 10, background: descText.trim() ? C.grad : C.hover, border: "none", color: descText.trim() ? "#fff" : C.t3, fontSize: 13, fontWeight: 600, cursor: descText.trim() ? "pointer" : "not-allowed", fontFamily: "'Inter',sans-serif" }}
              >Confirm</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard question (single or multi select)
  if (ui.type === "question") {
    const isMulti = ui.select === "multi";
    const MAX_MULTI = ui.max || 3; // Claude can set per-question max
    const handleClick = (opt) => {
      if (isMulti) {
        setSelected(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          if (arr.includes(opt)) return arr.filter(v => v !== opt);
          if (arr.length >= MAX_MULTI) return arr;
          return [...arr, opt];
        });
      } else {
        setSelected(opt);
        setTimeout(() => onRespond(opt), 300);
      }
    };
    const selArr = Array.isArray(selected) ? selected : [];
    const atMax = isMulti && selArr.length >= MAX_MULTI;

    return (
      <div style={{ display: "flex", gap: 11, padding: "8px 0" }}>
        <AV />
        <div style={{ flex: 1 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 18px 15px", boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
            {ui.counter && <div style={{ fontSize: 11, color: C.accent, marginBottom: 10, fontWeight: 600, letterSpacing: .8, textTransform: "uppercase", opacity: .7 }}>{ui.counter}</div>}
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: C.t1, lineHeight: 1.22, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: (ui.headline || "").replace(brand, `<span style="color:${C.accent}">${brand}</span>`) }} />
            {ui.why && <div style={{ fontSize: 12, color: C.t3, fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>{ui.why}</div>}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {(ui.options || []).map((opt, i) => {
                const isSel = isMulti ? selArr.includes(opt) : selected === opt;
                const isDisabled = isMulti && atMax && !isSel;
                return (
                  <div key={opt} onClick={() => !isDisabled && handleClick(opt)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", cursor: isDisabled ? "not-allowed" : "pointer", borderBottom: i < ui.options.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 13, color: isDisabled ? C.t3 : isSel ? C.accent : C.t2, background: isSel ? "rgba(123,97,255,.1)" : "transparent", transition: "background .12s", opacity: isDisabled ? .4 : 1 }}>
                    <div style={{ width: 22, height: 22, borderRadius: isMulti ? 6 : "50%", background: isSel ? C.accent : C.adim, color: isSel ? "#fff" : C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, boxShadow: isSel ? "0 0 0 2px rgba(123,97,255,.25)" : "none" }}>{isSel ? "✓" : i + 1}</div>
                    {opt}
                  </div>
                );
              })}
            </div>
            {isMulti && selArr.length > 0 && (
              <button onClick={() => onRespond(selArr.join(", "))} style={{ marginTop: 10, width: "100%", padding: 11, borderRadius: 10, background: C.grad, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Confirm {selArr.length} selected →</button>
            )}
            <div style={{ fontSize: 10, color: C.t3, marginTop: 10, textAlign: "right", letterSpacing: .3 }}>{isMulti ? `Pick up to ${MAX_MULTI} — ${selArr.length}/${MAX_MULTI} selected` : "Tap to select"}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
