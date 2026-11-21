/* Demos — nüfus simülasyon motoru.
 * Yaş kohortu modeli: her gezegende 0..100 yaş için yıllık nüfus dizisi tutulur.
 * Her yıl: yaşa özel ölüm olasılıkları (Gompertz-Makeham + bebek/çocuk ölümü + olaylar),
 * yaşa özel doğurganlık (doğurganlık hızı x yaş dağılımı), göç ve uzay kolonizasyonu uygulanır.
 * Tarayıcıda window.Demos, Node'da module.exports olarak kullanılır.
 */
(function (root) {
  "use strict";
  const AGES = 101; // 0..100 (100 = 100 ve üzeri)
  const FEMALE = 0.49;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const n01 = v => clamp(v / 100, 0, 1);

  // ---------- Kullanıcının karar verdiği her şey (0-100 kaydırıcılar ve birkaç özel değer)
  const DEFAULT_POLICY = {
    desire: 2.4, contraception: 45, birthAge: 24, childSupport: 15, policy: "free", genderEq: 40,
    health: 45, vaccination: 50, sanitation: 50, elderCare: 30,
    agriculture: 55, industry: 40, education: 45, research: 35, welfare: 25, tax: 33,
    green: 25, urban: 40, terraform: 0,
    immigration: 20, colonization: 0,
    tradition: 55, security: 50, military: 20, diplomacy: 50,
  };

  // ---------- Gezegenler
  const PLANETS = [
    { id: "yurt", name: "Yurt", hab: 1.0, maxHab: 1.0, baseK: 3.2e9, kind: "home" },
    { id: "ay", name: "Ay", hab: 0.04, maxHab: 0.3, baseK: 2.5e8, kind: "moon" },
    { id: "kizil", name: "Kızıl", hab: 0.1, maxHab: 0.75, baseK: 1.4e9, kind: "desert" },
    { id: "buzul", name: "Buzul", hab: 0.14, maxHab: 0.8, baseK: 1.8e9, kind: "ice" },
  ];

  const EVENTS = {
    pandemic: { name: "Salgın", icon: "☣", desc: "Birkaç yıl süren bulaşıcı hastalık. Aşı, sağlık ve sanitasyon etkisini azaltır; kentleşme artırır." },
    famine: { name: "Kıtlık", icon: "🌾", desc: "Hasat çöker, gıda üretimi iki yıl boyunca yarıya iner." },
    war: { name: "Savaş", icon: "⚔", desc: "Genç yetişkin ölümleri artar, ekonomi ve doğumlar düşer. Diplomasi kısaltır, ordu kayıpları azaltır." },
    disaster: { name: "Doğal afet", icon: "🌋", desc: "Deprem, sel ya da kasırga. Anlık can kaybı ve ekonomik hasar." },
    babyboom: { name: "Bebek patlaması", icon: "👶", desc: "Altı yıl boyunca doğumlar belirgin şekilde artar." },
    tech: { name: "Bilimsel atılım", icon: "💡", desc: "Teknoloji seviyesi bir anda yükselir." },
    refugees: { name: "Göç dalgası", icon: "🧳", desc: "Dışarıdan büyük bir genç nüfus gelir, kısa süreli toplumsal gerilim yaratır." },
    medicine: { name: "Tıbbi devrim", icon: "🧬", desc: "Yaşlılık ölümleri kalıcı olarak azalır (en fazla 3 kez)." },
    asteroid: { name: "Asteroit", icon: "☄", desc: "Büyük çarpışma. Nüfusun önemli bir kısmı ölür, ardından yıllarca süren kış gelir." },
  };

  // ---------- Rastgele sayı üreteci (tekrarlanabilir)
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  // ---------- Yaşa özel ölüm olasılıkları
  function mortality(world, col, out) {
    const P = world.policy;
    const h = n01(P.health), v = n01(P.vaccination), s = n01(P.sanitation), e = n01(P.elderCare);
    const urb = n01(P.urban), sec = n01(P.security), mil = n01(P.military);
    const tech = world.tech, poll = col.pollution;
    const techCare = clamp((tech - 1) / 2, 0, 1.2);
    const crowd = col.crowding;
    const starve = crowd > 1 ? (crowd - 1) * 0.35 : 0;
    const harsh = col.kind === "home" ? 0 : Math.pow(1 - col.hab, 2) * 0.05 / Math.max(1, tech - 1);

    let infant = 0.17 * (1 - 0.55 * h) * (1 - 0.45 * s) * (1 - 0.3 * v) * (1 - 0.45 * techCare) + 0.0015;
    let child = 0.012 * (1 - 0.5 * v) * (1 - 0.45 * s) * (1 - 0.4 * h) * (1 - 0.5 * techCare) + 0.0002;
    let A = 0.004 * (1 - 0.45 * s) * (1 - 0.35 * h) * (1 - 0.3 * techCare) + 0.0002
      + 0.0012 * (1 - sec) + 0.004 * poll + harsh + starve * 0.6;
    let B = 9e-5 * Math.exp(-1.0 * h - 0.55 * e - 0.6 * techCare) * Math.pow(0.7, world.medicine);
    B *= 1 + 0.6 * poll;

    let war = 0, pandemic = 0;
    for (const fx of world.effects) {
      if (fx.colony && fx.colony !== col.id) continue;
      if (fx.type === "war") war = Math.max(war, fx.intensity);
      if (fx.type === "pandemic") pandemic = Math.max(pandemic, fx.intensity);
    }
    const famineFx = col.famine;
    if (famineFx > 0) { infant *= 1 + famineFx; child *= 1 + 1.5 * famineFx; A += 0.01 * famineFx; }
    infant *= 1 + starve * 2; child *= 1 + starve * 2;

    const panScale = pandemic * (1 - 0.65 * v) * (1 - 0.4 * h) * (1 - 0.3 * s) * (0.55 + 0.7 * urb);
    for (let x = 0; x < AGES; x++) {
      let q;
      if (x === 0) q = infant;
      else if (x < 5) q = child * 1.6;
      else if (x < 15) q = child * 0.5;
      else q = A + B * Math.exp(0.088 * x);
      if (war > 0) {
        q += 0.0015 * war;
        if (x >= 16 && x <= 45) q += 0.014 * war * (1 - 0.55 * mil);
      }
      if (panScale > 0) q += 0.018 * panScale * (0.25 + Math.pow(x / 65, 2));
      out[x] = clamp(q, 0, x === 100 ? 1 : 0.95);
    }
    out[100] = Math.max(out[100], 0.45);
    return out;
  }

  function lifeExpectancy(q) {
    let l = 1, e = 0;
    for (let x = 0; x < AGES; x++) {
      if (x === 100) { e += l / Math.max(q[x], 0.3); break; }
      e += l * (1 - q[x] * 0.5);
      l *= 1 - q[x];
    }
    return e;
  }

  // ---------- Doğurganlık
  function fertilityShape(meanAge) {
    const shape = new Float64Array(AGES);
    let sum = 0;
    const mu = meanAge + 3.5, sd = 6.2;
    for (let x = 14; x <= 49; x++) { shape[x] = Math.exp(-0.5 * Math.pow((x - mu) / sd, 2)); sum += shape[x]; }
    for (let x = 14; x <= 49; x++) shape[x] /= sum;
    return shape;
  }

  function totalFertility(world, col, infantQ) {
    const P = world.policy;
    const c = n01(P.contraception), edu = n01(P.education), urb = n01(P.urban), ge = n01(P.genderEq);
    const cs = n01(P.childSupport), wf = n01(P.welfare), trad = n01(P.tradition);
    const unwanted = Math.max(0, 7.2 - P.desire) * 0.32 * (1 - c) * (1 - 0.35 * trad * 0) * (1 - 0.3 * edu);
    let t = P.desire + unwanted * (0.6 + 0.4 * trad);
    t *= 0.8 + 0.4 * trad;
    t *= 1 - 0.2 * edu;
    t *= 1 - 0.12 * urb;
    t *= 1 - 0.08 * ge;
    t *= 1 + 0.4 * cs;
    t *= 1 - 0.06 * wf;
    t *= 1 / (1 + 0.08 * Math.max(0, world.wealth - 1));
    t *= 1 + 1.6 * infantQ; // çocuk kaybı telafisi
    t *= 0.85 + 0.3 * world.happiness;
    const crowd = col.crowding;
    if (crowd > 0.75) t /= 1 + (crowd - 0.75) * 1.8;
    if (col.kind !== "home") t *= 0.75 + 0.25 * col.hab;
    for (const fx of world.effects) {
      if (fx.colony && fx.colony !== col.id) continue;
      if (fx.type === "war") t *= 1 - 0.3 * fx.intensity;
      if (fx.type === "pandemic") t *= 1 - 0.12 * fx.intensity;
      if (fx.type === "babyboom") t *= 1 + 0.45 * fx.intensity;
    }
    if (col.famine > 0) t *= 1 - 0.35 * col.famine;
    const cap = P.policy === "one" ? 1.15 : P.policy === "two" ? 2.05 : P.policy === "pro" ? 99 : 99;
    if (P.policy === "pro") t *= 1.12;
    if (t > cap) t = cap + (t - cap) * 0.12;
    return clamp(t, 0, 9);
  }

  // ---------- Dünya oluşturma
  function makeColony(def, pop, mortQ, growth) {
    const col = {
      id: def.id, name: def.name, kind: def.kind, hab: def.hab, maxHab: def.maxHab, baseK: def.baseK,
      ages: new Float64Array(AGES), pollution: 0, crowding: 0, famine: 0, K: 1,
      births: 0, deaths: 0, migration: 0, tfr: 0, e0: 0, founded: pop > 0 ? 0 : null,
    };
    if (pop > 0) {
      let l = 1, sum = 0;
      const tmp = new Float64Array(AGES);
      for (let x = 0; x < AGES; x++) { tmp[x] = l * Math.exp(-growth * x); sum += tmp[x]; l *= 1 - mortQ[x]; }
      for (let x = 0; x < AGES; x++) col.ages[x] = tmp[x] / sum * pop;
    }
    return col;
  }

  const SCENARIOS = {
    default: { name: "Gelişen toplum", desc: "40 milyonluk, genç ve büyüyen bir sanayi toplumu.", pop: 4e7, growth: 0.022, tech: 1.0, wealth: 1.0, policy: {} },
    aging: {
      name: "Yaşlanan refah toplumu", desc: "Zengin, uzun yaşayan ama çok az çocuk doğuran bir toplum.", pop: 1.2e8, growth: -0.012, tech: 1.6, wealth: 1.9,
      policy: { desire: 1.75, contraception: 90, birthAge: 31, health: 85, vaccination: 90, sanitation: 92, elderCare: 70, education: 85, welfare: 70, tax: 48, tradition: 20, genderEq: 80, urban: 80, industry: 55, green: 50, research: 55 },
    },
    boom: {
      name: "Nüfus patlaması", desc: "Çok yüksek doğurganlık, zayıf sağlık sistemi ve kısıtlı gıda.", pop: 2.5e8, growth: 0.032, tech: 1.0, wealth: 0.7,
      policy: { desire: 5.0, contraception: 15, birthAge: 19, health: 25, vaccination: 25, sanitation: 25, education: 20, tradition: 80, genderEq: 15, agriculture: 45, tax: 22, welfare: 10, urban: 30 },
    },
    survivors: {
      name: "Son hayatta kalanlar", desc: "Bir felaketten sonra geriye kalan 5.000 kişi. Toplumu yeniden kur.", pop: 5000, growth: 0.0, tech: 1.2, wealth: 0.55,
      policy: { desire: 3.5, health: 35, vaccination: 30, sanitation: 30, education: 35, industry: 15, agriculture: 70, tax: 25, military: 5 },
    },
    space: {
      name: "Uzay çağı", desc: "Kalabalık ve ileri teknolojili bir dünya. Koloniler kurulmaya hazır.", pop: 2.1e9, growth: 0.006, tech: 2.15, wealth: 2.2,
      policy: { desire: 2.0, contraception: 80, birthAge: 28, health: 75, vaccination: 85, sanitation: 85, elderCare: 55, education: 80, research: 70, industry: 65, green: 45, tax: 45, welfare: 50, urban: 75, colonization: 35, tradition: 30, genderEq: 70 },
    },
  };

  function createWorld(scenarioId, seed) {
    const sc = SCENARIOS[scenarioId] || SCENARIOS.default;
    const world = {
      scenario: scenarioId in SCENARIOS ? scenarioId : "default",
      year: 0, startYear: 2100,
      policy: Object.assign({}, DEFAULT_POLICY, sc.policy),
      tech: sc.tech, wealth: sc.wealth, debt: 0.3, budget: 0, happiness: 0.55,
      medicine: 0, effects: [], log: [], history: [], colonies: [],
      randomEvents: true, eventRate: 50, seed: seed || (Math.random() * 1e9) | 0,
      shipsThisYear: 0, extinct: false, newEvents: [],
    };
    world.rand = rng(world.seed);
    const q = new Float64Array(AGES);
    const tmpCol = { id: "yurt", kind: "home", hab: 1, pollution: 0, crowding: sc.pop / 3e9, famine: 0 };
    mortality(world, tmpCol, q);
    for (const def of PLANETS) world.colonies.push(makeColony(def, def.kind === "home" ? sc.pop : 0, q, sc.growth));
    updateCapacity(world);
    record(world);
    world.log.push({ year: world.startYear, text: sc.name + " senaryosu başladı.", kind: "info" });
    return world;
  }

  function totalPop(world) { let s = 0; for (const c of world.colonies) s += popOf(c); return s; }
  function popOf(col) { let s = 0; for (let x = 0; x < AGES; x++) s += col.ages[x]; return s; }

  function foodCapacity(world, col) {
    const P = world.policy;
    const ag = n01(P.agriculture);
    let F = col.baseK * col.hab * (0.3 + 0.95 * ag) * (0.55 + 0.45 * Math.min(world.tech, 3.5)) * (1 - 0.45 * col.pollution);
    F *= 1 + 0.25 * n01(P.urban); // yoğun yerleşim daha çok insan barındırır
    for (const fx of world.effects) {
      if (fx.colony && fx.colony !== col.id) continue;
      if (fx.type === "famine") F *= 1 - 0.55 * fx.intensity;
      if (fx.type === "winter") F *= 1 - 0.5 * fx.intensity;
      if (fx.type === "war") F *= 1 - 0.12 * fx.intensity;
    }
    return Math.max(F, 1);
  }

  function updateCapacity(world) {
    for (const col of world.colonies) {
      col.K = foodCapacity(world, col);
      const p = popOf(col);
      col.crowding = p / col.K;
      let fam = 0;
      for (const fx of world.effects) if ((fx.type === "famine" || fx.type === "winter") && (!fx.colony || fx.colony === col.id)) fam = Math.max(fam, fx.intensity);
      col.famine = fam;
    }
  }

  function log(world, text, kind) {
    const entry = { year: world.startYear + world.year, text, kind: kind || "info" };
    world.log.push(entry);
    if (world.log.length > 200) world.log.shift();
    world.newEvents.push(entry);
  }

  // ---------- Olaylar
  function triggerEvent(world, type, opts) {
    const R = world.rand, P = world.policy;
    const home = world.colonies[0];
    const inhabited = world.colonies.filter(c => popOf(c) > 1);
    const target = (opts && opts.colony) || null;
    const where = target ? world.colonies.find(c => c.id === target) : home;
    const name = where ? where.name : "Yurt";
    const result = { type, colony: where ? where.id : "yurt" };
    switch (type) {
      case "pandemic": {
        const I = 0.5 + R() * 0.6;
        world.effects.push({ type, years: 2 + Math.floor(R() * 3), intensity: I });
        log(world, "Salgın başladı. Bütün yerleşimlere yayılıyor.", "bad");
        break;
      }
      case "famine":
        world.effects.push({ type, years: 2, intensity: 0.8 + R() * 0.2, colony: result.colony });
        log(world, name + " üzerinde kıtlık: hasat çöktü.", "bad");
        break;
      case "war": {
        const I = 0.5 + R() * 0.5;
        world.effects.push({ type, years: 3 + Math.floor(R() * 5), intensity: I, colony: result.colony });
        log(world, name + " savaşa girdi.", "bad");
        break;
      }
      case "disaster": {
        const share = (0.004 + R() * 0.02) * (1 - 0.4 * n01(P.health));
        kill(where, share);
        world.wealth *= 0.93;
        log(world, name + " büyük bir doğal afet yaşadı. Nüfusun %" + (share * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + "'i hayatını kaybetti.", "bad");
        result.share = share;
        break;
      }
      case "babyboom":
        world.effects.push({ type, years: 6, intensity: 1 });
        log(world, "Bebek patlaması! Doğumlar hızla artıyor.", "good");
        break;
      case "tech":
        world.tech += 0.35;
        log(world, "Bilimsel atılım: teknoloji seviyesi " + world.tech.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " oldu.", "good");
        break;
      case "refugees": {
        const p = popOf(where);
        const add = Math.max(500, p * (0.025 + R() * 0.025));
        for (let x = 0; x <= 45; x++) where.ages[x] += add * (x < 15 ? 0.012 : x <= 35 ? 0.04 : 0.016);
        world.effects.push({ type: "tension", years: 3, intensity: 1 });
        log(world, name + " gezegenine " + fmtNum(add) + " göçmen geldi.", "info");
        break;
      }
      case "medicine":
        if (world.medicine >= 3) { log(world, "Tıp sınırına ulaşıldı: yeni bir devrim mümkün değil.", "info"); result.none = true; break; }
        world.medicine++;
        log(world, "Tıbbi devrim: yaşlılık ölümleri kalıcı olarak azaldı.", "good");
        break;
      case "asteroid": {
        if (world.tech >= 2.6 && n01(P.military) > 0.3 && R() < 0.6) {
          log(world, "Asteroit gezegen savunma sistemi tarafından saptırıldı!", "good");
          result.deflected = true;
          break;
        }
        const share = 0.15 + R() * 0.2;
        kill(where, share);
        where.pollution = clamp(where.pollution + 0.2, 0, 1);
        world.effects.push({ type: "winter", years: 4, intensity: 0.9, colony: where.id });
        world.wealth *= 0.75;
        log(world, "Asteroit çarptı! " + name + " nüfusunun %" + (share * 100).toFixed(0) + "'i öldü. Çarpma kışı başlıyor.", "bad");
        result.share = share;
        break;
      }
    }
    updateCapacity(world);
    void inhabited;
    return result;
  }

  function kill(col, share) {
    for (let x = 0; x < AGES; x++) col.ages[x] *= 1 - share * (x < 5 || x > 70 ? 1.3 : 0.9);
  }

  function randomEvents(world) {
    if (!world.randomEvents) return [];
    const R = world.rand, P = world.policy, f = world.eventRate / 50;
    const fired = [];
    const has = t => world.effects.some(e => e.type === t);
    const chances = {
      pandemic: 0.018 * (0.5 + n01(P.urban)) * (1.2 - 0.5 * n01(P.sanitation)),
      war: 0.022 * (1.25 - n01(P.diplomacy)) * (1 - 0.45 * n01(P.military)),
      famine: 0.014 * (1.4 - n01(P.agriculture)),
      disaster: 0.03,
      babyboom: 0.008,
      tech: 0.008 * (0.4 + n01(P.research)),
      refugees: 0.01 * (0.4 + n01(P.immigration)),
      asteroid: 0.0012,
    };
    for (const t in chances) {
      if (has(t)) continue;
      if (R() < chances[t] * f) { const r = triggerEvent(world, t); r.random = true; fired.push(r); }
    }
    return fired;
  }

  // ---------- Bir yıl ilerlet
  const qBuf = new Float64Array(AGES);
  function step(world) {
    if (world.extinct) return { events: [] };
    const P = world.policy, R = world.rand;
    world.newEvents = [];
    const events = randomEvents(world);
    updateCapacity(world);

    // Ekonomi ve bütçe
    const tax = n01(P.tax);
    const hs = stats(world.colonies[0]);
    const oldShare = hs.pop > 0 ? hs.old / hs.pop : 0.1, workShare = hs.pop > 0 ? hs.work / hs.pop : 0.6;
    world.oldShare = oldShare;
    const revenue = tax * clamp(workShare / 0.62, 0.5, 1.3);
    const spend = 0.5 * (n01(P.health) * 0.25 * (0.7 + 2 * oldShare) + n01(P.education) * 0.2 + n01(P.welfare) * 0.25 * clamp(oldShare / 0.12, 0.4, 2.2) + n01(P.childSupport) * 0.12
      + n01(P.research) * 0.12 + n01(P.green) * 0.1 + n01(P.military) * 0.15 + n01(P.security) * 0.08 + n01(P.agriculture) * 0.06
      + n01(P.vaccination) * 0.04 + n01(P.sanitation) * 0.06 + n01(P.elderCare) * 0.08 + n01(P.colonization) * 0.18 + n01(P.terraform) * 0.14);
    const interest = 0.035 * Math.max(0, world.debt);
    world.budget = revenue - spend - interest;
    world.debt = clamp(world.debt - world.budget * 0.5, -1, 5);
    const home = world.colonies[0];
    let war = 0, tension = 0;
    for (const fx of world.effects) { if (fx.type === "war") war = Math.max(war, fx.intensity); if (fx.type === "tension") tension = 1; }
    const total0 = totalPop(world);
    const crowdAll = total0 / world.colonies.reduce((s, c) => s + (popOf(c) > 0 ? c.K : 0), 0.0001);
    let wTarget = (0.45 + 1.1 * n01(P.industry) + 0.55 * n01(P.education) + 0.2 * n01(P.genderEq) + 0.15 * n01(P.urban))
      * (0.55 + 0.45 * world.tech) * (1 - 0.3 * war) * (1 - 0.35 * tax * tax);
    wTarget /= 1 + 0.35 * Math.max(0, world.debt - 0.8);
    if (crowdAll > 1) wTarget /= 1 + (crowdAll - 1);
    if (home.famine > 0) wTarget *= 1 - 0.25 * home.famine;
    wTarget *= 1 - 0.1 * n01(P.tradition);
    world.wealth += (wTarget - world.wealth) * 0.08;

    // Teknoloji
    const popF = clamp(Math.log10(Math.max(total0, 10)) / 8.5, 0.15, 1.25);
    world.tech += 0.028 * (0.15 + n01(P.research)) * (0.4 + n01(P.education)) * Math.sqrt(Math.max(world.wealth, 0.05)) * popF * (1 - 0.4 * war)
      / (1 + 0.6 * Math.max(0, world.tech - 3));

    // Mutluluk
    let hap = 0.42 + 0.14 * clamp(world.wealth - 1, -1, 1.5) + 0.12 * n01(P.health) + 0.06 * n01(P.education) + 0.1 * n01(P.welfare)
      + 0.05 * n01(P.genderEq) - 0.3 * home.pollution - 0.35 * war - 0.3 * home.famine - 0.12 * tension
      - 0.25 * Math.max(0, crowdAll - 0.9) - 0.15 * Math.max(0, tax - 0.4) - 0.12 * Math.max(0, n01(P.security) - 0.7)
      - (P.policy === "one" ? 0.12 : P.policy === "two" ? 0.05 : 0) - 0.08 * Math.max(0, world.debt - 1.5);
    world.happiness += (clamp(hap, 0, 1) - world.happiness) * 0.25;

    // Demografi her gezegende
    let shipsOut = 0;
    const colonizationOpen = world.tech >= 2 && n01(P.colonization) > 0;
    for (const col of world.colonies) {
      const pop = popOf(col);
      // Kirlilik
      const ind = n01(P.industry), grn = n01(P.green);
      const scale = Math.pow(Math.min(3, pop / 5e8), 0.6);
      col.pollution = clamp(col.pollution + 0.009 * ind * Math.min(world.tech, 2.2) * scale - 0.03 * grn * (0.7 + 0.3 * Math.min(world.tech, 3)) - 0.004, 0, 1);
      // Terraform
      if (col.kind !== "home" && world.tech >= 2.8 && n01(P.terraform) > 0) {
        col.hab = Math.min(col.maxHab, col.hab + n01(P.terraform) * 0.012 * (world.tech - 2.6) * (col.maxHab - col.hab + 0.02));
      }
      if (pop < 1) { col.births = col.deaths = col.migration = 0; col.tfr = 0; mortality(world, col, qBuf); col.e0 = lifeExpectancy(qBuf); continue; }

      const q = mortality(world, col, qBuf);
      col.e0 = lifeExpectancy(q);
      const tfr = totalFertility(world, col, q[0]);
      col.tfr = tfr;
      const shape = fertilityShape(P.birthAge);
      let births = 0;
      for (let x = 14; x <= 49; x++) births += col.ages[x] * FEMALE * tfr * shape[x];
      // Küçük topluluklarda rastlantısallık
      if (pop < 2000) births = Math.max(0, births + (R() - 0.5) * Math.sqrt(births + 1) * 2);

      let deaths = 0;
      const next = new Float64Array(AGES);
      for (let x = 0; x < AGES; x++) {
        const d = col.ages[x] * q[x];
        deaths += d;
        const surv = col.ages[x] - d;
        if (x < 100) next[x + 1] += surv; else next[100] += surv;
      }
      next[0] = births;

      // Göç (yalnızca ana gezegen dış dünyayla etkileşir)
      let mig = 0;
      if (col.kind === "home") {
        const attract = world.happiness - 0.45;
        const inRate = n01(P.immigration) * 0.012 * Math.max(0, attract + 0.15) * (crowdAll < 1 ? 1 : 0.3);
        const outRate = 0.012 * Math.max(0, 0.42 - world.happiness) + 0.006 * war;
        mig = pop * (inRate - outRate);
        // Uzay kolonizasyonu
        if (colonizationOpen && pop > 1e5) {
          shipsOut = pop * n01(P.colonization) * 0.0035 * clamp(world.tech - 1.8, 0.2, 1.5) * clamp(world.wealth, 0.3, 2);
          mig -= shipsOut;
        }
      }
      distribute(next, mig);
      col.ages = next;
      col.births = births; col.deaths = deaths; col.migration = mig;
      if (popOf(col) < 2) { col.ages.fill(0); if (col.kind !== "home") log(world, col.name + " kolonisi yok oldu.", "bad"); }
    }

    // Kolonilere gemi varışı
    world.shipsThisYear = 0;
    if (shipsOut > 0) {
      const targets = world.colonies.filter(c => c.kind !== "home");
      const weights = targets.map(c => c.hab * c.baseK / Math.max(1, popOf(c) + c.K * 0.2) + 1e-9);
      const ws = weights.reduce((a, b) => a + b, 0);
      targets.forEach((c, i) => {
        const arriving = shipsOut * weights[i] / ws;
        if (arriving <= 0) return;
        if (popOf(c) < 1) { c.founded = world.year; log(world, c.name + " üzerinde ilk koloni kuruldu!", "good"); }
        distribute(c.ages, arriving);
        c.migration += arriving;
      });
      world.shipsThisYear = shipsOut;
    }

    // Etkilerin süresini azalt
    for (const fx of world.effects) {
      fx.years--;
      if (fx.type === "war" && R() < n01(P.diplomacy) * 0.25) { fx.years = 0; log(world, "Diplomasi sayesinde barış imzalandı.", "good"); }
    }
    const ended = world.effects.filter(fx => fx.years <= 0);
    world.effects = world.effects.filter(fx => fx.years > 0);
    for (const fx of ended) {
      if (fx.type === "war" && !fx.silent) log(world, "Savaş sona erdi.", "info");
      if (fx.type === "pandemic") log(world, "Salgın sona erdi.", "info");
      if (fx.type === "famine") log(world, "Kıtlık sona erdi.", "info");
      if (fx.type === "winter") log(world, "Çarpma kışı sona erdi, gökyüzü açılıyor.", "info");
    }

    // Eşik bildirimleri
    const t0 = world.tech;
    if (!world.flagSpace && t0 >= 2) { world.flagSpace = true; log(world, "Uzay çağı başladı: koloniler kurulabilir.", "good"); }
    if (!world.flagTerra && t0 >= 2.8) { world.flagTerra = true; log(world, "Terraform teknolojisi geliştirildi.", "good"); }
    const home0 = world.colonies[0];
    if (home0.crowding > 1.02 && !world.flagCrowd) { world.flagCrowd = true; log(world, "Nüfus taşıma kapasitesini aştı: açlık başlıyor.", "bad"); }
    if (home0.crowding < 0.9) world.flagCrowd = false;

    world.year++;
    updateCapacity(world);
    record(world);
    if (totalPop(world) < 2) { world.extinct = true; log(world, "Toplum yok oldu.", "bad"); }
    return { events };
  }

  function distribute(ages, amount) {
    if (!amount) return;
    // Göçmenler çoğunlukla 18-40 yaş arası, bir kısmı çocuklarıyla
    const w = [];
    let s = 0;
    for (let x = 0; x <= 60; x++) { const v = x < 15 ? 0.4 : x <= 40 ? 1.5 : 0.35; w.push(v); s += v; }
    if (amount < 0) {
      for (let x = 0; x <= 60; x++) ages[x] = Math.max(0, ages[x] + amount * w[x] / s);
    } else for (let x = 0; x <= 60; x++) ages[x] += amount * w[x] / s;
  }

  function stats(col) {
    let pop = 0, kids = 0, old = 0, work = 0;
    for (let x = 0; x < AGES; x++) { const v = col.ages[x]; pop += v; if (x < 15) kids += v; else if (x >= 65) old += v; else work += v; }
    let acc = 0, median = 0;
    for (let x = 0; x < AGES; x++) { acc += col.ages[x]; if (acc >= pop / 2) { median = x; break; } }
    return { pop, kids, old, work, median, dependency: work > 0 ? (kids + old) / work : 0 };
  }

  function record(world) {
    const total = totalPop(world);
    let births = 0, deaths = 0, tfrW = 0, e0W = 0;
    for (const c of world.colonies) { const p = popOf(c); births += c.births; deaths += c.deaths; tfrW += c.tfr * p; e0W += c.e0 * p; }
    world.history.push({
      year: world.startYear + world.year, pop: total,
      pops: world.colonies.map(popOf),
      births, deaths, tfr: total ? tfrW / total : 0, e0: total ? e0W / total : 0,
      happy: world.happiness, food: world.colonies[0].crowding > 0 ? 1 / world.colonies[0].crowding : 0,
      pollution: world.colonies[0].pollution, wealth: world.wealth, tech: world.tech,
    });
    if (world.history.length > 1500) world.history.shift();
  }

  function fmtNum(n) {
    n = Math.max(0, n);
    if (n < 1000) return Math.round(n).toLocaleString("tr-TR");
    const units = [[1e12, "Tn"], [1e9, "Mr"], [1e6, "Mn"], [1e3, "B"]];
    for (const [v, u] of units) if (n >= v) return (n / v).toLocaleString("tr-TR", { maximumFractionDigits: n / v < 10 ? 2 : 1 }) + " " + u;
    return String(Math.round(n));
  }

  // Kayıt/yükleme için düz nesneye çevir
  function serialize(world) {
    const o = Object.assign({}, world);
    delete o.rand;
    o.colonies = world.colonies.map(c => Object.assign({}, c, { ages: Array.from(c.ages) }));
    o.history = world.history.slice(-600);
    o.newEvents = [];
    return JSON.stringify(o);
  }
  function deserialize(str) {
    const o = JSON.parse(str);
    o.colonies.forEach(c => { c.ages = Float64Array.from(c.ages); });
    o.policy = Object.assign({}, DEFAULT_POLICY, o.policy);
    o.rand = rng((o.seed + o.year * 7919) | 0);
    return o;
  }

  const api = { AGES, DEFAULT_POLICY, PLANETS, EVENTS, SCENARIOS, createWorld, step, triggerEvent, totalPop, popOf, stats, mortality, lifeExpectancy, fmtNum, serialize, deserialize };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Demos = api;
})(typeof window !== "undefined" ? window : globalThis);
