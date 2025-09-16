import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Calculator, RefreshCcw, DollarSign, Link as LinkIcon } from "@/icons";

// ---------- 工具函数 ----------
const fmt = (n?: number, digits = 2) =>
  n === undefined || Number.isNaN(n)
    ? "-"
    : n.toLocaleString("zh-CN", { maximumFractionDigits: digits });

const fmtShort = (n?: number, digits = 2) => {
  if (n === undefined || Number.isNaN(n)) return "-";
  const abs = Math.abs(n);
  const trim = (s: string) => (s.includes(".")) ? s.replace(/0+$/g, "").replace(/\.$/g, "") : s;
  if (abs >= 1e12) return trim((n / 1e12).toFixed(digits)) + "T";
  if (abs >= 1e9) return trim((n / 1e9).toFixed(digits)) + "B";
  if (abs >= 1e6) return trim((n / 1e6).toFixed(digits)) + "M";
  if (abs >= 1e3) return trim((n / 1e3).toFixed(digits)) + "K";
  return n.toLocaleString("zh-CN", { maximumFractionDigits: digits });
};

const parseNum = (v: string) => {
  let s = (v || "").trim();
  s = s.replace(/，/g, ",");
  if (s.includes(",") && !s.includes(".")) {
    s = s.replace(/,/g, ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// 单位换算
const unitToMultiplier = {
  分: 1,
  M: 1_000_000,
  B: 1_000_000_000,
  T: 1_000_000_000_000,
} as const;
type Unit = keyof typeof unitToMultiplier;

// 智能解析工具：支持 48.09T / 580M / 39K / 123（分）
const suffixToUnit: Record<string, Unit> = {
  k: '分', K: '分',
  m: 'M', M: 'M',
  b: 'B', B: 'B',
  t: 'T', T: 'T',
  '分': '分',
};

function normalizeNumericString(raw: string) {
  let s = (raw || '').trim();
  s = s.replace(/，/g, ',');
  if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
  else s = s.replace(/,/g, '');
  return s;
}

function parseNumberAndUnit(raw: string, defaultUnit: Unit): { value: number; unit: Unit } {
  let s = normalizeNumericString(raw);
  let unit: Unit = defaultUnit;
  if (s.length > 0) {
    const last = s[s.length - 1];
    if (suffixToUnit[last]) {
      unit = suffixToUnit[last];
      s = s.slice(0, -1);
    }
  }
  const num = Number(s || '0');
  return { value: Number.isFinite(num) ? num : 0, unit };
}

function toAbs(value: number, unit: Unit) {
  return value * (unitToMultiplier[unit] || 1);
}

function parseAbsWithUnitString(raw: string): number {
  const { value, unit } = parseNumberAndUnit(raw, '分');
  if ((/k$/i).test((raw || '').trim())) return value * 1000; // 处理 K 千分
  return toAbs(value, unit);
}

// ---------- 行情获取 ----------
async function fetchENAFromCoingecko(): Promise<number | undefined> {
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethena&vs_currencies=usd";
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("price fetch failed");
    const j = await r.json();
    const price = j?.ethena?.usd;
    if (typeof price === "number") return price;
  } catch (e) {
    console.error(e);
  }
  return undefined;
}

// ---------- React 组件 ----------
export default function Component() {
  // 基础输入
  const [myPoints, setMyPoints] = useState<number>(0);
  const [myUnit, setMyUnit] = useState<Unit>("M");
  const [totalPoints, setTotalPoints] = useState<number>(48.09);
  const [totalUnit, setTotalUnit] = useState<Unit>("T");
  const [s4Percent, setS4Percent] = useState<number>(3.5); // 默认 3.5%
  const [enaTotalSupply] = useState<number>(15_000_000_000); // 15B 固定
  // 文本态，便于输入小数与过渡态（如 "49.")
  const [myPointsText, setMyPointsText] = useState<string>("0");
  const [totalPointsText, setTotalPointsText] = useState<string>("48.09");

  // 价格联动
  const [enaPrice, setEnaPrice] = useState<number | undefined>(undefined);
  const [priceLoading, setPriceLoading] = useState<boolean>(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // 日度预估输入
  const END_DATE = useMemo(() => new Date(2025, 8, 24), []); // 2025-09-24
  const remDays = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.ceil((END_DATE.getTime() - start.getTime()) / 86400000);
    return Math.max(0, diff);
  }, [END_DATE]);
  const [myDaily, setMyDaily] = useState<number>(0);
  const [myDailyUnit, setMyDailyUnit] = useState<Unit>("M");
  const [totalDaily, setTotalDaily] = useState<number>(0);
  const [totalDailyUnit, setTotalDailyUnit] = useState<Unit>("T");
  // 文本态，便于输入小数与过渡态（如 "0."）
  const [myDailyText, setMyDailyText] = useState<string>("");
  const [totalDailyText, setTotalDailyText] = useState<string>("");

  // 从 CoinGecko 获取价格
  const loadPrice = async () => {
    try {
      setPriceLoading(true);
      setPriceError(null);
      const p = await fetchENAFromCoingecko();
      if (p === undefined) {
        setPriceError("无法获取价格，请手动输入");
      }
      setEnaPrice(p);
    } catch (e) {
      setPriceError("无法获取价格，请手动输入");
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    loadPrice();
    const t = setInterval(loadPrice, 60000 * 5); // 5 分钟刷新一次
    return () => clearInterval(t);
  }, []);

  // 计算逻辑
  const pool = useMemo(() => (enaTotalSupply * s4Percent) / 100, [enaTotalSupply, s4Percent]);

  const myPointsAbs = useMemo(
    () => myPoints * unitToMultiplier[myUnit],
    [myPoints, myUnit]
  );

  const totalPointsAbs = useMemo(
    () => totalPoints * unitToMultiplier[totalUnit],
    [totalPoints, totalUnit]
  );

  const enaPerMillion = useMemo(() => {
    if (!totalPointsAbs) return undefined;
    return (pool / totalPointsAbs) * 1_000_000;
  }, [pool, totalPointsAbs]);

  const myENA = useMemo(() => {
    if (!myPointsAbs || !totalPointsAbs) return undefined;
    return (myPointsAbs / totalPointsAbs) * pool;
  }, [myPointsAbs, totalPointsAbs, pool]);

  const myUSD = useMemo(() => {
    if (!myENA || !enaPrice) return undefined;
    return myENA * enaPrice;
  }, [myENA, enaPrice]);

  // 日度预估计算
  const myDailyAbs = useMemo(() => myDaily * unitToMultiplier[myDailyUnit], [myDaily, myDailyUnit]);
  const totalDailyAbs = useMemo(() => totalDaily * unitToMultiplier[totalDailyUnit], [totalDaily, totalDailyUnit]);

  const startENA = useMemo(() => {
    if (!myPointsAbs || !totalPointsAbs) return undefined;
    return (myPointsAbs / totalPointsAbs) * pool;
  }, [myPointsAbs, totalPointsAbs, pool]);

  // 期末（至 END_DATE）总量（包含我与全网的后续增长）
  const endENA = useMemo(() => {
    if (!myPointsAbs || !totalPointsAbs) return undefined;
    const finalMy = myPointsAbs + myDailyAbs * remDays;
    const finalTotal = totalPointsAbs + totalDailyAbs * remDays;
    if (finalTotal <= 0) return 0;
    return (finalMy / finalTotal) * pool;
  }, [myPointsAbs, totalPointsAbs, myDailyAbs, totalDailyAbs, remDays, pool]);

  // 仅由“我未来日增积分”带来的新增 ENA（他人增速不变）——恒为非负
  const futureMyAddedENA = useMemo(() => {
    if (!myPointsAbs || !totalPointsAbs) return undefined;
    const finalMy = myPointsAbs + myDailyAbs * remDays;
    const finalTotal = totalPointsAbs + totalDailyAbs * remDays;
    // 对比：移除我后续贡献（他人仍按增速增长）
    const noMyFutureTotal = totalPointsAbs + totalDailyAbs * remDays; // 我不增，分母不含我的未来增量
    const noMyFutureENA = noMyFutureTotal > 0 ? (myPointsAbs / noMyFutureTotal) * pool : 0;
    const withAllENA = finalTotal > 0 ? (finalMy / finalTotal) * pool : 0;
    const delta = withAllENA - noMyFutureENA;
    return Math.max(0, delta);
  }, [myPointsAbs, totalPointsAbs, myDailyAbs, totalDailyAbs, remDays, pool]);

  // 逐日分摊展示：把“我未来新增 ENA”平均到每日，保证不为负、便于理解
  const forecast = useMemo(() => {
    if (!startENA || !futureMyAddedENA || !remDays) return [] as Array<{ day: number; newENA: number; totalENA: number }>;
    const perDay = futureMyAddedENA / remDays;
    const arr: Array<{ day: number; newENA: number; totalENA: number }> = [];
    for (let d = 1; d <= remDays; d++) {
      arr.push({ day: d, newENA: perDay, totalENA: startENA + perDay * d });
    }
    return arr;
  }, [startENA, futureMyAddedENA, remDays]);

  // UI 操作
  const fillExample = () => {
    setMyUnit("M");
    setTotalUnit("T");
    setMyPoints(120); // 120M
    setMyPointsText("120");
    setTotalPoints(48.09); // 48.09T
    setTotalPointsText("48.09");
    setS4Percent(3.5);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 标题区 */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6" />
              <CardTitle className="text-xl md:text-2xl">Ethena S4 空投计算器</CardTitle>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>说明：结果为估算，S4 分配比例默认为 <b>3.5%</b>（可调）。最终以官方结算为准。</span>
            </div>
          </CardHeader>
        </Card>

        {/* 基础输入卡 */}
        <Card>
          <CardHeader>
            <CardTitle>积分</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 我的积分 */}
            <div className="grid grid-cols-6 gap-3 items-end">
              <div className="col-span-4">
                <Label htmlFor="myPoints">我的 S4 总积分</Label>
                <Input
                  id="myPoints"
                  inputMode="decimal"
                  value={myPointsText}
                  onChange={(e) => {
                    const t = e.target.value;
                    setMyPointsText(t);
                    const r = parseNumberAndUnit(t, myUnit);
                    setMyPoints(r.value);
                    if (r.unit !== myUnit) setMyUnit(r.unit);
                  }}
                  placeholder="例如 120（结合右侧单位）"
                />
              </div>
              <div className="col-span-2">
                <Label>单位</Label>
                <Select value={myUnit} onValueChange={(v)=>setMyUnit(v as Unit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(unitToMultiplier) as Unit[]).map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 全网积分 */}
            <div className="grid grid-cols-6 gap-3 items-end">
              <div className="col-span-4">
                <Label htmlFor="totalPoints">全网 S4 预估总积分</Label>
                <Input
                  id="totalPoints"
                  inputMode="decimal"
                  value={totalPointsText}
                  onChange={(e) => {
                    const t = e.target.value;
                    setTotalPointsText(t);
                    const r = parseNumberAndUnit(t, totalUnit);
                    setTotalPoints(r.value);
                    if (r.unit !== totalUnit) setTotalUnit(r.unit);
                  }}
                  placeholder="默认 48.09（可修改）"
                />
              </div>
              <div className="col-span-2">
                <Label>单位</Label>
                <Select value={totalUnit} onValueChange={(v)=>setTotalUnit(v as Unit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(unitToMultiplier) as Unit[]).map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* S4 分配比例 */}
            <div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <Label>S4 分配比例（%）</Label>
                <div className="text-sm text-muted-foreground">当前：{s4Percent.toFixed(2)}%</div>
              </div>
              <Slider value={[s4Percent]} min={2} max={8} step={0.1} onValueChange={([v]) => setS4Percent(v)} className="mt-2" />
              <div className="flex gap-2 mt-2">
                {[3.5, 4, 5].map((v) => (
                  <Button key={v} variant="secondary" className="h-8" onClick={() => setS4Percent(v)}>
                    {v}%
                  </Button>
                ))}
              </div>
            </div>

            {/* 价格联动 */}
            <div className="grid grid-cols-1 gap-3 items-end">
              <div className="col-span-6">
                <Label htmlFor="enaPrice">ENA 价格（USD）</Label>
                <div className="flex gap-2">
                  <Input id="enaPrice" inputMode="text" value={enaPrice ?? ""} onChange={(e) => setEnaPrice(parseNum(e.target.value))} placeholder="自动获取中… 可手动修改" />
                  <Button variant="secondary" onClick={loadPrice} disabled={priceLoading}>
                    <RefreshCcw className={`h-4 w-4 ${priceLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1 break-words flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" /> 默认自动获取（CoinGecko），也可手动修改
                </div>
                {priceError && (
                  <div className="text-xs text-red-600 mt-1">{priceError}</div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={fillExample} variant="secondary">一键示例</Button>
              <Button
                onClick={() => {
                  setMyPoints(0);
                  setMyPointsText("");
                  setTotalPoints(0);
                  setTotalPointsText("");
                  setEnaPrice(undefined);
                  setS4Percent(3.5);
                }}
                variant="secondary"
              >清空</Button>
            </div>
          </CardContent>
        </Card>

        {/* 结果卡 */}
        <Card>
          <CardHeader>
            <CardTitle>统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-muted border border-border min-w-0 text-center">
                <div className="text-sm text-muted-foreground">分配池（ENA）</div>
                <div className="text-xl md:text-2xl font-semibold mt-1">{fmtShort(pool)}</div>
                <div className="text-xs text-muted-foreground mt-1 break-words">= {fmtShort(enaTotalSupply)} × {s4Percent}%</div>
              </div>
              <div className="p-4 rounded-2xl bg-muted border border-border min-w-0 text-center">
                <div className="text-sm text-muted-foreground">每百万分 ≈ ENA</div>
                <div className="text-xl md:text-2xl font-semibold mt-1">{fmt(enaPerMillion, 4)}</div>
                <div className="text-xs text-muted-foreground mt-1 break-words">= 分配池 / 全网积分 × 1,000,000</div>
              </div>
              <div className="p-4 rounded-2xl bg-muted border border-border min-w-0 col-span-2">
                <div className="grid grid-cols-2 gap-4 items-start text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">我预计可得 ENA</div>
                    <div className="text-2xl md:text-3xl font-semibold mt-1 leading-none">{fmtShort(myENA)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1"><DollarSign className="h-4 w-4"/>折合 USD</div>
                    <div className="text-2xl md:text-3xl font-semibold mt-1 leading-none">{fmtShort(myUSD)}</div>
                    <div className="text-xs text-muted-foreground mt-1 break-words">价格：{enaPrice !== undefined ? `$${enaPrice}` : "-"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs text-muted-foreground text-center">
                  <div className="bg-muted p-3 rounded-xl border border-border text-center">
                    我的积分（{myUnit}）
                    <div className="text-base mt-1">{fmt(myPoints)}</div>
                  </div>
                  <div className="bg-muted p-3 rounded-xl border border-border text-center">
                    全网积分（{totalUnit}）
                    <div className="text-base mt-1">{fmt(totalPoints)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">* 本工具仅用于估算与教育目的；最终派发与归属以官方为准。Top 2000 钱包可能涉及归属期，仅影响解锁节奏，不改变数量。</div>
          </CardContent>
        </Card>

        {/* 日度预估（按今日增速） */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>日度预估（按今日积分增速）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="grid grid-cols-6 gap-2 items-end">
                <div className="col-span-4">
                  <Label>我的日增积分</Label>
                  <Input inputMode="decimal" value={myDailyText} onChange={(e)=>{ const t = e.target.value; setMyDailyText(t); const r = parseNumberAndUnit(t, myDailyUnit); setMyDaily(r.value); if (r.unit !== myDailyUnit) setMyDailyUnit(r.unit); }} placeholder="例如 3（结合右侧单位）"/>
                </div>
                <div className="col-span-2">
                  <Label>单位</Label>
                  <Select value={myDailyUnit} onValueChange={(v)=>setMyDailyUnit(v as Unit)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(unitToMultiplier) as Unit[]).map((u)=> (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2 items-end">
                <div className="col-span-4">
                  <Label>全网日增积分</Label>
                  <Input inputMode="decimal" value={totalDailyText} onChange={(e)=>{ const t = e.target.value; setTotalDailyText(t); const r = parseNumberAndUnit(t, totalDailyUnit); setTotalDaily(r.value); if (r.unit !== totalDailyUnit) setTotalDailyUnit(r.unit); }} placeholder="例如 0.58T 或 800B"/>
                </div>
                <div className="col-span-2">
                  <Label>单位</Label>
                  <Select value={totalDailyUnit} onValueChange={(v)=>setTotalDailyUnit(v as Unit)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(unitToMultiplier) as Unit[]).map((u)=> (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 items-end">
              <div className="col-span-6">
                <div className="text-sm text-muted-foreground">结算日：2025-09-24（剩余 {remDays} 天）</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-muted border border-border text-center">
                <div className="text-xs text-muted-foreground">未来新增 ENA（合计）</div>
                <div className="text-2xl font-semibold mt-1">{fmtShort(futureMyAddedENA)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">逐日预估（在增速不变的假设下）：</div>
              <div className="max-h-72 overflow-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-card sticky top-0">
                    <tr>
                      <th className="text-left p-2">第 N 天</th>
                      <th className="text-right p-2">当日新增 ENA</th>
                      <th className="text-right p-2">累计 ENA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((row)=> (
                      <tr key={row.day} className="odd:bg-card even:bg-muted">
                        <td className="p-2">{row.day}</td>
                        <td className="p-2 text-right">{fmt(row.newENA, 4)}</td>
                        <td className="p-2 text-right">{fmt(row.totalENA, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
