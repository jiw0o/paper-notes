# 발표자료 생성 요청: Training-Time RTC

## 1) 논문
- 제목: Training-Time Action Conditioning for Efficient Real-Time Chunking
- 저자 / 발표처 / 연도: Kevin Black, Allen Z. Ren, Michael Equi, Sergey Levine · Preprint (arXiv) · 2025
- 링크: https://arxiv.org/abs/2512.05964
- 한 문장 논지: Inference-Time에서 매 denoising step마다 Backpropagation(VJP)을 요구하는 Inpainting 대신, Training-Time에 Inference Delay를 시뮬레이션해 모델이 Action Prefix-Conditioned Generation을 직접 학습하게 함으로써 동일한 성능을 유지하면서 Latency를 20% 줄인다.

## 2) 발표 맥락
- 청중: Lab Group Meeting / Robotics Researchers (action chunking, diffusion policy에 친숙한 수준)
- 길이: 슬라이드 12장, 약 12~15분
- 언어: **English throughout.** Use the paper's own terminology (see Glossary below); do not invent terms.
- 목표: (1) Training-Time RTC가 Inference-Time RTC의 실용적인 Drop-In Replacement임을 납득시키기, (2) Token-Wise Flow Matching Timestep 설계의 핵심 아이디어를 직관적으로 전달하기

## 2-bis) Glossary (paper terminology — use these exact terms)
- **RTC (Real-Time Chunking)**: Asynchronous execution of action chunking policies in real time
- **Action Chunking**: Grouping multiple consecutive predicted actions into a single temporal chunk
- **Action Prefix**: The first $d$ actions of a chunk that are already committed/executed (red in Figure 1)
- **Action Postfix**: The remaining actions in a chunk that need to be newly generated
- **Inference Delay ($d$)**: Time steps elapsed between when inference starts and when the new chunk will be executed
- **Inference-Time RTC (Inpainting)**: Guidance-based stitching at test time using Vector-Jacobian Products at every denoising step
- **Training-Time RTC**: The proposed method — simulate delay during training so the model directly learns prefix-conditioned generation
- **Vector-Jacobian Product (VJP)**: Backpropagation-based computation required for inpainting guidance, source of overhead
- **Asynchronous Execution**: Running policy inference in background while the robot executes current chunk in foreground
- **Flow Matching**: The diffusion-family objective used to train the action generation model
- **Token-Wise Flow Matching Timesteps**: Per-token $\tau$ assignment — prefix tokens get $\tau = 1.0$ (clean), postfix tokens get sampled $\tau \in [0, 1]$ (noisy)
- **adaLN-Zero**: Adaptive Layer Normalization with zero initialization in DiT blocks, modified here to apply token-specific scale, shift, and gate
- **Dynamic Kinetix**: The simulation benchmark used for evaluating solve rate vs. inference delay
- **$\pi_{0.6}$**: The base VLA model used for real-world experiments

## 3) 디자인 방향
- 비율 16:9, clean academic. 여백 넉넉, 슬라이드당 핵심 1개.
- **모든 content 슬라이드에 시각자료 1개** (아래 figure 또는 diagram).
- 타이포: 제목 serif, 본문 sans. 강조색(accent) 1개만(예: 딥 블루 또는 테라코타). 배경 밝은 톤.
- Bullet은 3~5개, 짧은 구. 문단 금지. 수식은 필요할 때만 크게.
- 출력: 완성 후 **HTML로 export** (웹 임베드용). 파일은 index.html 기준.

## 4) 업로드한 시각자료 (assets/ 폴더)
- `fig01.png` — Figure 1: 두 Action Chunk가 겹치는 타임라인. Prefix(red)와 Postfix(yellow) 구분 명시. → **S3 (Problem)**에서 Inference-Time RTC 설명 시 크게 사용.
- `fig02.png` — Figure 2: Conditioning Architecture. DiT 블록에 Prefix/Postfix 토큰과 Token-Wise Timestep이 어떻게 들어가는지. → **S6 (Architecture)**에 크게 사용.
- `fig03.png` — Figure 3: Simulation Results — Inference Delay($d$) vs. Solve Rate 그래프. Training-Time vs. Inference-Time vs. Naive Async 비교. → **S9 (Sim Results)**에 크게 사용.
- `fig04.png` — Box Building task 사진. → **S10 (Real-World Setup)**에 사용.
- `fig05.png` — Espresso Making task 사진. → **S10 (Real-World Setup)**에 fig04와 나란히.
- `fig06.png` — Figure 5: 실제 실험 결과 — Success Rate + Task Duration 바 차트. → **S11 (Real-World Results)**에 크게 사용.
- `fig07.png` — Mascot (skip; do not include).

## 5) 슬라이드 구성(장별)

### S1. Title
- Training-Time Action Conditioning for Efficient Real-Time Chunking
- Kevin Black, Allen Z. Ren, Michael Equi, Sergey Levine · arXiv 2025
- 시각자료: `fig02.png`(conditioning architecture)를 우측 배경에 반투명하게 은은히.
- 발표자 노트: Introduce the paper as a practical training recipe for real-time robot control — not a new model architecture, but a smarter way to train existing flow-matching policies.

### S2. Background: Asynchronous Execution in Real-Time Robot Control
- **Synchronous Execution**: Robot freezes between chunks — jerky, slow.
- **Asynchronous Execution**: Inference runs in background while robot executes current chunk — smoother, but creates a chunk-boundary gap.
- **Inference Delay $d$**: By the time inference finishes, the robot has already advanced $d$ steps into the next chunk.
- 시각자료: Diagram — Asynchronous Control Loop
  - 수평 타임라인 2행
  - Row 1 (Control Thread): `[Execute Chunk k (steps 1…8)]` → `[Execute Chunk k+1]`
  - Row 2 (Inference Thread): (겹쳐서) `[Infer Chunk k+1 (takes ~100ms)]`
  - 두 행 사이에 화살표로 "$d$ steps of delay" 표시
  - 캡션: "By the time new chunk is ready, robot is already at step $d$"
- 발표자 노트: Asynchronous execution is essential for fast robot control. But the chunk starting point the policy "assumes" has already been passed by the robot, creating a mismatch.

### S3. Problem: Inference-Time RTC and Its Overhead
- **Chunk-Boundary Mismatch**: Next chunk may diverge from committed prefix, causing jerky transitions.
- **Inference-Time RTC (Inpainting)**: Guides generation so the new chunk begins exactly where the previous one left off — uses the Action Prefix as a hard constraint.
- **The Cost**: Guidance requires a **Vector-Jacobian Product (VJP)** at *every denoising step* → adds ~20–30% latency overhead.
- **Contradiction**: RTC aims to speed up control, but inpainting slows inference.
- 시각자료: `fig01.png` — Figure 1 (overlapping action chunks; Prefix in red, Postfix in yellow). Caption: "Figure 1 from the paper."
- 발표자 노트: Inference-Time RTC solves chunk continuity but re-introduces latency through backpropagation-based guidance at each denoising step. This is the core tension.

### S4. Key Idea: Move the Cost to Training Time
- **Shift the Burden**: Instead of correcting chunk boundaries at test time, train the model to directly learn prefix-conditioned generation.
- **Simulate Delay During Training**: Randomly sample $d$ per batch; treat first $d$ actions as clean Prefix, rest as noisy Postfix.
- **Forward-Only at Test Time**: No inpainting, no backprop — just a standard forward pass.
- **Drop-In Replacement**: Retains asynchronous execution + chunk continuity, eliminates overhead.
- 시각자료: Diagram — Inference-Time vs. Training-Time Comparison
  - 두 컬럼
  - Left (Inference-Time RTC): `[Obs o_t]` → `[Policy]` → `[Action Chunk]` → `[Test-Time Inpainting (VJP × N steps)]` → `[Slow: +20–30% latency]`
  - Right (Training-Time RTC, accent color로 강조): `[Obs o_t + Prefix A_{t:t+d}]` → `[Conditioned Policy]` → `[Postfix (forward-only)]` → `[Fast: zero overhead]`
- 발표자 노트: The insight is simple — if we can make the model learn to continue a given prefix during training, we don't need to enforce it at test time at all.

### S5. Method (1): Conditional Action Generation
- **Standard Policy**: Learns joint distribution over full horizon $H$:
  $$p(A_{t:t+H} \mid o_t)$$
- **Training-Time RTC Objective**: Learns conditional distribution of Postfix given Prefix:
  $$p(A_{t+d:t+H} \mid o_t,\; A_{t:t+d})$$
- **Variable Delay**: $d$ is randomly sampled each training batch — builds robustness to fluctuating real-world latencies.
- 시각자료: Diagram — Training Objective Comparison
  - 위: Standard — single arrow from $o_t$ to full action sequence $[a_0, a_1, \ldots, a_{H-1}]$
  - 아래: Training-Time RTC — $o_t$ + Prefix $[a_0,\ldots,a_{d-1}]$ → Postfix $[a_d,\ldots,a_{H-1}]$
  - Prefix 블록 녹색, Postfix 블록 주황색(또는 accent)
- 발표자 노트: This is a straightforward conditioning. The tricky part is how to implement it inside a diffusion transformer that expects a single global timestep.

### S6. Method (2): Token-Wise Flow Matching Timestep + Architecture
- **Challenge**: Standard Flow Matching assigns one global timestep $\tau$ to all tokens.
- **Solution — Token-Wise Timesteps**:
  - Prefix tokens: $\tau = 1.0$ (fully clean — no denoising needed)
  - Postfix tokens: $\tau \sim \text{Uniform}(0, 1)$ (noisy — learn to denoise)
- **adaLN-Zero Modification**: DiT blocks adapted so each token has its own scale, shift, and gate based on its individual $\tau$.
- Loss computed **only on Postfix tokens**; Prefix tokens are untouched.
- 시각자료: `fig02.png` — Figure 2 (conditioning architecture: Prefix/Postfix token streams into DiT). Caption: "Figure 2 from the paper."
- 발표자 노트: This is the key technical contribution. By assigning different flow-matching timesteps per token, the model gets a clear signal about which tokens are "given" (prefix) and which it must "generate" (postfix).

### S7. Method (3): Training Recipe — Step by Step
1. **Sample delay**: $d \sim \text{Uniform}(0, d_{\max})$ per batch
2. **Set Prefix tokens** ($0$ to $d-1$): Ground-truth clean actions, timestep $\tau = 1.0$
3. **Set Postfix tokens** ($d$ to $H-1$): Noisy actions, timestep $\tau \sim \text{Uniform}(0, 1)$
4. **Forward pass + compute loss on Postfix only** (Prefix excluded from loss)
- 시각자료: Diagram — Token Layout at Training Time
  - $H$개의 수평 블록 ($0$ ~ $H-1$)
  - 블록 $0$~$d-1$: 녹색, 라벨 "Prefix (Ground Truth)", 아래에 "$\tau = 1.0$ / No Loss"
  - 블록 $d$~$H-1$: 주황(accent), 라벨 "Postfix (Noisy)", 아래에 "$\tau \in [0,1]$ / Flow Matching Loss"
  - 캡션: "Delay $d$ is sampled randomly per batch"
- 발표자 노트: The recipe is drop-in. You change the data loader to sample $d$, assign prefix/postfix timesteps, and mask the loss. The model architecture change is minimal — just adaLN-Zero per token.

### S8. Method (4): Inference — Closing the Control Loop
- **Foreground Control Loop**: Executes committed actions at 50 Hz.
- **Background Inference Loop**:
  1. Predict next delay $\hat{d}$ from a running queue of recent latency measurements (max of queue)
  2. Gather committed actions $A_{\text{prev}}[s : s + \hat{d}]$ as the Prefix
  3. Run forward pass → generate Postfix $A_{\text{cur}}[\hat{d} : H]$
- **Seamless Handover**: New postfix starts exactly where the robot will be when inference completes.
- 시각자료: Diagram — Inference Control Loop
  - 두 수평 행
  - Row 1 (Foreground / Control Thread): `[Execute Prefix (committed)]` → `[Execute New Postfix]`
  - Row 2 (Background / Inference Thread): `[Obs o_t + Prefix A_prev[s:s+d̂]]` → `[Forward Pass (no backprop)]` → `[Postfix ready]`
  - 두 행 사이 점선으로 "handover at step $s+\hat{d}$"
- 발표자 노트: At test time there is no VJP. Just a standard forward pass. The key is predicting $d$ accurately — done simply by taking the max of a sliding window of recent inference times.

### S9. Simulation Results: Robustness to Inference Delay
- **Benchmark**: Dynamic Kinetix (same as original RTC paper), $H = 8$, delay $d = 0 \sim 4$
- **Low delay ($d \leq 1$)**: Training-Time RTC ≈ Inference-Time RTC in Solve Rate
- **High delay ($d \geq 2$)**: Training-Time RTC **outperforms** Inference-Time RTC — gap widens with $d$
- **Why?** At long delays, inpainting struggles to satisfy hard long-prefix constraints post-hoc; the proposed model was trained to handle them natively.
- 시각자료: `fig03.png` — Figure 3 (Solve Rate vs. Inference Delay). Caption: "Figure 3 from the paper."
- 발표자 노트: The crossing point is at $d=2$. Below that both methods match. Above that, the trained conditional model consistently wins. This is the clean argument that shifting the cost to training is strictly better.

### S10. Real-World Evaluation Setup
- **Base Model**: $\pi_{0.6}$ fine-tuned with Training-Time RTC conditioning
- **Delay Distribution**: $d \sim \text{Uniform}(0, 10)$ — supports up to 200 ms latency at 50 Hz
- **Tasks**:
  - **Box Building**: High-precision, contact-rich assembly
  - **Espresso Making**: Complex multi-step sequencing
- **Baselines**: Synchronous Baseline · Inference-Time RTC · Training-Time RTC
- 시각자료: `fig04.png` (Box Building) + `fig05.png` (Espresso Making) 나란히 배치. Caption: "Real-world evaluation tasks."
- 발표자 노트: Both tasks are challenging and contact-rich. They fine-tuned the publicly available π0.6 base model — demonstrating that Training-Time RTC is truly a drop-in recipe on top of an existing pretrained VLA.

### S11. Real-World Results: Same Performance, Lower Latency
- **Success Rate**: Training-Time RTC ≈ Inference-Time RTC on both tasks (both much better than Synchronous).
- **Task Duration**: Both RTC variants significantly faster than Synchronous.
- **End-to-End Control Latency**:
  - Training-Time RTC: **108 ms** ← proposed
  - Inference-Time RTC: 135 ms
  - → **20% latency reduction**, zero VJP overhead
- 시각자료: `fig06.png` — Figure 5 (Success Rate + Duration bar charts for both tasks). Caption: "Figure 5 from the paper."
- 발표자 노트: The headline number is 108 ms vs. 135 ms — a 20% wall-clock speedup with no drop in task success rate. This validates the core claim: you lose nothing and gain faster control.

### S12. Summary & Takeaways
- **Problem**: Inference-Time RTC requires VJP at every denoising step → latency overhead.
- **Solution**: Simulate delay during training; model directly learns $p(A_{\text{postfix}} \mid o_t, A_{\text{prefix}})$.
- **Results**: 20% latency reduction (108 ms vs. 135 ms) with identical success rate; more robust at high delay in simulation.
- **What it is**: A **training recipe** — drop-in replacement for any flow-matching / diffusion action-chunking policy.
- **Limitations**: Only hard action prefix supported (less flexible than soft inference-time guidance); delay distribution must be chosen carefully at training time.
- 시각자료: `fig03.png` 재등장 (핵심 그래프 리마인더) 또는 S4의 두-컬럼 비교 다이어그램 재사용.
- 발표자 노트: The contribution is elegant in its simplicity. No new model, no new architecture — just a smarter training objective that front-loads the cost of chunk stitching. Q&A.

---

## 6) 다이어그램 스펙 (직접 그릴 것)

### Diagram A (S2: Asynchronous Control Loop)
- 레이아웃: 수평 타임라인, 2행
- Row 1 (Control Thread, 위): 연속된 블록 2개
  - `[Chunk k: steps 0…s-1]` (회색) → `[Chunk k+1: steps 0…H-1]` (accent)
- Row 2 (Inference Thread, 아래, 비동기로 겹침):
  - `[Infer Chunk k+1 (~100 ms)]` (점선 박스)
- 두 행 사이 수직 화살표: "starts inference at $t$" (Chunk k 실행 중) → "inference done at $t+d$"
- 오른쪽 끝 레이블: "$d$ steps of committed actions become the Prefix"
- 배경색: Row 1 밝게, Row 2 약간 음영

### Diagram B (S4: Inference-Time vs. Training-Time Comparison)
- 레이아웃: 좌우 2컬럼, 중앙 "vs." 구분선
- 왼쪽 (Inference-Time RTC, 회색조):
  - `[Obs o_t]` → `[Policy]` → `[Action Chunk]` → `[Inpainting (VJP × N)]` → `[Slow ⚠]`
  - 아래 레이블: "Backprop at every denoising step"
- 오른쪽 (Training-Time RTC, accent color):
  - `[Obs o_t] + [Prefix A_{t:t+d}]` → `[Conditioned Policy]` → `[Postfix (forward only)]` → `[Fast ✓]`
  - 아래 레이블: "No backprop at test time"

### Diagram C (S5: Training Objective)
- 레이아웃: 상하 2행
- 위 (Standard):
  - `o_t` → 화살표 → 길고 단일한 action bar `[a_0 a_1 … a_{H-1}]` (단색)
  - 라벨: "Standard: $p(A_{t:t+H} \mid o_t)$"
- 아래 (Training-Time RTC):
  - `o_t` + 녹색 bar `[a_0…a_{d-1}]` (Prefix) → 화살표 → 주황 bar `[a_d…a_{H-1}]` (Postfix)
  - 라벨: "Training-Time RTC: $p(A_{t+d:t+H} \mid o_t, A_{t:t+d})$"

### Diagram D (S7: Training Token Layout)
- 레이아웃: $H$개 정사각형 블록 수평 나열
- 블록 $0$ ~ $d-1$ (좌측): 녹색 채움, 상단 라벨 "Prefix Tokens", 하단 "$\tau = 1.0$", 하단 밑에 "No Loss"
- 블록 $d$ ~ $H-1$ (우측): 주황(accent) 채움, 상단 라벨 "Postfix Tokens", 하단 "$\tau \sim U(0,1)$", 하단 밑에 "Flow Matching Loss ✓"
- 블록 경계에 수직 점선 + 레이블 "$d$ (sampled randomly)"
- 전체 캡션: "Masking the loss on prefix tokens; $d$ varies each batch"

### Diagram E (S8: Inference Control Loop)
- 레이아웃: 수평 타임라인, 2행
- Row 1 (Foreground): `[Committed Prefix A_prev[s:s+d̂]]` → `[New Postfix A_cur[d̂:H]]`
- Row 2 (Background): `[Obs o_t]` + `[Prefix]` → `[Forward Pass (no backprop)]` → `[Postfix ready]`
- 두 행 사이 수직 점선: "handover at $s + \hat{d}$"
- 오른쪽 상단 작은 박스: "Queue of latencies → $\hat{d} = \max(\text{queue})$"

---

## 7) 지켜야 할 것
- **수치는 논문/노트 그대로**: 108 ms, 135 ms, $d=2$ crossover, $H=8$, 50 Hz, 200 ms, Dynamic Kinetix. 없는 수치 생성 금지.
- **용어는 Glossary 그대로**: "Inference-Time RTC", "Training-Time RTC", "Vector-Jacobian Product (VJP)", "adaLN-Zero" 등 대소문자 포함.
- **figure 캡션 출처**: 각 figure 아래 "Figure N from the paper." 형식으로 표기.
- **완성 후 HTML export**: 단일 index.html 또는 index.html + assets/. iframe 임베드 가능해야 함.
- **영어 only**: 슬라이드 본문, 다이어그램 라벨, 발표자 노트 모두 영어. 이 brief 자체의 한국어 설명은 참고용이며 슬라이드에 반영하지 않는다.
