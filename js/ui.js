// ============================================================
// SKY ISLAND MULETEER - UI Manager
// Copyright (c) 2026 Devin Bartley. MIT License.
// ============================================================

class UI {
    constructor() {
        this.messages = [];
        this.maxMessages = 50;
    }

    addMessage(text, type = 'info') {
        this.messages.push({ text, type, turn: window.game ? window.game.turn : 0 });
        if (this.messages.length > this.maxMessages) this.messages.shift();
        this.renderMessages();
    }

    renderMessages() {
        const container = document.getElementById('messages');
        if (!container) return;
        const recent = this.messages.slice(-8);
        container.innerHTML = recent.map(m => `<div class="msg msg-${m.type}">${m.text}</div>`).join('');
        container.scrollTop = container.scrollHeight;
    }

    renderStats(player) {
        const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
        const hpColor = hpPct > 60 ? '#6B8E23' : (hpPct > 30 ? '#DAA520' : '#B22222');
        document.getElementById('hp-bar').innerHTML = `
            <div class="hp-bar-outer"><div class="hp-bar-inner" style="width:${hpPct}%;background:${hpColor}"></div>
            <div class="hp-bar-text">HP: ${player.hp}/${player.maxHp}</div></div>`;

        const thPct = Math.round((player.thirst / player.maxThirst) * 100);
        const thColor = thPct > 60 ? '#4682B4' : (thPct > 30 ? '#DAA520' : '#B22222');
        const wpn = player.equipment.weapon ? player.equipment.weapon.name : 'Fists';
        document.getElementById('stats-detail').innerHTML = `
            <div class="stat-line">Level <span class="stat-value">${player.level}</span></div>
            <div class="stat-line">XP <span class="stat-value">${player.xp}/${player.level * 20}</span></div>
            <div class="stat-line">Attack <span class="stat-value">${player.getAttack()}</span></div>
            <div class="stat-line">Defense <span class="stat-value">${player.getDefense()}</span></div>
            <div class="stat-line">Thirst <span class="stat-value" style="color:${thColor}">${thPct}%</span></div>
            <div class="stat-line">Gold <span class="stat-value" style="color:#DAA520">${player.gold}</span></div>
            <div class="stat-line">Weapon <span class="stat-value">${wpn}</span></div>
            <div class="stat-line">Kills <span class="stat-value">${player.kills}</span></div>`;
    }

    renderMuleStatus(player) {
        const c = document.getElementById('mule-list');
        if (player.mules.length === 0) { c.innerHTML = '<div style="color:#696969">No mules</div>'; return; }
        c.innerHTML = player.mules.map(m => {
            if (!m.alive) return `<div class="mule-entry"><span class="mule-name" style="color:#696969">${m.name} (dead)</span></div>`;
            const tp = Math.round((m.thirst / m.maxThirst) * 100);
            const tc = tp > 60 ? 'thirst-ok' : (tp > 30 ? 'thirst-low' : 'thirst-critical');
            return `<div class="mule-entry"><span class="mule-name">m ${m.name}${m.spooked ? ' [!]' : ''}</span>
                <span class="mule-thirst ${tc}">${tp}%</span>
                <div style="color:#8B7355;font-size:10px">HP:${m.hp}/${m.maxHp}${m.cargo ? ' (' + m.cargo + ')' : ''}</div></div>`;
        }).join('');
    }

    renderCargoStatus(player) {
        const c = document.getElementById('cargo-list');
        if (!player.contract) { c.innerHTML = '<div style="color:#696969">No cargo</div>'; return; }
        const loaded = player.mules.filter(m => m.alive && m.cargo).length;
        c.innerHTML = `<div class="cargo-entry">${player.contract.cargo}</div><div style="color:#8B7355;font-size:10px">${loaded} mules loaded</div>`;
    }

    renderContractStatus(player) {
        const c = document.getElementById('contract-detail');
        if (!player.contract) { c.innerHTML = '<div style="color:#696969">No contract. Visit a town.</div>'; return; }
        const ct = player.contract;
        c.innerHTML = `<div class="contract-active">${ct.cargo}</div><div>${ct.origin} → ${ct.dest}</div><div style="color:#DAA520">Pay: $${ct.pay}</div>`;
    }

    renderAll(player) {
        this.renderStats(player);
        this.renderMuleStatus(player);
        this.renderCargoStatus(player);
        this.renderContractStatus(player);
    }

    // ---- Town Screen with inline feedback ----
    showTownScreen(location, game) {
        const screen = document.getElementById('town-screen');
        document.getElementById('town-name').textContent = location.name;
        document.getElementById('town-desc').textContent = location.desc;
        document.getElementById('town-feedback').textContent = '';
        const opts = document.getElementById('town-options');
        const o = [];
        o.push(`<div class="town-option"><span class="key">[C]</span> Contract Board</div>`);
        o.push(`<div class="town-option"><span class="key">[R]</span> Rest and heal (5 gold)</div>`);
        o.push(`<div class="town-option"><span class="key">[W]</span> Water mules (3 gold)</div>`);
        o.push(`<div class="town-option"><span class="key">[B]</span> Buy a mule (15 gold)</div>`);
        o.push(`<div class="town-option"><span class="key">[S]</span> Shop - buy supplies & gear</div>`);
        o.push(`<div class="town-option"><span class="key">[T]</span> Tavern</div>`);
        o.push(`<div class="town-option"><span class="key">[I]</span> Inventory - sell items</div>`);
        if (game.player.contract && game.player.contract.dest === location.name) {
            o.push(`<div class="town-option" style="color:#DAA520"><span class="key">[D]</span> Deliver cargo ($${game.player.contract.pay})</div>`);
        }
        opts.innerHTML = o.join('');
        screen.classList.remove('hidden');
        game.state = 'town';
    }

    setTownFeedback(text, color) {
        const el = document.getElementById('town-feedback');
        if (el) { el.textContent = text; el.style.color = color || '#C4A882'; }
    }

    hideTownScreen() { document.getElementById('town-screen').classList.add('hidden'); }

    showContractScreen(game) {
        const screen = document.getElementById('contract-screen');
        const list = document.getElementById('contract-list');
        const loc = game.map.getNearbyLocation(game.player.x, game.player.y, 8);
        if (!loc) {
            list.innerHTML = '<p style="color:#696969">No contracts available here.</p>';
            screen.classList.remove('hidden');
            game.state = 'contracts';
            return;
        }
        const available = CONTRACTS.filter(c => c.origin === loc.name);
        if (available.length === 0) {
            list.innerHTML = '<p style="color:#696969">No contracts from this location.</p>';
        } else {
            list.innerHTML = available.map((c, i) => {
                return `<div class="contract-entry"><div class="contract-pay">$${c.pay}</div>
                    <div class="contract-cargo">[${i + 1}] ${c.cargo}</div>
                    <div class="contract-route">${c.origin} → ${c.dest} (${c.mulesNeeded} mules)</div>
                    <div class="contract-danger">Danger: ${'!'.repeat(c.danger)}</div>
                    <div style="color:#8B7355;font-size:11px;margin-top:4px">${c.desc}</div></div>`;
            }).join('');
        }
        screen.classList.remove('hidden');
        game.state = 'contracts';
        game._contractOptions = available;
    }

    hideContractScreen() { document.getElementById('contract-screen').classList.add('hidden'); }

    // ---- Inventory Screen ----
    showInventoryScreen(game) {
        const screen = document.getElementById('inventory-screen');
        const list = document.getElementById('inventory-list');
        const p = game.player;
        const inTown = game.map.getNearbyLocation(p.x, p.y, 8);
        let html = '<div style="margin-bottom:10px">';
        // Equipment
        html += '<h3 style="color:#DAA520;margin-bottom:6px">EQUIPPED</h3>';
        for (const slot of ['weapon', 'head', 'body', 'feet']) {
            const item = p.equipment[slot];
            const label = slot.charAt(0).toUpperCase() + slot.slice(1);
            if (item) {
                html += `<div class="inv-item"><span style="color:#DEB887">${label}: ${item.name}</span> <span style="color:#696969">(atk:${item.atk||0} def:${item.def||0})</span></div>`;
            } else {
                html += `<div class="inv-item"><span style="color:#696969">${label}: (empty)</span></div>`;
            }
        }
        html += '</div>';
        // Inventory items
        html += '<h3 style="color:#DAA520;margin-bottom:6px">PACK</h3>';
        if (p.inventory.length === 0) {
            html += '<div style="color:#696969">Empty</div>';
        } else {
            p.inventory.forEach((item, i) => {
                const num = i + 1;
                const sellStr = inTown ? ` | [${num}] sell $${Math.max(1, Math.floor((item.value||1)*0.5))}` : '';
                const equipStr = item.slot ? ' | [E+' + num + '] equip' : '';
                const useStr = (item.type === 'food' || item.type === 'heal') ? ' | [U+' + num + '] use' : '';
                html += `<div class="inv-item"><span style="color:#DEB887">${num}. ${item.name}</span>`;
                if (item.atk) html += ` <span style="color:#CD5C5C">atk:${item.atk}</span>`;
                if (item.def) html += ` <span style="color:#4682B4">def:${item.def}</span>`;
                if (item.heal) html += ` <span style="color:#6B8E23">heal:${item.heal}</span>`;
                if (item.value) html += ` <span style="color:#DAA520">($${item.value})</span>`;
                html += `<div style="color:#696969;font-size:10px">${item.desc || ''}${equipStr}${useStr}${sellStr}</div></div>`;
            });
        }
        list.innerHTML = html;
        document.getElementById('inventory-feedback').textContent = '';
        screen.classList.remove('hidden');
        game.state = 'inventory';
    }

    hideInventoryScreen() { document.getElementById('inventory-screen').classList.add('hidden'); }

    // ---- Shop Screen ----
    showShopScreen(game, location) {
        const screen = document.getElementById('shop-screen');
        const list = document.getElementById('shop-list');
        document.getElementById('shop-gold').textContent = `Gold: ${game.player.gold}`;
        const shopItems = SHOP_ITEMS[location.type] || SHOP_ITEMS.town;
        let html = '';
        shopItems.forEach((entry, i) => {
            const item = ITEMS[entry.item];
            if (!item) return;
            const num = i + 1;
            const canAfford = game.player.gold >= entry.price;
            const color = canAfford ? '#DEB887' : '#696969';
            html += `<div class="shop-item" style="color:${color}"><span>[${num}]</span> ${item.name} - $${entry.price}`;
            if (item.atk) html += ` <span style="color:#CD5C5C">atk:${item.atk}</span>`;
            if (item.def) html += ` <span style="color:#4682B4">def:${item.def}</span>`;
            if (item.heal) html += ` <span style="color:#6B8E23">heal:${item.heal}</span>`;
            html += `<div style="color:#696969;font-size:10px">${item.desc || ''}</div></div>`;
        });
        list.innerHTML = html;
        document.getElementById('shop-feedback').textContent = '';
        screen.classList.remove('hidden');
        game.state = 'shop';
        game._shopItems = shopItems;
    }

    hideShopScreen() { document.getElementById('shop-screen').classList.add('hidden'); }

    showDeathScreen(player) {
        const screen = document.getElementById('death-screen');
        const q = QUOTES.death[Math.floor(Math.random() * QUOTES.death.length)];
        document.getElementById('death-quote').textContent = `"${q.text}"`;
        document.getElementById('death-attribution').textContent = `- ${q.attr}`;
        document.getElementById('death-stats').innerHTML = `
            <div>Turns survived: ${player.turnsPlayed}</div><div>Enemies killed: ${player.kills}</div>
            <div>Deliveries made: ${player.deliveries}</div><div>Gold earned: ${player.gold}</div>
            <div>Level reached: ${player.level}</div>`;
        screen.classList.remove('hidden');
    }

    hideDeathScreen() { document.getElementById('death-screen').classList.add('hidden'); }
    showHelp() { document.getElementById('help-screen').classList.remove('hidden'); }
    hideHelp() { document.getElementById('help-screen').classList.add('hidden'); }

    updateTopBar(turn, player, map) {
        document.getElementById('turn-counter').textContent = `Turn: ${turn}`;
        const loc = map.getNearbyLocation(player.x, player.y, 8);
        document.getElementById('location-name').textContent = loc ? loc.name : map.getTile(player.x, player.y).name;
    }
}
