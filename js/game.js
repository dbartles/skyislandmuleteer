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
        this.state = 'title'; // title, explore, town, contracts, inventory, shop, look, throw, help, dead
        this._contractOptions = [];
        this._shopItems = [];
        this._inputLocked = false;
        this._lookDir = null;
        this._throwItem = null;
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
        this.map.init();

        // Place player near Tucson - outside the town walls
        const tucson = LOCATIONS.find(l => l.name === 'Tucson');
        const startX = tucson.x + 10;
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

        // Spawn entities
        this.entities = [];
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

    _spawnEntities() {
        const rng = ROT.RNG;
        const numEntities = 160 + Math.floor(rng.getUniform() * 80);

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

        // Judge Holden
        const judgeX = 150 + Math.floor(rng.getUniform() * 40);
        const judgeY = 40 + Math.floor(rng.getUniform() * 30);
        if (this.map.isWalkable(judgeX, judgeY)) {
            const judge = new Entity('JUDGE_HOLDEN', judgeX, judgeY);
            this.entities.push(judge);
            this.map.addEntity(judge);
        }

        // The Kid
        const kidX = 130 + Math.floor(rng.getUniform() * 10);
        const kidY = 34 + Math.floor(rng.getUniform() * 8);
        if (this.map.isWalkable(kidX, kidY)) {
            const kid = new Entity('THE_KID', kidX, kidY);
            this.entities.push(kid);
            this.map.addEntity(kid);
        }

        // Tobin
        const tobinX = 120 + Math.floor(rng.getUniform() * 8);
        const tobinY = 32 + Math.floor(rng.getUniform() * 6);
        if (this.map.isWalkable(tobinX, tobinY)) {
            const tobin = new Entity('TOBIN', tobinX, tobinY);
            this.entities.push(tobin);
            this.map.addEntity(tobin);
        }

        // Toadvine
        const tvX = 140 + Math.floor(rng.getUniform() * 40);
        const tvY = 50 + Math.floor(rng.getUniform() * 20);
        if (this.map.isWalkable(tvX, tvY)) {
            const tv = new Entity('TOADVINE', tvX, tvY);
            this.entities.push(tv);
            this.map.addEntity(tv);
        }

        // Glanton + gang
        const gX = 120 + Math.floor(rng.getUniform() * 40);
        const gY = 80 + Math.floor(rng.getUniform() * 20);
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
        const bcX = 110 + Math.floor(rng.getUniform() * 20);
        const bcY = 55 + Math.floor(rng.getUniform() * 10);
        if (this.map.isWalkable(bcX, bcY)) {
            const bc = new Entity('BATHCAT', bcX, bcY);
            this.entities.push(bc);
            this.map.addEntity(bc);
        }

        // Black Jackson
        const bjX = 160 + Math.floor(rng.getUniform() * 30);
        const bjY = 60 + Math.floor(rng.getUniform() * 20);
        if (this.map.isWalkable(bjX, bjY)) {
            const bj = new Entity('BLACK_JACKSON', bjX, bjY);
            this.entities.push(bj);
            this.map.addEntity(bj);
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
        if (rng.getUniform() < 0.6) {
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
        if (loc && (tileType === 'TOWN_DOOR' || tileType === 'TOWN_FLOOR' || tileType === 'CAMPFIRE')) {
            this.ui.showTownScreen(loc, this);
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
            case 'BLACK_JACKSON':
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
            this.ui.hideInventoryScreen();
            // Return to town if we were in one
            const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
            const tileType = this.map.getTileType(this.player.x, this.player.y);
            if (loc && (tileType === 'TOWN_DOOR' || tileType === 'TOWN_FLOOR' || tileType === 'CAMPFIRE')) {
                this.ui.showTownScreen(loc, this);
            } else {
                this.state = 'explore';
            }
            return;
        }

        const fb = document.getElementById('inventory-feedback');

        // Check for equip commands: E+number
        if (key.toLowerCase() === 'e') {
            // Wait for next key
            this._inventoryEquipPending = true;
            if (fb) fb.textContent = 'Equip which item? Press number...';
            return;
        }

        // Check for use commands: U+number
        if (key.toLowerCase() === 'u') {
            this._inventoryUsePending = true;
            if (fb) fb.textContent = 'Use which item? Press number...';
            return;
        }

        const num = parseInt(key);
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
            this.ui.hideShopScreen();
            const loc = this.map.getNearbyLocation(this.player.x, this.player.y, 8);
            if (loc) {
                this.ui.showTownScreen(loc, this);
            } else {
                this.state = 'explore';
            }
            return;
        }

        const num = parseInt(key);
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

        // Refresh shop display then set feedback
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
        for (let i = 0; i < 8; i++) {
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
