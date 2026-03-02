// 香水工坊 - 游戏数据
// 材料：A/B/C 组为普通材料（15种），S 组为特殊材料（5种）。仅香水中用到的材料会在游戏中出现。

// 普通材料（15种）：A组凝萃液态、B组芳菲固态、C组深沉木质
const COMMON_MATERIALS = [
  '晨曦花露', '初萃花蜜', '鲜活叶汁', '纯净雨水', '凝结雾气',   // A01-A05
  '绯红花瓣', '流金花粉', '柔纱花蕊', '干燥花萼', '风干花苞',   // B01-B05
  '坚韧花藤', '幽蓝花刺', '深邃花根', '斑驳树皮', '沉睡种子'    // C01-C05
];

// 特殊材料（5种）：S组特殊媒介
const SPECIAL_MATERIALS = [
  '虹彩光棱', '凝时琥珀', '迷雾香氛', '水银镜片', '星尘丝线'   // S01-S05
];

// 图鉴中材料对应的图标（emoji）
const MATERIAL_ICONS = {
  '晨曦花露': '💧', '初萃花蜜': '🍯', '鲜活叶汁': '🌿', '纯净雨水': '🌧️', '凝结雾气': '🌫️',
  '绯红花瓣': '🌸', '流金花粉': '✨', '柔纱花蕊': '🧶', '干燥花萼': '🍂', '风干花苞': '🥀',
  '坚韧花藤': '🪵', '幽蓝花刺': '🌵', '深邃花根': '🟤', '斑驳树皮': '🪵', '沉睡种子': '🌰',
  '虹彩光棱': '🌈', '凝时琥珀': '⏳', '迷雾香氛': '🌫️', '水银镜片': '🪞', '星尘丝线': '✨'
};

// 制作失败时对“未选对材料”的提示（用特性/作用描述，不直接写材料名）
const MATERIAL_HINTS = {
  '晨曦花露': '清晨、纯净、无味的液态', '初萃花蜜': '甜蜜、粘稠、金色的蜜感', '鲜活叶汁': '青涩、生机、绿色', '纯净雨水': '凉爽、天空、流动', '凝结雾气': '朦胧、潮湿、白色',
  '绯红花瓣': '艳丽、浓香、柔软', '流金花粉': '粉尘、温暖、扩散', '柔纱花蕊': '细腻、核心、幽香', '干燥花萼': '草本、支撑、苦涩', '风干花苞': '内敛、潜力、封闭',
  '坚韧花藤': '缠绕、线条、韧性', '幽蓝花刺': '尖锐、防御、冷酷', '深邃花根': '泥土、黑暗、基础', '斑驳树皮': '粗糙、岁月、厚重', '沉睡种子': '坚硬、起源、核心',
  '虹彩光棱': '光影折射的媒介', '凝时琥珀': '时间封存的媒介', '迷雾香氛': '空间扩散的媒介', '水银镜片': '镜像复制的媒介', '星尘丝线': '命运编织的媒介'
};

// 特殊道具（与特殊材料一一对应，挂机时携带可获得对应特殊材料）
const SPECIAL_ITEMS = [
  { id: 'item_1', name: '虹彩光棱', materialId: 0 },
  { id: 'item_2', name: '凝时琥珀', materialId: 1 },
  { id: 'item_3', name: '迷雾香氛', materialId: 2 },
  { id: 'item_4', name: '水银镜片', materialId: 3 },
  { id: 'item_5', name: '星尘丝线', materialId: 4 }
];

// 材料解锁里程碑：解锁第 2、5、8、12、15 种材料时获得随机特殊道具（每种一次）
const SPECIAL_ITEM_MILESTONES = [2, 5, 8, 12, 15];

// 挂机时只从“香水中用到的普通材料”中随机（香水中未用到的材料不在游戏中出现）
const COMMON_MATERIALS_IN_USE = [
  '晨曦花露', '鲜活叶汁', '纯净雨水', '凝结雾气',
  '绯红花瓣', '流金花粉', '柔纱花蕊', '干燥花萼', '风干花苞',
  '坚韧花藤', '幽蓝花刺', '深邃花根', '斑驳树皮', '沉睡种子'
]; // 不含 初萃花蜜（配方中未使用）

// 可单独制作香水的材料（配方仅需一种普通材料）：朽木=斑驳树皮，青藤叶=鲜活叶汁，丝绒=柔纱花蕊
const SOLO_COMMON_MATERIALS = ['斑驳树皮', '鲜活叶汁', '柔纱花蕊'];

// 香水：15 种，公式为 1～4 种普通材料 + 0 或 1 种特殊材料
const COMMON_PERFUMES = [
  { id: 'p1', name: '朽木', formula: { common: ['斑驳树皮'], special: null }, desc: '一段被岁月风干的树皮，散发着干燥而安静的木质气息。' },
  { id: 'p2', name: '青藤叶', formula: { common: ['鲜活叶汁'], special: null }, desc: '揉碎一片嫩叶，指尖残留着生涩且清醒的绿意。' },
  { id: 'p3', name: '丝绒', formula: { common: ['柔纱花蕊'], special: null }, desc: '花蕊带来的粉质感，像春天的一块天鹅绒，温柔贴肤。' },
  { id: 'p4', name: '野蛮生长', formula: { common: ['鲜活叶汁', '鲜活叶汁'], special: null }, desc: '双倍的绿叶汁，仿佛置身于无人修剪的荒野，绿意逼人。' },
  { id: 'p5', name: '雨后', formula: { common: ['深邃花根', '纯净雨水'], special: null }, desc: '雨水渗入花根，还原了暴雨过后湿润泥土的芬芳（Petrichor）。' },
  { id: 'p6', name: '双生蕾', formula: { common: ['风干花苞', '风干花苞'], special: null }, desc: '两颗紧闭的花苞，内敛而克制，暗藏着即将爆发的生命力。' },
  { id: 'p7', name: '绿意包裹', formula: { common: ['鲜活叶汁', '风干花苞'], special: null }, desc: '青叶包裹着花苞，清苦中透出一丝若有似无的甜。' },
  { id: 'p8', name: '晨曦旷野', formula: { common: ['晨曦花露', '流金花粉', '深邃花根'], special: null }, desc: '晨露打湿了旷野上的花粉与根茎，原本又野性的自然气息。' },
  { id: 'p9', name: '雾中落红', formula: { common: ['绯红花瓣', '深邃花根', '凝结雾气'], special: null }, desc: '山雾弥漫，一片花瓣静静落在裸露的树根上，凄美而静谧。' },
  { id: 'p10', name: '迷岭', formula: { common: ['坚韧花藤', '凝结雾气', '柔纱花蕊'], special: null }, desc: '花藤在雾气中蜿蜒，花蕊的幽香在湿气中若隐若现。' },
  { id: 'p11', name: '光谱之根', formula: { common: ['深邃花根', '深邃花根'], special: '虹彩光棱' }, desc: '[虹彩光棱] 照进深埋地下的双重花根，泥土味中折射出的暖意。' },
  { id: 'p12', name: '琥珀初露', formula: { common: ['晨曦花露', '沉睡种子', '流金花粉'], special: '凝时琥珀' }, desc: '[凝时琥珀] 封存了晨露、种子与金色花粉，时间的味道。' },
  { id: 'p13', name: '荆棘雨', formula: { common: ['绯红花瓣', '纯净雨水', '幽蓝花刺'], special: '迷雾香氛' }, desc: '[迷雾香氛] 扩散着被冷雨打湿的玫瑰与尖刺，冷冽花香。' },
  { id: 'p14', name: '水之倒影', formula: { common: ['晨曦花露', '晨曦花露', '绯红花瓣'], special: '水银镜片' }, desc: '[水银镜片] 映照出双倍露水滋养下的花瓣，清澈见底。' },
  { id: 'p15', name: '命运羁绊', formula: { common: ['幽蓝花刺', '幽蓝花刺', '干燥花萼'], special: '星尘丝线' }, desc: '[星尘丝线] 缠绕着双重花刺与花萼，无法挣脱的宿命感。' }
];

const SPECIAL_PERFUMES = [];

function getAllMaterials() {
  return [...COMMON_MATERIALS, ...SPECIAL_MATERIALS];
}

function getAllPerfumes() {
  return [...COMMON_PERFUMES, ...SPECIAL_PERFUMES];
}

function formulaToSet(p) {
  const s = new Set(p.formula.common);
  if (p.formula.special) s.add(p.formula.special);
  return s;
}

// 公式匹配：按多重集合比较（同一材料可出现多次，如 鲜活叶汁+鲜活叶汁）
function formulaMatch(attemptCommon, attemptSpecial, perfume) {
  const needCommon = [...perfume.formula.common].sort();
  const tryCommon = [...attemptCommon].sort();
  if (needCommon.length !== tryCommon.length) return false;
  for (let i = 0; i < needCommon.length; i++) if (needCommon[i] !== tryCommon[i]) return false;
  if ((perfume.formula.special || null) !== (attemptSpecial || null)) return false;
  return true;
}
