(function () {
  'use strict';

  const CENTER = 12;
  const ROWS = 5;
  const COLS = 5;
  const CORNERS = [0, 4, 20, 24];
  const ADJACENT_TO_STATUE = [7, 11, 13, 17];

  const PLANTS = {
    hongmeigui: {
      id: 'hongmeigui',
      name: '红玫瑰',
      category: '鲜花类',
      categoryKey: 'flower',
      effect: '每回合获得1积分，棋盘上每拥有N个红玫瑰，每回合可额外获得N积分。',
      weight: 200
    },
    baibahe: {
      id: 'baibahe',
      name: '白百何',
      category: '鲜花类',
      categoryKey: 'flower',
      effect: '每回合获得2积分。',
      weight: 200
    },
    youjialiye: {
      id: 'youjialiye',
      name: '尤加利叶',
      category: '鲜花类',
      categoryKey: 'flower',
      effect: '使在棋盘上相邻格子的【鲜花类】种植物本回合获得的积分+1。',
      weight: 100
    },
    qiukui: {
      id: 'qiukui',
      name: '秋葵',
      category: '惊喜类',
      categoryKey: 'surprise',
      effect: '每回合获得5积分，位于棋盘的四个角落时，额外获得10积分。',
      weight: 50
    },
    xigua: {
      id: 'xigua',
      name: '西瓜',
      category: '惊喜类',
      categoryKey: 'surprise',
      effect: '使与其相邻的【种植物】本回合可获得的积分翻倍。',
      weight: 30
    },
    bangbangtang: {
      id: 'bangbangtang',
      name: '棒棒糖',
      category: '惊喜类',
      categoryKey: 'surprise',
      effect: '使与雕像相邻的【种植物】本回合可获得的积分翻倍。',
      weight: 30
    },
    bengbengling: {
      id: 'bengbengling',
      name: '蹦蹦灵',
      category: '花灵类',
      categoryKey: 'spirit',
      effect: '使得棋盘上不与任何【种植物】相邻的【种植物】积分+2。',
      weight: 20
    },
    wuwuling: {
      id: 'wuwuling',
      name: '呜呜灵',
      category: '花灵类',
      categoryKey: 'spirit',
      effect: '本回合获得20积分，使与其相邻的【种植物】本回合不生效。',
      weight: 20
    },
    guguling: {
      id: 'guguling',
      name: '咕咕灵',
      category: '花灵类',
      categoryKey: 'spirit',
      effect: '若本回合仓库里没有出现在棋盘的【种植物】数量为N，则本回合额外获得N分。',
      weight: 10
    }
  };

  const GRID_EFFECTS = {
    fenlaifenlai: {
      id: 'fenlaifenlai',
      name: '分来分来',
      category: '稳妥类',
      effect: '每回合随机棋盘上的一排，这一排上的【种植物】本回合分别额外获得2积分。',
      duration: 3,
      cost: 10
    },
    gugudaji: {
      id: 'gugudaji',
      name: '咕咕大吉',
      category: '激进类',
      effect: '本回合不会从背包里抽取任何【种植物】，但若背包里拥有的【种植物】数量为N，则本回合额外获得N分。',
      duration: 1,
      cost: 10
    }
  };

  function getNeighbors(index) {
    const n = [];
    if (index >= COLS) n.push(index - COLS);
    if (index < (ROWS - 1) * COLS) n.push(index + COLS);
    if (index % COLS > 0) n.push(index - 1);
    if (index % COLS < COLS - 1) n.push(index + 1);
    return n;
  }

  function getPlantIdsByWeight() {
    const list = [];
    for (const [id, p] of Object.entries(PLANTS)) {
      for (let i = 0; i < p.weight; i++) list.push(id);
    }
    return list;
  }

  const WEIGHTED_PLANT_IDS = getPlantIdsByWeight();

  const state = {
    totalScore: 0,
    roundCount: 0,
    coins: 0,
    warehouse: ['hongmeigui', 'baibahe', 'bengbengling'],
    board: new Array(25).fill(null),
    activeGridEffects: [],
    nextRoundEffects: []
  };

  function getBoard() {
    return state.board;
  }

  function setBoard(index, plantId) {
    state.board[index] = plantId;
  }

  function clearBoard() {
    for (let i = 0; i < 25; i++) {
      if (i !== CENTER) state.board[i] = null;
    }
  }

  function getEmptySlots() {
    const slots = [];
    for (let i = 0; i < 25; i++) {
      if (i !== CENTER && state.board[i] === null) slots.push(i);
    }
    return slots;
  }

  function startRoundWithGugudaji() {
    clearBoard();
    const n = state.warehouse.length;
    state.totalScore += n;
    state.roundCount++;
    if (state.roundCount % 5 === 0) state.coins++;
    applyGridEffectDurations();
    return { roundScore: n, boardScores: [], bonusRow: null };
  }

  function applyGridEffectDurations() {
    state.activeGridEffects = state.activeGridEffects.filter(e => {
      e.remaining--;
      return e.remaining > 0;
    });
    state.activeGridEffects.push(...state.nextRoundEffects);
    state.nextRoundEffects = [];
  }

  function drawAndPlace() {
    clearBoard();
    const warehouse = state.warehouse;
    const drawCount = Math.min(warehouse.length, 24);
    const drawn = [];
    for (let i = 0; i < drawCount; i++) {
      drawn.push(warehouse[Math.floor(Math.random() * warehouse.length)]);
    }
    const slots = getEmptySlots();
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    for (let i = 0; i < drawn.length; i++) {
      setBoard(slots[i], drawn[i]);
    }
    return drawn;
  }

  function computeScores() {
    const board = state.board.slice();
    const silenced = new Set();

    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i]) continue;
      if (board[i] === 'wuwuling') {
        getNeighbors(i).forEach(idx => {
          if (board[idx]) silenced.add(idx);
        });
      }
    }

    let baseScores = new Array(25).fill(0);
    const hongmeiguiCount = board.filter(id => id === 'hongmeigui').length;

    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      const id = board[i];
      const p = PLANTS[id];
      if (!p) continue;
      if (id === 'hongmeigui') baseScores[i] = 1 + hongmeiguiCount;
      else if (id === 'baibahe') baseScores[i] = 2;
      else if (id === 'youjialiye') baseScores[i] = 0;
      else if (id === 'qiukui') {
        baseScores[i] = 5;
        if (CORNERS.includes(i)) baseScores[i] += 10;
      } else if (id === 'xigua' || id === 'bangbangtang') baseScores[i] = 0;
      else if (id === 'bengbengling') baseScores[i] = 0;
      else if (id === 'wuwuling') baseScores[i] = 20;
      else if (id === 'guguling') baseScores[i] = 0;
    }

    const onBoardIds = new Set();
    for (let i = 0; i < 25; i++) {
      if (board[i]) onBoardIds.add(board[i]);
    }
    const warehouseSet = new Set(state.warehouse);
    let gugulingBonus = 0;
    for (const id of warehouseSet) {
      if (!onBoardIds.has(id)) gugulingBonus++;
    }

    const youjialiyeAdd = new Array(25).fill(0);
    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      if (board[i] === 'youjialiye') {
        getNeighbors(i).forEach(idx => {
          if (board[idx] && PLANTS[board[idx]].categoryKey === 'flower') youjialiyeAdd[idx]++;
        });
      }
    }
    for (let i = 0; i < 25; i++) baseScores[i] += youjialiyeAdd[i];

    const multipliers = new Array(25).fill(1);
    const hasBangbangtang = board.some(id => id === 'bangbangtang');
    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      if (board[i] === 'xigua') {
        getNeighbors(i).forEach(idx => {
          if (board[idx]) multipliers[idx] *= 2;
        });
      }
    }
    if (hasBangbangtang) {
      ADJACENT_TO_STATUE.forEach(idx => {
        if (board[idx]) multipliers[idx] *= 2;
      });
    }

    let scores = baseScores.map((s, i) => Math.round(s * (multipliers[i] || 1)));

    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      const neighbors = getNeighbors(i);
      const hasPlantNeighbor = neighbors.some(idx => board[idx] !== null && idx !== CENTER);
      if (!hasPlantNeighbor) scores[i] += 2;
    }

    let bonusRow = null;
    const fenlaifenlai = state.activeGridEffects.find(e => e.id === 'fenlaifenlai');
    if (fenlaifenlai) {
      bonusRow = Math.floor(Math.random() * 5);
      for (let c = 0; c < 5; c++) {
        const idx = bonusRow * 5 + c;
        if (board[idx]) scores[idx] += 2;
      }
    }

    let total = scores.reduce((a, b) => a + b, 0) + gugulingBonus;
    state.totalScore += total;
    state.roundCount++;
    if (state.roundCount % 5 === 0) state.coins++;

    applyGridEffectDurations();

    return {
      roundScore: total,
      boardScores: scores,
      bonusRow
    };
  }

  function pickThreePlants() {
    const chosen = new Set();
    while (chosen.size < 3) {
      const id = WEIGHTED_PLANT_IDS[Math.floor(Math.random() * WEIGHTED_PLANT_IDS.length)];
      chosen.add(id);
    }
    return Array.from(chosen);
  }

  function renderBoard(scores, bonusRow) {
    const el = document.getElementById('board');
    el.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('div');
      if (i === CENTER) {
        cell.className = 'cell statue';
        cell.textContent = '雕像';
      } else {
        const plantId = state.board[i];
        if (plantId) {
          const p = PLANTS[plantId];
          cell.className = 'cell ' + p.categoryKey;
          cell.innerHTML = '<span class="name">' + p.name + '</span>' +
            (scores && scores[i] !== undefined ? '<span class="pts">+' + scores[i] + '</span>' : '');
          if (bonusRow !== null && Math.floor(i / 5) === bonusRow) cell.classList.add('effect-row');
        } else {
          cell.className = 'cell empty';
          cell.textContent = '';
        }
      }
      el.appendChild(cell);
    }
  }

  function renderWarehouse() {
    const el = document.getElementById('warehouse');
    el.innerHTML = '';
    state.warehouse.forEach(plantId => {
      const p = PLANTS[plantId];
      if (!p) return;
      const btn = document.createElement('button');
      btn.className = 'warehouse-item ' + p.categoryKey;
      btn.textContent = p.name;
      btn.type = 'button';
      btn.addEventListener('click', () => showPlantDetail(plantId));
      el.appendChild(btn);
    });
  }

  function renderTopBar() {
    document.getElementById('totalScore').textContent = state.totalScore;
    document.getElementById('roundCount').textContent = state.roundCount;
    document.getElementById('coinCount').textContent = state.coins;
  }

  function renderEffectsPanel() {
    const el = document.getElementById('effectsList');
    if (state.activeGridEffects.length === 0) {
      el.textContent = '暂无';
      return;
    }
    el.innerHTML = state.activeGridEffects.map(e => {
      const g = GRID_EFFECTS[e.id];
      return g.name + '（剩余' + e.remaining + '回合）';
    }).join('、');
  }

  function showPlantDetail(plantId) {
    const p = PLANTS[plantId];
    if (!p) return;
    document.getElementById('detailName').textContent = '名称：' + p.name;
    document.getElementById('detailCategory').textContent = '分类：' + p.category;
    document.getElementById('detailEffect').textContent = '效果：' + p.effect;
    document.getElementById('modalPlantDetail').classList.add('show');
  }

  function showChoice(choices, resolve) {
    const list = document.getElementById('choiceList');
    list.innerHTML = '';
    choices.forEach(plantId => {
      const p = PLANTS[plantId];
      const btn = document.createElement('button');
      btn.className = 'choice-btn ' + p.categoryKey;
      btn.textContent = p.name + '（' + p.category + '）';
      btn.type = 'button';
      btn.addEventListener('click', () => {
        state.warehouse.push(plantId);
        document.getElementById('modalChoice').classList.remove('show');
        renderWarehouse();
        renderTopBar();
        resolve();
      });
      list.appendChild(btn);
    });
    document.getElementById('modalChoice').classList.add('show');
  }

  function showRoundScore(roundScore, resolve) {
    document.getElementById('roundScoreText').textContent = roundScore + ' 积分';
    document.getElementById('modalScore').classList.add('show');
    document.getElementById('closeScore').onclick = () => {
      document.getElementById('modalScore').classList.remove('show');
      resolve();
    };
  }

  function runRound() {
    const gugudaji = state.activeGridEffects.find(e => e.id === 'gugudaji');
    if (gugudaji) {
      const result = startRoundWithGugudaji();
      renderBoard([], null);
      renderTopBar();
      renderEffectsPanel();
      showRoundScore(result.roundScore, () => {
        showChoice(pickThreePlants(), () => {});
      });
      return;
    }

    drawAndPlace();
    const { roundScore, boardScores, bonusRow } = computeScores();
    renderBoard(boardScores, bonusRow);
    renderTopBar();
    renderEffectsPanel();

    showRoundScore(roundScore, () => {
      showChoice(pickThreePlants(), () => {});
    });
  }

  function openShop() {
    document.getElementById('shopCoinDisplay').textContent = state.coins;
    const list = document.getElementById('shopList');
    list.innerHTML = '';
    for (const [id, g] of Object.entries(GRID_EFFECTS)) {
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = '<div><strong>' + g.name + '</strong>（' + g.category + '）· ' + g.effect + ' · 持续' + g.duration + '回合 · 消耗' + g.cost + '兑换币</div>';
      const btn = document.createElement('button');
      btn.textContent = '购买';
      btn.disabled = state.coins < g.cost;
      btn.addEventListener('click', () => {
        if (state.coins < g.cost) return;
        state.coins -= g.cost;
        state.nextRoundEffects.push({ id, remaining: g.duration });
        document.getElementById('shopCoinDisplay').textContent = state.coins;
        renderTopBar();
        renderEffectsPanel();
        btn.disabled = state.coins < g.cost;
      });
      div.appendChild(btn);
      list.appendChild(div);
    }
    document.getElementById('modalShop').classList.add('show');
  }

  document.getElementById('btnPlant').addEventListener('click', runRound);
  document.getElementById('btnShop').addEventListener('click', openShop);
  document.getElementById('closeDetail').addEventListener('click', () => document.getElementById('modalPlantDetail').classList.remove('show'));
  document.getElementById('closeShop').addEventListener('click', () => document.getElementById('modalShop').classList.remove('show'));

  document.getElementById('modalPlantDetail').addEventListener('click', e => {
    if (e.target.id === 'modalPlantDetail') e.target.classList.remove('show');
  });
  document.getElementById('modalChoice').addEventListener('click', e => {
    if (e.target.id === 'modalChoice') e.target.classList.remove('show');
  });
  document.getElementById('modalScore').addEventListener('click', e => {
    if (e.target.id === 'modalScore') e.target.classList.remove('show');
  });
  document.getElementById('modalShop').addEventListener('click', e => {
    if (e.target.id === 'modalShop') e.target.classList.remove('show');
  });

  clearBoard();
  renderBoard();
  renderWarehouse();
  renderTopBar();
  renderEffectsPanel();
})();
