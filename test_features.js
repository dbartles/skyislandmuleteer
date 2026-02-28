const puppeteer = require('puppeteer');
const path = require('path');
const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('file://' + path.resolve('index.html'), { waitUntil: 'load' });
    await delay(2000);
    await page.keyboard.press('Enter');
    await delay(3000);

    let pass = 0, fail = 0;
    function check(name, ok) {
        console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}`);
        if (ok) pass++; else fail++;
    }

    // === Feature: Inventory (I key) ===
    await page.keyboard.press('i');
    await delay(300);
    let state = await page.evaluate(() => window.game.state);
    check('I key opens inventory', state === 'inventory');

    let invVisible = await page.evaluate(() => !document.getElementById('inventory-screen').classList.contains('hidden'));
    check('Inventory screen visible', invVisible);

    let invContent = await page.evaluate(() => document.getElementById('inventory-list').innerHTML);
    check('Inventory shows items', invContent.includes('Bowie knife') || invContent.includes('Cotton shirt'));

    await page.keyboard.press('Escape');
    await delay(300);

    // === Feature: C key error when not in town ===
    // Move well away from town
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowDown');
        await delay(50);
    }
    await page.keyboard.press('c');
    await delay(300);
    state = await page.evaluate(() => window.game.state);
    check('C key stays in explore when not in town', state === 'explore');

    let msgs = await page.evaluate(() => document.getElementById('messages').innerHTML);
    check('C key shows error message', msgs.includes('town') || msgs.includes('contract'));

    // === Feature: Look mode (L key) ===
    await page.keyboard.press('l');
    await delay(200);
    state = await page.evaluate(() => window.game.state);
    check('L key enters look mode', state === 'look');

    await page.keyboard.press('ArrowDown');
    await delay(200);
    state = await page.evaluate(() => window.game.state);
    check('Look mode returns to explore', state === 'explore');

    msgs = await page.evaluate(() => document.getElementById('messages').innerHTML);
    check('Look provides description', msgs.includes('You see'));

    // === Feature: Equipment system ===
    let defense = await page.evaluate(() => window.game.player.getDefense());
    check('getDefense works', defense >= 0);

    let attack = await page.evaluate(() => window.game.player.getAttack());
    check('getAttack works', attack > 0);

    // === Feature: Throw mode ===
    let hasThrowable = await page.evaluate(() => window.game.player.inventory.some(i => i.type === 'throwable'));
    if (hasThrowable) {
        await page.keyboard.press('t');
        await delay(200);
        state = await page.evaluate(() => window.game.state);
        check('T key enters throw mode', state === 'throw');
        await page.keyboard.press('ArrowDown');
        await delay(300);
        state = await page.evaluate(() => window.game.state);
        check('Throw completes', state === 'explore');
    } else {
        // No throwable - t should show message
        await page.keyboard.press('t');
        await delay(200);
        state = await page.evaluate(() => window.game.state);
        check('T key with no throwables stays in explore', state === 'explore');
    }

    // === Feature: Map expanded ===
    let mapInfo = await page.evaluate(() => ({
        w: window.game.map.width,
        h: window.game.map.height,
        entities: window.game.entities.length
    }));
    check('Map is 280x140', mapInfo.w === 280 && mapInfo.h === 140);
    check('100+ entities spawned', mapInfo.entities > 100);

    // === Feature: Entity colors (bright red/yellow) ===
    let hasHostileColors = await page.evaluate(() => {
        const types = Object.values(ENTITY_TYPES);
        const hostile = types.filter(t => t.hostile);
        return hostile.every(t => {
            const fg = t.fg.toUpperCase();
            return fg.includes('FF') || fg.includes('DD') || fg.includes('EE') || fg.includes('CC');
        });
    });
    check('Hostile entities have bright colors', hasHostileColors);

    // === Feature: Help screen updated ===
    await page.keyboard.press('?');
    await delay(200);
    let helpContent = await page.evaluate(() => document.getElementById('help-screen').innerHTML);
    check('Help shows Look command', helpContent.includes('Look'));
    check('Help shows Throw command', helpContent.includes('Throw'));
    check('Help shows Mine command', helpContent.includes('Mine'));
    await page.keyboard.press('Escape');
    await delay(200);

    // === Feature: Player starts with correct items ===
    let startItems = await page.evaluate(() => {
        const p = window.game.player;
        return {
            weapon: p.equipment.weapon ? p.equipment.weapon.name : null,
            invNames: p.inventory.map(i => i.name),
            gold: p.gold
        };
    });
    check('Starts with knife equipped', startItems.weapon === 'Bowie knife');
    check('Starts with gold', startItems.gold >= 15);

    // === Feature: No JS errors ===
    check('No JS errors', errors.length === 0);
    errors.forEach(e => console.log(`  ERROR: ${e}`));

    console.log(`\n=== ${pass} passed, ${fail} failed ===`);
    await browser.close();
    process.exit(fail > 0 ? 1 : 0);
})();
