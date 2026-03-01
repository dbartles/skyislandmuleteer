// ============================================================
// SKY ISLAND MULETEER - Main Game
// ============================================================

class Combat {
    constructor(game) {
        this.game = game;
    }

    playerAttacks(entity) {
        const atk = this.game.player.getAttack();
        const roll = Math.floor(ROT.RNG.getUniform() * 4) + 1;
        const damage = Math.max(1, atk + roll - entity.def);
        entity.takeDamage(damage);

        if (entity.alive) {
            this.game.ui.addMessage(`You strike the ${entity.name} for ${damage} damage.`, 'combat');
        } else {
            this.game.ui.addMessage(`You kill the ${entity.name}!`, 'combat');
            this.game.player.kills++;
            this.game.player.xp += entity.xp;
            this.game.player.checkLevelUp(this.game);
            this._dropLoot(entity);
            this.game.map.removeEntity(entity);
            this.game.entities = this.game.entities.filter(e => e !== entity);

            if (ROT.RNG.getUniform() < 0.15) {
                const q = QUOTES.combat[Math.floor(ROT.RNG.getUniform() * QUOTES.combat.length)];
                this.game.ui.addMessage(`"${q.text}" - ${q.attr}`, 'quote');
            }
        }
    }

    entityAttacksPlayer(entity) {
        const roll = Math.floor(ROT.RNG.getUniform() * 3) + 1;
        const damage = entity.atk + roll;
        const actual = this.game.player.takeDamage(damage);
        this.game.ui.addMessage(`The ${entity.name} hits you for ${actual} damage!`, 'danger');

        if (!this.game.player.alive) {
            this.game.gameOver();
        }

        this._checkMuleSpook(entity);
    }

    entityAttacksMule(entity, mule) {
        const roll = Math.floor(ROT.RNG.getUniform() * 3) + 1;
        const damage = Math.max(1, entity.atk + roll - 1);
        mule.takeDamage(damage);
        this.game.ui.addMessage(`The ${entity.name} attacks ${mule.name} for ${damage} damage!`, 'danger');

        if (!mule.alive) {
            this.game.ui.addMessage(`${mule.name} is killed! The cargo is lost to the dust.`, 'danger');
        } else {
            mule.spook(this.game);
        }
    }

    _checkMuleSpook(entity) {
        for (const mule of this.game.player.mules) {
            if (!mule.alive) continue;
            const dist = Math.abs(mule.x - entity.x) + Math.abs(mule.y - entity.y);
            if (dist <= 2 && ROT.RNG.getUniform() < 0.25) {
                mule.spook(this.game);
            }
        }
    }

    _dropLoot(entity) {
        const rng = ROT.RNG;
        // Gold drops
        if (rng.getUniform() < 0.4) {
            const gold = Math.floor(rng.getUniform() * 8) + 1;
            this.game.player.gold += gold;
            this.game.ui.addMessage(`Found ${gold} gold on the body.`, 'gold');
        }
        // Valuable drops from humans
        if (entity.type !== 'RATTLESNAKE' && entity.type !== 'SCORPION' && entity.type !== 'COYOTE' && rng.getUniform() < 0.2) {
            const valuables = ['GOLD_DUST', 'SILVER_NUGGET', 'TURQUOISE'];
            const key = valuables[Math.floor(rng.getUniform() * valuables.length)];
            const item = { ...ITEMS[key] };
            this.game.player.inventory.push(item);
            this.game.ui.addMessage(`Found: ${item.name}`, 'gold');
        }
        // Item drops
        if (rng.getUniform() < 0.15) {
            const item = this._randomItem(entity);
            if (item) {
                this.game.player.inventory.push(item);
                this.game.ui.addMessage(`Found: ${item.name}`, 'gold');
            }
        }
    }

    _randomItem(entity) {
        const rng = ROT.RNG;
        // Human enemies can drop weapons
        if (entity.hostile && rng.getUniform() < 0.3) {
            const weapons = ['KNIFE', 'LANCE', 'CLUB', 'MACHETE'];
            if (rng.getUniform() < 0.1) weapons.push('REVOLVER');
            const key = weapons[Math.floor(rng.getUniform() * weapons.length)];
            return { ...ITEMS[key] };
        }
        const items = [ITEMS.JERKY, ITEMS.HARDTACK, ITEMS.BANDAGE, ITEMS.WATER_SKIN, ITEMS.TOBACCO, ITEMS.WHISKEY];
        return { ...items[Math.floor(rng.getUniform() * items.length)] };
    }

    throwAtEntity(entity, item) {
        const atk = item.atk || 2;
        const roll = Math.floor(ROT.RNG.getUniform() * 3) + 1;
        const damage = Math.max(1, atk + roll - entity.def);
        entity.takeDamage(damage);
        this.game.ui.addMessage(`You hurl the ${item.name} at the ${entity.name} for ${damage} damage!`, 'combat');
        if (!entity.alive) {
            this.game.ui.addMessage(`You kill the ${entity.name}!`, 'combat');
            this.game.player.kills++;
            this.game.player.xp += entity.xp;
            this.game.player.checkLevelUp(this.game);
            this._dropLoot(entity);
            this.game.map.removeEntity(entity);
            this.game.entities = this.game.entities.filter(e => e !== entity);
        }
    }
}

// ============================================================
// MAIN GAME CLASS
// ============================================================

class Game {
    constructor() {
        this.display = null;
        this.map = null;
        this.player = null;
        this.entities = [];
        this.combat = null;
        this.ui = null;
        this.turn = 0;
        this.state = 'title'; // title, explore, town, contracts, inventory, shop, look, throw, help, dead, overview, tavern, mine
        this._contractOptions = [];
        this._shopItems = [];
        this._inputLocked = false;
        this._lookDir = null;
        this._throwItem = null;
        // Input buffers for multi-digit numbers
        this._shopInputBuffer = '';
        this._shopInputTimer = null;
        this._invInputBuffer = '';
        this._invInputTimer = null;
        this._inventoryEquipPending = false;
        this._inventoryUsePending = false;
        // Map overview state
        this._overviewX = 0;
        this._overviewY = 0;
        this._overviewDisplay = null;
        // Mine state
        this._inMine = false;
        this._mineMap = null;
        this._mineW = 40;
        this._mineH = 20;
        this._minePlayerX = 0;
        this._minePlayerY = 0;
        this._mineEntrance = null; // {x, y} on the overworld
    }

    init() {
        this.ui = new UI();
        this.combat = new Combat(this);

        this.display = new ROT.Display({
            width: VIEWPORT_W,
            height: VIEWPORT_H,
            fontSize: 16,
            fontFamily: '"Courier New", "Lucida Console", monospace',
            bg: '#0d0a04',
            spacing: 1.0,
        });

        const canvas = this.display.getContainer();
        document.getElementById('map-container').appendChild(canvas);

        document.addEventListener('keydown', (e) => this.handleInput(e));

        this.state = 'title';
    }

    newGame() {
        this.map = new GameMap(MAP_WIDTH, MAP_HEIGHT);

        // Check localStorage for a saved default map
        const loaded = this._tryLoadSavedMap();
        if (!loaded) {
            this.map.init();
        }

        // Place player near Tucson - outside the town walls
        const tucson = LOCATIONS.find(l => l.name === 'Tucson');
        const startX = tucson.x + 14;
        const startY = tucson.y;
        let px = startX, py = startY;
        for (let r = 0; r < 15; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (this.map.isWalkable(startX + dx, startY + dy)) {
                        px = startX + dx;
                        py = startY + dy;
                        r = 15; dx = r + 1; dy = r + 1;
                    }
                }
            }
        }
        this.player = new Player(px, py);

        // Starting mules
        this.player.addMule();
        this.player.addMule();

        let mx = px - 1, my = py;
        if (!this.map.isWalkable(mx, my)) { mx = px; my = py - 1; }
        this.player.mules[0].x = mx;
        this.player.mules[0].y = my;
        let mx2 = mx - 1, my2 = my;
        if (!this.map.isWalkable(mx2, my2)) { mx2 = mx; my2 = my - 1; }
        this.player.mules[1].x = mx2;
        this.player.mules[1].y = my2;

        // Spawn entities (keep any loaded from saved map)
        if (!this.entities || this.entities.length === 0) {
            this.entities = [];
        }
        this._spawnEntities();
        this._spawnSpecialCharacters();

        this.turn = 0;
        this.state = 'explore';

        this.ui.addMessage('You stand at the edge of Tucson, two mules in tow.', 'info');
        this.ui.addMessage('The desert stretches endless in every direction.', 'info');
        this.ui.addMessage('Visit a town to find contracts. Survive.', 'system');

        const q = QUOTES.travel[Math.floor(ROT.RNG.getUniform() * QUOTES.travel.length)];
        this.ui.addMessage(`"${q.text}" - ${q.attr}`, 'quote');

        this.render();
        this.ui.renderAll(this.player);
    }

    _tryLoadSavedMap() {
        try {
            let data = null;
            let sourceName = '';

            // Method 1: Check for saved_map.js file (works with file:// and http://)
            if (window.SAVED_MAP_DATA && window.SAVED_MAP_DATA.tiles) {
                data = window.SAVED_MAP_DATA;
                sourceName = data.name || 'saved_map.js';
            }

            // Method 2: Check localStorage (works over http:// only)
            if (!data) {
                const defaultName = localStorage.getItem('sim_default_map');
                if (!defaultName) return false;
                const raw = localStorage.getItem('sim_map_' + defaultName);
                if (!raw) return false;
                data = JSON.parse(raw);
                sourceName = defaultName;
            }

            if (!data || !data.tiles || data.tiles.length === 0) return false;

            // Load tiles
            for (let y = 0; y < this.map.height; y++) {
                this.map.tiles[y] = [];
                this.map.explored[y] = [];
                this.map.visible[y] = [];
                for (let x = 0; x < this.map.width; x++) {
                    this.map.tiles[y][x] = (data.tiles[y] && data.tiles[y][x]) ? data.tiles[y][x] : 'SAND';
                    this.map.explored[y][x] = false;
                    this.map.visible[y][x] = false;
                }
            }

            // Load entities from saved map (placed via editor)
            if (data.entities && data.entities.length > 0) {
                for (const e of data.entities) {
                    if (ENTITY_TYPES[e.type]) {
                        const entity = new Entity(e.type, e.x, e.y);
                        this.entities.push(entity);
                        this.map.addEntity(entity);
                    }
                }
            }

            this.ui.addMessage(`Loaded saved map: ${sourceName}`, 'system');
            return true;
        } catch (err) {
            console.warn('Failed to load saved map:', err);
            return false;
        }
    }

    _spawnEntities() {
        const rng = ROT.RNG;
        const numEntities = 500 + Math.floor(rng.getUniform() * 200);

        for (let i = 0; i < numEntities; i++) {
            const x = Math.floor(rng.getUniform() * this.map.width);
            const y = Math.floor(rng.getUniform() * this.map.height);

            if (!this.map.isWalkable(x, y)) continue;
            if (this.map.getLocation(x, y)) continue;
            const nearLoc = this.map.getNearbyLocation(x, y, 6);
            if (nearLoc) continue;

            const zone = this.map.getTerrainZone(x, y);
            const table = SPAWN_TABLES[zone] || SPAWN_TABLES.desert;

            const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
            let roll = rng.getUniform() * totalWeight;
            let chosen = table[0].type;
            for (const entry of table) {
                roll -= entry.weight;
                if (roll <= 0) { chosen = entry.type; break; }
            }

            const entity = new Entity(chosen, x, y);
            this.entities.push(entity);
            this.map.addEntity(entity);
        }
    }

    _spawnSpecialCharacters() {
        const rng = ROT.RNG;

        // Judge Holden - near Hueco Tanks area
        const judgeX = 300 + Math.floor(rng.getUniform() * 80);
        const judgeY = 80 + Math.floor(rng.getUniform() * 60);
        if (this.map.isWalkable(judgeX, judgeY)) {
            const judge = new Entity('JUDGE_HOLDEN', judgeX, judgeY);
            this.entities.push(judge);
            this.map.addEntity(judge);
        }

        // The Kid - near Tucson
        const kidX = 260 + Math.floor(rng.getUniform() * 20);
        const kidY = 68 + Math.floor(rng.getUniform() * 16);
        if (this.map.isWalkable(kidX, kidY)) {
            const kid = new Entity('THE_KID', kidX, kidY);
            this.entities.push(kid);
            this.map.addEntity(kid);
        }

        // Tobin - near Tucson
        const tobinX = 240 + Math.floor(rng.getUniform() * 16);
        const tobinY = 64 + Math.floor(rng.getUniform() * 12);
        if (this.map.isWalkable(tobinX, tobinY)) {
            const tobin = new Entity('TOBIN', tobinX, tobinY);
            this.entities.push(tobin);
            this.map.addEntity(tobin);
        }

        // Toadvine
        const tvX = 280 + Math.floor(rng.getUniform() * 80);
        const tvY = 100 + Math.floor(rng.getUniform() * 40);
        if (this.map.isWalkable(tvX, tvY)) {
            const tv = new Entity('TOADVINE', tvX, tvY);
            this.entities.push(tv);
            this.map.addEntity(tv);
        }

        // Glanton + gang
        const gX = 240 + Math.floor(rng.getUniform() * 80);
        const gY = 160 + Math.floor(rng.getUniform() * 40);
        if (this.map.isWalkable(gX, gY)) {
            const glanton = new Entity('GLANTON', gX, gY);
            this.entities.push(glanton);
            this.map.addEntity(glanton);
            for (let i = 0; i < 5; i++) {
                const sx = gX + Math.floor(rng.getUniform() * 8) - 4;
                const sy = gY + Math.floor(rng.getUniform() * 8) - 4;
                if (this.map.isWalkable(sx, sy)) {
                    const sh = new Entity('SCALPHUNTER', sx, sy);
                    this.entities.push(sh);
                    this.map.addEntity(sh);
                }
            }
        }

        // Bathcat
        const bcX = 220 + Math.floor(rng.getUniform() * 40);
        const bcY = 110 + Math.floor(rng.getUniform() * 20);
        if (this.map.isWalkable(bcX, bcY)) {
            const bc = new Entity('BATHCAT', bcX, bcY);
            this.entities.push(bc);
            this.map.addEntity(bc);
        }

        // Black Jackson
        const bjX = 320 + Math.floor(rng.getUniform() * 60);
        const bjY = 120 + Math.floor(rng.getUniform() * 40);
        if (this.map.isWalkable(bjX, bjY)) {
            const bj = new Entity('JACKSON', bjX, bjY);
            this.entities.push(bj);
            this.map.addEntity(bj);
        }

        // NPCs near Hueco Tanks
        const huecoTanks = LOCATIONS.find(l => l.name === 'Hueco Tanks');
        if (huecoTanks) {
            // A second Judge sighting near the tanks
            const hjX = huecoTanks.x + Math.floor(rng.getUniform() * 16) - 8;
            const hjY = huecoTanks.y + Math.floor(rng.getUniform() * 16) - 8;
            if (this.map.isWalkable(hjX, hjY)) {
                const hj = new Entity('JUDGE_HOLDEN', hjX, hjY);
                this.entities.push(hj);
                this.map.addEntity(hj);
            }
            // Tobin near the tanks
            const htX = huecoTanks.x + Math.floor(rng.getUniform() * 12) - 6;
            const htY = huecoTanks.y + Math.floor(rng.getUniform() * 12) - 6;
            if (this.map.isWalkable(htX, htY)) {
                const ht = new Entity('TOBIN', htX, htY);
                this.entities.push(ht);
                this.map.addEntity(ht);
            }
            // Toadvine near the tanks
            const hvX = huecoTanks.x + Math.floor(rng.getUniform() * 12) - 6;
            const hvY = huecoTanks.y + Math.floor(rng.getUniform() * 12) - 6;
            if (this.map.isWalkable(hvX, hvY)) {
                const hv = new Entity('TOADVINE', hvX, hvY);
                this.entities.push(hv);
                this.map.addEntity(hv);
            }
        }
    }

    handleInput(e) {
        if (this._inputLocked) return;

        const key = e.key;

        // Title screen
        if (this.state === 'title') {
            if (key === 'Enter') {
                document.getElementById('title-screen').classList.add('hidden');
                this.newGame();
            } else if (key === 'h' || key === 'H') {
                this.ui.showHelp();
                this.state = 'help';
            }
            return;
        }

        // Death screen
        if (this.state === 'dead') {
            if (key === 'Enter') {
                this.ui.hideDeathScreen();
                this.newGame();
            }
            return;
        }

        // Help screen
        if (this.state === 'help') {
            if (key === 'Escape') {
                this.ui.hideHelp();
                this.state = 'explore';
            }
            return;
        }

        // Map overview
        if (this.state === 'overview') {
            e.preventDefault();
            this._handleOverviewInput(key);
            return;
        }

        // Tavern screen
        if (this.state === 'tavern') {
            this._handleTavernInput(key);
            return;
        }

        // Mine interior
        if (this.state === 'mine') {
            this._handleMineInput(key);
            return;
        }

        // Town screen
        if (this.state === 'town') {
            this._handleTownInput(key);
            return;
        }

        // Contract screen
        if (this.state === 'contracts') {
            this._handleContractInput(key);
            return;
        }

        // Inventory screen
        if (this.state === 'inventory') {
            this._handleInventoryInput(key);
            return;
        }

        // Shop screen
        if (this.state === 'shop') {
            this._handleShopInput(key);
            return;
        }

        // Look mode - waiting for direction
        if (this.state === 'look') {
            this._handleLookInput(key);
            return;
        }

        // Throw mode - waiting for direction
        if (this.state === 'throw') {
            this._handleThrowInput(key);
            return;
        }

        // Explore state - main gameplay
        if (this.state === 'explore') {
            let moved = false;
            let dx = 0, dy = 0;

            switch (key) {
                case 'ArrowUp': case 'w': case 'W': dy = -1; break;
                case 'ArrowDown': case 's': case 'S': dy = 1; break;
                case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
                case 'ArrowRight': case 'd': case 'D': dx = 1; break;
                case ' ': case '.': moved = true; break; // Wait
                case '?': this.ui.showHelp(); this.state = 'help'; return;
                case 'i': case 'I':
                    this.ui.showInventoryScreen(this);
                    return;
                case 'c': case 'C':
                    this._openContracts();
                    return;
                case 'l': case 'L':
                    this.state = 'look';
                    this.ui.addMessage('Look in which direction? (WASD/arrows)', 'system');
                    return;
                case 't':
                    this._startThrow();
                    return;
                case 'm': case 'M':
                    this._tryMine();
                    return;
                case 'o': case 'O':
                    this._openOverview();
                    return;
                case 'Enter':
                    this._tryEnterMine();
                    return;
                default: return;
            }

            e.preventDefault();

            if (dx !== 0 || dy !== 0) {
                moved = this._tryMove(dx, dy);
            }

            if (moved) {
                this._endTurn();
            }
        }
    }

    _openContracts() {
        const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
        if (loc) {
            this.ui.showContractScreen(this);
        } else {
            this.ui.addMessage('You must be near a town to view contracts.', 'system');
        }
    }

    _startThrow() {
        const throwables = this.player.inventory.filter(i => i.type === 'throwable');
        if (throwables.length === 0) {
            this.ui.addMessage('You have nothing to throw.', 'system');
            return;
        }
        this._throwItem = throwables[0];
        this.state = 'throw';
        this.ui.addMessage(`Throw ${this._throwItem.name} in which direction? (WASD/arrows)`, 'system');
    }

    _handleLookInput(key) {
        let dx = 0, dy = 0;
        switch (key) {
            case 'ArrowUp': case 'w': case 'W': dy = -1; break;
            case 'ArrowDown': case 's': case 'S': dy = 1; break;
            case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
            case 'ArrowRight': case 'd': case 'D': dx = 1; break;
            case 'Escape':
                this.state = 'explore';
                this.ui.addMessage('Cancelled.', 'system');
                return;
            default: return;
        }
        this.state = 'explore';

        // Look along the direction until we hit something interesting
        let lx = this.player.x + dx;
        let ly = this.player.y + dy;
        const maxRange = FOV_RADIUS;
        for (let r = 0; r < maxRange; r++) {
            if (lx < 0 || lx >= this.map.width || ly < 0 || ly >= this.map.height) break;
            if (!this.map.visible[ly] || !this.map.visible[ly][lx]) break;

            // Check entities
            const ents = this.map.getEntitiesAt(lx, ly);
            for (const ent of ents) {
                if (ent.alive) {
                    this.ui.addMessage(`You see: ${ent.name} - ${ent.desc}`, 'info');
                    return;
                }
            }

            // Check mules
            for (const mule of this.player.mules) {
                if (mule.alive && mule.x === lx && mule.y === ly) {
                    const status = mule.spooked ? ' (spooked!)' : '';
                    this.ui.addMessage(`You see: ${mule.name} the mule${status} - HP:${mule.hp}/${mule.maxHp} Thirst:${Math.round(mule.thirst)}%`, 'info');
                    return;
                }
            }

            const tile = this.map.getTile(lx, ly);
            if (!tile.walkable || tile.damage > 0) {
                this.ui.addMessage(`You see: ${tile.name}`, 'info');
                return;
            }
            if (tile.thirstCost < 0) {
                this.ui.addMessage(`You see: ${tile.name} - a source of water.`, 'water');
                return;
            }
            if (TERRAIN[this.map.getTileType(lx, ly)] && TERRAIN[this.map.getTileType(lx, ly)].mineable) {
                this.ui.addMessage(`You see: ${tile.name} - can be mined for ore.`, 'gold');
                return;
            }

            lx += dx;
            ly += dy;
        }
        const finalTile = this.map.getTile(this.player.x + dx, this.player.y + dy);
        this.ui.addMessage(`You see: ${finalTile.name}`, 'info');
    }

    _handleThrowInput(key) {
        let dx = 0, dy = 0;
        switch (key) {
            case 'ArrowUp': case 'w': case 'W': dy = -1; break;
            case 'ArrowDown': case 's': case 'S': dy = 1; break;
            case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
            case 'ArrowRight': case 'd': case 'D': dx = 1; break;
            case 'Escape':
                this.state = 'explore';
                this._throwItem = null;
                this.ui.addMessage('Cancelled.', 'system');
                return;
            default: return;
        }
        this.state = 'explore';

        const item = this._throwItem;
        this._throwItem = null;

        // Remove from inventory
        const idx = this.player.inventory.indexOf(item);
        if (idx >= 0) this.player.inventory.splice(idx, 1);

        // Find target in direction (up to 5 tiles)
        let tx = this.player.x, ty = this.player.y;
        let hitEntity = null;
        for (let r = 1; r <= 5; r++) {
            tx = this.player.x + dx * r;
            ty = this.player.y + dy * r;
            if (tx < 0 || tx >= this.map.width || ty < 0 || ty >= this.map.height) break;
            if (!this.map.isWalkable(tx, ty)) break;

            const ents = this.map.getEntitiesAt(tx, ty);
            for (const ent of ents) {
                if (ent.alive && ent.hostile) {
                    hitEntity = ent;
                    break;
                }
            }
            if (hitEntity) break;
        }

        if (hitEntity) {
            this.combat.throwAtEntity(hitEntity, item);
        } else {
            this.ui.addMessage(`The ${item.name} sails through the air and lands in the dirt.`, 'info');
        }
        this._endTurn();
    }

    _tryMine() {
        const tileType = this.map.getTileType(this.player.x, this.player.y);
        const tile = TERRAIN[tileType];
        if (!tile || !tile.mineable) {
            this.ui.addMessage('There is nothing to mine here.', 'system');
            return;
        }

        this.ui.addMessage('You swing at the ore vein...', 'info');
        const rng = ROT.RNG;
        // Mining tools increase success rate
        let miningBonus = 0;
        for (const item of this.player.inventory) {
            if (item.toolType === 'mining' && item.miningBonus) {
                miningBonus += item.miningBonus;
            }
        }
        if (rng.getUniform() < 0.6 + miningBonus) {
            // Pick from mining loot table
            const totalWeight = MINING_LOOT.reduce((sum, e) => sum + e.weight, 0);
            let roll = rng.getUniform() * totalWeight;
            let chosen = MINING_LOOT[0].item;
            for (const entry of MINING_LOOT) {
                roll -= entry.weight;
                if (roll <= 0) { chosen = entry.item; break; }
            }
            const item = { ...ITEMS[chosen] };
            this.player.inventory.push(item);
            this.ui.addMessage(`You extract: ${item.name}!`, 'gold');

            // Vein may be exhausted
            if (rng.getUniform() < 0.3) {
                this.map.tiles[this.player.y][this.player.x] = 'GRAVEL';
                this.ui.addMessage('The vein is exhausted.', 'system');
            }
        } else {
            this.ui.addMessage('Nothing but rock.', 'system');
        }
        this._endTurn();
    }

    _tryMove(dx, dy) {
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;

        if (!this.map.isWalkable(nx, ny)) {
            const tile = this.map.getTile(nx, ny);
            if (tile.damage > 0) {
                const dmg = this.player.takeDamage(tile.damage);
                this.ui.addMessage(`The ${tile.name.toLowerCase()} tears at your flesh! (${dmg} damage)`, 'danger');
                if (!this.player.alive) {
                    this.gameOver();
                    return false;
                }
            }
            return false;
        }

        // Check for entities at destination
        const entitiesAt = this.map.getEntitiesAt(nx, ny);
        for (const entity of entitiesAt) {
            if (entity.hostile && entity.alive) {
                this.combat.playerAttacks(entity);
                return true;
            }
            if (entity.special && entity.alive) {
                this._interactSpecial(entity);
                return true;
            }
        }

        const oldX = this.player.x;
        const oldY = this.player.y;
        this.player.x = nx;
        this.player.y = ny;

        this.player.moveMules(oldX, oldY);

        const tile = this.map.getTile(nx, ny);
        if (tile.damage > 0) {
            const dmg = this.player.takeDamage(tile.damage);
            this.ui.addMessage(`Cholla needles embed in your skin! (${dmg} damage)`, 'danger');
            for (const mule of this.player.mules) {
                if (mule.alive && mule.x === nx && mule.y === ny) {
                    mule.takeDamage(1);
                    if (ROT.RNG.getUniform() < 0.4) mule.spook(this);
                }
            }
            if (!this.player.alive) {
                this.gameOver();
                return false;
            }
        }

        // Check for location entry
        const loc = this.map.getNearbyLocation(nx, ny, 3);
        const tileType = this.map.getTileType(nx, ny);
        if (loc && tileType === 'CAMPFIRE') {
            // Remove dead mules when arriving in town
            const removed = this.player.removeDeadMules();
            if (removed > 0) {
                this.ui.addMessage(`The town undertaker hauls away ${removed} dead mule${removed > 1 ? 's' : ''} from your train.`, 'system');
            }
            this.ui.showTownScreen(loc, this);
        } else if (loc && tileType === 'TOWN_DOOR') {
            this.ui.addMessage(`You enter ${loc.name}. Find the campfire at the center to access town services.`, 'info');
        } else if (loc && tileType === 'TOWN_FLOOR') {
            this.ui.addMessage(`${loc.name}`, 'system');
        }

        return true;
    }

    _interactSpecial(entity) {
        switch (entity.type) {
            case 'JUDGE_HOLDEN': {
                const q = QUOTES.judge[Math.floor(ROT.RNG.getUniform() * QUOTES.judge.length)];
                this.ui.addMessage(`A massive pale figure sits before you. The Judge smiles.`, 'info');
                this.ui.addMessage(`"${q.text}"`, 'quote');
                break;
            }
            case 'THE_KID':
                this.ui.addMessage(`A lean youth with cold eyes. He nods but says nothing.`, 'info');
                if (ROT.RNG.getUniform() < 0.3) {
                    this.ui.addMessage(`The Kid offers to ride with you for a share of the take.`, 'info');
                }
                break;
            case 'TOBIN':
                this.ui.addMessage(`The ex-priest leans close. His breath stinks of mezcal.`, 'info');
                this.ui.addMessage(`"Avoid the canyons at night, muleteer. The Apaches own the dark."`, 'quote');
                break;
            case 'TOADVINE':
                this.ui.addMessage(`A scarred man with burn marks and no ears. Toadvine.`, 'info');
                this.ui.addMessage(`"You got anything worth sellin, muleteer?"`, 'quote');
                break;
            case 'GLANTON':
                this.ui.addMessage(`John Joel Glanton. His eyes are as empty as the desert.`, 'info');
                this.ui.addMessage(`"You work for me now, or you die where you stand."`, 'quote');
                break;
            case 'BATHCAT':
                this.ui.addMessage(`A heavy-set teamster with a cat purring inside his shirt.`, 'info');
                this.ui.addMessage(`"This here cat's better company than any man I ever rode with."`, 'quote');
                break;
            case 'JACKSON':
                this.ui.addMessage(`A dark giant of a man. His quiet gaze misses nothing.`, 'info');
                this.ui.addMessage(`"Watch your back out there. Ain't nobody else will."`, 'quote');
                break;
            default:
                this.ui.addMessage(`You encounter ${entity.name}.`, 'info');
        }
    }

    _handleTownInput(key) {
        switch (key) {
            case 'Escape':
                this.ui.hideTownScreen();
                this.state = 'explore';
                break;
            case 'c': case 'C':
                this.ui.hideTownScreen();
                this.ui.showContractScreen(this);
                break;
            case 'r': case 'R':
                if (this.player.gold >= 5) {
                    this.player.gold -= 5;
                    this.player.hp = this.player.maxHp;
                    this.player.thirst = this.player.maxThirst;
                    this.ui.setTownFeedback('You rest in the shade. Wounds mended, thirst quenched.', '#6B8E23');
                } else {
                    this.ui.setTownFeedback('Not enough gold. You need 5.', '#B22222');
                }
                this.ui.renderAll(this.player);
                break;
            case 'w': case 'W':
                if (this.player.gold >= 3) {
                    this.player.gold -= 3;
                    let watered = 0;
                    for (const m of this.player.mules) {
                        if (m.alive) {
                            m.thirst = m.maxThirst;
                            m.spooked = false;
                            watered++;
                        }
                    }
                    this.ui.setTownFeedback(`${watered} mules drink their fill at the trough.`, '#4682B4');
                } else {
                    this.ui.setTownFeedback('Not enough gold. You need 3.', '#B22222');
                }
                this.ui.renderAll(this.player);
                break;
            case 'b': case 'B':
                if (this.player.gold >= 15) {
                    if (this.player.addMule()) {
                        this.player.gold -= 15;
                        const mule = this.player.mules[this.player.mules.length - 1];
                        mule.x = this.player.x - 1;
                        mule.y = this.player.y;
                        this.ui.setTownFeedback(`Purchased ${mule.name}, a sturdy burro.`, '#DAA520');
                    } else {
                        this.ui.setTownFeedback(`Cannot handle more than ${MAX_MULES} mules.`, '#B22222');
                    }
                } else {
                    this.ui.setTownFeedback('Not enough gold. You need 15.', '#B22222');
                }
                this.ui.renderAll(this.player);
                break;
            case 's': case 'S': {
                const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
                if (loc) {
                    this.ui.hideTownScreen();
                    this.ui.showShopScreen(this, loc);
                }
                break;
            }
            case 'i': case 'I':
                this.ui.hideTownScreen();
                this.ui.showInventoryScreen(this);
                break;
            case 't': case 'T': {
                const tavLoc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
                if (tavLoc) {
                    this.ui.hideTownScreen();
                    this._openTavern(tavLoc);
                }
                break;
            }
            case 'd': case 'D':
                if (this.player.contract) {
                    const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
                    if (loc && loc.name === this.player.contract.dest) {
                        this._deliverContract();
                    }
                }
                break;
        }
    }

    _handleContractInput(key) {
        if (key === 'Escape') {
            this.ui.hideContractScreen();
            const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
            if (loc) {
                this.state = 'explore';
                this.ui.showTownScreen(loc, this);
            } else {
                this.state = 'explore';
            }
            return;
        }

        const idx = parseInt(key) - 1;
        if (idx >= 0 && idx < this._contractOptions.length) {
            const contract = this._contractOptions[idx];
            if (this.player.contract) {
                this.ui.addMessage('You already have a contract. Deliver it first.', 'system');
                return;
            }
            const aliveMules = this.player.mules.filter(m => m.alive).length;
            if (aliveMules < contract.mulesNeeded) {
                this.ui.addMessage(`Need ${contract.mulesNeeded} mules. You have ${aliveMules}.`, 'system');
                return;
            }
            this.player.contract = contract;
            let loaded = 0;
            for (const mule of this.player.mules) {
                if (mule.alive && loaded < contract.mulesNeeded) {
                    mule.cargo = contract.cargo;
                    loaded++;
                }
            }
            this.ui.addMessage(`Contract accepted: ${contract.cargo} to ${contract.dest}. ($${contract.pay})`, 'gold');
            this.ui.hideContractScreen();
            this.ui.hideTownScreen();
            this.state = 'explore';
            this.ui.renderAll(this.player);
        }
    }

    _handleInventoryInput(key) {
        if (key === 'Escape') {
            this._invInputBuffer = '';
            if (this._invInputTimer) { clearTimeout(this._invInputTimer); this._invInputTimer = null; }
            this._inventoryEquipPending = false;
            this._inventoryUsePending = false;
            this.ui.hideInventoryScreen();
            const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
            const tileType = this.map.getTileType(this.player.x, this.player.y);
            if (loc && tileType === 'CAMPFIRE') {
                this.ui.showTownScreen(loc, this);
            } else {
                this.state = 'explore';
            }
            return;
        }

        const fb = document.getElementById('inventory-feedback');

        // Check for equip commands: E+number
        if (key.toLowerCase() === 'e') {
            this._inventoryEquipPending = true;
            this._inventoryUsePending = false;
            this._invInputBuffer = '';
            if (this._invInputTimer) { clearTimeout(this._invInputTimer); this._invInputTimer = null; }
            if (fb) fb.textContent = 'Equip which item? Press number...';
            return;
        }

        // Check for use commands: U+number
        if (key.toLowerCase() === 'u') {
            this._inventoryUsePending = true;
            this._inventoryEquipPending = false;
            this._invInputBuffer = '';
            if (this._invInputTimer) { clearTimeout(this._invInputTimer); this._invInputTimer = null; }
            if (fb) fb.textContent = 'Use which item? Press number...';
            return;
        }

        // Enter confirms buffered input
        if (key === 'Enter' && this._invInputBuffer.length > 0) {
            this._processInventoryAction(parseInt(this._invInputBuffer));
            this._invInputBuffer = '';
            if (this._invInputTimer) { clearTimeout(this._invInputTimer); this._invInputTimer = null; }
            return;
        }

        const digit = parseInt(key);
        if (isNaN(digit)) {
            this._inventoryEquipPending = false;
            this._inventoryUsePending = false;
            this._invInputBuffer = '';
            if (this._invInputTimer) { clearTimeout(this._invInputTimer); this._invInputTimer = null; }
            return;
        }

        this._invInputBuffer += key;
        if (this._invInputTimer) clearTimeout(this._invInputTimer);

        const bufNum = parseInt(this._invInputBuffer);
        const maxItem = this.player.inventory.length;

        // If 9 or fewer items, process immediately
        if (maxItem <= 9) {
            this._processInventoryAction(bufNum);
            this._invInputBuffer = '';
            return;
        }

        // If buffer is 2+ digits or can't form a larger valid number, process now
        if (this._invInputBuffer.length >= 2 || bufNum * 10 > maxItem) {
            this._processInventoryAction(bufNum);
            this._invInputBuffer = '';
            return;
        }

        // Wait for a second digit
        const mode = this._inventoryEquipPending ? 'Equip' : (this._inventoryUsePending ? 'Use' : 'Sell');
        if (fb) { fb.textContent = `${mode} item #${this._invInputBuffer}... (press Enter or another digit)`; fb.style.color = '#DAA520'; }
        this._invInputTimer = setTimeout(() => {
            if (this._invInputBuffer.length > 0) {
                this._processInventoryAction(parseInt(this._invInputBuffer));
                this._invInputBuffer = '';
            }
        }, 1500);
    }

    _processInventoryAction(num) {
        const fb = document.getElementById('inventory-feedback');
        if (isNaN(num) || num < 1 || num > this.player.inventory.length) {
            this._inventoryEquipPending = false;
            this._inventoryUsePending = false;
            return;
        }

        const itemIdx = num - 1;
        const item = this.player.inventory[itemIdx];

        if (this._inventoryEquipPending) {
            this._inventoryEquipPending = false;
            if (item.slot) {
                this.player.equipItem(item);
                if (fb) { fb.textContent = `Equipped ${item.name}.`; fb.style.color = '#6B8E23'; }
            } else {
                if (fb) { fb.textContent = `Cannot equip ${item.name}.`; fb.style.color = '#B22222'; }
            }
            this.ui.showInventoryScreen(this);
            return;
        }

        if (this._inventoryUsePending) {
            this._inventoryUsePending = false;
            if (item.type === 'food' || item.type === 'heal') {
                const healAmt = item.heal || 3;
                this.player.heal(healAmt);
                this.player.inventory.splice(itemIdx, 1);
                if (fb) { fb.textContent = `Used ${item.name}. Healed ${healAmt} HP.`; fb.style.color = '#6B8E23'; }
            } else {
                if (fb) { fb.textContent = `Cannot use ${item.name}.`; fb.style.color = '#B22222'; }
            }
            this.ui.showInventoryScreen(this);
            this.ui.renderAll(this.player);
            return;
        }

        // Default: sell if in town
        const inTown = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
        if (inTown) {
            const price = this.player.sellItem(item);
            if (price > 0) {
                if (fb) { fb.textContent = `Sold ${item.name} for $${price}.`; fb.style.color = '#DAA520'; }
            }
        }

        this.ui.showInventoryScreen(this);
        this.ui.renderAll(this.player);
    }

    _handleShopInput(key) {
        if (key === 'Escape') {
            this._shopInputBuffer = '';
            if (this._shopInputTimer) { clearTimeout(this._shopInputTimer); this._shopInputTimer = null; }
            this.ui.hideShopScreen();
            const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
            if (loc) {
                this.ui.showTownScreen(loc, this);
            } else {
                this.state = 'explore';
            }
            return;
        }

        // Enter key confirms buffered input
        if (key === 'Enter' && this._shopInputBuffer.length > 0) {
            this._processShopPurchase(parseInt(this._shopInputBuffer));
            this._shopInputBuffer = '';
            if (this._shopInputTimer) { clearTimeout(this._shopInputTimer); this._shopInputTimer = null; }
            return;
        }

        const digit = parseInt(key);
        if (isNaN(digit)) return;

        this._shopInputBuffer += key;
        if (this._shopInputTimer) clearTimeout(this._shopInputTimer);

        // If the buffer can't possibly be a valid prefix for any item, process now
        const bufNum = parseInt(this._shopInputBuffer);
        const maxItem = this._shopItems.length;

        // If single digit and no items 10+, process immediately
        if (maxItem <= 9) {
            this._processShopPurchase(bufNum);
            this._shopInputBuffer = '';
            return;
        }

        // If buffer is already >= 10 or buffer * 10 > maxItem, process now
        if (this._shopInputBuffer.length >= 2 || bufNum * 10 > maxItem) {
            this._processShopPurchase(bufNum);
            this._shopInputBuffer = '';
            return;
        }

        // Otherwise wait briefly for a second digit
        const fb = document.getElementById('shop-feedback');
        if (fb) { fb.textContent = `Item #${this._shopInputBuffer}... (press Enter or another digit)`; fb.style.color = '#DAA520'; }
        this._shopInputTimer = setTimeout(() => {
            if (this._shopInputBuffer.length > 0) {
                this._processShopPurchase(parseInt(this._shopInputBuffer));
                this._shopInputBuffer = '';
            }
        }, 1500);
    }

    _processShopPurchase(num) {
        if (isNaN(num) || num < 1 || num > this._shopItems.length) return;

        const entry = this._shopItems[num - 1];
        const itemData = ITEMS[entry.item];
        if (!itemData) return;

        let fbText = '';
        let fbColor = '#6B8E23';
        if (this.player.gold >= entry.price) {
            this.player.gold -= entry.price;
            const item = { ...itemData };
            this.player.inventory.push(item);
            fbText = `Bought ${item.name} for $${entry.price}.`;
            fbColor = '#6B8E23';
        } else {
            fbText = `Cannot afford ${itemData.name}. Need $${entry.price}, have $${this.player.gold}.`;
            fbColor = '#B22222';
        }

        const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
        if (loc) this.ui.showShopScreen(this, loc);
        const fb = document.getElementById('shop-feedback');
        if (fb) { fb.textContent = fbText; fb.style.color = fbColor; }
        this.ui.renderAll(this.player);
    }

    _deliverContract() {
        const contract = this.player.contract;
        const cargoMules = this.player.mules.filter(m => m.alive && m.cargo);
        const delivered = cargoMules.length;
        const needed = contract.mulesNeeded;

        if (delivered >= needed) {
            this.player.gold += contract.pay;
            this.player.deliveries++;
            this.player.xp += contract.pay;
            this.ui.setTownFeedback(`Contract complete! Delivered ${contract.cargo}. Earned $${contract.pay}.`, '#DAA520');
            this.ui.addMessage(`Contract complete! Earned $${contract.pay}.`, 'gold');
        } else {
            const partial = Math.floor(contract.pay * (delivered / needed) * 0.5);
            this.player.gold += partial;
            this.player.deliveries++;
            this.ui.setTownFeedback(`Partial delivery. ${delivered}/${needed} mules with cargo. Earned $${partial}.`, '#DAA520');
        }

        for (const mule of this.player.mules) {
            mule.cargo = null;
        }
        this.player.contract = null;
        this.player.checkLevelUp(this);
        this.ui.renderAll(this.player);
    }

    // ---- MAP OVERVIEW ----
    _openOverview() {
        this.state = 'overview';
        this._overviewX = Math.max(0, this.player.x - 40);
        this._overviewY = Math.max(0, this.player.y - 20);
        const screen = document.getElementById('overview-screen');
        screen.classList.remove('hidden');
        this._renderOverview();
    }

    _handleOverviewInput(key) {
        const step = 5;
        switch (key) {
            case 'ArrowUp': case 'w': case 'W':
                this._overviewY = Math.max(0, this._overviewY - step); break;
            case 'ArrowDown': case 's': case 'S':
                this._overviewY = Math.min(this.map.height - 1, this._overviewY + step); break;
            case 'ArrowLeft': case 'a': case 'A':
                this._overviewX = Math.max(0, this._overviewX - step); break;
            case 'ArrowRight': case 'd': case 'D':
                this._overviewX = Math.min(this.map.width - 1, this._overviewX + step); break;
            case 'Escape':
                document.getElementById('overview-screen').classList.add('hidden');
                this.state = 'explore';
                return;
            default: return;
        }
        this._renderOverview();
    }

    _renderOverview() {
        const canvas = document.getElementById('overview-canvas');
        const ctx = canvas.getContext('2d');
        const cw = canvas.width;
        const ch = canvas.height;
        const cellW = 5;
        const cellH = 5;
        const viewW = Math.floor(cw / cellW);
        const viewH = Math.floor(ch / cellH);

        ctx.fillStyle = '#0d0a04';
        ctx.fillRect(0, 0, cw, ch);

        const startX = Math.max(0, Math.min(this.map.width - viewW, this._overviewX - Math.floor(viewW / 2)));
        const startY = Math.max(0, Math.min(this.map.height - viewH, this._overviewY - Math.floor(viewH / 2)));

        for (let y = 0; y < viewH; y++) {
            for (let x = 0; x < viewW; x++) {
                const mx = startX + x;
                const my = startY + y;
                if (mx >= this.map.width || my >= this.map.height) continue;
                const tile = this.map.getTile(mx, my);
                const explored = this.map.explored[my] && this.map.explored[my][mx];
                const alpha = explored ? 0.7 : 0.25;
                ctx.fillStyle = tile.bg || '#0d0a04';
                ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
                ctx.fillStyle = tile.fg || '#555';
                ctx.globalAlpha = alpha;
                ctx.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);
                ctx.globalAlpha = 1.0;
            }
        }

        // Draw locations
        ctx.font = '10px monospace';
        ctx.textBaseline = 'bottom';
        for (const loc of LOCATIONS) {
            const sx = (loc.x - startX) * cellW;
            const sy = (loc.y - startY) * cellH;
            if (sx < 0 || sx >= cw || sy < 0 || sy >= ch) continue;
            // Town dot
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(sx - 2, sy - 2, 5, 5);
            // Label
            ctx.fillStyle = '#DAA520';
            ctx.fillText(loc.name, sx - 10, sy - 5);
        }

        // Draw player position
        const px = (this.player.x - startX) * cellW;
        const py = (this.player.y - startY) * cellH;
        if (px >= 0 && px < cw && py >= 0 && py < ch) {
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(px - 3, py - 3, 7, 7);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '9px monospace';
            ctx.fillText('@', px - 3, py + 10);
        }

        // Update position text
        document.getElementById('overview-pos').textContent = `Position: ${this.player.x}, ${this.player.y}`;
    }

    // ---- TAVERN ----
    _openTavern(location) {
        this.state = 'tavern';
        this._tavernLocation = location;
        const screen = document.getElementById('tavern-screen');
        document.getElementById('tavern-name').textContent = `${location.name} Tavern`;
        document.getElementById('tavern-feedback').textContent = '';

        // Build drink menu
        let html = '';
        TAVERN_DRINKS.forEach((d, i) => {
            const item = ITEMS[d.item];
            if (!item) return;
            const canAfford = this.player.gold >= d.price;
            const color = canAfford ? '#DEB887' : '#696969';
            html += `<div class="tavern-drink" style="color:${color}"><span class="key">[${i + 1}]</span> ${item.name} - $${d.price} <span style="color:#696969;font-size:10px">${item.desc}</span></div>`;
        });
        document.getElementById('tavern-drinks').innerHTML = html;
        document.getElementById('tavern-gold').textContent = `Gold: ${this.player.gold}`;
        screen.classList.remove('hidden');

        // Random tavern event
        this._triggerTavernEvent();
    }

    _triggerTavernEvent() {
        const event = TAVERN_EVENTS[Math.floor(ROT.RNG.getUniform() * TAVERN_EVENTS.length)];
        const fb = document.getElementById('tavern-event');
        fb.textContent = event.text;

        if (event.type === 'brawl') {
            const dmg = event.damage[0] + Math.floor(ROT.RNG.getUniform() * (event.damage[1] - event.damage[0] + 1));
            if (dmg > 0) {
                this.player.takeDamage(dmg);
                this.ui.addMessage(`Caught in a brawl! Took ${dmg} damage.`, 'combat');
            }
            if (event.goldChance > 0 && ROT.RNG.getUniform() < event.goldChance) {
                const gold = event.goldAmount[0] + Math.floor(ROT.RNG.getUniform() * (event.goldAmount[1] - event.goldAmount[0] + 1));
                this.player.gold += gold;
                this.ui.addMessage(`Found ${gold} gold in the chaos.`, 'gold');
            }
        } else if (event.type === 'good') {
            if (event.heal) {
                this.player.heal(event.heal);
                this.ui.addMessage(`Healed ${event.heal} HP.`, 'good');
            }
        } else if (event.type === 'gamble') {
            if (ROT.RNG.getUniform() < 0.4) {
                const win = event.goldWin[0] + Math.floor(ROT.RNG.getUniform() * (event.goldWin[1] - event.goldWin[0] + 1));
                this.player.gold += win;
                fb.textContent += ` You win $${win}!`;
            } else {
                const loss = Math.min(this.player.gold, event.goldLoss[0] + Math.floor(ROT.RNG.getUniform() * (event.goldLoss[1] - event.goldLoss[0] + 1)));
                this.player.gold -= loss;
                fb.textContent += ` You lose $${loss}.`;
            }
        }

        // Show a quote
        if (ROT.RNG.getUniform() < 0.6) {
            const q = TAVERN_QUOTES[Math.floor(ROT.RNG.getUniform() * TAVERN_QUOTES.length)];
            document.getElementById('tavern-quote').textContent = `"${q.text}" - ${q.attr}`;
        } else {
            document.getElementById('tavern-quote').textContent = '';
        }

        this.ui.renderAll(this.player);
    }

    _handleTavernInput(key) {
        if (key === 'Escape') {
            document.getElementById('tavern-screen').classList.add('hidden');
            if (this._tavernLocation) {
                this.ui.showTownScreen(this._tavernLocation, this);
            } else {
                this.state = 'explore';
            }
            return;
        }

        // Another round (new event)
        if (key === 'r' || key === 'R') {
            this._triggerTavernEvent();
            return;
        }

        const num = parseInt(key);
        if (!isNaN(num) && num >= 1 && num <= TAVERN_DRINKS.length) {
            const drink = TAVERN_DRINKS[num - 1];
            const itemData = ITEMS[drink.item];
            if (!itemData) return;

            const fb = document.getElementById('tavern-feedback');
            if (this.player.gold >= drink.price) {
                this.player.gold -= drink.price;
                const healAmt = itemData.heal || 3;
                this.player.heal(healAmt);
                if (fb) { fb.textContent = `You drink the ${itemData.name}. Healed ${healAmt} HP.`; fb.style.color = '#6B8E23'; }
                document.getElementById('tavern-gold').textContent = `Gold: ${this.player.gold}`;
            } else {
                if (fb) { fb.textContent = `Cannot afford ${itemData.name}. Need $${drink.price}.`; fb.style.color = '#B22222'; }
            }
            this.ui.renderAll(this.player);
        }
    }

    // ---- MINE INTERIOR ----
    _tryEnterMine() {
        const tileType = this.map.getTileType(this.player.x, this.player.y);
        if (tileType !== 'MINE_ENTRANCE') return;

        this._mineEntrance = { x: this.player.x, y: this.player.y };
        this._generateMine();
        this._inMine = true;
        this.state = 'mine';
        this.ui.addMessage('You descend into the darkness of the mine...', 'system');
        this._renderMine();
    }

    _generateMine() {
        const w = this._mineW;
        const h = this._mineH;
        this._mineMap = [];

        // Fill with walls
        for (let y = 0; y < h; y++) {
            this._mineMap[y] = [];
            for (let x = 0; x < w; x++) {
                this._mineMap[y][x] = 'MINE_WALL';
            }
        }

        // Carve tunnels using a simple random walk + rooms approach
        const rng = ROT.RNG;

        // Main horizontal tunnel
        const mainY = Math.floor(h / 2);
        for (let x = 1; x < w - 1; x++) {
            this._mineMap[mainY][x] = 'MINE_FLOOR';
            if (rng.getUniform() < 0.3) {
                const dy = rng.getUniform() < 0.5 ? -1 : 1;
                if (mainY + dy > 0 && mainY + dy < h - 1) {
                    this._mineMap[mainY + dy][x] = 'MINE_FLOOR';
                }
            }
        }

        // Branch tunnels
        for (let b = 0; b < 5; b++) {
            const bx = 3 + Math.floor(rng.getUniform() * (w - 8));
            const dir = rng.getUniform() < 0.5 ? -1 : 1;
            let cy = mainY;
            for (let i = 0; i < 4 + Math.floor(rng.getUniform() * 5); i++) {
                cy += dir;
                if (cy <= 0 || cy >= h - 1) break;
                this._mineMap[cy][bx] = 'MINE_FLOOR';
                // Widen sometimes
                if (rng.getUniform() < 0.4 && bx + 1 < w - 1) this._mineMap[cy][bx + 1] = 'MINE_FLOOR';
                if (rng.getUniform() < 0.3 && bx - 1 > 0) this._mineMap[cy][bx - 1] = 'MINE_FLOOR';
            }
        }

        // Small rooms (ore chambers)
        for (let r = 0; r < 3; r++) {
            const rx = 4 + Math.floor(rng.getUniform() * (w - 10));
            const ry = 2 + Math.floor(rng.getUniform() * (h - 5));
            const rw = 2 + Math.floor(rng.getUniform() * 3);
            const rh = 2 + Math.floor(rng.getUniform() * 2);
            for (let y = ry; y < Math.min(ry + rh, h - 1); y++) {
                for (let x = rx; x < Math.min(rx + rw, w - 1); x++) {
                    this._mineMap[y][x] = 'MINE_FLOOR';
                }
            }
            // Connect room to main tunnel
            const connX = rx;
            const startY = Math.min(ry, mainY);
            const endY = Math.max(ry, mainY);
            for (let y = startY; y <= endY; y++) {
                if (y > 0 && y < h - 1) this._mineMap[y][connX] = 'MINE_FLOOR';
            }
        }

        // Place ore veins
        let oreCount = 0;
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                if (this._mineMap[y][x] === 'MINE_FLOOR' && rng.getUniform() < 0.12) {
                    this._mineMap[y][x] = 'MINE_ORE';
                    oreCount++;
                }
            }
        }

        // Place support beams
        for (let x = 5; x < w - 2; x += (4 + Math.floor(rng.getUniform() * 4))) {
            if (this._mineMap[mainY - 1] && this._mineMap[mainY - 1][x] === 'MINE_FLOOR') {
                this._mineMap[mainY - 1][x] = 'MINE_SUPPORT';
            }
        }

        // Entrance at left
        this._mineMap[mainY][0] = 'MINE_FLOOR';
        this._minePlayerX = 1;
        this._minePlayerY = mainY;
    }

    _handleMineInput(key) {
        let dx = 0, dy = 0;
        switch (key) {
            case 'ArrowUp': case 'w': case 'W': dy = -1; break;
            case 'ArrowDown': case 's': case 'S': dy = 1; break;
            case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
            case 'ArrowRight': case 'd': case 'D': dx = 1; break;
            case 'm': case 'M': this._tryMineMine(); return;
            case 'Escape':
                // Exit mine
                this._exitMine();
                return;
            default: return;
        }

        const nx = this._minePlayerX + dx;
        const ny = this._minePlayerY + dy;

        if (nx < 0) {
            // Exiting the mine
            this._exitMine();
            return;
        }

        if (nx < 0 || nx >= this._mineW || ny < 0 || ny >= this._mineH) return;
        const tile = this._mineMap[ny][nx];
        if (tile === 'MINE_WALL' || tile === 'MINE_SUPPORT') return;

        this._minePlayerX = nx;
        this._minePlayerY = ny;
        this._renderMine();
    }

    _tryMineMine() {
        const tile = this._mineMap[this._minePlayerY][this._minePlayerX];
        if (tile !== 'MINE_ORE') {
            this.ui.addMessage('Nothing to mine here.', 'system');
            return;
        }

        const rng = ROT.RNG;
        let miningBonus = 0;
        for (const item of this.player.inventory) {
            if (item.toolType === 'mining' && item.miningBonus) miningBonus += item.miningBonus;
        }

        this.ui.addMessage('You swing at the rich ore...', 'info');
        if (rng.getUniform() < 0.7 + miningBonus) {
            // Use the richer mine loot table
            const totalWeight = MINE_LOOT.reduce((sum, e) => sum + e.weight, 0);
            let roll = rng.getUniform() * totalWeight;
            let chosen = MINE_LOOT[0].item;
            for (const entry of MINE_LOOT) {
                roll -= entry.weight;
                if (roll <= 0) { chosen = entry.item; break; }
            }
            const item = { ...ITEMS[chosen] };
            this.player.inventory.push(item);
            this.ui.addMessage(`You extract: ${item.name}!`, 'gold');

            if (rng.getUniform() < 0.4) {
                this._mineMap[this._minePlayerY][this._minePlayerX] = 'MINE_FLOOR';
                this.ui.addMessage('The vein is exhausted.', 'system');
            }
        } else {
            this.ui.addMessage('Nothing but rock.', 'system');
        }
        this.ui.renderAll(this.player);
        this._renderMine();
    }

    _exitMine() {
        this._inMine = false;
        this.state = 'explore';
        this.ui.addMessage('You emerge from the mine, blinking in the daylight.', 'info');
        this.render();
        this.ui.renderAll(this.player);
    }

    _renderMine() {
        const display = this.display;
        display.clear();

        // Center viewport on mine player
        const vpW = VIEWPORT_W;
        const vpH = VIEWPORT_H;
        const startX = Math.max(0, Math.min(this._mineW - vpW, this._minePlayerX - Math.floor(vpW / 2)));
        const startY = Math.max(0, Math.min(this._mineH - vpH, this._minePlayerY - Math.floor(vpH / 2)));

        for (let vy = 0; vy < vpH; vy++) {
            for (let vx = 0; vx < vpW; vx++) {
                const mx = startX + vx;
                const my = startY + vy;
                if (mx >= this._mineW || my >= this._mineH || mx < 0 || my < 0) continue;
                const tileType = this._mineMap[my][mx];
                const tile = TERRAIN[tileType];
                if (tile) {
                    display.draw(vx, vy, tile.char, tile.fg, tile.bg);
                }
            }
        }

        // Draw player
        const px = this._minePlayerX - startX;
        const py = this._minePlayerY - startY;
        if (px >= 0 && px < vpW && py >= 0 && py < vpH) {
            display.draw(px, py, '@', '#F0E0C0', '#0e0c08');
        }
    }

    _endTurn() {
        this.turn++;
        this.player.turnsPlayed++;

        this.player.updateThirst(this);

        for (const mule of this.player.mules) {
            mule.update(this);
        }

        for (const entity of this.entities) {
            if (entity.alive) {
                entity.act(this);
            }
        }

        this._checkRandomEvents();

        if (this.turn % 30 === 0) {
            this._respawnEntities();
        }

        this.render();
        this.ui.renderAll(this.player);
        this.ui.updateTopBar(this.turn, this.player, this.map);
    }

    _checkRandomEvents() {
        const rng = ROT.RNG;

        if (this.turn % 50 === 0) {
            const q = QUOTES.travel[Math.floor(rng.getUniform() * QUOTES.travel.length)];
            this.ui.addMessage(`"${q.text}" - ${q.attr}`, 'quote');
        }

        if (this.turn % 25 === 0 && rng.getUniform() < 0.3) {
            const q = QUOTES.camp[Math.floor(rng.getUniform() * QUOTES.camp.length)];
            this.ui.addMessage(`"${q.text}" - ${q.attr}`, 'quote');
        }

        if (this.player.hp < this.player.maxHp * 0.3 && rng.getUniform() < 0.1) {
            this.ui.addMessage('Vultures circle overhead.', 'system');
        }

        if (rng.getUniform() < 0.02) {
            const events = [
                'A dust devil spins across the flats.',
                'The heat shimmers like water on the horizon.',
                'Something howls in the distance.',
                'The sky is the color of hammered copper.',
                'Bones bleach in the sun beside the trail.',
                'A raven watches you from a saguaro.',
                'The wind carries the smell of creosote.',
                'Thunder rumbles over the distant peaks.',
            ];
            this.ui.addMessage(events[Math.floor(rng.getUniform() * events.length)], 'system');
        }
    }

    _respawnEntities() {
        const rng = ROT.RNG;
        for (let i = 0; i < 16; i++) {
            const x = Math.floor(rng.getUniform() * this.map.width);
            const y = Math.floor(rng.getUniform() * this.map.height);
            const dist = Math.abs(x - this.player.x) + Math.abs(y - this.player.y);
            if (dist < 20) continue;
            if (!this.map.isWalkable(x, y)) continue;
            if (this.map.getNearbyLocation(x, y, 6)) continue;

            const zone = this.map.getTerrainZone(x, y);
            const table = SPAWN_TABLES[zone] || SPAWN_TABLES.desert;
            const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
            let roll = rng.getUniform() * totalWeight;
            let chosen = table[0].type;
            for (const entry of table) {
                roll -= entry.weight;
                if (roll <= 0) { chosen = entry.type; break; }
            }

            const entity = new Entity(chosen, x, y);
            this.entities.push(entity);
            this.map.addEntity(entity);
        }
    }

    render() {
        if (!this.display || !this.player) return;

        const display = this.display;
        display.clear();

        this.map.computeFOV(this.player.x, this.player.y, FOV_RADIUS);

        const vpX = Math.max(0, Math.min(this.map.width - VIEWPORT_W, this.player.x - Math.floor(VIEWPORT_W / 2)));
        const vpY = Math.max(0, Math.min(this.map.height - VIEWPORT_H, this.player.y - Math.floor(VIEWPORT_H / 2)));

        for (let vy = 0; vy < VIEWPORT_H; vy++) {
            for (let vx = 0; vx < VIEWPORT_W; vx++) {
                const mx = vpX + vx;
                const my = vpY + vy;

                if (mx >= this.map.width || my >= this.map.height) continue;

                if (this.map.visible[my] && this.map.visible[my][mx]) {
                    const tile = this.map.getTile(mx, my);
                    display.draw(vx, vy, tile.char, tile.fg, tile.bg);
                } else if (this.map.explored[my] && this.map.explored[my][mx]) {
                    const tile = this.map.getTile(mx, my);
                    display.draw(vx, vy, tile.char, this._dimColor(tile.fg), '#0a0804');
                }
            }
        }

        // Draw entities
        for (const entity of this.entities) {
            if (!entity.alive) continue;
            const ex = entity.x - vpX;
            const ey = entity.y - vpY;
            if (ex < 0 || ex >= VIEWPORT_W || ey < 0 || ey >= VIEWPORT_H) continue;
            if (this.map.visible[entity.y] && this.map.visible[entity.y][entity.x]) {
                display.draw(ex, ey, entity.char, entity.fg, '#0d0a04');
            }
        }

        // Draw mules
        for (const mule of this.player.mules) {
            if (!mule.alive) continue;
            const mx = mule.x - vpX;
            const my = mule.y - vpY;
            if (mx < 0 || mx >= VIEWPORT_W || my < 0 || my >= VIEWPORT_H) continue;
            const color = mule.spooked ? '#CD5C5C' : mule.fg;
            display.draw(mx, my, mule.char, color, '#0d0a04');
        }

        // Draw player
        const px = this.player.x - vpX;
        const py = this.player.y - vpY;
        if (px >= 0 && px < VIEWPORT_W && py >= 0 && py < VIEWPORT_H) {
            display.draw(px, py, this.player.char, this.player.fg, '#0d0a04');
        }

        // Draw location labels
        for (const loc of LOCATIONS) {
            const lx = loc.x - vpX;
            const ly = loc.y - vpY - (loc.size || 3) - 2;
            if (lx < 0 || lx >= VIEWPORT_W - loc.name.length || ly < 0 || ly >= VIEWPORT_H) continue;
            if (this.map.explored[loc.y] && this.map.explored[loc.y][loc.x]) {
                for (let ci = 0; ci < loc.name.length; ci++) {
                    if (lx + ci < VIEWPORT_W) {
                        display.draw(lx + ci, ly, loc.name[ci], '#DAA520', '#0d0a04');
                    }
                }
            }
        }
    }

    _dimColor(hex) {
        if (!hex || hex.length < 7) return '#1a1a1a';
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        const factor = 0.3;
        const dr = Math.floor(r * factor);
        const dg = Math.floor(g * factor);
        const db = Math.floor(b * factor);
        return '#' + dr.toString(16).padStart(2, '0') + dg.toString(16).padStart(2, '0') + db.toString(16).padStart(2, '0');
    }

    gameOver() {
        this.state = 'dead';
        this.ui.showDeathScreen(this.player);
    }
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('load', () => {
    window.game = new Game();
    window.game.init();
});
