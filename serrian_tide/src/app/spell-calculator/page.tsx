"use client";

import { useState } from "react";
import Link from "next/link";
import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

/* ---------- Types & Constants ---------- */

type MBNode = {
  container: string;
  effects: Array<[string, number]>;
  range: string;
  shape: string;
  shape_increments: number;
  duration: string;
  lingering: number;
  multi_target: number;
  children: MBNode[];
};

const CONTAINERS: Record<string, number> = {
  Target: 1,
  "AoE (Area)": 2,
  Control: 2,
  "Temporal/Spatial": 5,
};

const STAND_ALONES: Record<string, any> = {
  Damage: { type: "per", base: 3, per: 2 },
  Healing: { type: "per", base: 3, per: 2 },
  Buff: { type: "per", base: 2, per: 1 },
  Debuff: { type: "per", base: 2, per: 1 },
  "Summon (minor)": { type: "flat", cost: 8 },
  "Summon (major)": { type: "flat", cost: 15 },
  "Create/Destroy (basic)": { type: "flat", cost: 5 },
  "Create/Destroy (major)": { type: "flat", cost: 12 },
  "Transform/Alter": { type: "flat", cost: 10 },
  "Illusion / Mask": { type: "flat", cost: 4 },
  "Reveal / Detect": { type: "flat", cost: 4 },
  "Counter / Cancel": { type: "flat", cost: 6 },
  "Accelerate / Hasten": { type: "per", base: 4, per: 1 },
  "Decelerate / Slow": { type: "per", base: 4, per: 1 },
  Teleportation: { type: "flat", cost: 8 },
  Banish: { type: "flat", cost: 10 },
  "Pocket Space": { type: "flat", cost: 12 },
  "Spatial Bubble": { type: "flat", cost: 8 },
  "Temporal Stasis": { type: "flat", cost: 6 },
  "Link / Bind": { type: "flat", cost: 6 },
  "Transfer Life Force": { type: "per", base: 4, per: 2 },
  "Push (Control)": { type: "flat", cost: 3, control_only: true },
  "Pull (Control)": { type: "flat", cost: 3, control_only: true },
  "Grapple/Restrain (Control)": { type: "flat", cost: 4, control_only: true },
  "Immobilize (Control)": { type: "flat", cost: 6, control_only: true },
  "Stun/Daze (Control)": { type: "flat", cost: 6, control_only: true },
  "Disarm (Control)": { type: "flat", cost: 5 },
  "Knockdown (Control)": { type: "flat", cost: 4 },
  "Blind/Deaf/Silence (Control)": {
    type: "flat",
    cost: 5,
    control_only: true,
  },
  "Anchor/Lock (Control)": { type: "flat", cost: 6 },
};

const RANGES: Record<string, number> = {
  Self: 1,
  Touch: 2,
  "Melee Reach": 3,
  "Short (30 ft)": 4,
  "Medium (60 ft)": 5,
  "Long (120 ft)": 7,
  "Line of Sight": 10,
  Unlimited: 15,
};

const SHAPES: Record<string, { base: number; per_inc: number; label: string }> =
  {
    "Radius (10 ft)": { base: 3, per_inc: 2, label: "+2 per +10 ft" },
    "Cone (30 ft)": { base: 3, per_inc: 2, label: "+2 per +10 ft" },
    "Line (30 ft)": { base: 3, per_inc: 2, label: "+2 per +10 ft" },
    "Wall (30 ft)": { base: 4, per_inc: 2, label: "+2 per +10 ft" },
    "Sphere/Cube/Zone": { base: 5, per_inc: 3, label: "+3 per size" },
  };

const DURATIONS: Record<string, number> = {
  Instantaneous: 1,
  "Combat Step": 2,
  "Combat Round": 5,
  Lingering: 2,
};

const MULTI_TARGET = { base: 3, per_target: 1 };

const MODIFIERS: Record<string, number> = {
  Concentration: -2,
  "Static Assignment": 1,
  "Per Success Assignment": 3,
  "Sense Modifier": 2,
  "Component Requirement": -2,
  "Environmental Dependency": -3,
  "Backlash Risk": -5,
  "Expose / Conceal": 2,
  "Release (Delayed)": 2,
  "Progressive Spell": 3,
};

const MASTERY_BANDS: Array<[string, number, number]> = [
  ["Apprentice", 1, 10],
  ["Novice", 11, 20],
  ["Master", 21, 50],
  ["High Master", 51, 90],
  ["Grand Master", 91, 200],
];

const masteryFor = (mana: number) => {
  if (mana <= 0) return "Apprentice";
  for (const [n, lo, hi] of MASTERY_BANDS)
    if (lo <= mana && mana <= hi) return n;
  return "Beyond Grand Master";
};

/* ---------- Main Component ---------- */

export default function SpellCalculatorPage() {
  const [blocks, setBlocks] = useState<MBNode[]>([
    {
      container: "Target",
      effects: [],
      range: "",
      shape: "",
      shape_increments: 0,
      duration: "",
      lingering: 0,
      multi_target: 0,
      children: [],
    },
  ]);
  const [mods, setMods] = useState<Record<string, number>>(
    Object.fromEntries(Object.keys(MODIFIERS).map((k) => [k, 0])) as Record<
      string,
      number
    >
  );
  const [trad, setTrad] = useState<string>("Spellcraft, Talismanism, Faith (Spells)");
  const [name, setName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [flavor, setFlavor] = useState<string>("");

  const nodeSubtotal = (n: MBNode): number => {
    let m = CONTAINERS[n.container] || 0;
    for (const [ename, cnt] of n.effects) {
      const meta = STAND_ALONES[ename];
      if (!meta) continue;
      if (meta.type === "flat") m += meta.cost;
      else m += meta.base + Math.max(0, (cnt || 1) - 1) * meta.per;
    }
    m += RANGES[n.range] || 0;
    if (n.shape) {
      const meta = SHAPES[n.shape];
      if (meta)
        m += meta.base + meta.per_inc * Math.max(0, n.shape_increments || 0);
    }
    if (n.duration) {
      m += DURATIONS[n.duration] || 0;
      if (n.duration === "Lingering") m += Number(n.lingering || 0);
    }
    if (n.container === "Target" && (n.multi_target || 0) > 0) {
      m +=
        MULTI_TARGET.base +
        Math.max(0, (n.multi_target || 0) - 1) * MULTI_TARGET.per_target;
    }
    for (const ch of n.children) m += nodeSubtotal(ch);
    return m;
  };

  const totalMana =
    blocks.reduce((a, b) => a + nodeSubtotal(b), 0) +
    Object.entries(mods).reduce(
      (a, [k, v]) => a + (MODIFIERS[k] || 0) * (Number(v) || 0),
      0
    );
  const castingTime = Math.floor(totalMana / 2);
  const mastery = masteryFor(totalMana);

  const addRoot = () =>
    setBlocks((b) => [
      ...b,
      {
        container: "Target",
        effects: [],
        range: "",
        shape: "",
        shape_increments: 0,
        duration: "",
        lingering: 0,
        multi_target: 0,
        children: [],
      },
    ]);

  const updateNodeAt = (pathIdx: number[], patch: Partial<MBNode>) => {
    setBlocks((prev) => {
      const clone = structuredClone(prev) as MBNode[];
      let cur: any = clone;
      for (let i = 0; i < pathIdx.length - 1; i++) {
        const idx = pathIdx[i];
        if (idx === undefined) return prev;
        cur = cur[idx].children;
      }
      const last = pathIdx[pathIdx.length - 1];
      if (last === undefined) return prev;
      cur[last] = { ...cur[last], ...patch };
      return clone;
    });
  };

  const addChildAt = (pathIdx: number[]) => {
    setBlocks((prev) => {
      const clone = structuredClone(prev) as MBNode[];
      let cur: any = clone;
      for (let i = 0; i < pathIdx.length - 1; i++) {
        const idx = pathIdx[i];
        if (idx === undefined) return prev;
        cur = cur[idx].children;
      }
      const last = pathIdx[pathIdx.length - 1];
      if (last === undefined) return prev;
      cur[last].children.push({
        container: "Target",
        effects: [],
        range: "",
        shape: "",
        shape_increments: 0,
        duration: "",
        lingering: 0,
        multi_target: 0,
        children: [],
      });
      return clone;
    });
  };

  const removeAt = (pathIdx: number[]) => {
    setBlocks((prev) => {
      const clone = structuredClone(prev) as MBNode[];
      if (pathIdx.length === 1) {
        const idx = pathIdx[0];
        if (idx === undefined) return prev;
        clone.splice(idx, 1);
        return clone.length
          ? clone
          : [
              {
                container: "Target",
                effects: [],
                range: "",
                shape: "",
                shape_increments: 0,
                duration: "",
                lingering: 0,
                multi_target: 0,
                children: [],
              },
            ];
      }
      let cur: any = clone;
      for (let i = 0; i < pathIdx.length - 2; i++) {
        const idx = pathIdx[i];
        if (idx === undefined) return prev;
        cur = cur[idx].children;
      }
      const lastIdx = pathIdx[pathIdx.length - 1];
      if (lastIdx === undefined) return prev;
      cur.splice(lastIdx, 1);
      return clone;
    });
  };

  const addEffectAt = (pathIdx: number[], name: string, count: number) => {
    if (!name) return;
    setBlocks((prev) => {
      const clone = structuredClone(prev) as MBNode[];
      let cur: any = clone;
      for (let i = 0; i < pathIdx.length - 1; i++) {
        const idx = pathIdx[i];
        if (idx === undefined) return prev;
        cur = cur[idx].children;
      }
      const last = pathIdx[pathIdx.length - 1];
      if (last === undefined) return prev;
      const info = STAND_ALONES[name];
      const c = info?.type === "per" ? Math.max(1, Number(count) || 1) : 1;
      cur[last].effects.push([name, c]);
      return clone;
    });
  };

  const NodeCard = ({ node, pathIdx }: { node: MBNode; pathIdx: number[] }) => {
    const effectsList = node.effects.length
      ? node.effects
          .map(
            ([n, c], i) =>
              `${i + 1}. ${n}${
                STAND_ALONES[n]?.type === "per" ? ` ×${c}` : ""
              }`
          )
          .join("\n")
      : "(none)";
    const [effName, setEffName] = useState<string>(
      Object.keys(STAND_ALONES)[0] || ""
    );
    const [effCnt, setEffCnt] = useState<number>(1);

    return (
      <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sm">
            Container {pathIdx.join("/")}
          </div>
          <div className="ms-auto flex gap-2">
            <button
              className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
              onClick={() => addChildAt(pathIdx)}
            >
              Add Child
            </button>
            <button
              className="rounded border border-rose-400/30 text-rose-200 px-2 py-1 text-xs hover:bg-rose-400/10"
              onClick={() => removeAt(pathIdx)}
            >
              Remove
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <label className="block">
            Type
            <select
              className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={node.container}
              onChange={(e) =>
                updateNodeAt(pathIdx, { container: e.target.value })
              }
            >
              {Object.keys(CONTAINERS).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Range
            <select
              className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={node.range}
              onChange={(e) => updateNodeAt(pathIdx, { range: e.target.value })}
            >
              <option value=""></option>
              {Object.keys(RANGES).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Duration
            <select
              className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={node.duration}
              onChange={(e) =>
                updateNodeAt(pathIdx, { duration: e.target.value })
              }
            >
              <option value=""></option>
              {Object.keys(DURATIONS).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <label className="block">
            Shape
            <select
              className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={node.shape}
              onChange={(e) =>
                updateNodeAt(pathIdx, { shape: e.target.value })
              }
            >
              <option value=""></option>
              {Object.keys(SHAPES).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Shape +inc
            <input
              type="number"
              className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={node.shape_increments}
              onChange={(e) =>
                updateNodeAt(pathIdx, {
                  shape_increments: Number(e.target.value) || 0,
                })
              }
            />
          </label>
          <label className="block">
            Lingering +steps
            <input
              type="number"
              className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={node.lingering}
              onChange={(e) =>
                updateNodeAt(pathIdx, {
                  lingering: Number(e.target.value) || 0,
                })
              }
            />
          </label>
        </div>

        {node.container === "Target" && (
          <label className="block text-sm">
            Multi-Target (+targets)
            <input
              type="number"
              className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={node.multi_target}
              onChange={(e) =>
                updateNodeAt(pathIdx, {
                  multi_target: Number(e.target.value) || 0,
                })
              }
            />
          </label>
        )}

        <div className="rounded-lg border border-white/10 p-2">
          <div className="font-medium mb-1 text-sm">Effects</div>
          <div className="flex gap-2 items-center">
            <select
              className="rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={effName}
              onChange={(e) => setEffName(e.target.value)}
            >
              {Object.keys(STAND_ALONES).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <span className="text-xs">×</span>
            <input
              type="number"
              className="w-20 rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
              value={effCnt}
              onChange={(e) => setEffCnt(Number(e.target.value) || 1)}
            />
            <button
              className="rounded border border-emerald-400/40 text-emerald-200 px-2 py-1 text-xs hover:bg-emerald-400/10"
              onClick={() => addEffectAt(pathIdx, effName, effCnt)}
            >
              Add Effect
            </button>
          </div>
          <textarea
            className="mt-2 w-full h-24 rounded border border-white/10 bg-black/50 p-2 text-xs"
            readOnly
            value={effectsList}
          />
        </div>

        {node.children.length > 0 && (
          <div className="space-y-2">
            {node.children.map((ch, i) => (
              <NodeCard key={i} node={ch} pathIdx={[...pathIdx, i]} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-3xl sm:text-4xl tracking-tight"
            >
              Spell Calculator
            </GradientText>
            <p className="mt-2 text-sm text-zinc-300/90">
              Build spells, psionics, and resonances with the Serrian Tide magic
              system.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              ← Dashboard
            </Button>
          </Link>
        </div>

        <Card className="bg-emerald-500/5 border border-emerald-400/30 rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-emerald-200 font-semibold">
                Spell Cost (Mana):
              </span>{" "}
              <span className="text-xl font-bold text-emerald-100">
                {totalMana}
              </span>
            </div>
            <div>
              <span className="text-emerald-200 font-semibold">
                Casting Time:
              </span>{" "}
              <span className="text-xl font-bold text-emerald-100">
                {castingTime} initiative
              </span>
            </div>
            <div>
              <span className="text-emerald-200 font-semibold">
                Mastery Level:
              </span>{" "}
              <span className="text-xl font-bold text-emerald-100">
                {mastery}
              </span>
            </div>
          </div>
        </Card>
      </header>

      <section className="max-w-7xl mx-auto space-y-4">
        <Card className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <label className="block">
              Tradition / Output
              <select
                className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
                value={trad}
                onChange={(e) => setTrad(e.target.value)}
              >
                {[
                  "Spellcraft, Talismanism, Faith (Spells)",
                  "Psionics (Psionic Skill)",
                  "Bardic Resonance (Reverberation)",
                ].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Name
              <input
                className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              Flavor Line
              <input
                className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm"
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
              />
            </label>
          </div>
        </Card>

        <Card className="rounded-3xl border border-amber-400/30 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-100">
              Spell Structure
            </h2>
            <button
              className="rounded border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={addRoot}
            >
              ➕ Add Root Container
            </button>
          </div>

          <div className="space-y-3">
            {blocks.map((n, i) => (
              <NodeCard key={i} node={n} pathIdx={[i]} />
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="font-semibold mb-2 text-sm">Modifiers (global)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(MODIFIERS).map(([m, delta]) => (
              <label
                key={m}
                className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/40 px-2 py-1"
              >
                <span>
                  {m} ({delta > 0 ? `+${delta}` : delta})
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-20 rounded bg-black/50 px-2 py-1 text-xs"
                  value={mods[m] || 0}
                  onChange={(e) =>
                    setMods({
                      ...mods,
                      [m]: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </label>
            ))}
          </div>
        </Card>

        <label className="block text-sm">
          Notes / Special Conditions
          <textarea
            className="mt-1 w-full h-28 rounded-lg border border-white/10 bg-black/50 p-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </section>
    </main>
  );
}
