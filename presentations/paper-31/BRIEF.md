# Slide Deck Brief: Real-Time Chunking (RTC) — NeurIPS 2025

## 1) Paper
- **Title**: Real-Time Execution of Action Chunking Flow Policies
- **Authors**: Kevin Black, Manuel Y. Galliker, Sergey Levine
- **Venue / Year**: NeurIPS 2025 · arXiv:2506.07339
- **URL**: https://arxiv.org/abs/2506.07339
- **One-sentence thesis**: Action chunking policies can execute asynchronously in real time—without retraining—by using flow-matching inpainting to keep consecutive chunks continuous at their boundaries.

---

## 2) Presentation Context
- **Audience**: Lab group meeting (robot learning / VLA researchers)
- **Length**: ~16 slides, ~15 min
- **Language**: **English throughout.** Use exact paper terminology from the Glossary below. Do not back-translate Korean notes.
- **Goal**: Audience understands (1) why naive asynchronous execution fails, (2) how ΠGDM + soft masking fixes it, (3) how strong the results are.

---

## 2-bis) Glossary — use these exact terms
| Concept | Paper term |
|---|---|
| 실시간 청킹 | Real-Time Chunking (**RTC**) |
| 동기 실행 | synchronous execution |
| 비동기 실행 | (naive) asynchronous execution |
| 임시 앙상블 | temporal ensembling (**TE**) |
| 양방향 디코딩 | **BID** (Bidirectional Decoding) |
| 청크 경계 불연속 | chunk-to-chunk discontinuity / **bifurcation** |
| 인페인팅 | inpainting |
| 고정 구간 | **frozen** region |
| 중간 구간 | **intermediate** region |
| 새 생성 구간 | **freshly generated** region |
| 가이던스 가중치 | guidance weight *W* |
| 가이던스 클리핑 | guidance weight clipping *β* |
| 추론 지연 | inference delay *d* |
| 실행 호라이즌 | execution horizon *s* |
| 예측 호라이즌 | prediction horizon *H* |
| 최소 실행 호라이즌 | minimum execution horizon *s*_min |
| 컨트롤러 루프 / 백그라운드 루프 | controller loop / background loop |
| 가중 목표 오차 | weighted target error |
| 모델명 | π₀.₅ |

---

## 3) Design Direction
- **Ratio**: 16:9, clean academic, generous whitespace
- **One visual per content slide** (figure from paper or drawn diagram — never skip)
- **Typography**: serif title, sans body, one accent color (warm red)
- **Bullets**: 3–5 short phrases per slide, no full sentences, no paragraphs
- **Math**: display only key equations, large and centered
- **Export**: HTML (index.html), for iframe embedding

---

## 4) Assets — figures to upload (from `assets/` folder)

> **Do NOT use**: `fig05.jpg` (composite thumbnail), `fig09.png` (mascot)

| File | What it is | Assigned slide |
|---|---|---|
| `fig01.jpg` | Figure 1 top — match-lighting photo | S1 Title |
| `fig01b_curves.png` | Figure 1 bottom — position/velocity/acceleration: RTC (green, smooth) vs Sync (red, spiky) | S5 & S16 |
| `fig02.png` | Figure 2 — bifurcation: two chunks planning opposite paths around obstacle | S4 |
| `fig03.png` | Figure 3 — the 3-region soft masking diagram (frozen / intermediate / fresh) | S9 |
| `fig04.png` | Figure 4 — trajectory: hard masking vs soft masking | S10 |
| `fig05b_delay.png` | Figure 5 right — inference delay vs solve rate (12 envs + avg) | S11 |
| `fig05a_exechorizon.png` | Figure 5 bottom-left — execution horizon vs solve rate | S12 |
| `fig08.png` | Figure 8 left — masking schedule ablation (exp decay wins) | S13 |
| `fig06b_throughput.png` | Figure 6 right — injected delay vs average throughput | S14 |
| `fig06.png` | Figure 6 top — per-task cumulative progress over controller steps | S15 |
| `fig07.png` | Figure 7 — guidance clipping β: U-shaped coefficient curve + ablation | S8 |

---

## 5) Slide-by-Slide Plan

### S1. Title
- Title, authors, NeurIPS 2025 · arXiv:2506.07339
- Visual: `fig01.jpg` — match-lighting photo, right side or faded background
- Speaker note: "This robot lights a match with 300 ms of inference delay. That's what RTC enables."

---

### S2. The Inference Latency Problem
- Policy "thinks" while the physical world keeps moving
- Observation → inference → action delivery: **inference delay *d***
- Action chunking gives temporally consistent actions — does **not** solve latency
- Visual: **Diagram D1** — two-lane timeline: controller lane (top) vs VLA server lane (bottom), delay block shaded red
- Speaker note: The gap between "policy finishes thinking" and "robot needs to act" is the core problem.

---

### S3. Three Existing Strategies — All Suboptimal
- **Synchronous**: wait for next chunk → robot freezes / position-holds during inference
- **Naive asynchronous**: switch chunks immediately → acceleration spike at boundary
- **Temporal ensembling (TE)**: average overlapping chunks → smoother but suboptimal
- Visual: **Diagram D2** — three horizontal swim lanes showing each strategy's chunk timeline
- Speaker note: Each approach trades off latency for continuity. None get both.

---

### S4. The Core Problem: Bifurcation
- New chunk may plan a **completely different strategy** than the current one
- At the join point: robot jumps from $a_{10}$ to $a'_{11}$ → out-of-distribution acceleration spike
- TE reduces the spike but produces poor intermediate actions
- Visual: `fig02.png` — Figure 2: two chunks taking opposite paths around an obstacle
- Speaker note: This is the failure mode. Two valid plans, one physical body, no bridge between them.

---

### S5. RTC: The Key Idea
> Generate the next chunk **in parallel** while executing the current one, and use **inpainting** to enforce continuity at the boundary.

- Actions guaranteed to execute before the new chunk arrives → **freeze** them as inpainting target
- Constrain new chunk generation to agree with those committed actions
- **Training-free** — works with any flow matching or diffusion VLA
- Visual: `fig01b_curves.png` — Figure 1 bottom: RTC (green, smooth) vs Sync (red, spiky) position/velocity/acceleration

---

### S6. How RTC Runs: Two Concurrent Loops
**Controller loop** (every control tick):
- Pop next action from $A_\text{cur}$; save latest observation

**Background loop** (runs concurrently):
1. Wait until $t > s_\text{min}$
2. Record actions executed so far → $s$; predict delay $d = \max(Q)$
3. Run RTC generation (inpainting-guided denoising)
4. Swap to new chunk, skipping the $t - s$ already-executed actions

Feasibility constraint: $d \leq s \leq H - d$

- Visual: **Diagram D3** — two swim-lane timelines (controller top, background bottom) running in parallel

---

### S7. Inpainting with Flow Matching
Flow matching denoising step:
$$A_t^{\tau+1/n} = A_t^\tau + \tfrac{1}{n}\,v_\pi(A_t^\tau,\,o_t,\,\tau)$$

Predicted clean chunk at noise level $\tau$:
$$\hat{A}_t^1 = A_t^\tau + (1-\tau)\,v(A_t^\tau,\,o_t,\,\tau)$$

**Inpainting target** $Y$: overlap region from previous chunk

Goal: steer $\hat{A}_t^1 \to Y$ on committed actions, free generation elsewhere

- Visual: **Diagram D4** — one action chunk bar: frozen region (solid), intermediate (striped), fresh (white); bracket below marks $Y$

---

### S8. ΠGDM: Training-Free Guidance
Augmented velocity field:
$$v_{\Pi\text{GDM}} = v + \underbrace{\min\!\left(\beta,\;\tfrac{1-\tau}{\tau\,r_\tau^2}\right)}_{\text{coefficient}} \cdot \left(Y - \hat{A}_t^1\right)^\top \text{diag}(W)\;\tfrac{\partial \hat{A}_t^1}{\partial A_t^\tau}$$

- Coefficient is **U-shaped** in $\tau$: strong early, relaxed mid, corrective late
- **Clipping** $\beta$: prevents divergence near $\tau = 0$ with few denoising steps
- $W$: per-action guidance weight (defined by soft masking)
- Visual: `fig07.png` — Figure 7: U-shaped coefficient curve + β ablation showing no gain beyond β = 5

---

### S9. Soft Masking: Three Regions
Hard masking only freezes the first $d$ actions → abrupt direction change just past the boundary

**Soft masking** assigns guidance weight $W_i$ by region:

| Region | Condition | Weight |
|---|---|---|
| **Frozen** | $i < d$ | 1 — full guidance |
| **Intermediate** | $d \leq i < H-s$ | exponential decay toward 0 |
| **Freshly generated** | $i \geq H-s$ | 0 — free generation |

Near future: lock tightly. Far future: generate freely.

- Visual: `fig03.png` — Figure 3: the 3-region diagram with labeled guidance weights

---

### S10. Soft vs Hard Masking
- Hard masking: constraint ends sharply at $d$ → kink in the trajectory at the boundary
- Soft masking: gradual transition via exponential decay → smooth continuation
- Visual: `fig04.png` — Figure 4: trajectory comparison (hard left, soft right)
- Speaker note: The kink in hard masking is small but causes jerk — exactly what we're trying to avoid.

---

### S11. Simulation: Kinetix Benchmark
- 12 dynamic tasks (throwing, catching, balancing) — force-based control, no position hold
- Baselines: naive async, temporal ensembling, BID
- **RTC outperforms all baselines at every delay level**
- Performance gap widens as inference delay *d* increases
- Soft masking adds substantial lift over hard masking
- Visual: `fig05b_delay.png` — Figure 5 right: inference delay *d* vs solve rate (all 12 envs + average)

---

### S12. Execution Horizon: Shorter Is Better with RTC
- Smaller $s$ = more frequent chunk updates = higher reactivity
- **Only RTC and BID** gain from smaller $s$ — they maintain continuity across boundaries
- Naive async and TE **degrade** as $s$ shrinks — boundary discontinuity gets triggered more often
- Visual: `fig05a_exechorizon.png` — Figure 5 bottom-left: execution horizon $s$ vs average solve rate

---

### S13. Ablation: Masking Schedule
- Compared: exponential decay, linear decay, constant (hard masking), Diffuser inpainting
- **Exponential decay best overall; linear decay close**
- Hard masking significantly worse
- Even the simpler Diffuser overwrite helps — but guidance-based ΠGDM wins
- Visual: `fig08.png` — Figure 8: schedule ablation (left) + Diffuser comparison (right)

---

### S14. Real World: Bimanual Manipulation (π₀.₅)
- Tasks: plug Ethernet, folding, dishes, match-lighting — bimanual gripper setup
- $H=50$, $\Delta t = 20\text{ ms}$, $n=5$ denoising steps; injected delays: +0/+100/+200 ms
- **RTC: highest throughput at every delay level**
- **TE (sparse/dense): triggers robot protective stop at +100 ms and +200 ms** — cannot run
- Sync: throughput degrades linearly with delay
- Visual: `fig06b_throughput.png` — Figure 6 right: injected delay vs average throughput (±1 SEM bars)

---

### S15. Real World: Per-Task Progress
- Retry-possible tasks (Plug, Folding, Dishes): RTC reaches the same endpoint faster, fewer retries
- Precision-sensitive tasks: RTC's smoothness directly raises success rate
- Across all tasks: RTC completes more progress within the episode time budget
- Visual: `fig06.png` — Figure 6 top: per-task cumulative progress vs controller steps (aggregated across delays)

---

### S16. Takeaways
- **RTC does not speed up inference** — it parallelizes inference with execution so the robot never waits
- **ΠGDM + soft masking** is the key: exponential decay in the intermediate region is what makes boundaries smooth
- **Training-free**: drop into any flow/diffusion VLA; the only cost is backprop through ΠGDM each denoising step
- Future direction: training-time RTC (condition on action prefix during training) eliminates ΠGDM overhead entirely
- Visual: `fig01b_curves.png` — the smooth green line vs spiky red line is the paper in one image

---

## 6) Diagram Specs

### D1 — Inference Latency Timeline (S2)
Two horizontal swim-lane timelines, stacked vertically, sharing a time axis at the bottom.

**Top lane — Controller**:
`[observe o_t]` → `[execute A_cur actions…]` → `[receive A_next]` → `[execute A_next…]`

**Bottom lane — VLA Server**:
`[receive o_t]` → `[▓▓▓▓▓ INFERENCE DELAY d ▓▓▓▓▓]` (shaded red) → `[send A_next]`

- Vertical dashed line from "observe o_t" to "receive o_t" to synchronize the two lanes
- Another dashed line from "send A_next" to "receive A_next"
- Annotation on the red block: *"The physical world doesn't pause"*
- Label: left→right time axis

### D2 — Three Execution Strategies (S3)
Three rows, each a horizontal timeline. Time axis at bottom.

**Row 1 — Synchronous**:
`[chunk 1: s steps]` → `[⏸ PAUSE (inference)]` → `[chunk 2: s steps]`
Annotation: *"robot freezes"*

**Row 2 — Naive Asynchronous**:
`[chunk 1: continuous execution]` → sharp red jagged spike at join point → `[chunk 2: continues]`
Annotation: *"OOD acceleration spike"*

**Row 3 — Temporal Ensembling**:
`[chunk 1]` and `[chunk 2]` overlap in a blended gradient region
Annotation: *"smoother, but suboptimal trajectory"*

### D3 — RTC Two Loops (S6)
Two horizontal swim-lane timelines.

**Top — Controller Loop** (repeating, fast):
`[pop action]` → `[execute]` → `[save obs]` → `[pop action]` → `[execute]` → `…`

**Bottom — Background Loop** (slower, starts concurrently):
`[wait s > s_min]` → `[record s, predict d]` → `[▓▓▓ RTC GENERATE ▓▓▓]` (red) → `[swap chunk]`

- Dotted arrow from "save obs" → "Background Loop" labeled *"latest observation"*
- Dotted arrow from "swap chunk" → Controller Loop labeled *"A_new ready"*
- The two loops run simultaneously — no pausing between them

### D4 — Inpainting Target Y (S7)
One horizontal bar representing the action chunk of length $H$.

- Left block `[0 … d-1]`: **solid red** — labeled **"Frozen"** (will execute before new chunk arrives)
- Middle block `[d … H-s-1]`: **diagonal stripes** — labeled **"Intermediate"** (soft constraint, exponential decay)
- Right block `[H-s … H-1]`: **white/empty** — labeled **"Freshly generated"** (no constraint)
- Bracket below the frozen + intermediate region: "Inpainting target *Y*"
- Vertical dashed line at $d$: label *"inference completes"*
- Vertical dashed line at $H-s$: label *"end of previous chunk"*

---

## 7) Rules
- **No numbers or claims not in the note or paper.** If uncertain, flag with `[?]`.
- Caption every figure with its paper Figure number (e.g., *"Figure 3"*).
- Use only Glossary terminology — no back-translation.
- Export as HTML (`index.html`), self-contained or with relative asset paths.
