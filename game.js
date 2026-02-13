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
      effect: '每回合固定基础加分：每回合获得1积分。每回合额外效果加分：棋盘上每拥有N个红玫瑰，每回合可额外获得N积分。',
      weight: 200
    },
    baibahe: {
      id: 'baibahe',
      name: '白百何',
      category: '鲜花类',
      categoryKey: 'flower',
      effect: '每回合固定基础加分：每回合获得3积分。',
      weight: 200
    },
    youjialiye: {
      id: 'youjialiye',
      name: '尤加利叶',
      category: '鲜花类',
      categoryKey: 'flower',
      effect: '每回合额外效果加分：使在棋盘上相邻格子的【鲜花类】种植物本回合获得的积分+1。',
      weight: 100
    },
    qiukui: {
      id: 'qiukui',
      name: '秋葵',
      category: '惊喜类',
      categoryKey: 'surprise',
      effect: '每回合固定基础加分：每回合获得5积分。每回合额外效果加分：位于棋盘的四个角落时，额外获得10积分。',
      weight: 50
    },
    xigua: {
      id: 'xigua',
      name: '西瓜',
      category: '惊喜类',
      categoryKey: 'surprise',
      effect: '每回合额外效果加分：使与其相邻的【种植物】本回合可获得的积分翻倍。',
      weight: 30
    },
    bangbangtang: {
      id: 'bangbangtang',
      name: '棒棒糖',
      category: '惊喜类',
      categoryKey: 'surprise',
      effect: '每回合额外效果加分：使与雕像相邻的【种植物】本回合可获得的积分翻倍。',
      weight: 30
    },
    bengbengling: {
      id: 'bengbengling',
      name: '蹦蹦灵',
      category: '花灵类',
      categoryKey: 'spirit',
      effect: '每回合额外效果加分：使得棋盘上不与任何【种植物】相邻的【种植物】积分+2。',
      weight: 20
    },
    wuwuling: {
      id: 'wuwuling',
      name: '呜呜灵',
      category: '花灵类',
      categoryKey: 'spirit',
      effect: '每回合固定基础加分：本回合获得20积分。每回合额外效果加分：与其相邻的【种植物】本回合不生效。',
      weight: 20
    },
    guguling: {
      id: 'guguling',
      name: '咕咕灵',
      category: '花灵类',
      categoryKey: 'spirit',
      effect: '每回合额外效果加分：若本回合仓库里没有出现在棋盘的【种植物】数量为N，则本回合额外获得N分。',
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
    nextRoundEffects: [],
    roundLogs: []
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
    state.roundLogs.push({
      round: state.roundCount,
      total: n,
      gugudaji: true,
      fixedLines: [],
      fixedTotal: 0,
      effectLines: ['咕咕大吉：本回合未抽取种植物，仓库数量 N = ' + n + '，+' + n + ' 分'],
      effectTotal: 0,
      hongmeiguiExtra: 0,
      gugulingExtra: 0
    });
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
    const copy = warehouse.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const drawn = copy.slice(0, drawCount);
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

    const hongmeiguiCount = board.filter(id => id === 'hongmeigui').length;

    // 每回合固定基础加分：直接累加，不参与翻倍
    const fixedScores = new Array(25).fill(0);
    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      const id = board[i];
      if (id === 'hongmeigui') fixedScores[i] = 1;
      else if (id === 'baibahe') fixedScores[i] = 3;
      else if (id === 'qiukui') fixedScores[i] = 5;
      else if (id === 'wuwuling') fixedScores[i] = 20;
    }

    // 每回合额外效果加分：可被尤加利叶/西瓜/棒棒糖/蹦蹦灵/分来分来影响
    let effectScores = new Array(25).fill(0);
    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      const id = board[i];
      if (id === 'qiukui' && CORNERS.includes(i)) effectScores[i] = 10;
      // 红玫瑰的 N 积分在最后单独加，不放在格子里
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
    for (let i = 0; i < 25; i++) effectScores[i] += youjialiyeAdd[i];

    // 西瓜/棒棒糖只对额外效果加分翻倍
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

    effectScores = effectScores.map((s, i) => Math.round(s * (multipliers[i] || 1)));

    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      const neighbors = getNeighbors(i);
      const hasPlantNeighbor = neighbors.some(idx => board[idx] !== null && idx !== CENTER);
      if (!hasPlantNeighbor) effectScores[i] += 2;
    }

    let bonusRow = null;
    const fenlaifenlai = state.activeGridEffects.find(e => e.id === 'fenlaifenlai');
    if (fenlaifenlai) {
      bonusRow = Math.floor(Math.random() * 5);
      for (let c = 0; c < 5; c++) {
        const idx = bonusRow * 5 + c;
        if (board[idx]) effectScores[idx] += 2;
      }
    }

    // 每格显示分 = 固定基础 + 额外效果（格子上显示）
    const scores = fixedScores.map((f, i) => f + effectScores[i]);

    const onBoardIds = new Set();
    for (let i = 0; i < 25; i++) {
      if (board[i]) onBoardIds.add(board[i]);
    }
    const warehouseSet = new Set(state.warehouse);
    let gugulingBonus = 0;
    for (const id of warehouseSet) {
      if (!onBoardIds.has(id)) gugulingBonus++;
    }

    // 总积分 = 格子分之和 + 红玫瑰额外N + 咕咕灵额外N
    let total = scores.reduce((a, b) => a + b, 0) + hongmeiguiCount + gugulingBonus;
    state.totalScore += total;
    state.roundCount++;
    if (state.roundCount % 5 === 0) state.coins++;

    applyGridEffectDurations();

    // 记录本回合加分细则
    const fixedTotal = fixedScores.reduce((a, b) => a + b, 0);
    const effectTotal = effectScores.reduce((a, b) => a + b, 0);
    const plantCounts = {};
    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      const id = board[i];
      plantCounts[id] = (plantCounts[id] || 0) + 1;
    }
    const fixedLines = [];
    if (plantCounts.hongmeigui) fixedLines.push('红玫瑰 × ' + plantCounts.hongmeigui + ' = ' + (plantCounts.hongmeigui * 1));
    if (plantCounts.baibahe) fixedLines.push('白百何 × ' + plantCounts.baibahe + ' = ' + (plantCounts.baibahe * 3));
    if (plantCounts.qiukui) fixedLines.push('秋葵 × ' + plantCounts.qiukui + ' = ' + (plantCounts.qiukui * 5));
    if (plantCounts.wuwuling) fixedLines.push('呜呜灵 × ' + plantCounts.wuwuling + ' = ' + (plantCounts.wuwuling * 20));

    let isolatedCount = 0;
    for (let i = 0; i < 25; i++) {
      if (i === CENTER || !board[i] || silenced.has(i)) continue;
      const neighbors = getNeighbors(i);
      if (!neighbors.some(idx => board[idx] !== null && idx !== CENTER)) isolatedCount++;
    }
    const youjialiyeSum = youjialiyeAdd.reduce((a, b) => a + b, 0);
    const effectLines = [];
    if (youjialiyeSum > 0) effectLines.push('尤加利叶：相邻鲜花类 +1，共 +' + youjialiyeSum + ' 分');
    const qiukuiCorner = CORNERS.filter(c => board[c] === 'qiukui').length;
    if (qiukuiCorner > 0) effectLines.push('秋葵角落：' + qiukuiCorner + ' 格 × 10 = +' + (qiukuiCorner * 10) + ' 分');
    if (hasBangbangtang) effectLines.push('棒棒糖：与雕像相邻的种植物积分翻倍');
    const xiguaCount = board.filter(id => id === 'xigua').length;
    if (xiguaCount > 0) effectLines.push('西瓜：与其相邻的种植物积分翻倍');
    if (isolatedCount > 0) effectLines.push('蹦蹦灵：孤立种植物 +2，共 ' + isolatedCount + ' 格 = +' + (isolatedCount * 2) + ' 分');
    if (bonusRow !== null) {
      const rowCount = [0,1,2,3,4].filter(c => board[bonusRow * 5 + c]).length;
      if (rowCount > 0) effectLines.push('分来分来：第 ' + (bonusRow + 1) + ' 排 +2，共 ' + rowCount + ' 格 = +' + (rowCount * 2) + ' 分');
    }
    if (hongmeiguiCount > 0) effectLines.push('红玫瑰额外：棋盘 N = ' + hongmeiguiCount + '，+' + hongmeiguiCount + ' 分');
    if (gugulingBonus > 0) effectLines.push('咕咕灵：仓库未上场种类 N = ' + gugulingBonus + '，+' + gugulingBonus + ' 分');

    state.roundLogs.push({
      round: state.roundCount,
      total,
      fixedLines,
      fixedTotal,
      effectLines,
      effectTotal,
      hongmeiguiExtra: hongmeiguiCount,
      gugulingExtra: gugulingBonus
    });

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

  function renderRoundLogs() {
    const el = document.getElementById('roundLogList');
    if (!el) return;
    if (state.roundLogs.length === 0) {
      el.innerHTML = '暂无记录，完成一回合种花后这里会显示该回合的加分细则。';
      return;
    }
    el.innerHTML = state.roundLogs.map((entry, idx) => {
      const fixedBlock = entry.fixedLines.length
        ? '<div class="sub">固定基础加分：</div>' + entry.fixedLines.map(l => '<div class="line">' + l + '</div>').join('') + '<div class="line">小计：' + entry.fixedTotal + ' 分</div>'
        : '';
      const effectBlock = entry.effectLines.length
        ? '<div class="sub">额外效果加分：</div>' + entry.effectLines.map(l => '<div class="line">' + l + '</div>').join('') + (entry.effectTotal > 0 ? '<div class="line">格子额外效果小计：' + entry.effectTotal + ' 分</div>' : '')
        : '';
      const totalLine = '<div class="total">本回合合计：' + entry.total + ' 分</div>';
      return '<div class="log-round" data-idx="' + idx + '">' +
        '<div class="log-round-header">第 ' + entry.round + ' 回合' + (entry.gugudaji ? '（咕咕大吉）' : '') + '：' + entry.total + ' 分</div>' +
        '<div class="log-round-detail">' + fixedBlock + effectBlock + totalLine + '</div>' +
        '</div>';
    }).join('');
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
      renderRoundLogs();
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
    renderRoundLogs();

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
  renderRoundLogs();

  const logToggle = document.getElementById('logPanelToggle');
  const logBody = document.getElementById('logPanelBody');
  if (logToggle && logBody) {
    logToggle.addEventListener('click', () => {
      logBody.classList.toggle('collapsed');
      logToggle.classList.toggle('collapsed');
      logToggle.textContent = logBody.classList.contains('collapsed') ? '▶ 回合加分细则说明' : '▼ 回合加分细则说明';
    });
  }
})();
