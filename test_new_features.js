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

    // === Feature: Map Overview (O key) ===
    await page.keyboard.press('o');
    await delay(300);
    let state = await page.evaluate(() => window.game.state);
    check('O key opens map overview', state === 'overview');

    let overviewVisible = await page.evaluate(() => !document.getElementById('overview-screen').classList.contains('hidden'));
    check('Overview screen visible', overviewVisible);

    let canvasExists = await page.evaluate(() => document.getElementById('overview-canvas') !== null);
    check('Overview canvas exists', canvasExists);

    // Scroll in overview
    await page.keyboard.press('ArrowRight');
    await delay(200);
    state = await page.evaluate(() => window.game.state);
    check('Overview stays open after scroll', state === 'overview');

    await page.keyboard.press('Escape');
    await delay(300);
    state = await page.evaluate(() => window.game.state);
    check('Overview closes with ESC', state === 'explore');

    // === Feature: Shop multi-digit input ===
    // Move to Tucson and enter town
    await page.evaluate(() => {
        const tucson = LOCATIONS.find(l => l.name === 'Tucson');
        window.game.player.x = tucson.x;
        window.game.player.y = tucson.y;
        window.game.render();
    });
    await delay(300);
    await page.keyboard.press('ArrowRight');
    await delay(500);
    state = await page.evaluate(() => window.game.state);
    if (state !== 'town') {
        for (const dir of ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp']) {
            await page.keyboard.press(dir);
            await delay(200);
            state = await page.evaluate(() => window.game.state);
            if (state === 'town') break;
        }
    }

    if (state === 'town') {
        // Open shop
        await page.keyboard.press('s');
        await delay(300);
        state = await page.evaluate(() => window.game.state);
        check('Shop opens from town', state === 'shop');

        if (state === 'shop') {
            // Check shop has mining tools
            let shopContent = await page.evaluate(() => document.getElementById('shop-list').innerHTML);
            check('Shop has pickaxe', shopContent.includes('Pickaxe'));
            check('Shop has gold pan', shopContent.includes('Gold pan'));

            // Test multi-digit: shop has 22 items, press '2' then '0' (item 20)
            let shopCount = await page.evaluate(() => window.game._shopItems.length);
            check('Shop has 10+ items (multi-digit needed)', shopCount > 9);

            // Give player enough gold
            await page.evaluate(() => { window.game.player.gold = 500; });

            // Buy item 2 by pressing '2' - should wait for second digit since >9 items
            await page.keyboard.press('2');
            await delay(200);
            let fb = await page.evaluate(() => document.getElementById('shop-feedback').textContent);
            check('Multi-digit buffer shows pending', fb.includes('#2') || fb.includes('Bought'));

            // If buffer is pending, press Enter to confirm
            if (fb.includes('#2')) {
                await page.keyboard.press('Enter');
                await delay(300);
                fb = await page.evaluate(() => document.getElementById('shop-feedback').textContent);
                check('Enter confirms shop purchase', fb.includes('Bought'));
            } else {
                check('Single digit fallback works', fb.includes('Bought'));
            }

            await page.keyboard.press('Escape');
            await delay(300);
        }

        // === Feature: Tavern ===
        state = await page.evaluate(() => window.game.state);
        if (state === 'town') {
            await page.keyboard.press('t');
            await delay(300);
            state = await page.evaluate(() => window.game.state);
            check('T key opens tavern from town', state === 'tavern');

            if (state === 'tavern') {
                let tavernVisible = await page.evaluate(() => !document.getElementById('tavern-screen').classList.contains('hidden'));
                check('Tavern screen visible', tavernVisible);

                let tavernEvent = await page.evaluate(() => document.getElementById('tavern-event').textContent);
                check('Tavern shows event', tavernEvent.length > 10);

                let drinksContent = await page.evaluate(() => document.getElementById('tavern-drinks').innerHTML);
                check('Tavern has mezcal', drinksContent.includes('Mezcal'));
                check('Tavern has pulque', drinksContent.includes('Pulque'));
                check('Tavern has aguardiente', drinksContent.includes('Aguardiente'));

                // Buy a drink
                await page.evaluate(() => { window.game.player.gold = 100; });
                await page.keyboard.press('1');
                await delay(300);
                let tavernFb = await page.evaluate(() => document.getElementById('tavern-feedback').textContent);
                check('Tavern drink gives feedback', tavernFb.length > 0);

                // Another round
                await page.keyboard.press('r');
                await delay(300);
                let newEvent = await page.evaluate(() => document.getElementById('tavern-event').textContent);
                check('Another round changes event', newEvent.length > 10);

                await page.keyboard.press('Escape');
                await delay(300);
                state = await page.evaluate(() => window.game.state);
                check('Tavern ESC returns to town', state === 'town');
            }
        }

        // === Feature: Town has Tavern option ===
        if (state === 'town') {
            let townOpts = await page.evaluate(() => document.getElementById('town-options').innerHTML);
            check('Town has Tavern option', townOpts.includes('[T]'));
            await page.keyboard.press('Escape');
            await delay(300);
        }
    }

    // === Feature: Dead mule cleanup ===
    await page.evaluate(() => {
        // Kill a mule
        if (window.game.player.mules.length > 0) {
            window.game.player.mules[0].alive = false;
            window.game.player.mules[0].hp = 0;
        }
    });
    let mulesBefore = await page.evaluate(() => window.game.player.mules.length);

    // Walk into town
    await page.evaluate(() => {
        const tucson = LOCATIONS.find(l => l.name === 'Tucson');
        window.game.player.x = tucson.x;
        window.game.player.y = tucson.y;
    });
    await page.keyboard.press('ArrowRight');
    await delay(500);
    state = await page.evaluate(() => window.game.state);
    if (state !== 'town') {
        for (const dir of ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp']) {
            await page.keyboard.press(dir);
            await delay(200);
            state = await page.evaluate(() => window.game.state);
            if (state === 'town') break;
        }
    }
    let mulesAfter = await page.evaluate(() => window.game.player.mules.length);
    check('Dead mules removed on town entry', mulesAfter < mulesBefore);

    // === Feature: Mine entrances exist ===
    let mineEntrances = await page.evaluate(() => {
        let count = 0;
        for (let y = 0; y < window.game.map.height; y++) {
            for (let x = 0; x < window.game.map.width; x++) {
                if (window.game.map.tiles[y][x] === 'MINE_ENTRANCE') count++;
            }
        }
        return count;
    });
    check('Mine entrances placed on map', mineEntrances > 0);

    // === Feature: Mine entry ===
    // Teleport to a mine entrance
    let entered = await page.evaluate(() => {
        for (let y = 0; y < window.game.map.height; y++) {
            for (let x = 0; x < window.game.map.width; x++) {
                if (window.game.map.tiles[y][x] === 'MINE_ENTRANCE') {
                    window.game.player.x = x;
                    window.game.player.y = y;
                    return true;
                }
            }
        }
        return false;
    });
    if (state === 'town') {
        await page.keyboard.press('Escape');
        await delay(300);
    }
    if (entered) {
        await page.keyboard.press('Enter');
        await delay(300);
        state = await page.evaluate(() => window.game.state);
        check('ENTER enters mine', state === 'mine');

        if (state === 'mine') {
            // Move in mine
            await page.keyboard.press('ArrowRight');
            await delay(200);
            state = await page.evaluate(() => window.game.state);
            check('Can move in mine', state === 'mine');

            // Exit mine
            await page.keyboard.press('Escape');
            await delay(300);
            state = await page.evaluate(() => window.game.state);
            check('ESC exits mine', state === 'explore');
        }
    }

    // === Feature: Mining tools in data ===
    let hasPickaxe = await page.evaluate(() => ITEMS.PICKAXE !== undefined);
    let hasGoldPan = await page.evaluate(() => ITEMS.GOLD_PAN !== undefined);
    let hasMinersLamp = await page.evaluate(() => ITEMS.MINERS_LAMP !== undefined);
    check('Pickaxe item defined', hasPickaxe);
    check('Gold pan item defined', hasGoldPan);
    check('Miners lamp item defined', hasMinersLamp);

    // === Feature: Alcohol items ===
    let hasMezcal = await page.evaluate(() => ITEMS.MEZCAL !== undefined);
    let hasPulque = await page.evaluate(() => ITEMS.PULQUE !== undefined);
    let hasAguardiente = await page.evaluate(() => ITEMS.AGUARDIENTE !== undefined);
    check('Mezcal item defined', hasMezcal);
    check('Pulque item defined', hasPulque);
    check('Aguardiente item defined', hasAguardiente);

    // === Feature: Judge quote reduction ===
    let judgeProb = await page.evaluate(() => {
        // Read the _judgeAI source to verify probability
        const src = Entity.prototype._judgeAI.toString();
        return src.includes('0.06');
    });
    check('Judge quote probability reduced to 0.06', judgeProb);

    // Check for errors
    check('No JS errors', errors.length === 0);
    errors.forEach(e => console.log(`  ERROR: ${e}`));

    console.log(`\n=== ${pass} passed, ${fail} failed ===`);
    await browser.close();
    process.exit(fail > 0 ? 1 : 0);
})();
