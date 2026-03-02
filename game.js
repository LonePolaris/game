// 香水工坊 - 游戏逻辑

const IDLE_DURATION_MS = 30 * 60 * 1000; // 挂机固定 30 分钟

class Game {
  constructor() {
    this.commonCount = {};   // 普通材料数量 { 材料名: number }
    this.specialCount = {};  // 特殊材料数量
    this.specialItemCount = {}; // 特殊道具数量 { itemId: number }
    this.gold = 20;          // 初始金币
    this.nextSkipCost = 5;  // 下次跳过挂机消耗的金币，每跳过一次 +5
    this.unlockedPerfumes = new Set(); // 已解锁香水 id
    this.unlockedMaterials = new Set(); // 已获得过的材料（用于统计解锁种类数）
    this.triedCombinations = []; // 尝试过的组合 [{ common: string[], special: string|null }]
    this.obtainedSpecialItemIds = new Set(); // 已获得过的特殊道具 id（每种一次）
    this.selectedSpecialItemId = null; // 本次挂机携带的特殊道具
    this.isIdling = false;
    this.idleTimer = null;
    this.idleStartTime = 0;   // 挂机开始时间戳，用于计算剩余时间
    this._idleOnFinish = null; // 挂机结束回调（供跳过调用）
    this.allPerfumes = getAllPerfumes();
    this.materialUnlockCount = 0; // 已解锁的材料种类数（用于里程碑）
    this.idleCount = 0; // 已完成的挂机次数（前两次保证给至少一种可单独制香的材料）
  }

  getGold() { return this.gold; }
  getSkipIdleCost() { return this.nextSkipCost; }
  canSkipIdle() { return this.isIdling && this.gold >= this.nextSkipCost; }

  getUnlockedMaterialCount() {
    return this.unlockedMaterials.size;
  }

  addMaterial(name, isSpecial, count = 1) {
    const wasNew = !this.unlockedMaterials.has(name);
    this.unlockedMaterials.add(name);
    if (isSpecial) {
      this.specialCount[name] = (this.specialCount[name] || 0) + count;
    } else {
      this.commonCount[name] = (this.commonCount[name] || 0) + count;
    }
    if (wasNew) {
      this.materialUnlockCount = this.unlockedMaterials.size;
      return this.checkSpecialItemMilestone();
    }
    return null;
  }

  checkSpecialItemMilestone() {
    if (!SPECIAL_ITEM_MILESTONES.includes(this.materialUnlockCount)) return null;
    const available = SPECIAL_ITEMS.filter(it => !this.obtainedSpecialItemIds.has(it.id));
    if (available.length === 0) return null;
    const chosen = available[Math.floor(Math.random() * available.length)];
    this.obtainedSpecialItemIds.add(chosen.id);
    this.specialItemCount[chosen.id] = (this.specialItemCount[chosen.id] || 0) + 1;
    return chosen;
  }

  selectSpecialItemForIdle(itemId) {
    if (!itemId || (this.specialItemCount[itemId] || 0) < 1) return false;
    this.selectedSpecialItemId = itemId;
    return true;
  }

  startIdle(onProgress, onFinish) {
    if (this.isIdling) return;
    this.isIdling = true;
    this._idleOnFinish = onFinish;
    this.idleStartTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - this.idleStartTime;
      if (elapsed >= IDLE_DURATION_MS) {
        this.isIdling = false;
        this._idleOnFinish = null;
        this.finishIdle();
        onFinish && onFinish(this.lastIdleReward);
        return;
      }
      onProgress && onProgress(elapsed / IDLE_DURATION_MS, elapsed);
      this.idleTimer = setTimeout(tick, 1000); // 每秒更新一次
    };
    tick();
  }

  // 消耗金币立即结束挂机，返回 true 表示成功
  skipIdle() {
    if (!this.isIdling) return false;
    if (this.gold < this.nextSkipCost) return false;
    this.gold -= this.nextSkipCost;
    this.nextSkipCost += 5; // 下次跳过多消耗 5 金币
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    this.isIdling = false;
    const onFinish = this._idleOnFinish;
    this._idleOnFinish = null;
    this.finishIdle();
    if (onFinish) onFinish(this.lastIdleReward);
    return true;
  }

  getIdleRemainingMs() {
    if (!this.isIdling) return 0;
    const elapsed = Date.now() - this.idleStartTime;
    return Math.max(0, IDLE_DURATION_MS - elapsed);
  }

  finishIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    const n = 2 + Math.floor(Math.random() * 2); // 2 或 3
    const reward = { common: [], special: null, newSpecialItem: null };
    const isFirstTwoIdles = this.idleCount < 2;
    if (isFirstTwoIdles) {
      const solo = SOLO_COMMON_MATERIALS[Math.floor(Math.random() * SOLO_COMMON_MATERIALS.length)];
      const newItem = this.addMaterial(solo, false, 1);
      reward.common.push(solo);
      if (newItem) reward.newSpecialItem = newItem;
    }
    for (let i = isFirstTwoIdles ? 1 : 0; i < n; i++) {
      const m = COMMON_MATERIALS_IN_USE[Math.floor(Math.random() * COMMON_MATERIALS_IN_USE.length)];
      const newItem = this.addMaterial(m, false, 1);
      reward.common.push(m);
      if (newItem) reward.newSpecialItem = newItem;
    }
    if (isFirstTwoIdles) this.idleCount++;
    if (this.selectedSpecialItemId) {
      const item = SPECIAL_ITEMS.find(it => it.id === this.selectedSpecialItemId);
      if (item && (this.specialItemCount[this.selectedSpecialItemId] || 0) >= 1) {
        this.specialItemCount[this.selectedSpecialItemId]--;
        const specialMat = SPECIAL_MATERIALS[item.materialId];
        const newItem = this.addMaterial(specialMat, true, 1);
        reward.special = specialMat;
        if (newItem) reward.newSpecialItem = newItem;
      }
      this.selectedSpecialItemId = null;
    }
    this.lastIdleReward = reward;
  }

  // 制作香水。attemptCommon: string[], attemptSpecial: string|null
  // 返回 { success, perfume, consumed } 成功且首次解锁时 consumed=true
  craft(attemptCommon, attemptSpecial) {
    if (!attemptCommon || attemptCommon.length === 0) return { success: false, perfume: null, consumed: false };
    if (attemptCommon.length > 4) return { success: false, perfume: null, consumed: false };
    if (attemptSpecial && !SPECIAL_MATERIALS.includes(attemptSpecial)) return { success: false, perfume: null, consumed: false };
    this.triedCombinations.push({ common: [...attemptCommon], special: attemptSpecial || null });

    let matched = null;
    for (const p of this.allPerfumes) {
      if (formulaMatch(attemptCommon, attemptSpecial, p)) {
        matched = p;
        break;
      }
    }
    if (!matched) {
      const hintResult = this.getClosestFormulaHint(attemptCommon, attemptSpecial);
      return { success: false, perfume: null, consumed: false, hint: hintResult ? hintResult.hintText : null };
    }

    const alreadyUnlocked = this.unlockedPerfumes.has(matched.id);
    if (alreadyUnlocked) return { success: true, perfume: matched, consumed: false };

    // 检查材料是否足够并扣除（支持同一种材料多份）
    const needCommon = [...matched.formula.common];
    const needSpecial = matched.formula.special || null;
    const needCount = {};
    for (const m of needCommon) needCount[m] = (needCount[m] || 0) + 1;
    for (const m of Object.keys(needCount)) {
      if ((this.commonCount[m] || 0) < needCount[m]) return { success: false, perfume: matched, consumed: false, reason: 'insufficient' };
    }
    if (needSpecial && (this.specialCount[needSpecial] || 0) < 1) return { success: false, perfume: matched, consumed: false, reason: 'insufficient' };

    for (const m of needCommon) this.commonCount[m]--;
    if (needSpecial) this.specialCount[needSpecial]--;
    this.unlockedPerfumes.add(matched.id);
    const goldEarned = 10 + Math.floor(Math.random() * 11); // [10, 20] 随机
    this.gold += goldEarned;
    return { success: true, perfume: matched, consumed: true, goldEarned };
  }

  // 制作失败时：找到与当前选择重合度最高的配方，返回未选对材料的提示文案
  getClosestFormulaHint(attemptCommon, attemptSpecial) {
    const trySet = new Set(attemptCommon);
    const trySpecial = attemptSpecial || null;
    let bestPerfume = null;
    let bestOverlap = -1;
    for (const p of this.allPerfumes) {
      const needSet = new Set(p.formula.common);
      const needSpecial = p.formula.special || null;
      let overlap = 0;
      for (const m of needSet) if (trySet.has(m)) overlap++;
      if (needSpecial && needSpecial === trySpecial) overlap++;
      if (overlap > bestOverlap) { bestOverlap = overlap; bestPerfume = p; }
    }
    if (!bestPerfume || bestOverlap === 0) return null;
    const needSet2 = new Set(bestPerfume.formula.common);
    if (bestPerfume.formula.special) needSet2.add(bestPerfume.formula.special);
    const trySet2 = new Set(attemptCommon);
    if (trySpecial) trySet2.add(trySpecial);
    const missing = [...needSet2].filter(m => !trySet2.has(m));
    if (missing.length === 0) return null;
    const hints = missing.map(m => MATERIAL_HINTS[m] || '某种材料').filter(Boolean);
    const hintText = '最接近的配方中，还差：' + hints.join('；');
    return { perfume: bestPerfume, missing, hintText };
  }

  // 获取某香水的公式显示：已通过尝试揭示的部分显示材料名，否则 ?
  getFormulaDisplay(perfume) {
    const required = [...perfume.formula.common];
    if (perfume.formula.special) required.push(perfume.formula.special);
    const revealed = new Set();
    for (const t of this.triedCombinations) {
      for (const r of required) {
        if ((Array.isArray(t.common) ? t.common.includes(r) : t.common.has(r)) || t.special === r) revealed.add(r);
      }
    }
    return required.map(r => revealed.has(r) ? r : '?');
  }

  hasEnoughForFormula(perfume) {
    for (const m of perfume.formula.common) {
      if ((this.commonCount[m] || 0) < 1) return false;
    }
    if (perfume.formula.special && (this.specialCount[perfume.formula.special] || 0) < 1) return false;
    return true;
  }

  getCommonCount(name) { return this.commonCount[name] || 0; }
  getSpecialCount(name) { return this.specialCount[name] || 0; }
  getSpecialItemCount(itemId) { return this.specialItemCount[itemId] || 0; }
  isPerfumeUnlocked(id) { return this.unlockedPerfumes.has(id); }

  save() {
    return JSON.stringify({
      commonCount: this.commonCount,
      specialCount: this.specialCount,
      specialItemCount: this.specialItemCount,
      gold: this.gold,
      nextSkipCost: this.nextSkipCost,
      idleCount: this.idleCount,
      unlockedPerfumes: [...this.unlockedPerfumes],
      unlockedMaterials: [...this.unlockedMaterials],
      triedCombinations: this.triedCombinations.map(t => ({
        common: [...t.common],
        special: t.special
      })),
      obtainedSpecialItemIds: [...this.obtainedSpecialItemIds]
    });
  }

  load(jsonStr) {
    try {
      const o = JSON.parse(jsonStr);
      this.commonCount = o.commonCount || {};
      this.specialCount = o.specialCount || {};
      this.specialItemCount = o.specialItemCount || {};
      this.gold = o.gold !== undefined ? o.gold : 20;
      this.nextSkipCost = o.nextSkipCost !== undefined ? o.nextSkipCost : 5;
      this.idleCount = o.idleCount !== undefined ? o.idleCount : 0;
      this.unlockedPerfumes = new Set(o.unlockedPerfumes || []);
      this.unlockedMaterials = new Set(o.unlockedMaterials || []);
      this.triedCombinations = (o.triedCombinations || []).map(t => ({
        common: Array.isArray(t.common) ? t.common : [],
        special: t.special
      }));
      this.obtainedSpecialItemIds = new Set(o.obtainedSpecialItemIds || []);
      this.materialUnlockCount = this.unlockedMaterials.size;
    } catch (e) {}
  }
}
