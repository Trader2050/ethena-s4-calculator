// 简化版积分规则引擎：纯前端、无依赖

/**
 * 规则示例结构：
 * {
 *   version: 's4-demo-1',
 *   categories: [{ id: 'holding', label: '持仓' }, ...],
 *   rules: [
 *     { type: 'timeWeighted', id, category, label, inputKey, daysKey, rate, cap? },
 *     { type: 'tiered', id, category, label, inputKey, tiers: [{ lte?, gt?, scorePerUnit }], cap? },
 *     { type: 'sum', id, category, label, inputKey, weight, cap? },
 *     { type: 'boolean', id, category, label, inputKey, score },
 *     { type: 'multiplier', id, category, label, inputKey, base, perUnit, max? },
 *   ]
 * }
 */

export function clampCap(score, cap) {
  return typeof cap === 'number' ? Math.min(score, cap) : score;
}

export function evalTiered(value, tiers) {
  let remaining = value;
  let lastBound = 0;
  let score = 0;
  for (const t of tiers) {
    const lower = t.gt ?? lastBound;
    const upper = t.lte ?? Infinity;
    if (remaining <= 0) break;
    const width = Math.max(0, Math.min(value, upper) - lower);
    if (width > 0) {
      score += width * t.scorePerUnit;
      remaining -= width;
    }
    lastBound = upper;
  }
  if (score === 0 && tiers.length === 1) score = value * tiers[0].scorePerUnit;
  return score;
}

export function computeScore(config, inputs) {
  const details = [];
  const byCategory = {};
  let baseScore = 0;
  let multiplier = 1;

  for (const r of config.rules) {
    if (r.type === 'multiplier') {
      const raw = Number(inputs[r.inputKey] ?? 0);
      const m = Math.min(r.max ?? Infinity, r.base + raw * r.perUnit);
      multiplier *= m;
      details.push({ id: r.id, label: r.label, raw, effective: m, score: 0, category: r.category, explain: `乘数=${m.toFixed(3)}` });
      continue;
    }

    let raw = 0, score = 0, effective = 0;

    if (r.type === 'timeWeighted') {
      const amt = Math.max(0, Number(inputs[r.inputKey] ?? 0));
      const days = Math.max(0, Number(inputs[r.daysKey] ?? 0));
      raw = amt * days;
      score = clampCap(raw * r.rate, r.cap);
      effective = raw;
    } else if (r.type === 'tiered') {
      raw = Math.max(0, Number(inputs[r.inputKey] ?? 0));
      score = clampCap(evalTiered(raw, r.tiers), r.cap);
      effective = raw;
    } else if (r.type === 'sum') {
      raw = Math.max(0, Number(inputs[r.inputKey] ?? 0));
      score = clampCap(raw * r.weight, r.cap);
      effective = raw;
    } else if (r.type === 'boolean') {
      raw = inputs[r.inputKey] ? 1 : 0;
      score = raw ? r.score : 0;
      effective = raw;
    }

    baseScore += score;
    byCategory[r.category] = (byCategory[r.category] ?? 0) + score;
    details.push({ id: r.id, label: r.label, raw, effective, score, category: r.category, explain: `计分=${score.toFixed(2)}` });
  }

  const total = Math.round(baseScore * multiplier);
  return { version: config.version, total, byCategory, details, multiplier };
}

