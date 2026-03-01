// ============================================================
// SKY ISLAND MULETEER - Game Data
// Copyright (c) 2026 Devin Bartley. MIT License.
// Inspired by Blood Meridian by Cormac McCarthy.
// Quotes used under fair use.
// All terrain, entities, items, locations, and quotes
// Edit this file to change game content without touching code
// ============================================================

const MAP_WIDTH = 560;
const MAP_HEIGHT = 280;
const VIEWPORT_W = 65;
const VIEWPORT_H = 33;
const FOV_RADIUS = 14;
const MAX_MULES = 8;

// ---- TERRAIN DEFINITIONS ----
const TERRAIN = {
    SAND:           { char: '.', fg: '#C4A882', bg: '#1a1206', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Desert sand' },
    HARD_PAN:       { char: '.', fg: '#A0926B', bg: '#15100a', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Hard pan' },
    DUST:           { char: ':', fg: '#8B7B62', bg: '#1a1206', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 2, name: 'Alkali dust' },
    SCRUB:          { char: ';', fg: '#7A7A52', bg: '#1a1206', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Creosote scrub' },
    DRY_GRASS:      { char: '"', fg: '#BDB76B', bg: '#1a1206', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Dry grass' },
    GRAVEL:         { char: ':', fg: '#9E8E7E', bg: '#181008', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Gravel wash' },
    SAGUARO:        { char: '|', fg: '#5B7A3A', bg: '#1a1206', walkable: false, seeThrough: true,  damage: 1, thirstCost: 0, name: 'Saguaro cactus' },
    CHOLLA:         { char: '*', fg: '#8FA63A', bg: '#1a1206', walkable: true,  seeThrough: true,  damage: 2, thirstCost: 1, name: 'Cholla cactus' },
    PRICKLY_PEAR:   { char: 'o', fg: '#4A7A32', bg: '#1a1206', walkable: true,  seeThrough: true,  damage: 1, thirstCost: 1, name: 'Prickly pear' },
    BARREL_CACTUS:  { char: 'O', fg: '#5A8A2A', bg: '#1a1206', walkable: false, seeThrough: true,  damage: 1, thirstCost: 0, name: 'Barrel cactus' },
    OCOTILLO:       { char: '/', fg: '#8B5A2B', bg: '#1a1206', walkable: false, seeThrough: true,  damage: 0, thirstCost: 0, name: 'Ocotillo' },
    MESQUITE:       { char: 'T', fg: '#5A6B3A', bg: '#12100a', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Mesquite tree' },
    PALO_VERDE:     { char: 'Y', fg: '#7A9A32', bg: '#12100a', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Palo verde tree' },
    IRONWOOD:       { char: 'T', fg: '#4A5A3A', bg: '#12100a', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Ironwood tree' },
    JUNIPER:        { char: 'f', fg: '#3A6A3A', bg: '#0e120a', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Juniper' },
    PINE:           { char: 'T', fg: '#2A5A2A', bg: '#0a120a', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Pine tree' },
    OAK:            { char: 'T', fg: '#4A6A32', bg: '#0a120a', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Oak tree' },
    ROCK:           { char: '#', fg: '#706860', bg: '#181510', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Rock face' },
    BOULDER:        { char: '0', fg: '#8A7A6A', bg: '#181510', walkable: false, seeThrough: true,  damage: 0, thirstCost: 0, name: 'Boulder' },
    CANYON_WALL:    { char: '#', fg: '#8B5A3A', bg: '#2a1a0e', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Canyon wall' },
    CANYON_FLOOR:   { char: '.', fg: '#A07A5A', bg: '#201208', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Canyon floor' },
    MOUNTAIN:       { char: '^', fg: '#808888', bg: '#181818', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Mountain' },
    MOUNTAIN_PASS:  { char: 'v', fg: '#908878', bg: '#1a1510', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Mountain pass' },
    PEAK:           { char: 'A', fg: '#B0B0B0', bg: '#1a1a1a', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Mountain peak' },
    FOOTHILL:       { char: 'n', fg: '#8A7A6A', bg: '#181208', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Foothills' },
    CREEK:          { char: '~', fg: '#5A8AAA', bg: '#0a1520', walkable: true,  seeThrough: true,  damage: 0, thirstCost: -3, name: 'Creek' },
    RIVER:          { char: '~', fg: '#4682B4', bg: '#0a1828', walkable: false, seeThrough: true,  damage: 0, thirstCost: 0, name: 'River' },
    RIVER_FORD:     { char: '~', fg: '#5A92B4', bg: '#0a1520', walkable: true,  seeThrough: true,  damage: 0, thirstCost: -3, name: 'River ford' },
    TINAJA:         { char: 'O', fg: '#3A7ACA', bg: '#0a1828', walkable: true,  seeThrough: true,  damage: 0, thirstCost: -8, name: 'Tinaja' },
    SPRING:         { char: 'o', fg: '#4A8ABA', bg: '#0a1520', walkable: true,  seeThrough: true,  damage: 0, thirstCost: -5, name: 'Desert spring' },
    DRY_WASH:       { char: '~', fg: '#B0A080', bg: '#181208', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Dry wash' },
    TRAIL:          { char: '.', fg: '#DEB887', bg: '#1a1408', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Trail' },
    ROAD:           { char: '=', fg: '#C4A870', bg: '#1a1408', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Road' },
    RUINS:          { char: '%', fg: '#7A6A5A', bg: '#181510', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Ruins' },
    BONES:          { char: '%', fg: '#E8E0D0', bg: '#1a1206', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Bleached bones' },
    ORE_VEIN:       { char: '&', fg: '#C0A030', bg: '#181510', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Ore vein', mineable: true },
    MINE_ENTRANCE:  { char: '>', fg: '#DAA520', bg: '#181510', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 0, name: 'Mine entrance' },
    MINE_FLOOR:     { char: '.', fg: '#706860', bg: '#0e0c08', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 0, name: 'Mine tunnel' },
    MINE_WALL:      { char: '#', fg: '#504840', bg: '#0a0806', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Mine wall' },
    MINE_ORE:       { char: '&', fg: '#E0C040', bg: '#0e0c08', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 0, name: 'Rich ore vein', mineable: true },
    MINE_SUPPORT:   { char: 'H', fg: '#8B7355', bg: '#0e0c08', walkable: false, seeThrough: true,  damage: 0, thirstCost: 0, name: 'Mine support beam' },
    TOWN_WALL:      { char: '#', fg: '#B89868', bg: '#2a1e10', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Adobe wall' },
    TOWN_FLOOR:     { char: '.', fg: '#C8A878', bg: '#201808', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 0, name: 'Town square' },
    TOWN_DOOR:      { char: '+', fg: '#DAA520', bg: '#201808', walkable: true,  seeThrough: false, damage: 0, thirstCost: 0, name: 'Doorway' },
    BUILDING:       { char: '#', fg: '#A08060', bg: '#201810', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Building' },
    FORT_WALL:      { char: '#', fg: '#908070', bg: '#201810', walkable: false, seeThrough: false, damage: 0, thirstCost: 0, name: 'Fort wall' },
    CAMPFIRE:       { char: '*', fg: '#FF6030', bg: '#201008', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 0, name: 'Campfire' },
    GRAVE:          { char: '+', fg: '#808080', bg: '#1a1206', walkable: true,  seeThrough: true,  damage: 0, thirstCost: 1, name: 'Grave marker' },
};

// ---- ENTITY TYPES ----
// Hostile entities use BRIGHT RED/ORANGE/YELLOW for high contrast
const ENTITY_TYPES = {
    // --- Hostile humans (RED/ORANGE) ---
    APACHE_WARRIOR:   { char: 'A', fg: '#FF4444', name: 'Apache warrior',        hp: 14, atk: 5, def: 3, speed: 1, hostile: true,  aggroRange: 8, xp: 15, desc: 'A fierce warrior with war paint streaked across his face. He carries a lance and a look of absolute fury.' },
    APACHE_SCOUT:     { char: 'A', fg: '#DD3333', name: 'Apache scout',           hp: 9,  atk: 4, def: 2, speed: 2, hostile: true,  aggroRange: 10, xp: 10, desc: 'A lithe figure, nearly invisible against the rock. He has been watching you for some time.' },
    COMANCHE_RIDER:   { char: 'C', fg: '#FF3322', name: 'Comanche rider',         hp: 16, atk: 6, def: 3, speed: 2, hostile: true,  aggroRange: 9, xp: 20, desc: 'Mounted and deadly. The finest horseman on the plains, here far from home and looking for blood.' },
    BANDITO:          { char: 'B', fg: '#FF6633', name: 'Mexican bandito',         hp: 10, atk: 4, def: 2, speed: 1, hostile: true,  aggroRange: 7, xp: 8, desc: 'A rough man in a sombrero with crossed bandoliers. He grins with gold teeth.' },
    DESPERADO:        { char: 'D', fg: '#EE5522', name: 'Desperado',              hp: 11, atk: 5, def: 1, speed: 1, hostile: true,  aggroRange: 6, xp: 10, desc: 'A gaunt figure with hollow eyes. Wanted in three territories. Nothing left to lose.' },
    FILIBUSTER:       { char: 'F', fg: '#FF5544', name: 'Filibustering American', hp: 13, atk: 5, def: 3, speed: 1, hostile: true,  aggroRange: 7, xp: 12, desc: 'An American adventurer turned privateer. He fights for glory and plunder in a foreign land.' },
    DESERTER:         { char: 'D', fg: '#CC4433', name: 'Army deserter',          hp: 10, atk: 4, def: 2, speed: 1, hostile: true,  aggroRange: 6, xp: 8, desc: 'Still wearing his army blues, torn and filthy. He will kill you for your boots.' },
    SCALPHUNTER:      { char: 'S', fg: '#FF2222', name: 'Scalphunter',            hp: 15, atk: 6, def: 3, speed: 1, hostile: true,  aggroRange: 8, xp: 18, desc: 'A blood-caked man with a belt of dried scalps. His eyes are those of a man who has lost his soul.' },

    // --- Hostile animals (YELLOW/AMBER) ---
    BLACK_BEAR:       { char: 'B', fg: '#FFCC00', name: 'Black bear',             hp: 20, atk: 6, def: 4, speed: 1, hostile: true,  aggroRange: 5, xp: 15, desc: 'A massive black bear, risen on its hind legs. Its claws are as long as your fingers.' },
    MOUNTAIN_LION:    { char: 'L', fg: '#FFAA00', name: 'Mountain lion',           hp: 12, atk: 7, def: 2, speed: 2, hostile: true,  aggroRange: 6, xp: 14, desc: 'A tawny shape crouched low. The lion watches with amber eyes, perfectly still.' },
    COYOTE:           { char: 'C', fg: '#FFD700', name: 'Coyote',                 hp: 6,  atk: 3, def: 1, speed: 2, hostile: true,  aggroRange: 5, xp: 4, desc: 'A mangy coyote, ribs showing. Hunger has made it bold.' },
    COYOTE_PACK:      { char: 'C', fg: '#FFD700', name: 'Coyote',                 hp: 6,  atk: 3, def: 1, speed: 2, hostile: true,  aggroRange: 6, xp: 4, desc: 'One of several coyotes circling. They hunt in packs here.' },
    DESERT_WOLF:      { char: 'W', fg: '#FFBB00', name: 'Desert wolf',            hp: 10, atk: 5, def: 2, speed: 2, hostile: true,  aggroRange: 7, xp: 10, desc: 'A grey wolf, larger than a coyote. Its yellow eyes track your every move.' },
    RATTLESNAKE:      { char: 'S', fg: '#FFE000', name: 'Rattlesnake',            hp: 3,  atk: 6, def: 0, speed: 1, hostile: true,  aggroRange: 2, xp: 5, desc: 'A diamondback rattler, coiled and buzzing. Its venom can kill a man in hours.' },
    GILA_MONSTER:     { char: 'G', fg: '#FFAA22', name: 'Gila monster',           hp: 5,  atk: 4, def: 2, speed: 1, hostile: true,  aggroRange: 2, xp: 5, desc: 'A beaded lizard, black and orange. It does not let go once it bites.' },
    JAVELINA:         { char: 'J', fg: '#DDAA44', name: 'Javelina',               hp: 8,  atk: 3, def: 2, speed: 1, hostile: false, aggroRange: 3, xp: 3, desc: 'A peccary, pig-like and bristling. It smells terrible and will charge if cornered.' },
    SCORPION:         { char: 'X', fg: '#FFD040', name: 'Bark scorpion',          hp: 2,  atk: 5, def: 0, speed: 1, hostile: true,  aggroRange: 2, xp: 3, desc: 'A pale scorpion, translucent in the moonlight. Its sting burns like fire.' },
    VULTURE:          { char: 'V', fg: '#AA8866', name: 'Vulture',                hp: 4,  atk: 1, def: 0, speed: 1, hostile: false, aggroRange: 0, xp: 1, desc: 'A turkey vulture circling overhead. It is patient. It has all the time in the world.' },

    // --- Named characters (BRIGHT DISTINCTIVE) ---
    JUDGE_HOLDEN:     { char: 'J', fg: '#FFFFFF', name: 'Judge Holden',           hp: 99, atk: 15, def: 10, speed: 1, hostile: false, aggroRange: 0, xp: 0, special: true, desc: 'An enormous man, hairless and white as a bone. He is seven feet tall and smiling.' },
    THE_KID:          { char: 'K', fg: '#EEBB77', name: 'The Kid',                hp: 18, atk: 6, def: 3, speed: 1, hostile: false, aggroRange: 0, xp: 0, special: true, desc: 'A lean youth with cold eyes. He carries a Colt and speaks little.' },
    TOBIN:            { char: 'P', fg: '#88AAAA', name: 'Tobin the ex-priest',    hp: 12, atk: 3, def: 2, speed: 1, hostile: false, aggroRange: 0, xp: 0, special: true, desc: 'A man in a tattered cassock. He was once a priest. Now he is something else entirely.' },
    TOADVINE:         { char: 'T', fg: '#CC8844', name: 'Toadvine',               hp: 14, atk: 5, def: 2, speed: 1, hostile: false, aggroRange: 0, xp: 0, special: true, desc: 'A scarred man with burn marks and no ears. He has survived things that would kill most men twice.' },
    GLANTON:          { char: 'G', fg: '#FF4466', name: 'John Joel Glanton',      hp: 20, atk: 8, def: 4, speed: 1, hostile: false, aggroRange: 0, xp: 0, special: true, desc: 'John Joel Glanton. Captain of scalphunters. His eyes are as empty as the desert.' },
    BATHCAT:          { char: 'R', fg: '#BB8866', name: 'Bathcat',                hp: 10, atk: 3, def: 2, speed: 1, hostile: false, aggroRange: 0, xp: 0, special: true, desc: 'A heavy-set teamster. He carries a cat in his shirt and speaks to it tenderly.' },
    JACKSON:          { char: 'H', fg: '#DDAAFF', name: 'Jackson',          hp: 16, atk: 7, def: 3, speed: 1, hostile: false, aggroRange: 0, xp: 0, special: true, desc: 'A dark giant of a man. He moves with the quiet menace of a coiled spring.' },

    // --- Neutral NPCs ---
    TOWNSPERSON:      { char: 't', fg: '#887766', name: 'Townsperson',            hp: 5,  atk: 1, def: 0, speed: 1, hostile: false, aggroRange: 0, xp: 0, desc: 'A local resident going about their business.' },
    MERCHANT:         { char: '$', fg: '#DAA520', name: 'Merchant',               hp: 5,  atk: 1, def: 0, speed: 1, hostile: false, aggroRange: 0, xp: 0, desc: 'A trader with a mule loaded with goods.' },
    CAVALRY:          { char: 'U', fg: '#5566AA', name: 'US Cavalry soldier',     hp: 12, atk: 4, def: 3, speed: 1, hostile: false, aggroRange: 0, xp: 0, desc: 'A soldier in dusty blue. He looks tired and far from home.' },
    MEXICAN_SOLDIER:  { char: 'M', fg: '#448844', name: 'Mexican soldier',        hp: 10, atk: 4, def: 2, speed: 1, hostile: false, aggroRange: 0, xp: 0, desc: 'A Mexican infantryman. His uniform is threadbare.' },
    PADRE:            { char: 'p', fg: '#887766', name: 'Padre',                  hp: 4,  atk: 0, def: 0, speed: 1, hostile: false, aggroRange: 0, xp: 0, desc: 'A priest in black robes. He mutters prayers as he walks.' },
};

// ---- MOUNTAIN RANGES (scaled 4x) ----
const MOUNTAIN_RANGES = [
    { name: 'Santa Catalina Mtns', cx: 260, cy: 48,  rx: 48, ry: 32 },
    { name: 'Rincon Mountains',    cx: 320, cy: 64,  rx: 28, ry: 24 },
    { name: 'Santa Rita Mtns',     cx: 232, cy: 128, rx: 36, ry: 28 },
    { name: 'Huachuca Mountains',  cx: 180, cy: 160, rx: 32, ry: 24 },
    { name: 'Chiricahua Mtns',     cx: 440, cy: 112, rx: 48, ry: 36 },
    { name: 'Dragoon Mountains',   cx: 380, cy: 104, rx: 24, ry: 20 },
    { name: 'Whetstone Mtns',      cx: 272, cy: 152, rx: 20, ry: 16 },
    { name: 'Patagonia Mtns',      cx: 200, cy: 144, rx: 20, ry: 16 },
    { name: 'Mule Mountains',      cx: 400, cy: 160, rx: 24, ry: 20 },
    { name: 'Sierra Cananea',      cx: 220, cy: 208, rx: 32, ry: 24 },
    { name: 'Sierra Madre',        cx: 320, cy: 232, rx: 40, ry: 28 },
    { name: 'Baboquivari Peak',    cx: 140, cy: 120, rx: 20, ry: 20 },
];

// ---- LOCATIONS (scaled 4x) ----
const LOCATIONS = [
    { name: 'Tucson',         x: 248, y: 72,  type: 'town', size: 6, desc: 'A dusty pueblo of adobe and mesquite. The smell of woodsmoke and horses.' },
    { name: 'Tubac',          x: 220, y: 120, type: 'town', size: 5, desc: 'The old presidio. Its walls crumbling. Mexicans and Americans eye each other across the plaza.' },
    { name: 'Ft. Buchanan',   x: 192, y: 152, type: 'fort', size: 4, desc: 'A sorry collection of jacales the army calls a fort. Soldiers idle in the shade.' },
    { name: 'Ft. Bowie',      x: 460, y: 100, type: 'fort', size: 4, desc: 'Guarding Apache Pass. The Chiricahuas watch from the ridges above.' },
    { name: 'Tombstone',      x: 392, y: 152, type: 'town', size: 5, desc: 'Silver country. The hills are alive with prospectors and the men who rob them.' },
    { name: 'Santa Cruz',     x: 220, y: 184, type: 'town', size: 4, desc: 'A Mexican village on the river. The church bell rings for vespers.' },
    { name: 'Magdalena',      x: 200, y: 208, type: 'town', size: 5, desc: 'The fiesta of San Francisco. Pilgrims walk the dusty road from the south.' },
    { name: 'Arizpe',         x: 300, y: 224, type: 'town', size: 5, desc: 'The old Sonoran capital. Apache scalps hang drying in the plaza.' },
    { name: 'Hermosillo',     x: 152, y: 240, type: 'town', size: 6, desc: 'A city of churches and trade. The end of the long road south.' },
    { name: 'Ft. Crittenden', x: 208, y: 136, type: 'fort', size: 3, desc: 'Abandoned and reoccupied. The flagpole stands crooked against the sky.' },
    { name: 'Dragoon Springs', x: 368, y: 120, type: 'camp', size: 2, desc: 'A stage station in the shadow of the Dragoons. Water here, and danger.' },
    { name: 'Apache Pass',     x: 432, y: 104, type: 'camp', size: 2, desc: 'The spring in the pass. Bones of men and animals mark the approach.' },
    { name: 'Hueco Tanks',    x: 500, y: 60,  type: 'tanks', size: 4, desc: 'Ancient rock basins that hold rainwater in the desert. Petroglyphs cover the boulders. Men have killed each other here for water since before memory.' },
];

// ---- RIVERS (scaled 4x with more waypoints for length) ----
const RIVERS = [
    { name: 'Santa Cruz River', points: [[232,260],[230,240],[228,220],[224,200],[222,184],[220,170],[222,156],[224,140],[226,124],[228,110],[232,96],[236,80],[240,68],[244,56],[248,44],[250,32],[252,20]] },
    { name: 'San Pedro River',  points: [[356,260],[354,240],[352,224],[350,208],[348,192],[348,176],[346,160],[344,144],[342,128],[340,112],[338,96],[336,80],[334,64],[332,48],[330,32]] },
];

// ---- CONTRACTS ----
const CONTRACTS = [
    { origin: 'Tucson', dest: 'Ft. Buchanan', cargo: 'Ammunition & hardtack', mulesNeeded: 3, pay: 40, danger: 2, desc: 'The army needs powder. The Apaches need you dead.' },
    { origin: 'Tucson', dest: 'Tubac', cargo: 'Dry goods & flour', mulesNeeded: 2, pay: 20, danger: 1, desc: 'Simple haul down the Santa Cruz. Should be.' },
    { origin: 'Tucson', dest: 'Tombstone', cargo: 'Mining equipment', mulesNeeded: 4, pay: 60, danger: 3, desc: 'Heavy iron through the Whetstones. Bandits love this route.' },
    { origin: 'Tubac', dest: 'Santa Cruz', cargo: 'Cattle hides', mulesNeeded: 3, pay: 30, danger: 2, desc: 'Cross the border with hides. The rurales want their cut.' },
    { origin: 'Ft. Bowie', dest: 'Tucson', cargo: 'Army dispatches', mulesNeeded: 1, pay: 50, danger: 4, desc: 'Ride fast through Apache country with dispatches that cannot be lost.' },
    { origin: 'Tombstone', dest: 'Ft. Bowie', cargo: 'Whiskey & tobacco', mulesNeeded: 3, pay: 55, danger: 4, desc: 'Soldiers will pay top dollar. Getting there alive is the trick.' },
    { origin: 'Magdalena', dest: 'Tucson', cargo: 'Silver ore', mulesNeeded: 5, pay: 100, danger: 5, desc: 'A kings ransom in silver. Every bandit and Apache for fifty miles will know.' },
    { origin: 'Hermosillo', dest: 'Magdalena', cargo: 'Church goods & wine', mulesNeeded: 3, pay: 35, danger: 2, desc: 'Holy cargo for the fiesta. God may protect you. Or not.' },
    { origin: 'Santa Cruz', dest: 'Arizpe', cargo: 'Mezcal & gunpowder', mulesNeeded: 4, pay: 65, danger: 3, desc: 'The governor wants his drink and his war supplies. Deliver both.' },
    { origin: 'Ft. Buchanan', dest: 'Ft. Crittenden', cargo: 'Garrison supplies', mulesNeeded: 2, pay: 25, danger: 2, desc: 'Short haul between forts. The mountains between them are not short.' },
    { origin: 'Dragoon Springs', dest: 'Tombstone', cargo: 'Mail & parcels', mulesNeeded: 1, pay: 15, danger: 2, desc: 'Stage mail that missed the coach. Quick work if you survive it.' },
    { origin: 'Arizpe', dest: 'Hermosillo', cargo: 'Apache scalps', mulesNeeded: 2, pay: 80, danger: 3, desc: 'The bounty. One hundred dollars a scalp. The Judge himself set the price.' },
    { origin: 'Ft. Bowie', dest: 'Hueco Tanks', cargo: 'Survey equipment', mulesNeeded: 3, pay: 70, danger: 4, desc: 'The army wants the tanks mapped. The desert between here and there is merciless.' },
    { origin: 'Hueco Tanks', dest: 'Tombstone', cargo: 'Turquoise & relics', mulesNeeded: 2, pay: 55, danger: 3, desc: 'Ancient stones pried from the rock basins. Collectors in Tombstone pay well.' },
];

// ---- ITEMS ----
const ITEMS = {
    // Weapons
    KNIFE:          { name: 'Bowie knife',       type: 'weapon', slot: 'weapon', atk: 2, def: 0, value: 5,  desc: 'A heavy-bladed knife. Good for cutting and killing.' },
    REVOLVER:       { name: 'Colt Dragoon',      type: 'weapon', slot: 'weapon', atk: 5, def: 0, value: 25, desc: 'Six shots. The great equalizer of the frontier.' },
    RIFLE:          { name: 'Hawken rifle',      type: 'weapon', slot: 'weapon', atk: 7, def: 0, value: 40, desc: 'A plains rifle. Accurate and deadly at range.' },
    SHOTGUN:        { name: 'Sawed-off shotgun', type: 'weapon', slot: 'weapon', atk: 8, def: 0, value: 35, desc: 'Cut down for close work. Devastating.' },
    LANCE:          { name: 'Apache lance',      type: 'weapon', slot: 'weapon', atk: 4, def: 0, value: 10, desc: 'A hardwood lance with a fire-hardened tip.' },
    CLUB:           { name: 'War club',          type: 'weapon', slot: 'weapon', atk: 3, def: 0, value: 5,  desc: 'A stone-headed club. Brutal and simple.' },
    MACHETE:        { name: 'Machete',           type: 'weapon', slot: 'weapon', atk: 3, def: 0, value: 8,  desc: 'A broad-bladed cane knife. Clears brush and men alike.' },
    // Clothing - Head
    SLOUCH_HAT:     { name: 'Slouch hat',        type: 'clothing', slot: 'head', atk: 0, def: 1, value: 3,  desc: 'A wide-brimmed felt hat. Keeps the sun off.' },
    SOMBRERO:       { name: 'Sombrero',          type: 'clothing', slot: 'head', atk: 0, def: 1, value: 4,  desc: 'A broad sombrero. The desert mans hat.' },
    CAVALRY_HAT:    { name: 'Cavalry kepi',      type: 'clothing', slot: 'head', atk: 0, def: 1, value: 6,  desc: 'A US Army kepi. Taken from a dead man most likely.' },
    // Clothing - Body
    COTTON_SHIRT:   { name: 'Cotton shirt',      type: 'clothing', slot: 'body', atk: 0, def: 1, value: 3,  desc: 'A plain cotton shirt. Better than nothing.' },
    LEATHER_VEST:   { name: 'Leather vest',      type: 'clothing', slot: 'body', atk: 0, def: 2, value: 8,  desc: 'Thick cowhide. Turns a blade somewhat.' },
    SERAPE:         { name: 'Serape',             type: 'clothing', slot: 'body', atk: 0, def: 2, value: 6,  desc: 'A heavy wool serape. Warm in the mountains, stifling in the desert.' },
    ARMY_COAT:      { name: 'Army greatcoat',    type: 'clothing', slot: 'body', atk: 0, def: 3, value: 12, desc: 'A heavy wool military coat. Good protection.' },
    // Clothing - Feet
    SANDALS:        { name: 'Huaraches',         type: 'clothing', slot: 'feet', atk: 0, def: 0, value: 2,  desc: 'Woven leather sandals. They let your feet breathe.' },
    BOOTS:          { name: 'Riding boots',      type: 'clothing', slot: 'feet', atk: 0, def: 1, value: 8,  desc: 'Proper leather boots. A mans most important possession in this country.' },
    MOCCASINS:      { name: 'Moccasins',         type: 'clothing', slot: 'feet', atk: 0, def: 1, value: 5,  desc: 'Soft deerskin moccasins. Move quiet as a ghost.' },
    // Supplies
    WATER_SKIN:     { name: 'Water skin',        type: 'supply', uses: 10, value: 3,  desc: 'A goatskin water bag. Life itself in the desert.' },
    JERKY:          { name: 'Dried beef',        type: 'food',   heal: 3,  value: 2,  desc: 'Tough as saddle leather. Keeps you alive.' },
    HARDTACK:       { name: 'Hardtack',          type: 'food',   heal: 2,  value: 1,  desc: 'Army crackers. You could break a tooth.' },
    WHISKEY:        { name: 'Whiskey',           type: 'food',   heal: 5,  value: 4,  desc: 'Rotgut whiskey. Burns going down. Heals what ails you.' },
    BANDAGE:        { name: 'Bandage',           type: 'heal',   heal: 8,  value: 5,  desc: 'Strips of clean cloth. Stanch the bleeding.' },
    LAUDANUM:       { name: 'Laudanum',          type: 'heal',   heal: 15, value: 10, desc: 'Tincture of opium. Kills the pain and everything else.' },
    TOBACCO:        { name: 'Tobacco pouch',     type: 'trade',  value: 3,  desc: 'Good Virginia tobacco. Worth more than gold to some men.' },
    // Alcohol
    MEZCAL:         { name: 'Mezcal',            type: 'food',   heal: 6,  value: 5,  desc: 'Smoky agave spirits. Burns like the desert sun.' },
    PULQUE:         { name: 'Pulque',             type: 'food',   heal: 3,  value: 2,  desc: 'Fermented maguey sap. Thick as milk. The peasants drink.' },
    AGUARDIENTE:    { name: 'Aguardiente',        type: 'food',   heal: 8,  value: 8,  desc: 'Cane liquor. White lightning from Sonora. Will make a man brave or dead.' },
    // Mining tools
    PICKAXE:        { name: 'Pickaxe',            type: 'tool', toolType: 'mining', miningBonus: 0.15, value: 12, desc: 'A heavy iron pick. The miners tool of choice.' },
    GOLD_PAN:       { name: 'Gold pan',           type: 'tool', toolType: 'mining', miningBonus: 0.10, value: 8,  desc: 'A flat iron pan for separating gold from gravel.' },
    MINERS_LAMP:    { name: 'Miners lamp',        type: 'tool', toolType: 'mining', miningBonus: 0.05, value: 6,  desc: 'A tin lamp burning whale oil. See what the dark hides.' },
    // Throwable
    THROWING_KNIFE: { name: 'Throwing knife',    type: 'throwable', atk: 4, value: 3, desc: 'A balanced blade for throwing.' },
    ROCK:           { name: 'Rock',              type: 'throwable', atk: 2, value: 0, desc: 'A fist-sized stone. Hurts when thrown.' },
    // Valuables
    GOLD_DUST:      { name: 'Gold dust',         type: 'valuable', value: 10, desc: 'A pouch of placer gold. Glittering and heavy.' },
    SILVER_NUGGET:  { name: 'Silver nugget',     type: 'valuable', value: 8,  desc: 'A lump of native silver. Tarnished but true.' },
    TURQUOISE:      { name: 'Turquoise stone',   type: 'valuable', value: 6,  desc: 'A blue-green stone. Sacred to the Navajo.' },
    GOLD_NUGGET:    { name: 'Gold nugget',       type: 'valuable', value: 20, desc: 'A fat nugget of pure gold. Worth killing for.' },
    SILVER_ORE:     { name: 'Silver ore',        type: 'valuable', value: 12, desc: 'Raw silver ore. Heavy and promising.' },
};

// ---- SHOP INVENTORY (by location type) ----
const SHOP_ITEMS = {
    town: [
        { item: 'REVOLVER', price: 30 },
        { item: 'RIFLE', price: 45 },
        { item: 'SHOTGUN', price: 40 },
        { item: 'MACHETE', price: 10 },
        { item: 'SLOUCH_HAT', price: 4 },
        { item: 'SOMBRERO', price: 5 },
        { item: 'COTTON_SHIRT', price: 4 },
        { item: 'LEATHER_VEST', price: 10 },
        { item: 'SERAPE', price: 8 },
        { item: 'BOOTS', price: 10 },
        { item: 'SANDALS', price: 3 },
        { item: 'WATER_SKIN', price: 4 },
        { item: 'JERKY', price: 3 },
        { item: 'HARDTACK', price: 2 },
        { item: 'WHISKEY', price: 5 },
        { item: 'BANDAGE', price: 6 },
        { item: 'LAUDANUM', price: 12 },
        { item: 'THROWING_KNIFE', price: 4 },
        { item: 'TOBACCO', price: 4 },
        { item: 'PICKAXE', price: 15 },
        { item: 'GOLD_PAN', price: 10 },
        { item: 'MINERS_LAMP', price: 8 },
    ],
    fort: [
        { item: 'REVOLVER', price: 25 },
        { item: 'RIFLE', price: 40 },
        { item: 'CAVALRY_HAT', price: 7 },
        { item: 'ARMY_COAT', price: 15 },
        { item: 'BOOTS', price: 10 },
        { item: 'WATER_SKIN', price: 3 },
        { item: 'JERKY', price: 2 },
        { item: 'HARDTACK', price: 1 },
        { item: 'BANDAGE', price: 5 },
        { item: 'LAUDANUM', price: 10 },
    ],
    camp: [
        { item: 'JERKY', price: 3 },
        { item: 'WATER_SKIN', price: 5 },
        { item: 'BANDAGE', price: 7 },
        { item: 'TOBACCO', price: 4 },
    ],
    tanks: [
        { item: 'JERKY', price: 3 },
        { item: 'WATER_SKIN', price: 4 },
        { item: 'BANDAGE', price: 6 },
        { item: 'TOBACCO', price: 4 },
        { item: 'TURQUOISE', price: 8 },
    ],
};

// ---- MCCARTHY QUOTES ----
const QUOTES = {
    death: [
        { text: "He never sleeps. He says that he will never die.", attr: "Blood Meridian" },
        { text: "And they are dancing, the board floor slamming under the bootheel and the fiddler grinning hideously over his canted piece.", attr: "Blood Meridian" },
        { text: "Your heart's desire is to be told some mystery. The mystery is that there is no mystery.", attr: "Blood Meridian" },
        { text: "The flames sawed in the wind and the embers paled and deepened and paled and deepened like the breathing of some living thing eviscerate upon the ground.", attr: "Blood Meridian" },
        { text: "They rode on.", attr: "Blood Meridian" },
    ],
    camp: [
        { text: "Whatever in creation exists without my knowledge exists without my consent.", attr: "Judge Holden" },
        { text: "The universe is no narrow thing and the order within it is not constrained by any latitude in its conception to repeat what exists in one part in any other part.", attr: "Judge Holden" },
        { text: "A man's at odds to know his mind cause his mind is aught he has to know it with.", attr: "Blood Meridian" },
        { text: "The way of the world is to bloom and to flower and die but in the affairs of men there is no waning and the noon of his expression signals the onset of night.", attr: "Blood Meridian" },
    ],
    combat: [
        { text: "War is god.", attr: "Judge Holden" },
        { text: "It makes no difference what men think of war. War endures.", attr: "Judge Holden" },
        { text: "Only that man who has offered up himself entire to the blood of war... only that man can dance.", attr: "Judge Holden" },
        { text: "Moral law is an invention of mankind for the disenfranchisement of the powerful in favor of the weak.", attr: "Judge Holden" },
    ],
    travel: [
        { text: "They rode on.", attr: "Blood Meridian" },
        { text: "See the child.", attr: "Blood Meridian" },
        { text: "The man who believes that the secrets of the world are forever hidden lives in mystery and fear.", attr: "Judge Holden" },
        { text: "Whatever longings the heart harbors are disavowed.", attr: "Blood Meridian" },
        { text: "In the neuter austerity of that terrain all phenomena were bided in a single and brooding quietude.", attr: "Blood Meridian" },
    ],
    judge: [
        { text: "Whatever in creation exists without my knowledge exists without my consent.", attr: "Judge Holden" },
        { text: "The man who believes that the secrets of the world are forever hidden lives in mystery and fear. Superstition. The superstitious man is to be feared.", attr: "Judge Holden" },
        { text: "If God meant to interfere in the degeneracy of mankind would he not have done so by now?", attr: "Judge Holden" },
        { text: "Only nature can enslave man and only when the existence of each last entity is routed out and made to stand naked before him will he be properly suzerain of the earth.", attr: "Judge Holden" },
        { text: "He is dancing, dancing. He says that he will never die.", attr: "Blood Meridian" },
    ],
};

// ---- TAVERN DATA ----
const TAVERN_DRINKS = [
    { item: 'MEZCAL', price: 4 },
    { item: 'PULQUE', price: 2 },
    { item: 'AGUARDIENTE', price: 6 },
    { item: 'WHISKEY', price: 5 },
];

const TAVERN_EVENTS = [
    { text: 'A one-eyed man at the bar draws a knife on a vaquero. Chairs fly. Blood on the sawdust.', type: 'brawl', damage: [0, 3], goldChance: 0.3, goldAmount: [1, 5] },
    { text: 'Two Americans argue over a card game. One pulls a pistol. The other dies where he sits.', type: 'brawl', damage: [0, 2], goldChance: 0.2, goldAmount: [2, 8] },
    { text: 'A drunk soldier staggers into your table. He swings. The room erupts.', type: 'brawl', damage: [1, 4], goldChance: 0.2, goldAmount: [1, 3] },
    { text: 'A scarred prospector slams the bar and buys a round for the house. The mezcal flows.', type: 'good', heal: 3 },
    { text: 'A quiet Mexican woman sings a corrido. For a moment the violence pauses.', type: 'calm' },
    { text: 'A grizzled scalphunter eyes your belt and says nothing. He drinks alone in the corner.', type: 'calm' },
    { text: 'A fiddler plays. Men stomp and holler. Someone fires a pistol through the ceiling.', type: 'brawl', damage: [0, 1], goldChance: 0, goldAmount: [0, 0] },
    { text: 'A gambler offers you a hand of monte. You lose track of the cards.', type: 'gamble', goldLoss: [2, 8], goldWin: [4, 15] },
    { text: 'A man with no teeth tells you about a silver strike in the mountains. He wants a grubstake.', type: 'rumor' },
    { text: 'The barkeep pours you a drink on the house. He says you look like you need it.', type: 'good', heal: 2 },
];

const TAVERN_QUOTES = [
    { text: "They rode on and the sun in the east flushed the sandstone country to the west.", attr: "Blood Meridian" },
    { text: "The truth about the world, he said, is that anything is possible.", attr: "Blood Meridian" },
    { text: "Between the wish and the thing the world lies waiting.", attr: "All the Pretty Horses" },
    { text: "You think when you wake up in the mornin yesterday dont count. But yesterday is all that does count.", attr: "No Country for Old Men" },
    { text: "Anything that doesnt take years of your life and drive you to suicide hardly seems worth doing.", attr: "Suttree" },
    { text: "There is no such joy in the tavern as upon the road thereto.", attr: "Blood Meridian" },
    { text: "A man who has not passed through the inferno of his passions has never overcome them.", attr: "Blood Meridian" },
    { text: "You never know what worse luck your bad luck has saved you from.", attr: "No Country for Old Men" },
    { text: "Every man is the bard of his own existence.", attr: "Blood Meridian" },
    { text: "The old man said that in his country once there were great cathedral bells. He said that the weights of the bells was the measure of the wealth of the people.", attr: "The Crossing" },
];

const MINE_LOOT = [
    { item: 'GOLD_NUGGET', weight: 2 },
    { item: 'GOLD_DUST', weight: 4 },
    { item: 'SILVER_ORE', weight: 4 },
    { item: 'SILVER_NUGGET', weight: 5 },
    { item: 'TURQUOISE', weight: 3 },
    { item: 'ROCK', weight: 4 },
];

const MULE_NAMES = [
    'Perdido', 'Ceniza', 'Polvo', 'Sombra', 'Viejo', 'Hueso',
    'Piedra', 'Cielo', 'Rojo', 'Canela', 'Borracho', 'Diablo',
    'Flaca', 'Mosca', 'Trueno', 'Peligro', 'Muerto', 'Esperanza',
];

const SPAWN_TABLES = {
    desert: [
        { type: 'RATTLESNAKE', weight: 4 },
        { type: 'SCORPION', weight: 3 },
        { type: 'COYOTE', weight: 3 },
        { type: 'GILA_MONSTER', weight: 2 },
        { type: 'JAVELINA', weight: 2 },
        { type: 'VULTURE', weight: 3 },
        { type: 'DESPERADO', weight: 2 },
        { type: 'BANDITO', weight: 2 },
        { type: 'APACHE_SCOUT', weight: 1 },
    ],
    mountain: [
        { type: 'BLACK_BEAR', weight: 3 },
        { type: 'MOUNTAIN_LION', weight: 2 },
        { type: 'DESERT_WOLF', weight: 3 },
        { type: 'COYOTE', weight: 2 },
        { type: 'APACHE_WARRIOR', weight: 3 },
        { type: 'APACHE_SCOUT', weight: 2 },
        { type: 'RATTLESNAKE', weight: 2 },
    ],
    canyon: [
        { type: 'APACHE_WARRIOR', weight: 4 },
        { type: 'APACHE_SCOUT', weight: 3 },
        { type: 'MOUNTAIN_LION', weight: 2 },
        { type: 'COYOTE_PACK', weight: 3 },
        { type: 'RATTLESNAKE', weight: 3 },
        { type: 'SCALPHUNTER', weight: 2 },
        { type: 'DESPERADO', weight: 2 },
    ],
    road: [
        { type: 'FILIBUSTER', weight: 3 },
        { type: 'BANDITO', weight: 3 },
        { type: 'DESERTER', weight: 2 },
        { type: 'COMANCHE_RIDER', weight: 1 },
        { type: 'COYOTE', weight: 2 },
    ],
};

const MINING_LOOT = [
    { item: 'GOLD_DUST', weight: 3 },
    { item: 'SILVER_NUGGET', weight: 5 },
    { item: 'TURQUOISE', weight: 4 },
    { item: 'ROCK', weight: 8 },
];

const PLAYER_DEFAULTS = {
    hp: 25,
    maxHp: 25,
    atk: 3,
    def: 2,
    gold: 20,
    thirst: 100,
    maxThirst: 100,
    xp: 0,
    level: 1,
};
