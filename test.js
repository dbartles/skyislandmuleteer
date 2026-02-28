const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    const filePath = 'file://' + path.resolve('index.html');
    await page.goto(filePath, { waitUntil: 'load', timeout: 30000 });
    await delay(2000);

    // Test 1: Title screen
    const titleVisible = await page.evaluate(() => {
        const el = document.getElementById('title-screen');
        return el && !el.classList.contains('hidden');
    });
    console.log(`[${titleVisible ? 'PASS' : 'FAIL'}] Title screen visible`);

    // Test 2: Start game
    await page.keyboard.press('Enter');
    await delay(3000);
    const gameStarted = await page.evaluate(() => window.game && window.game.state === 'explore');
    console.log(`[${gameStarted ? 'PASS' : 'FAIL'}] Game started`);

    // Test 3: Player alive
    const playerAlive = await page.evaluate(() => window.game.player && window.game.player.alive);
    console.log(`[${playerAlive ? 'PASS' : 'FAIL'}] Player alive`);

    // Test 4: Mules
    const muleCount = await page.evaluate(() => window.game.player.mules.length);
    console.log(`[${muleCount === 2 ? 'PASS' : 'FAIL'}] 2 starting mules (got ${muleCount})`);

    // Test 5: Inventory
    const invCount = await page.evaluate(() => window.game.player.inventory.length);
    console.log(`[${invCount > 0 ? 'PASS' : 'FAIL'}] Has inventory (${invCount} items)`);

    // Test 6: Weapon equipped
    const hasWeapon = await page.evaluate(() => window.game.player.equipment.weapon !== null);
    console.log(`[${hasWeapon ? 'PASS' : 'FAIL'}] Weapon equipped`);

    // Test 7: Movement
    const pos1 = await page.evaluate(() => ({ x: window.game.player.x, y: window.game.player.y }));
    await page.keyboard.press('ArrowRight');
    await delay(300);
    const pos2 = await page.evaluate(() => ({ x: window.game.player.x, y: window.game.player.y }));
    const moved = pos2.x !== pos1.x || pos2.y !== pos1.y;
    console.log(`[${moved ? 'PASS' : 'FAIL'}] Movement works (${pos1.x},${pos1.y})->(${pos2.x},${pos2.y})`);

    // Test 8: Turn counter
    const turn = await page.evaluate(() => window.game.turn);
    console.log(`[${turn > 0 ? 'PASS' : 'FAIL'}] Turn counter (${turn})`);

    // Test 9: Open inventory
    await page.keyboard.press('i');
    await delay(300);
    const invOpen = await page.evaluate(() => window.game.state === 'inventory');
    console.log(`[${invOpen ? 'PASS' : 'FAIL'}] Inventory opens`);

    // Test 10: Close inventory
    await page.keyboard.press('Escape');
    await delay(300);
    const invClosed = await page.evaluate(() => window.game.state === 'explore');
    console.log(`[${invClosed ? 'PASS' : 'FAIL'}] Inventory closes`);

    // Test 11: C key away from town
    for (let i = 0; i < 15; i++) {
        await page.keyboard.press('ArrowRight');
        await delay(50);
    }
    await page.keyboard.press('c');
    await delay(300);
    const cState = await page.evaluate(() => window.game.state);
    console.log(`[${cState === 'explore' ? 'PASS' : 'FAIL'}] C key away from town (state: ${cState})`);

    // Test 12: Look mode
    await page.keyboard.press('l');
    await delay(200);
    const lookState = await page.evaluate(() => window.game.state);
    console.log(`[${lookState === 'look' ? 'PASS' : 'FAIL'}] Look mode (state: ${lookState})`);
    await page.keyboard.press('ArrowRight');
    await delay(200);
    const afterLook = await page.evaluate(() => window.game.state);
    console.log(`[${afterLook === 'explore' ? 'PASS' : 'FAIL'}] Look mode returns to explore`);

    // Test 13: Map size
    const mapSize = await page.evaluate(() => ({ w: window.game.map.width, h: window.game.map.height }));
    console.log(`[${mapSize.w === 280 && mapSize.h === 140 ? 'PASS' : 'FAIL'}] Map size (${mapSize.w}x${mapSize.h})`);

    // Test 14: Entity count
    const entCount = await page.evaluate(() => window.game.entities.length);
    console.log(`[${entCount > 50 ? 'PASS' : 'FAIL'}] Entities spawned (${entCount})`);

    // Test 15: Help screen
    await page.keyboard.press('?');
    await delay(200);
    const helpState = await page.evaluate(() => window.game.state);
    console.log(`[${helpState === 'help' ? 'PASS' : 'FAIL'}] Help screen`);
    await page.keyboard.press('Escape');
    await delay(200);

    // Test 16: UI rendered
    const uiOk = await page.evaluate(() => {
        return document.getElementById('hp-bar').innerHTML.length > 0 &&
               document.getElementById('stats-detail').innerHTML.length > 0;
    });
    console.log(`[${uiOk ? 'PASS' : 'FAIL'}] UI rendered`);

    // Test 17: Messages
    const msgCount = await page.evaluate(() => document.getElementById('messages').children.length);
    console.log(`[${msgCount > 0 ? 'PASS' : 'FAIL'}] Messages (${msgCount})`);

    // Test 18: JS errors
    console.log(`[${errors.length === 0 ? 'PASS' : 'FAIL'}] No JS errors (${errors.length})`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));

    console.log('\n--- Tests Complete ---');
    await browser.close();
})();
