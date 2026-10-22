# NOTE — 온갖 [DRAFT] (AI startup, Korean, desktop only)

This run: step 2 only (storyboard). Build sections (direction choice recap, self-gate, 17 rows, measurements, gaps, self-disclosure) come in the later build run.

## Settings applied (DIALS-1)

DIALS-1 has **no `customer` value and no customer words** (`mood.words_customer` absent). Every axis and dial still has its `ai` value, so no value had to be set by me; the settings are the step-1 values, and the expression written for direction A in DIRECTIONS.md is what those values give. It is therefore kept where it matches, and refined only where a setting reads further than the mock went.

| Setting | Value | Where it lands / where it pulls against the direction |
|---|---|---|
| brightness | +2 bright | warm paper ground #F1ECE2 kept; no dark scene anywhere (even the "program" scene stays on paper). |
| warmth | +1 warm | paper + ink #14110D; raking light warm-white. |
| colour_strength | -1 restrained | one signal orange #FF4A1C only; it marks the visitor's own letters, never decoration. |
| energy | +1 dynamic | letters travel on arcs every scene; holds stay short. |
| ornament | -1 minimal | no icons, no illustrations; only glyphs, rules, tiles. |
| roughness | 0 | paper grain present but tiles are clean-edged. |
| sharpness | +1 angles | square tiles and cells, no rounded cards (pulls against the mock's pill CTA: CTA becomes a square-cornered ink block). |
| futurism | -1 classic | serif display Noto Serif KR 900, no neon/glow — breaks trade habit T2. |
| formality | 0 | plain polite Korean (해요체/합니다 mixed per scene). |
| metaphor | +1 | "letters are the material" stays the one metaphor; no second metaphor. |
| novelty | +2 experimental | protagonist is a sentence, not a product UI. |
| playfulness | +1 | the caret becomes the game character; deleted words fly off. |
| motion_amount 70 | | something moves in every scene; letters never sit still for a whole screen. |
| tempo 45 | | medium-slow; each reflow is scrubbed over ~1.2 screens of scroll. |
| motion_character glide | | eased arcs, no springs or snaps (the game character's jump also glides). |
| scroll_staging 80 (core) | | every scene is a pinned stage scrubbed by scroll; only the last is a plain stop. |
| alive_at_rest on | | caret blink, slow raking light, grain drift; game character idles. |
| intro short | | ~1.2 s: the sample line types itself on the input rule. |
| hand "a few places" | | three places: hero line editable, program-cell hover, final send. Pulls against nothing in A. |
| cursor own | | cursor is a small ink caret bar; turns orange over editable line. |
| ui_material default | | no glass. |
| density 30 | | one statement per scene; generous paper. |
| grid_freedom 55 | | 12-col kept, but the made thing breaks out of its 5 cols in S2 and S4. |
| type_contrast 90 (core) | | 900-weight serif display vs Plex Mono 400 labels; huge vs tiny. |
| accent_strength 60 | | orange glyph(s) carry the eye across scenes. |
| photo_grade 0 | | no photos (image route: none, kept from PLAN). |
| grain 35 | | visible paper grain, WebGL multiply. |
| convention_break 75 (core) | | no screenshots, no logo wall, no dark glow; prompt-box habit (T1) kept but turned into the protagonist. |
| signature_strength 85 (core) | | the reflow (thing → letters → next thing over the fixed input rule) happens 3 times, each in a different way. |
| trust_upfront 20 | | no proof up front (and none exists in INTAKE). |
| effects_weight 45 | | WebGL limited to paper light, grain and tile shadows; letters are DOM/canvas glyphs. |
| mood words | inky, lucid, inventive, warm paper, quietly playful | step-1 words stand (no customer words). |

Kept unchanged from PLAN.md: main idea, shared facts, image route (none — type, drawing and motion in code).

## §0 Storyboard

Main idea: **one line of words is all it takes** — the visitor's kind of sentence comes apart, its letters become the material of whatever gets made, and at the end the line is handed back for the visitor to write.

Constant hinge: the 2 px ink **input rule** (horizon) runs through every scene; the thing being made always stands on it.

Per #57: the picture layer must read with all text hidden. Here the "picture" is the shapes the letters make (tile stack, window grid, bars, path). With glyph faces blanked, S2 still reads as a platform level, S3 as a window with cells, S4 as three different tools, S5 as a route — a change of thing each scene, not a re-angle.

Section boards looked at: OVERVIEW-1, OVERVIEW-2, OVERVIEW-3, BOARD-03-1 (pinned statement, words swap/mark in place), BOARD-09-1 (horizontal track inside vertical scroll), BOARD-11-1 (frame that grows to full / shrinks to a window), BOARD-17-1 (a drawn line/path that carries the reader between stops). Forms taken as forms only; no composition copied.

### S1 — Hero: 한 줄 (the line)
- **picture says:** a sentence typed on the input rule (sample: 「비 오는 날 우산 챙기는 고양이 게임 만들어 줘」); huge 900 serif headline above it. The line is the only object; light rakes slowly across the paper.
- **text says:** 「한 줄이면, 무엇이든.」 + sub 「프로그램 · 게임 · 도구, 분야를 가리지 않습니다」 + first-screen ask button 「아이디어 한 줄 보내기」 (jumps to S6).
- **hand says:** the line is editable — click it and type your own; every later scene uses the letters you typed (falls back to the sample). Why: the main idea is *the visitor's* sentence; this is the one place the hand makes it theirs. Pointer elsewhere: nothing.
- **section form:** pinned statement (form 03, BOARD-03): the stage holds while scroll strikes words out of the sentence one by one (the filler words 「비 오는 날」「챙기는」「만들어 줘」 turn orange-underlined, then lift). Why: the visitor must watch *their* line come apart in place before anything new appears; a moving section would hide the act.
- **hand-over:** the struck words don't vanish — they fly on arcs to the right 5 cols and land as square tiles on the input rule. The headline lifts out of frame; the tiles are already the floor of S2.

### S2 — 게임이 됩니다 (it becomes a game)
- **picture says:** the landed letters stack into a one-screen platform level (ground, steps, a gap); the caret detaches from the line and becomes the character, gliding across the tiles; one orange tile 「고」(고양이) is the goal. Change of thing: a sentence → a playable-looking level.
- **text says:** label 「OUTPUT 01 — 게임」; one line 「문장 속 낱말이 발판이 되고, 커서가 주인공이 됩니다.」
- **hand says:** nothing. Why: the scroll is already driving the character; a second control would compete, and "a few places" is spent on S1/S3/S6.
- **section form:** frame grows (form 11, BOARD-11): the level starts inside the right 5 cols and widens with scroll until it fills the stage edge to edge, the input rule stretching with it. Why: "my line became a whole world" must feel like the thing outgrowing its box.
- **hand-over (signature reflow #1 — collapse):** when the character reaches the goal tile, every tile tips over and falls back into a row of letters on the rule; the row then re-flows upward into rows and columns — S3's grid grows out of the same glyphs.

### S3 — 프로그램이 됩니다 (it becomes a program)
- **picture says:** the same letters set into a program window: title bar, a sidebar column, a grid of cells (a calendar/booking-type layout) where each cell holds one source glyph; cast shadows under the window from the raking light. Change of thing: level → software window.
- **text says:** label 「OUTPUT 02 — 프로그램」; 「같은 글자로, 이번엔 화면과 버튼을.」
- **hand says:** hover a cell → it lifts and the source word in the hero line (kept small at the top of the rule) lights orange. Why: shows the trace "this part came from that word of my line" — the main idea checked by hand.
- **section form:** the inverse of S2's form 11 — the full stage shrinks into a framed window sitting on the rule, pinned while cells fill in by scroll (form 11 reversed, BOARD-11). Why: a program is a contained thing; contraction after S2's expansion gives the page a breath and changes the motion from outward to inward.
- **hand-over (signature reflow #2 — unzip):** the window's columns slide apart sideways like a drawer; each column becomes a separate small strip that moves into a horizontal track — S4 begins as these strips.

### S4 — 도구가 됩니다 (it becomes a tool — any field)
- **picture says:** a horizontal track of three tools made from the same glyph tiles: a bar chart (가계부 tool), a dial/timer (운동 기록), a map-like grid of routes (배달 동선). Each tool is a different shape, proving "no fixed field". Change of thing: one window → many small tools.
- **text says:** label 「OUTPUT 03 — 도구」; 「분야는 정하지 않았습니다. 한 줄이 정합니다.」; tool names under each (examples, [DRAFT] — samples only, not past clients).
- **hand says:** nothing (scroll moves the track). Why: dragging a track is a common template device; scroll keeps one gesture for the whole page.
- **section form:** horizontal track inside vertical scroll (form 09, BOARD-09): the stage pins and the strips slide right-to-left along the input rule. Why: range is a sideways idea — "and this, and this" — and it varies the staging after two in-place scenes.
- **hand-over (reflow #3 — unroll):** the last tool's tiles drop back onto the rule and the rule itself bends: it rises off the horizontal into a drawn path — S5 is this path.

### S5 — 이렇게 만듭니다 (how it gets made) [DRAFT steps]
- **picture says:** the input rule as a route with four stops; at each stop the glyph tiles show one state: loose letters (한 줄) → letters in a speech-mark pair (대화) → half-built tiles in outline (시안) → solid finished tiles (완성). Change of state along the path.
- **text says:** 「한 줄 → 대화로 다듬기 → 시안 → 완성」 with one sentence each. [DRAFT — process not in INTAKE; confirm with customer.] No times or prices.
- **hand says:** nothing. Why: reading scene; the eye should follow the line, not the hand.
- **section form:** drawn line carrying the reader between stops (form 17, BOARD-17): the path draws itself with scroll; the page scrolls normally past it (not pinned). Why: the visitor needs a sequence they can read at their own pace; a path is literally the input rule travelling — it grows out of what's on screen. The only unpinned scene before the end, so the tempo loosens before the ask.
- **hand-over:** the path's end flattens back to horizontal at the bottom of the screen and becomes the empty input rule of S6; all tiles from the stops slide along it and settle as letters back on the line.

### S6 — 이제 당신의 한 줄 (now your line)
- **picture says:** the letters gathered from every scene compress back into a single line on the rule, then fade to leave an empty rule with a blinking orange caret — the line given back. Change of state: full → empty, waiting.
- **text says:** 「이제 당신의 한 줄.」; input placeholder 「만들고 싶은 것을 한 줄로 적어 주세요」; send button 「보내기」; under it 「프로그램 · 게임 · 도구, 무엇이든」. Where it is delivered [DRAFT — no contact in INTAKE]. Small footer: wordmark 온갖 [DRAFT].
- **hand says:** type and send — the page's one real ask. On send the letters slide off right along the rule (the line leaves). Why: the whole page has been showing what a line becomes; this is where the visitor gives one.
- **section form:** plainly stacked end (no pin). Why: an ask must hold still and be easy to reach; nothing should move away from the field. The motion is only the letters settling in.
- **hand-over:** none (last scene).

### What the main idea can still do across the page (to build)
1. The visitor's own typed letters (S1) are reused in every later scene — not only the sample.
2. Deleted words fly off as physical pieces and become tiles (S1→S2).
3. The caret becomes the character (S2) and returns as the caret of the final field (S6).
4. Same glyphs, three different made things (level / window / tools) — each reflow different: collapse (S2→S3), unzip (S3→S4), unroll the rule into a path (S4→S5), compress (S5→S6).
5. The input rule as horizon → stretched floor → window base → track rail → path → empty field.
6. Light: a raking warm light with cast shadows under landed tiles; it lowers through the page (morning → late afternoon) so the end feels like a quiet desk.
7. Orange marks only what came from the visitor's own words — a trace through all scenes.
8. Hover trace back to source words (S3).
9. Grain/paper under WebGL; tiles cast real-feeling shadows when they land.

## Image route
None (kept from PLAN.md). REPLACE.md in build will list no stand-in photos; it will list the [DRAFT] name, sample sentence and example tools.

## [DRAFT] list (to confirm with the customer)
- Name 온갖; who comes; the single ask (send one line); where the line is delivered; process steps S5; example sentence and example tools S4.
