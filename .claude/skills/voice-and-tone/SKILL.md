# Voice & Tone — Selfie the Spire

## The Vibe
This game lives in the neon-soaked intersection of **1980s nostalgia**, **LA street culture**, and **Tokyo nightlife**. The tone is **punk**, **sassy**, and dripping with rebellious energy. Think synthwave arcades, boombox battles, leather jackets, and VHS static.

## Hard Rules

1. **NEVER use the word "AI"** — not in user-facing copy, not in UI text, not in flavor descriptions. The magic behind character generation is **"80's Magic"** — mysterious, analog, rad. Alternatives: "80's Magic", "the magic", "street sorcery", "neon alchemy", "arcade wizardry".

2. **No corporate/tech language** — avoid words like: algorithm, machine learning, neural, model, generate, process, compute, data, optimize. This is a world of magic and mayhem, not Silicon Valley.

3. **80s nostalgia vocabulary** — lean into: radical, gnarly, tubular, wicked, fresh, dope, sick, bodacious, righteous, primo, ace, stellar, mega, ultra, turbo, hyper, neon, chrome, synth, arcade, cassette, VHS, boombox.

4. **LA/Tokyo fusion** — the setting blends sun-bleached LA grit with rain-slicked Tokyo neon. References can pull from: back alleys, rooftops, subway tunnels, ramen shops, arcade dens, skate parks, graffiti walls, night markets, neon signs, fire escapes.

5. **Punk & rebellion** — the tone should feel like spray-painting a middle finger on a corporate billboard. Short, punchy sentences. Attitude over explanation. The player is an outsider, a street legend, not a customer.

6. **Sassy, not cringe** — be clever, not try-hard. One-liners over paragraphs. Confidence over enthusiasm. The game winks at you, it doesn't beg for attention.

## Tone Examples

### Good
- "80's Magic turns your face into a street legend."
- "Your mug. Your deck. No take-backs."
- "The neon reads your soul and spits out a warrior."
- "Snap a selfie. The arcade does the rest."

### Bad
- "Our AI generates a unique character based on your photo." (tech speak, mentions AI)
- "Click here to begin your amazing adventure!" (generic, corporate)
- "Welcome to Selfie the Spire! We're so excited you're here!" (cringe, eager)

## Screen-Specific Voice

### Rest Site (campfire)
Warm, brief respite from the grind. The player earned this breather.
- Heal option: "Crash for a bit. Patch up the damage."
- Upgrade option: "Sharpen your edge. Make a card hit harder."
- Keep it cozy but brief — the tower doesn't wait.

### Shop (neon bazaar)
A shady merchant in a neon alley. Think back-alley deals, not retail.
- Buying cards: "Fresh merch. Choose wisely — the neon doesn't do refunds."
- Card removal: "Thinning the deck. Cut the dead weight."
- Not enough gold: "Come back when you've got the cash, runner."
- Prices should feel like street deals, not receipts.

### Mystery Events
The weirdest, most atmospheric moments. Dripping with noir and neon mystique.
- Descriptive text should paint a scene in 2-3 sentences max.
- Choices should feel like a gamble — risk vs. reward, not right vs. wrong.
- Outcomes are blunt: "Took 8 damage." / "Gained 30 gold." / "You move on."
- Reference: see `src/data/events.ts` for 5 existing events (Boombox Oracle, Neon Graffiti, Arcade Machine, Back-Alley Ramen, Vinyl Dealer)

**Example event voice** (from Boombox Oracle):
> "A figure hunches over a golden boombox in a doorway, bass rattling the fire escapes. They look up with chrome-ringed eyes. 'The frequencies know your name, runner. Let me read the static for you.'"

### Combat
Terse, action-focused. No flowery prose mid-fight.
- Enemy intents: "Attacks!" / "Defends!" / "Buffs!"
- Damage: just the number, no commentary.
- Victory: "Enemies defeated. Loot the remains."
- Defeat: "Flatlined. The neon goes dark."

### Map Navigation
Minimal — let the map speak for itself.
- "Pick your path up the spire."
- Node type labels: FIGHT, ELITE, REST, SHOP, MYSTERY (short, uppercase)

### Error & Empty States
Even errors should have attitude.
- "Something broke. The static ate it." (generic error)
- "No cards to remove. Your deck's already lean." (empty state)
- "Not enough gold for that, runner." (insufficient funds)
- "Daily limit hit. Come back tomorrow." (rate limit)

### Loading & Status Messages
Rotating flavor text during generation:
- "The neon is reading your face..."
- "Mixing the paint..."
- "Tuning the frequencies..."
- "Channeling 80's Magic..."
- "The arcade hums with power..."

## Where This Applies
- All user-facing UI text (buttons, headings, descriptions)
- Landing page copy
- Loading/status messages
- Card flavor text and descriptions
- Error messages and notifications
- Mystery event narratives and choice text
- Rest site and shop UI copy
- Any new copy written for the game
- Commit messages and PR descriptions do NOT need this voice (those are for developers)
