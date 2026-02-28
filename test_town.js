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

    // Move player to Tucson center programmatically
    await page.evaluate(() => {
        const tucson = LOCATIONS.find(l => l.name === 'Tucson');
        window.game.player.x = tucson.x;
        window.game.player.y = tucson.y;
        window.game.render();
    });
    await delay(300);

    // Walk into town (should trigger town screen)
    await page.keyboard.press('ArrowRight');
    await delay(500);
    let state = await page.evaluate(() => window.game.state);
    // Player might already be in town from the move
    if (state !== 'town') {
        // Walk around to trigger town entry
        for (const dir of ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp']) {
            await page.keyboard.press(dir);
            await delay(200);
            state = await page.evaluate(() => window.game.state);
            if (state === 'town') break;
        }
    }

    check('Town screen opens', state === 'town');

    // Check town screen has all options
    let townOptions = await page.evaluate(() => document.getElementById('town-options').innerHTML);
    check('Town has Contract option', townOptions.includes('[C]'));
    check('Town has Rest option', townOptions.includes('[R]'));
    check('Town has Water option', townOptions.includes('[W]'));
    check('Town has Buy mule option', townOptions.includes('[B]'));
    check('Town has Shop option', townOptions.includes('[S]'));
    check('Town has Inventory option', townOptions.includes('[I]'));

    if (state === 'town') {
        // Test Rest action with inline feedback
        let goldBefore = await page.evaluate(() => window.game.player.gold);
        await page.keyboard.press('r');
        await delay(300);
        let feedback = await page.evaluate(() => document.getElementById('town-feedback').textContent);
        let goldAfter = await page.evaluate(() => window.game.player.gold);
        check('Rest gives feedback', feedback.length > 0);
        check('Rest costs gold', goldAfter < goldBefore);

        // Test Water mules
        goldBefore = goldAfter;
        await page.keyboard.press('w');
        await delay(300);
        feedback = await page.evaluate(() => document.getElementById('town-feedback').textContent);
        goldAfter = await page.evaluate(() => window.game.player.gold);
        check('Water gives feedback', feedback.length > 0);

        // Test Shop
        await page.keyboard.press('s');
        await delay(300);
        state = await page.evaluate(() => window.game.state);
        check('Shop screen opens', state === 'shop');

        if (state === 'shop') {
            let shopContent = await page.evaluate(() => document.getElementById('shop-list').innerHTML);
            check('Shop shows items', shopContent.length > 50);
            check('Shop has weapons', shopContent.includes('Colt') || shopContent.includes('Hawken') || shopContent.includes('Machete'));
            check('Shop has clothing', shopContent.includes('hat') || shopContent.includes('vest') || shopContent.includes('Serape'));
            check('Shop has supplies', shopContent.includes('Jerky') || shopContent.includes('Bandage'));

            // Buy an item
            await page.keyboard.press('1');
            await delay(300);
            let shopFeedback = await page.evaluate(() => document.getElementById('shop-feedback').textContent);
            check('Shop purchase gives feedback', shopFeedback.length > 0);

            await page.keyboard.press('Escape');
            await delay(300);
        }

        // Test Contract screen
        state = await page.evaluate(() => window.game.state);
        if (state === 'town') {
            await page.keyboard.press('c');
            await delay(300);
            state = await page.evaluate(() => window.game.state);
            check('Contract screen opens from town', state === 'contracts');

            if (state === 'contracts') {
                let contractContent = await page.evaluate(() => document.getElementById('contract-list').innerHTML);
                check('Contracts listed', contractContent.length > 50);
                await page.keyboard.press('Escape');
                await delay(300);
            }
        }
    }

    // Check for errors
    check('No JS errors', errors.length === 0);
    errors.forEach(e => console.log(`  ERROR: ${e}`));

    console.log(`\n=== ${pass} passed, ${fail} failed ===`);
    await browser.close();
    process.exit(fail > 0 ? 1 : 0);
})();
