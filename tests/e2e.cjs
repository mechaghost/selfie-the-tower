#!/usr/bin/env node
/**
 * Self-contained end-to-end game test. No MCP, no external tooling —
 * plain Playwright driving the real Zustand store through a headless
 * Chromium, with the dev servers booted automatically if needed.
 *
 * Usage:
 *   node tests/e2e.cjs [mechanics|victory|defeat|all]   (default: all)
 *
 * Modes:
 *   mechanics — deterministic combat-engine checks (statuses, rewards,
 *               loot tiers, run completion, corpse guard)
 *   victory   — full run: selfie → generation → 9 floors → beat the boss
 *   defeat    — full run that stops blocking from floor 5 and dies
 *   all       — mechanics + victory + defeat
 *
 * Environment:
 *   PW_CHROMIUM  — path to a Chromium/Chrome binary (auto-detected otherwise)
 *   E2E_BASE     — app URL if servers are already running (default http://localhost:5173)
 *
 * Screenshots and server logs land in tests/.e2e-out/.
 */
const { chromium } = require('playwright-core');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(__dirname, '.e2e-out');
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const API_HEALTH = 'http://localhost:3001/health';
const FIXTURE = path.join(__dirname, 'fixtures', 'bob_ross.jpg');

const mode = (process.argv[2] || 'all').toLowerCase();
if (!['mechanics', 'victory', 'defeat', 'all'].includes(mode)) {
    console.error(`Unknown mode "${mode}". Use: mechanics | victory | defeat | all`);
    process.exit(2);
}

let failures = 0;
function check(name, cond, detail = '') {
    const mark = cond ? 'PASS' : 'FAIL';
    if (!cond) failures++;
    console.log(`[${mark}] ${name}${detail ? ' — ' + detail : ''}`);
}

// ── Chromium resolution ─────────────────────────────────────────────
function findChromium() {
    if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
    try {
        // A playwright-managed browser, if the matching version is installed.
        // executablePath() returns a path without checking it exists.
        const p = chromium.executablePath();
        if (p && fs.existsSync(p)) return p;
    } catch { /* fall through to system lookups */ }
    const candidates = [];
    const pwRoot = process.env.PLAYWRIGHT_BROWSERS_PATH;
    if (pwRoot && fs.existsSync(pwRoot)) {
        for (const entry of fs.readdirSync(pwRoot)) {
            if (!entry.startsWith('chromium')) continue;
            const full = path.join(pwRoot, entry);
            candidates.push(
                full, // some environments link the binary directly
                path.join(full, 'chrome-linux', 'chrome'),
                path.join(full, 'chrome-linux64', 'chrome'),
                path.join(full, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
            );
        }
    }
    candidates.push(
        '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium', '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    );
    for (const c of candidates) {
        try {
            if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
        } catch { /* unreadable candidate */ }
    }
    try {
        return execSync('which google-chrome chromium chromium-browser 2>/dev/null | head -1', { encoding: 'utf8' }).trim() || null;
    } catch { return null; }
}

// ── Dev server management ───────────────────────────────────────────
const spawned = [];
async function up(url) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        return res.ok;
    } catch { return false; }
}

async function waitFor(url, label, timeoutMs = 45000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (await up(url)) return true;
        await new Promise(r => setTimeout(r, 700));
    }
    throw new Error(`${label} did not come up at ${url} within ${timeoutMs / 1000}s`);
}

function launch(cmd, args, cwd, logName) {
    const log = fs.openSync(path.join(OUT_DIR, logName), 'w');
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', log, log], detached: true });
    spawned.push(child);
    return child;
}

function killSpawned() {
    for (const child of spawned) {
        try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already gone */ }
    }
}
process.on('exit', killSpawned);
process.on('SIGINT', () => { killSpawned(); process.exit(130); });
process.on('SIGTERM', () => { killSpawned(); process.exit(143); });

async function ensureServers() {
    if (await up(BASE)) {
        console.log(`  vite already running at ${BASE}`);
    } else {
        console.log('  starting vite dev server...');
        launch('npx', ['vite', '--port', '5173'], ROOT, 'vite.log');
        await waitFor(BASE, 'vite');
    }
    if (await up(API_HEALTH)) {
        console.log('  API server already running on :3001');
    } else {
        console.log('  starting API server...');
        launch('npm', ['run', 'dev'], path.join(ROOT, 'server'), 'server.log');
        await waitFor(API_HEALTH, 'API server');
    }
}

// ── Shared page helpers ─────────────────────────────────────────────
async function waitIdleTurn(page, timeout = 30000) {
    await page.waitForFunction(() => {
        const s = window.__gameStore.getState();
        return s.isPlayerTurn && !s.isResolving && s.actionQueue.length === 0;
    }, null, { timeout });
}

async function freshStore(page) {
    await page.evaluate(async () => {
        const store = window.__gameStore;
        localStorage.removeItem('stt_run');
        store.getState().abandonRun();
        window.__enemies = await import('/src/data/enemies.ts');
        window.__cards = await import('/src/data/cards.ts');
        window.__mapgen = await import('/src/core/mapGenerator.ts');
    });
}

async function newPage(browser, consoleErrors, failedRequests) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));
    page.on('requestfailed', req => failedRequests.push(req.url()));
    await page.goto(BASE);
    await page.waitForFunction(() => !!window.__gameStore, null, { timeout: 20000 });
    await freshStore(page);
    return page;
}

// ── Mechanics suite ─────────────────────────────────────────────────
async function runMechanics(page) {
    console.log('— mechanics —');
    await page.evaluate(() => window.__gameStore.getState().initializeRun('e2e_mech'));

    // Tanky rat for exact-value math
    await page.evaluate(() => {
        const store = window.__gameStore;
        const rat = window.__enemies.createEnemyInstance('alley_rat', 'e1', null);
        rat.hp = 200; rat.maxHp = 200;
        store.getState().startCombat([rat]);
    });
    await waitIdleTurn(page);

    const turn1Intent = await page.evaluate(() => window.__gameStore.getState().enemies[0].intent?.type ?? null);
    check('Enemy telegraphs an intent on turn 1', turn1Intent !== null, `intent=${turn1Intent}`);

    await page.evaluate(() => {
        const store = window.__gameStore;
        const mk = id => window.__cards.createCardInstance(id);
        store.setState({ hand: [mk('torch_it'), mk('spiked_jacket'), mk('second_wind')] });
        const p = store.getState().player;
        store.setState({ player: { ...p, energy: 3 } });
    });

    for (const id of ['torch_it', 'spiked_jacket', 'second_wind']) {
        await page.evaluate((cardId) => {
            const s = window.__gameStore.getState();
            const c = s.hand.find(c => c.id === cardId);
            s.playCard(c.instanceId, c.target === 'Enemy' ? 'e1' : undefined);
        }, id);
        await waitIdleTurn(page);
    }
    let st = await page.evaluate(() => {
        const s = window.__gameStore.getState();
        return {
            ratHp: s.enemies[0].hp,
            ratBurn: s.enemies[0].statuses.find(x => x.id === 'burn')?.amount,
            block: s.player.block,
            thorns: s.player.statuses.find(x => x.id === 'thorns')?.amount,
            regen: s.player.statuses.find(x => x.id === 'regen')?.amount,
        };
    });
    check('Torch It deals 4 + applies 3 Burn', st.ratHp === 196 && st.ratBurn === 3, `hp=${st.ratHp} burn=${st.ratBurn}`);
    check('Spiked Jacket: 4 Block + 2 Spikes', st.block === 4 && st.thorns === 2, `block=${st.block} thorns=${st.thorns}`);
    check('Second Wind: 4 Regen', st.regen === 4, `regen=${st.regen}`);

    // End turn with the rat's declared intent known → exact expectations
    const pre = await page.evaluate(() => {
        const s = window.__gameStore.getState();
        const rat = s.enemies[0];
        const dmgEffects = (rat.intent?.effects || []).filter(e => e.type === 'Damage');
        return {
            ratHp: rat.hp,
            burn: rat.statuses.find(x => x.id === 'burn')?.amount || 0,
            intentType: rat.intent?.type,
            hits: dmgEffects.length,
            dmgs: dmgEffects.map(e => e.amount),
            playerHp: s.player.hp,
            playerMaxHp: s.player.maxHp,
            playerBlock: s.player.block,
            thorns: s.player.statuses.find(x => x.id === 'thorns')?.amount || 0,
            regen: s.player.statuses.find(x => x.id === 'regen')?.amount || 0,
        };
    });
    await page.evaluate(() => window.__gameStore.getState().endTurn());
    await waitIdleTurn(page);
    await page.waitForTimeout(700); // let the player STATUS_TICK settle

    const post = await page.evaluate(() => {
        const s = window.__gameStore.getState();
        const rat = s.enemies[0];
        return {
            ratHp: rat.hp,
            burn: rat.statuses.find(x => x.id === 'burn')?.amount || 0,
            playerHp: s.player.hp,
            regen: s.player.statuses.find(x => x.id === 'regen')?.amount || 0,
        };
    });
    const isAttack = (pre.intentType || '').includes('Attack');
    const thornsDmg = isAttack ? pre.hits * pre.thorns : 0;
    const expRatHp = pre.ratHp - pre.burn - thornsDmg;
    let blk = pre.playerBlock, hpLoss = 0;
    for (const d of pre.dmgs) {
        let nb = blk - d;
        if (nb < 0) { hpLoss += -nb; nb = 0; }
        blk = nb;
    }
    const hpAfterAttack = pre.playerHp - hpLoss;
    const expPlayerHp = Math.min(pre.playerMaxHp, hpAfterAttack + Math.min(pre.regen, pre.playerMaxHp - hpAfterAttack));
    check('Burn tick + Spikes retaliation exact', post.ratHp === expRatHp,
        `rat ${pre.ratHp}→${post.ratHp}, expected ${expRatHp} (burn ${pre.burn}, thorns ${thornsDmg}, intent ${pre.intentType})`);
    check('Burn and Regen decrement', post.burn === pre.burn - 1 && post.regen === pre.regen - 1,
        `burn ${pre.burn}→${post.burn}, regen ${pre.regen}→${post.regen}`);
    check('Player HP after attack + regen exact', post.playerHp === expPlayerHp,
        `hp ${pre.playerHp}→${post.playerHp}, expected ${expPlayerHp}`);

    // Victory → 3 rewards → claim
    await page.evaluate(() => {
        const store = window.__gameStore;
        const s = store.getState();
        store.setState({
            enemies: s.enemies.map(e => ({ ...e, hp: 3 })),
            hand: [window.__cards.createCardInstance('torch_it')],
            player: { ...s.player, energy: 3 },
        });
        const s2 = store.getState();
        s2.playCard(s2.hand[0].instanceId, 'e1');
    });
    await page.waitForFunction(() => window.__gameStore.getState().combatResult === 'victory', null, { timeout: 15000 });
    const claim = await page.evaluate(() => {
        const store = window.__gameStore;
        const s = store.getState();
        const rewards = s.cardRewards.length;
        const gold = s.goldReward;
        const preDeck = s.masterDeck.length;
        const preGold = s.player.gold;
        s.claimCardReward(s.cardRewards[0].instanceId);
        const after = store.getState();
        return {
            rewards, gold,
            deckGrew: after.masterDeck.length === preDeck + 1,
            goldAdded: after.player.gold === preGold + gold,
            combatEnded: !after.inCombat && after.combatResult === null,
        };
    });
    check('Victory offers 3 rewards + rolls gold', claim.rewards === 3 && claim.gold > 0, `gold=${claim.gold}`);
    check('Claiming adds card, banks gold, exits combat', claim.deckGrew && claim.goldAdded && claim.combatEnded);

    // Elite loot tier
    await page.evaluate(() => {
        const store = window.__gameStore;
        const elite = window.__enemies.createEnemyInstance('neon_yakuza', 'el1', null);
        elite.hp = 2;
        store.getState().startCombat([elite]);
    });
    await waitIdleTurn(page);
    await page.evaluate(() => {
        const store = window.__gameStore;
        const s0 = store.getState();
        store.setState({ hand: [window.__cards.createCardInstance('neon_jab')], player: { ...s0.player, energy: 3 } });
        const s = store.getState();
        s.playCard(s.hand[0].instanceId, 'el1');
    });
    await page.waitForFunction(() => window.__gameStore.getState().combatResult === 'victory', null, { timeout: 15000 });
    const eliteLoot = await page.evaluate(() => {
        const s = window.__gameStore.getState();
        const out = { gold: s.goldReward, allUpgraded: s.cardRewards.length === 3 && s.cardRewards.every(c => c.upgraded) };
        s.continueCombatResult();
        return out;
    });
    check('Elite loot pre-upgraded, gold 50-80', eliteLoot.allUpgraded && eliteLoot.gold >= 50 && eliteLoot.gold <= 80, `gold=${eliteLoot.gold}`);

    // Boss loot tier + run completion
    await page.evaluate(() => {
        const store = window.__gameStore;
        store.setState({ isBossFloor: true, floor: 9 });
        const boss = window.__enemies.createEnemyInstance('the_billboard', 'boss1', null);
        boss.hp = 2;
        store.getState().startCombat([boss]);
    });
    await waitIdleTurn(page);
    await page.evaluate(() => {
        const store = window.__gameStore;
        const s0 = store.getState();
        store.setState({ hand: [window.__cards.createCardInstance('neon_jab')], player: { ...s0.player, energy: 3 } });
        const s = store.getState();
        s.playCard(s.hand[0].instanceId, 'boss1');
    });
    await page.waitForFunction(() => window.__gameStore.getState().combatResult === 'victory', null, { timeout: 15000 });
    const bossOut = await page.evaluate(() => {
        const s = window.__gameStore.getState();
        const out = { gold: s.goldReward, allUpgraded: s.cardRewards.length === 3 && s.cardRewards.every(c => c.upgraded) };
        s.claimCardReward(s.cardRewards[0].instanceId);
        return { ...out, runComplete: window.__gameStore.getState().isRunComplete };
    });
    check('Boss loot pre-upgraded, gold 90-130', bossOut.allUpgraded && bossOut.gold >= 90 && bossOut.gold <= 130, `gold=${bossOut.gold}`);
    // The SPIRE CLEARED screen renders on the next React commit — wait for it
    const screenShown = await page.waitForFunction(
        () => !!document.querySelector('.run-victory-title'), null, { timeout: 5000 }
    ).then(() => true).catch(() => false);
    check('Boss-floor victory → SPIRE CLEARED', bossOut.runComplete && screenShown);
    await page.evaluate(() => window.__gameStore.setState({ isRunComplete: false, isBossFloor: false }));

    // Corpse-targeting guard
    await page.evaluate(() => {
        const store = window.__gameStore;
        const a = window.__enemies.createEnemyInstance('alley_rat', 'eA', null);
        const b = window.__enemies.createEnemyInstance('alley_rat', 'eB', null);
        a.hp = 100; a.maxHp = 100;
        store.getState().startCombat([a, b]);
    });
    await waitIdleTurn(page);
    const corpse = await page.evaluate(() => {
        const store = window.__gameStore;
        const s0 = store.getState();
        store.setState({
            enemies: s0.enemies.map(e => e.id === 'eB' ? { ...e, hp: 0 } : e),
            hand: [window.__cards.createCardInstance('torch_it')],
            player: { ...s0.player, energy: 3 },
        });
        const s = store.getState();
        s.playCard(s.hand[0].instanceId, 'eB');
        const after = store.getState();
        return { energy: after.player.energy, handSize: after.hand.length };
    });
    check('Playing a card on a corpse is refused', corpse.energy === 3 && corpse.handSize === 1);
    await page.evaluate(() => window.__gameStore.getState().abandonRun());
}

// ── Full-run suite (victory / defeat) ───────────────────────────────
async function runFullRun(page, runMode) {
    console.log(`— full run: ${runMode} —`);

    // Selfie from the fixture (read in Node, no public/ copy needed)
    let dataUrl;
    if (fs.existsSync(FIXTURE)) {
        dataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(FIXTURE).toString('base64');
    } else {
        console.log('  (fixture missing — using generated placeholder image)');
        dataUrl = await page.evaluate(() => {
            const c = document.createElement('canvas');
            c.width = 64; c.height = 64;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#8899aa'; ctx.fillRect(0, 0, 64, 64);
            return c.toDataURL('image/jpeg');
        });
    }

    const gen = await page.evaluate(async (img) => {
        const store = window.__gameStore;
        await store.getState().submitSelfie(img);
        const s = store.getState();
        return { phase: s.ugcPhase, name: s.generatedCharacter?.name, archetype: s.generatedCharacter?.archetype, cards: s.generatedCards?.length, err: s.ugcError };
    }, dataUrl);
    check(`[${runMode}] character generated`, gen.phase === 'reveal', JSON.stringify(gen));
    if (gen.phase !== 'reveal') return;
    console.log(`  Character: ${gen.name} (${gen.archetype}), ${gen.cards} cards`);

    await page.evaluate(() => window.__gameStore.getState().startGeneratedRun());

    let bossBeaten = false;
    let died = false;
    for (let floor = 1; floor <= 9; floor++) {
        const nav = await page.evaluate(async () => {
            const store = window.__gameStore;
            const s = store.getState();
            const mapData = window.__mapgen.generateMap(s.seed);
            let available;
            if (s.currentNodeId === null) {
                available = mapData.nodes.filter(n => n.y === 1);
            } else {
                const current = mapData.nodes.find(n => n.id === s.currentNodeId);
                available = mapData.nodes.filter(n => current.connections.includes(n.id));
            }
            if (!available || available.length === 0) return { done: true };
            const hpPct = s.player.hp / s.player.maxHp;
            const priority = hpPct < 0.5
                ? ['Rest', 'Combat', 'Shop', 'Unknown', 'Elite', 'Boss']
                : ['Combat', 'Shop', 'Unknown', 'Rest', 'Elite', 'Boss'];
            let chosen = null;
            for (const t of priority) { chosen = available.find(n => n.type === t); if (chosen) break; }
            if (!chosen) chosen = available[0];
            store.getState().advanceFloor(chosen);
            const a = store.getState();
            return { floor: a.floor, type: chosen.type, inCombat: a.inCombat, nodeEvent: a.nodeEvent, hp: `${a.player.hp}/${a.player.maxHp}` };
        });
        if (nav.done) break;
        console.log(`  Floor ${nav.floor}: ${nav.type} — HP ${nav.hp}`);

        if (nav.inCombat) {
            const throwFight = runMode === 'defeat' && floor >= 5;
            await page.evaluate((giveUp) => {
                if (window.__combatAI) clearInterval(window.__combatAI);
                function cardScore(card, player) {
                    let score = 0;
                    const hpPct = player.hp / player.maxHp;
                    for (const e of card.effects) {
                        if (e.type === 'Damage') score += (e.amount || 0) * 2;
                        if (e.type === 'Block') score += (e.amount || 0) * (hpPct < 0.4 ? 3 : 1);
                        if (e.type === 'ApplyStatus' && e.statusId === 'vulnerable') score += 8;
                        if (e.type === 'ApplyStatus' && e.statusId === 'weak') score += 6;
                        if (e.type === 'ApplyStatus' && (e.statusId === 'strength' || e.statusId === 'dexterity')) score += 10;
                        if (e.type === 'ApplyStatus' && e.statusId === 'burn') score += (e.amount || 0) * 2;
                        if (e.type === 'ApplyStatus' && e.statusId === 'thorns') score += 6;
                        if (e.type === 'ApplyStatus' && e.statusId === 'regen') score += (e.amount || 0) * (hpPct < 0.5 ? 4 : 1);
                        if (e.type === 'Draw') score += (e.amount || 0) * 3;
                        if (e.type === 'Heal') score += (e.amount || 0) * (hpPct < 0.5 ? 4 : 1);
                    }
                    if (card.cost === 0) score += 5;
                    if (card.isHeroCard) score += 15;
                    return score;
                }
                window.__combatAI = setInterval(() => {
                    const store = window.__gameStore;
                    const s = store.getState();
                    if (!s.inCombat || s.combatResult) { clearInterval(window.__combatAI); window.__combatAI = null; return; }
                    if (!s.isPlayerTurn || s.isResolving || s.actionQueue.length > 0) return;
                    if (giveUp) { store.getState().endTurn(); return; }
                    const enemies = s.enemies.filter(e => e.hp > 0);
                    if (enemies.length === 0) return;
                    const playable = s.hand.filter(c => c.cost <= s.player.energy)
                        .sort((a, b) => cardScore(b, s.player) - cardScore(a, s.player));
                    if (playable.length === 0) { store.getState().endTurn(); return; }
                    const card = playable[0];
                    let targetId = undefined;
                    if (card.target === 'Enemy') targetId = enemies.sort((a, b) => a.hp - b.hp)[0].id;
                    store.getState().playCard(card.instanceId, targetId);
                }, 200);
            }, throwFight);

            await page.waitForFunction(() => {
                const s = window.__gameStore.getState();
                return s.combatResult !== null || s.isGameOver;
            }, null, { timeout: 120000 });

            const res = await page.evaluate(() => {
                const store = window.__gameStore;
                const s = store.getState();
                const out = { result: s.combatResult, hp: `${s.player.hp}/${s.player.maxHp}`, rewards: s.cardRewards.length, loot: null };
                if (s.combatResult === 'victory' && s.cardRewards.length > 0) {
                    out.loot = s.cardRewards[0].name;
                    s.claimCardReward(s.cardRewards[0].instanceId);
                } else if (s.combatResult) {
                    s.continueCombatResult();
                }
                return out;
            });
            console.log(`    Combat ${res.result} — HP ${res.hp}, loot: ${res.loot ?? 'skipped'}`);
            if (res.result === 'defeat') { died = true; break; }
            if (res.result === 'victory') {
                check(`[${runMode}] floor ${nav.floor} offered 3 rewards`, res.rewards === 3);
                if (nav.type === 'Boss') bossBeaten = true;
            }
        } else if (nav.nodeEvent === 'rest') {
            await page.evaluate(() => window.__gameStore.getState().restHeal());
        } else if (nav.nodeEvent === 'shop') {
            await page.evaluate(() => window.__gameStore.getState().dismissNodeEvent());
        } else if (nav.nodeEvent === 'mystery') {
            await page.evaluate(() => {
                const store = window.__gameStore;
                const s = store.getState();
                const ev = s.currentEvent;
                if (ev) {
                    const choice = ev.choices.find(c => !c.condition) || ev.choices[0];
                    store.getState().chooseEventOption(choice.id);
                    store.getState().dismissNodeEvent();
                }
            });
        }
        await page.waitForTimeout(250);
    }

    const final = await page.evaluate(() => {
        const s = window.__gameStore.getState();
        return { floor: s.floor, hp: `${s.player.hp}/${s.player.maxHp}`, gold: s.player.gold, deck: s.masterDeck.length, gameOver: s.isGameOver, runComplete: s.isRunComplete };
    });
    console.log(`  Final: floor ${final.floor}, HP ${final.hp}, gold ${final.gold}, deck ${final.deck}`);

    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, `final_${runMode}.png`) });

    if (runMode === 'victory') {
        check('[victory] boss beaten', bossBeaten);
        check('[victory] run ends on SPIRE CLEARED', final.runComplete === true);
    } else {
        check('[defeat] run ended in death from floor >= 5', died && final.gameOver && final.floor >= 5, `floor=${final.floor}`);
    }
    await page.evaluate(() => window.__gameStore.getState().abandonRun());
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const executablePath = findChromium();
    if (!executablePath) {
        console.error('No Chromium found. Set PW_CHROMIUM=/path/to/chrome, or install one (e.g. `npx playwright install chromium`).');
        process.exit(2);
    }
    console.log(`chromium: ${executablePath}`);

    await ensureServers();

    const browser = await chromium.launch({ executablePath, headless: true });
    const consoleErrors = [];
    const failedRequests = [];

    try {
        const page = await newPage(browser, consoleErrors, failedRequests);

        if (mode === 'mechanics' || mode === 'all') await runMechanics(page);
        if (mode === 'victory' || mode === 'all') await runFullRun(page, 'victory');
        if (mode === 'defeat' || mode === 'all') await runFullRun(page, 'defeat');

        // External font hosts may be blocked in sandboxes — not a product failure
        const externalHosts = ['fonts.googleapis.com', 'fonts.gstatic.com'];
        const realFailed = failedRequests.filter(u => !externalHosts.some(h => u.includes(h)));
        const errs = consoleErrors.filter(e => !e.includes('favicon')
            && !(e.includes('ERR_CONNECTION_RESET') && realFailed.length === 0)
            && !(e.includes('Failed to load resource') && realFailed.length === 0));
        check('No unexpected failed requests', realFailed.length === 0, realFailed.slice(0, 5).join(' | '));
        check('No console errors', errs.length === 0, errs.slice(0, 5).join(' | '));
    } finally {
        await browser.close();
    }

    console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
    process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); killSpawned(); process.exit(1); });
