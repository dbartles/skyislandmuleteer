// ============================================================
// SKY ISLAND MULETEER - Map Generation
// Copyright (c) 2026 Devin Bartley. MIT License.
// ============================================================

class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.explored = [];
        this.visible = [];
        this.entityMap = {};
        this.locationMap = {};
    }

    init() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.explored[y] = [];
            this.visible[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = 'SAND';
                this.explored[y][x] = false;
                this.visible[y][x] = false;
            }
        }
        this.generate();
    }

    generate() {
        this._generateDesertBase();
        this._generateMountains();
        this._generateRivers();
        this._generateCreeks();
        this._generateCanyons();
        this._generateWashes();
        this._generateVegetation();
        this._generateWaterSources();
        this._generateOreVeins();
        this._generateMineEntrances();
        this._generateRoads();
        this._generateLocations();
        this._generateAtmosphere();
    }

    _generateDesertBase() {
        const rng = ROT.RNG;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const r = rng.getUniform();
                if (r < 0.50) this.tiles[y][x] = 'SAND';
                else if (r < 0.70) this.tiles[y][x] = 'HARD_PAN';
                else if (r < 0.82) this.tiles[y][x] = 'SCRUB';
                else if (r < 0.90) this.tiles[y][x] = 'DUST';
                else if (r < 0.95) this.tiles[y][x] = 'DRY_GRASS';
                else this.tiles[y][x] = 'GRAVEL';
            }
        }
    }

    _generateMountains() {
        for (const range of MOUNTAIN_RANGES) {
            this._placeRange(range);
        }
    }

    _placeRange(range) {
        const rng = ROT.RNG;
        for (let y = range.cy - range.ry - 6; y <= range.cy + range.ry + 6; y++) {
            for (let x = range.cx - range.rx - 6; x <= range.cx + range.rx + 6; x++) {
                if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
                const dx = (x - range.cx) / range.rx;
                const dy = (y - range.cy) / range.ry;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const noise = rng.getUniform() * 0.3;
                const elevation = 1.0 - dist + noise * 0.5;

                if (elevation > 0.9) {
                    this.tiles[y][x] = 'PEAK';
                } else if (elevation > 0.65) {
                    this.tiles[y][x] = rng.getUniform() < 0.6 ? 'MOUNTAIN' : 'ROCK';
                } else if (elevation > 0.45) {
                    const r = rng.getUniform();
                    if (r < 0.25) this.tiles[y][x] = 'JUNIPER';
                    else if (r < 0.40) this.tiles[y][x] = 'OAK';
                    else if (r < 0.48) this.tiles[y][x] = 'PINE';
                    else if (r < 0.58) this.tiles[y][x] = 'BOULDER';
                    else this.tiles[y][x] = 'FOOTHILL';
                } else if (elevation > 0.25) {
                    const r = rng.getUniform();
                    if (r < 0.3) this.tiles[y][x] = 'FOOTHILL';
                    else if (r < 0.4) this.tiles[y][x] = 'BOULDER';
                    else if (r < 0.5) this.tiles[y][x] = 'DRY_GRASS';
                    else this.tiles[y][x] = 'GRAVEL';
                }
            }
        }
    }

    _generateRivers() {
        for (const river of RIVERS) {
            this._carveRiver(river.points);
        }
    }

    _carveRiver(points) {
        const rng = ROT.RNG;
        for (let i = 0; i < points.length - 1; i++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[i + 1];
            const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
            for (let s = 0; s <= steps; s++) {
                const t = steps === 0 ? 0 : s / steps;
                let rx = Math.round(x1 + (x2 - x1) * t + (rng.getUniform() - 0.5) * 3);
                let ry = Math.round(y1 + (y2 - y1) * t);
                if (rx < 1 || rx >= this.width - 1 || ry < 0 || ry >= this.height) continue;
                // River is 2-3 tiles wide
                const width = 2 + (rng.getUniform() < 0.3 ? 1 : 0);
                for (let w = 0; w < width; w++) {
                    const wx = rx + w;
                    if (wx >= 0 && wx < this.width) {
                        this.tiles[ry][wx] = 'RIVER';
                        if (rng.getUniform() < 0.08) {
                            this.tiles[ry][wx] = 'RIVER_FORD';
                        }
                    }
                }
                // Banks with vegetation
                for (let side = -1; side <= width; side += width + 1) {
                    const bx = rx + side;
                    if (bx >= 0 && bx < this.width && this._isDesert(this.tiles[ry][bx])) {
                        if (rng.getUniform() < 0.4) this.tiles[ry][bx] = rng.getUniform() < 0.5 ? 'MESQUITE' : 'PALO_VERDE';
                        else this.tiles[ry][bx] = 'DRY_GRASS';
                    }
                }
            }
        }
    }

    _generateCreeks() {
        const rng = ROT.RNG;
        // Generate creeks flowing from mountains - 15-60 tiles long
        for (const range of MOUNTAIN_RANGES) {
            const numCreeks = 2 + Math.floor(rng.getUniform() * 3);
            for (let c = 0; c < numCreeks; c++) {
                const angle = rng.getUniform() * Math.PI * 2;
                let cx = Math.round(range.cx + Math.cos(angle) * (range.rx * 0.8));
                let cy = Math.round(range.cy + Math.sin(angle) * (range.ry * 0.8));
                const length = 15 + Math.floor(rng.getUniform() * 45);
                for (let s = 0; s < length; s++) {
                    if (cx < 0 || cx >= this.width || cy < 0 || cy >= this.height) break;
                    const tile = this.tiles[cy][cx];
                    if (this._isDesert(tile) || tile === 'FOOTHILL' || tile === 'CANYON_FLOOR' || tile === 'DRY_GRASS') {
                        this.tiles[cy][cx] = 'CREEK';
                    }
                    // Flow generally away from mountain center + wobble
                    const dx = cx - range.cx;
                    const dy = cy - range.cy;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        cx += dx > 0 ? 1 : -1;
                    } else {
                        cy += dy > 0 ? 1 : -1;
                    }
                    if (rng.getUniform() < 0.3) cx += rng.getUniform() < 0.5 ? 1 : -1;
                    if (rng.getUniform() < 0.3) cy += rng.getUniform() < 0.5 ? 1 : -1;
                    cx = Math.max(0, Math.min(this.width - 1, cx));
                    cy = Math.max(0, Math.min(this.height - 1, cy));
                }
            }
        }
    }

    _isDesert(tile) {
        return ['SAND', 'HARD_PAN', 'DUST', 'SCRUB', 'DRY_GRASS', 'GRAVEL'].includes(tile);
    }

    _generateCanyons() {
        const rng = ROT.RNG;
        for (const range of MOUNTAIN_RANGES) {
            const numCanyons = 1 + Math.floor(rng.getUniform() * 2);
            for (let c = 0; c < numCanyons; c++) {
                this._carveCanyon(range);
            }
        }
    }

    _carveCanyon(range) {
        const rng = ROT.RNG;
        const angle = rng.getUniform() * Math.PI * 2;
        const startX = Math.round(range.cx + Math.cos(angle) * (range.rx + 3));
        const startY = Math.round(range.cy + Math.sin(angle) * (range.ry + 3));
        const endX = Math.round(range.cx + Math.cos(angle + Math.PI) * (range.rx + 3));
        const endY = Math.round(range.cy + Math.sin(angle + Math.PI) * (range.ry + 3));

        let cx = startX, cy = startY;
        let steps = 0;
        const maxSteps = (range.rx + range.ry) * 4;

        while (steps < maxSteps && (Math.abs(cx - endX) > 1 || Math.abs(cy - endY) > 1)) {
            if (cx < 0 || cx >= this.width || cy < 0 || cy >= this.height) break;
            this.tiles[cy][cx] = 'CANYON_FLOOR';
            const perpAngle = angle + Math.PI / 2;
            for (let side = -1; side <= 1; side += 2) {
                const wx = Math.round(cx + Math.cos(perpAngle) * side);
                const wy = Math.round(cy + Math.sin(perpAngle) * side);
                if (wx >= 0 && wx < this.width && wy >= 0 && wy < this.height) {
                    if (this.tiles[wy][wx] !== 'CANYON_FLOOR') {
                        this.tiles[wy][wx] = 'CANYON_WALL';
                    }
                }
            }
            const dx = endX - cx, dy = endY - cy;
            if (rng.getUniform() < 0.6) cx += dx > 0 ? 1 : (dx < 0 ? -1 : 0);
            if (rng.getUniform() < 0.6) cy += dy > 0 ? 1 : (dy < 0 ? -1 : 0);
            if (rng.getUniform() < 0.3) cx += rng.getUniform() < 0.5 ? 1 : -1;
            if (rng.getUniform() < 0.3) cy += rng.getUniform() < 0.5 ? 1 : -1;
            cx = Math.max(0, Math.min(this.width - 1, cx));
            cy = Math.max(0, Math.min(this.height - 1, cy));
            steps++;
        }
    }

    _generateWashes() {
        const rng = ROT.RNG;
        const numWashes = 40 + Math.floor(rng.getUniform() * 20);
        for (let i = 0; i < numWashes; i++) {
            let x = Math.floor(rng.getUniform() * this.width);
            let y = Math.floor(rng.getUniform() * this.height);
            const length = 20 + Math.floor(rng.getUniform() * 40);
            for (let s = 0; s < length; s++) {
                if (x < 0 || x >= this.width || y < 0 || y >= this.height) break;
                if (this._isDesert(this.tiles[y][x])) {
                    this.tiles[y][x] = 'DRY_WASH';
                }
                x += rng.getUniform() < 0.5 ? 1 : (rng.getUniform() < 0.5 ? -1 : 0);
                y += rng.getUniform() < 0.7 ? 1 : 0;
            }
        }
    }

    _generateVegetation() {
        const rng = ROT.RNG;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this._isDesert(this.tiles[y][x])) continue;
                const r = rng.getUniform();
                if (r < 0.015 && y < this.height * 0.7) this.tiles[y][x] = 'SAGUARO';
                else if (r < 0.025) this.tiles[y][x] = 'CHOLLA';
                else if (r < 0.032) this.tiles[y][x] = 'PRICKLY_PEAR';
                else if (r < 0.036) this.tiles[y][x] = 'BARREL_CACTUS';
                else if (r < 0.042) this.tiles[y][x] = 'OCOTILLO';
                else if (r < 0.048) this.tiles[y][x] = 'MESQUITE';
                else if (r < 0.052) this.tiles[y][x] = 'PALO_VERDE';
                else if (r < 0.055) this.tiles[y][x] = 'IRONWOOD';
            }
        }
    }

    _generateWaterSources() {
        const rng = ROT.RNG;
        // TINAJAS (tanks) in the desert - larger clearings
        for (let i = 0; i < 30; i++) {
            let attempts = 0;
            while (attempts < 80) {
                const x = Math.floor(rng.getUniform() * this.width);
                const y = Math.floor(rng.getUniform() * this.height);
                if (this._isDesert(this.tiles[y][x])) {
                    // TINAJAS are 2-4 tiles with surrounding grass
                    const size = 1 + Math.floor(rng.getUniform() * 3);
                    for (let dy = -size; dy <= size; dy++) {
                        for (let dx = -size; dx <= size; dx++) {
                            const nx = x + dx, ny = y + dy;
                            if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                            const d = Math.abs(dx) + Math.abs(dy);
                            if (d <= 1) {
                                this.tiles[ny][nx] = 'TINAJA';
                            } else if (d <= size && this._isDesert(this.tiles[ny][nx])) {
                                this.tiles[ny][nx] = 'DRY_GRASS';
                            }
                        }
                    }
                    break;
                }
                attempts++;
            }
        }
        // Springs near mountains
        for (const range of MOUNTAIN_RANGES) {
            const numSprings = 1 + Math.floor(rng.getUniform() * 2);
            for (let s = 0; s < numSprings; s++) {
                const angle = rng.getUniform() * Math.PI * 2;
                const sx = Math.round(range.cx + Math.cos(angle) * (range.rx + 2));
                const sy = Math.round(range.cy + Math.sin(angle) * (range.ry + 2));
                if (sx >= 0 && sx < this.width && sy >= 0 && sy < this.height) {
                    this.tiles[sy][sx] = 'SPRING';
                }
            }
        }
    }

    _generateOreVeins() {
        const rng = ROT.RNG;
        // Ore veins near mountains
        for (const range of MOUNTAIN_RANGES) {
            const numVeins = 1 + Math.floor(rng.getUniform() * 3);
            for (let v = 0; v < numVeins; v++) {
                const angle = rng.getUniform() * Math.PI * 2;
                const dist = range.rx * 0.5 + rng.getUniform() * range.rx * 0.5;
                const ox = Math.round(range.cx + Math.cos(angle) * dist);
                const oy = Math.round(range.cy + Math.sin(angle) * dist);
                // Place a cluster of 2-5 ore tiles
                const count = 2 + Math.floor(rng.getUniform() * 4);
                for (let i = 0; i < count; i++) {
                    const vx = ox + Math.floor(rng.getUniform() * 3) - 1;
                    const vy = oy + Math.floor(rng.getUniform() * 3) - 1;
                    if (vx >= 0 && vx < this.width && vy >= 0 && vy < this.height) {
                        const t = this.tiles[vy][vx];
                        if (t === 'FOOTHILL' || t === 'GRAVEL' || this._isDesert(t)) {
                            this.tiles[vy][vx] = 'ORE_VEIN';
                        }
                    }
                }
            }
        }
    }

    _generateMineEntrances() {
        const rng = ROT.RNG;
        // Place mine entrances near some mountain ranges
        for (const range of MOUNTAIN_RANGES) {
            if (rng.getUniform() < 0.5) continue; // Only ~half of ranges get mines
            const numMines = 1 + Math.floor(rng.getUniform() * 2);
            for (let m = 0; m < numMines; m++) {
                const angle = rng.getUniform() * Math.PI * 2;
                const dist = range.rx * 0.6 + rng.getUniform() * range.rx * 0.3;
                const mx = Math.round(range.cx + Math.cos(angle) * dist);
                const my = Math.round(range.cy + Math.sin(angle) * dist);
                if (mx >= 1 && mx < this.width - 1 && my >= 1 && my < this.height - 1) {
                    const t = this.tiles[my][mx];
                    if (t === 'FOOTHILL' || t === 'GRAVEL' || this._isDesert(t)) {
                        this.tiles[my][mx] = 'MINE_ENTRANCE';
                    }
                }
            }
        }
    }

    _generateRoads() {
        for (let i = 0; i < LOCATIONS.length; i++) {
            for (let j = i + 1; j < LOCATIONS.length; j++) {
                const a = LOCATIONS[i];
                const b = LOCATIONS[j];
                const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
                if (dist < 120) {
                    this._carveRoad(a.x, a.y, b.x, b.y, dist < 60 ? 'ROAD' : 'TRAIL');
                }
            }
        }
    }

    _carveRoad(x1, y1, x2, y2, tileType) {
        const rng = ROT.RNG;
        let x = x1, y = y1;
        let steps = 0;
        const maxSteps = Math.abs(x2 - x1) + Math.abs(y2 - y1) + 40;
        while (steps < maxSteps && (Math.abs(x - x2) > 1 || Math.abs(y - y2) > 1)) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                const current = this.tiles[y][x];
                if (this._isDesert(current) || current === 'DRY_GRASS' || current === 'FOOTHILL' || current === 'GRAVEL') {
                    this.tiles[y][x] = tileType;
                }
            }
            const dx = x2 - x, dy = y2 - y;
            if (Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && rng.getUniform() < 0.5)) {
                x += dx > 0 ? 1 : -1;
            } else {
                y += dy > 0 ? 1 : -1;
            }
            if (rng.getUniform() < 0.12) x += rng.getUniform() < 0.5 ? 1 : -1;
            if (rng.getUniform() < 0.12) y += rng.getUniform() < 0.5 ? 1 : -1;
            x = Math.max(0, Math.min(this.width - 1, x));
            y = Math.max(0, Math.min(this.height - 1, y));
            steps++;
        }
    }

    _generateLocations() {
        for (const loc of LOCATIONS) {
            this._placeLocation(loc);
            this.locationMap[loc.x + ',' + loc.y] = loc;
        }
    }

    _placeLocation(loc) {
        const size = loc.size || 3;

        if (loc.type === 'tanks') {
            // Hueco Tanks: TINAJA center, bones ring, boulder/canyon wall outer ring
            this.tiles[loc.y][loc.x] = 'CAMPFIRE';
            // Inner ring:  water basin
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = loc.x + dx, ny = loc.y + dy;
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        this.tiles[ny][nx] = 'TINAJA';
                    }
                }
            }
            // Middle ring: bones and town floor
            for (let dy = -3; dy <= 3; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist < 2 || dist > 4) continue;
                    const nx = loc.x + dx, ny = loc.y + dy;
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        if (dist === 2) {
                            this.tiles[ny][nx] = 'BONES';
                        } else {
                            this.tiles[ny][nx] = 'TOWN_FLOOR';
                        }
                    }
                }
            }
            // Outer ring: sandstone cliffs (boulders and canyon walls)
            for (let dy = -size; dy <= size; dy++) {
                for (let dx = -size; dx <= size; dx++) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist < 5 || dist > size + 1) continue;
                    const nx = loc.x + dx, ny = loc.y + dy;
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        if (Math.abs(dx) === size || Math.abs(dy) === size) {
                            this.tiles[ny][nx] = 'CANYON_WALL';
                        } else {
                            this.tiles[ny][nx] = ROT.RNG.getUniform() < 0.5 ? 'BOULDER' : 'CANYON_WALL';
                        }
                    }
                }
            }
            return;
        }

        if (loc.type === 'camp') {
            this.tiles[loc.y][loc.x] = 'CAMPFIRE';
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = loc.x + dx, ny = loc.y + dy;
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        this.tiles[ny][nx] = 'TOWN_FLOOR';
                    }
                }
            }
            return;
        }

        // Large walled town - clear ALL vegetation inside
        const wallSize = size + 1;
        for (let dy = -wallSize; dy <= wallSize; dy++) {
            for (let dx = -wallSize; dx <= wallSize; dx++) {
                const nx = loc.x + dx, ny = loc.y + dy;
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                const onEdge = Math.abs(dx) === wallSize || Math.abs(dy) === wallSize;
                if (onEdge) {
                    this.tiles[ny][nx] = loc.type === 'fort' ? 'FORT_WALL' : 'TOWN_WALL';
                } else {
                    this.tiles[ny][nx] = 'TOWN_FLOOR';
                }
            }
        }
        // Doors on each side
        this.tiles[loc.y][loc.x - wallSize] = 'TOWN_DOOR';
        this.tiles[loc.y][loc.x + wallSize] = 'TOWN_DOOR';
        this.tiles[loc.y - wallSize][loc.x] = 'TOWN_DOOR';
        this.tiles[loc.y + wallSize][loc.x] = 'TOWN_DOOR';
        // Center campfire
        this.tiles[loc.y][loc.x] = 'CAMPFIRE';
        // A few interior buildings
        if (size >= 4) {
            const bx = loc.x - size + 2, by = loc.y - size + 2;
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    if (bx + dx >= 0 && bx + dx < this.width && by + dy >= 0 && by + dy < this.height) {
                        this.tiles[by + dy][bx + dx] = 'BUILDING';
                    }
                }
            }
            const bx2 = loc.x + size - 3, by2 = loc.y + size - 3;
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    if (bx2 + dx >= 0 && bx2 + dx < this.width && by2 + dy >= 0 && by2 + dy < this.height) {
                        this.tiles[by2 + dy][bx2 + dx] = 'BUILDING';
                    }
                }
            }
        }
    }

    _generateAtmosphere() {
        const rng = ROT.RNG;
        for (let i = 0; i < 180; i++) {
            const x = Math.floor(rng.getUniform() * this.width);
            const y = Math.floor(rng.getUniform() * this.height);
            if (this._isDesert(this.tiles[y][x])) {
                const r = rng.getUniform();
                if (r < 0.4) this.tiles[y][x] = 'BONES';
                else if (r < 0.7) this.tiles[y][x] = 'RUINS';
                else this.tiles[y][x] = 'GRAVE';
            }
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return TERRAIN.ROCK;
        return TERRAIN[this.tiles[y][x]] || TERRAIN.SAND;
    }

    getTileType(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 'ROCK';
        return this.tiles[y][x];
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const tile = TERRAIN[this.tiles[y][x]];
        return tile ? tile.walkable : false;
    }

    isSeeThrough(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const tile = TERRAIN[this.tiles[y][x]];
        return tile ? tile.seeThrough : false;
    }

    getTerrainZone(x, y) {
        const type = this.getTileType(x, y);
        if (['CANYON_FLOOR', 'CANYON_WALL'].includes(type)) return 'canyon';
        if (['MOUNTAIN', 'PEAK', 'ROCK', 'FOOTHILL', 'MOUNTAIN_PASS', 'JUNIPER', 'PINE', 'OAK'].includes(type)) return 'mountain';
        if (['TRAIL', 'ROAD'].includes(type)) return 'road';
        return 'desert';
    }

    computeFOV(px, py, radius) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.visible[y][x] = false;
            }
        }
        const fov = new ROT.FOV.PreciseShadowcasting((x, y) => this.isSeeThrough(x, y));
        fov.compute(px, py, radius, (x, y) => {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.visible[y][x] = true;
                this.explored[y][x] = true;
            }
        });
    }

    getLocation(x, y) {
        return this.locationMap[x + ',' + y] || null;
    }

    getNearbyLocation(x, y, radius) {
        for (const loc of LOCATIONS) {
            const dist = Math.abs(loc.x - x) + Math.abs(loc.y - y);
            if (dist <= radius) return loc;
        }
        return null;
    }

    addEntity(entity) {
        const key = entity.x + ',' + entity.y;
        if (!this.entityMap[key]) this.entityMap[key] = [];
        this.entityMap[key].push(entity);
    }

    removeEntity(entity) {
        const key = entity.x + ',' + entity.y;
        if (this.entityMap[key]) {
            this.entityMap[key] = this.entityMap[key].filter(e => e !== entity);
            if (this.entityMap[key].length === 0) delete this.entityMap[key];
        }
    }

    moveEntity(entity, newX, newY) {
        this.removeEntity(entity);
        entity.x = newX;
        entity.y = newY;
        this.addEntity(entity);
    }

    getEntitiesAt(x, y) {
        return this.entityMap[x + ',' + y] || [];
    }
}
