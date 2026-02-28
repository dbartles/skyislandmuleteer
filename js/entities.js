// ============================================================
// SKY ISLAND MULETEER - Entities
// ============================================================

class Entity {
    constructor(type, x, y) {
        const data = ENTITY_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.char = data.char;
        this.fg = data.fg;
        this.name = data.name;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.atk = data.atk;
        this.def = data.def;
        this.speed = data.speed;
        this.hostile = data.hostile;
        this.aggroRange = data.aggroRange;
        this.xp = data.xp;
        this.special = data.special || false;
        this.desc = data.desc || '';
        this.alive = true;
        this.stunned = false;
    }

    act(game) {
        if (!this.alive || this.stunned) { this.stunned = false; return; }
        if (this.hostile && this.aggroRange > 0) this._hostileAI(game);
        else if (this.special) this._specialAI(game);
    }

    _hostileAI(game) {
        const px = game.player.x, py = game.player.y;
        const dist = Math.abs(this.x - px) + Math.abs(this.y - py);
        if (dist <= this.aggroRange && game.map.visible[this.y] && game.map.visible[this.y][this.x]) {
            if (dist <= 1) { game.combat.entityAttacksPlayer(this); return; }
            const path = this._pathToward(game, px, py);
            if (path && path.length > 1) {
                const [nx, ny] = path[1];
                const muleAtPos = game.player.mules.find(m => m.alive && m.x === nx && m.y === ny);
                if (muleAtPos) { game.combat.entityAttacksMule(this, muleAtPos); return; }
                if (game.map.isWalkable(nx, ny)) game.map.moveEntity(this, nx, ny);
            }
        } else {
            this._wander(game);
        }
    }

    _specialAI(game) {
        if (this.type === 'JUDGE_HOLDEN') this._judgeAI(game);
        else if (ROT.RNG.getUniform() < 0.1) this._wander(game);
    }

    _judgeAI(game) {
        const dist = Math.abs(this.x - game.player.x) + Math.abs(this.y - game.player.y);
        if (dist <= 3 && ROT.RNG.getUniform() < 0.06) {
            const q = QUOTES.judge[Math.floor(ROT.RNG.getUniform() * QUOTES.judge.length)];
            game.ui.addMessage(`The Judge speaks: "${q.text}"`, 'quote');
        }
        if (ROT.RNG.getUniform() < 0.02) {
            const angle = ROT.RNG.getUniform() * Math.PI * 2;
            const r = 10 + Math.floor(ROT.RNG.getUniform() * 15);
            const nx = Math.round(game.player.x + Math.cos(angle) * r);
            const ny = Math.round(game.player.y + Math.sin(angle) * r);
            if (nx >= 0 && nx < game.map.width && ny >= 0 && ny < game.map.height && game.map.isWalkable(nx, ny)) {
                game.map.moveEntity(this, nx, ny);
            }
        }
    }

    _wander(game) {
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        const dir = dirs[Math.floor(ROT.RNG.getUniform() * dirs.length)];
        const nx = this.x + dir[0], ny = this.y + dir[1];
        if (game.map.isWalkable(nx, ny) && game.map.getEntitiesAt(nx, ny).length === 0) {
            game.map.moveEntity(this, nx, ny);
        }
    }

    _pathToward(game, tx, ty) {
        const astar = new ROT.Path.AStar(tx, ty, (x, y) => game.map.isWalkable(x, y), { topology: 4 });
        const path = [];
        astar.compute(this.x, this.y, (x, y) => path.push([x, y]));
        return path;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) { this.hp = 0; this.alive = false; }
    }
}

class Mule {
    constructor(name) {
        this.name = name;
        this.char = 'm';
        this.fg = '#8B7355';
        this.x = 0; this.y = 0;
        this.hp = 10; this.maxHp = 10;
        this.thirst = 80; this.maxThirst = 100;
        this.cargo = null; this.cargoWeight = 0; this.maxCarry = 50;
        this.alive = true; this.spooked = false; this.spookTimer = 0;
    }

    update(game) {
        if (!this.alive) return;
        const tile = game.map.getTile(this.x, this.y);
        this.thirst += tile.thirstCost * 0.15;
        this.thirst = Math.max(0, Math.min(this.maxThirst, this.thirst));
        if (tile.thirstCost < 0) game.ui.addMessage(`${this.name} drinks from the ${tile.name.toLowerCase()}.`, 'water');
        if (this.thirst <= 0) {
            this.hp -= 1;
            game.ui.addMessage(`${this.name} is dying of thirst!`, 'danger');
            if (this.hp <= 0) { this.alive = false; game.ui.addMessage(`${this.name} has perished. The cargo is lost.`, 'danger'); }
        } else if (this.thirst < 20 && ROT.RNG.getUniform() < 0.1) {
            game.ui.addMessage(`${this.name} brays desperately for water.`, 'danger');
        }
        if (this.spooked) { this.spookTimer--; if (this.spookTimer <= 0) { this.spooked = false; game.ui.addMessage(`${this.name} calms down.`, 'info'); } }
    }

    spook(game) {
        if (this.spooked) return;
        this.spooked = true;
        this.spookTimer = 3 + Math.floor(ROT.RNG.getUniform() * 4);
        game.ui.addMessage(`${this.name} is spooked!`, 'danger');
    }

    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) { this.hp = 0; this.alive = false; } }
}

class Player {
    constructor(x, y) {
        this.char = '@'; this.fg = '#F0E0C0';
        this.x = x; this.y = y;
        this.hp = PLAYER_DEFAULTS.hp; this.maxHp = PLAYER_DEFAULTS.maxHp;
        this.atk = PLAYER_DEFAULTS.atk; this.def = PLAYER_DEFAULTS.def;
        this.gold = PLAYER_DEFAULTS.gold;
        this.thirst = PLAYER_DEFAULTS.thirst; this.maxThirst = PLAYER_DEFAULTS.maxThirst;
        this.xp = PLAYER_DEFAULTS.xp; this.level = PLAYER_DEFAULTS.level;
        this.alive = true;
        this.mules = [];
        // Equipment slots
        this.equipment = { weapon: null, head: null, body: null, feet: null };
        // Inventory
        this.inventory = [
            { ...ITEMS.KNIFE },
            { ...ITEMS.WATER_SKIN },
            { ...ITEMS.JERKY },
            { ...ITEMS.JERKY },
            { ...ITEMS.COTTON_SHIRT },
            { ...ITEMS.ROCK },
        ];
        // Start with knife equipped
        this.equipment.weapon = { ...ITEMS.KNIFE };
        this.contract = null;
        this.kills = 0; this.deliveries = 0; this.turnsPlayed = 0;
    }

    addMule() {
        const aliveMules = this.mules.filter(m => m.alive).length;
        if (aliveMules >= MAX_MULES) return false;
        const nameIdx = this.mules.length % MULE_NAMES.length;
        const mule = new Mule(MULE_NAMES[nameIdx]);
        mule.x = this.x; mule.y = this.y;
        this.mules.push(mule);
        return true;
    }

    removeDeadMules() {
        const dead = this.mules.filter(m => !m.alive);
        if (dead.length > 0) {
            this.mules = this.mules.filter(m => m.alive);
            return dead.length;
        }
        return 0;
    }

    moveMules(oldX, oldY) {
        let prevX = oldX, prevY = oldY;
        for (const mule of this.mules) {
            if (!mule.alive) continue;
            if (mule.spooked) continue;
            const oldMX = mule.x, oldMY = mule.y;
            mule.x = prevX; mule.y = prevY;
            prevX = oldMX; prevY = oldMY;
        }
    }

    getAttack() {
        let a = this.atk;
        if (this.equipment.weapon) a += this.equipment.weapon.atk || 0;
        return a;
    }

    getDefense() {
        let d = this.def;
        for (const slot of ['head', 'body', 'feet']) {
            if (this.equipment[slot]) d += this.equipment[slot].def || 0;
        }
        return d;
    }

    takeDamage(amount) {
        const reduced = Math.max(1, amount - this.getDefense());
        this.hp -= reduced;
        if (this.hp <= 0) { this.hp = 0; this.alive = false; }
        return reduced;
    }

    heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }

    checkLevelUp(game) {
        const needed = this.level * 20;
        if (this.xp >= needed) {
            this.level++;
            this.xp -= needed;
            this.maxHp += 3;
            this.hp = Math.min(this.hp + 5, this.maxHp);
            this.atk += 1;
            this.def += (this.level % 2 === 0) ? 1 : 0;
            game.ui.addMessage(`Level ${this.level}. The desert hardens you.`, 'gold');
        }
    }

    updateThirst(game) {
        const tile = game.map.getTile(this.x, this.y);
        this.thirst -= tile.thirstCost * 0.25;
        this.thirst = Math.max(0, Math.min(this.maxThirst, this.thirst));
        if (tile.thirstCost < 0) game.ui.addMessage(`You drink from the ${tile.name.toLowerCase()}.`, 'water');
        if (this.thirst <= 0) { this.hp -= 1; game.ui.addMessage('You are dying of thirst!', 'danger'); }
        else if (this.thirst < 20 && ROT.RNG.getUniform() < 0.15) game.ui.addMessage('Your throat is parched. Find water.', 'danger');
    }

    equipItem(item) {
        const slot = item.slot;
        if (!slot) return false;
        // Unequip current item in slot
        if (this.equipment[slot]) {
            this.inventory.push(this.equipment[slot]);
        }
        // Remove from inventory and equip
        const idx = this.inventory.indexOf(item);
        if (idx >= 0) this.inventory.splice(idx, 1);
        this.equipment[slot] = item;
        return true;
    }

    unequipSlot(slot) {
        if (!this.equipment[slot]) return false;
        this.inventory.push(this.equipment[slot]);
        this.equipment[slot] = null;
        return true;
    }

    sellItem(item) {
        const idx = this.inventory.indexOf(item);
        if (idx < 0) return 0;
        const price = Math.max(1, Math.floor((item.value || 1) * 0.5));
        this.inventory.splice(idx, 1);
        this.gold += price;
        return price;
    }
}
