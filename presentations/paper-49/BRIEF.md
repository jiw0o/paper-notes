# 발표자료 생성 요청: RoboTTT — Context Scaling for Robot Policies

## 1) 논문

- 제목: **RoboTTT: Context Scaling for Robot Policies**
- 저자 / 발표처 / 연도: Yunfan Jiang, Yevgen Chebotar, Ruijie Zheng, Fengyuan Hu, Yunhao Ge, Jimmy Wu, Tianyuan Dai, Scott Reed, Li Fei-Fei, Yuke Zhu, Linxi "Jim" Fan · Preprint (arXiv:2607.15275) · 2026
- 링크: https://arxiv.org/abs/2607.15275
- 한 문장 논지(thesis): **Compressing a robot's rollout history into fast weights with Test-Time Training scales visuomotor context to 8K timesteps at constant inference cost, and once context is long enough, closed-loop performance keeps improving — making context length a new scaling axis for robot foundation models.**

## 2) 발표 맥락

- 청중: lab group meeting (robot learning / VLA researchers). 사전지식: VLA·flow-matching policy는 알지만 **TTT는 처음 듣는 사람이 있다고 가정.**
- 길이: 슬라이드 **21장**, 약 **20분**
- 언어: **English throughout.** Use the paper's own terminology (see Glossary below); do not invent terms. No Korean anywhere on the slides.
- 출력 형식: **HTML** (`index.html`) — 사이트에서 iframe으로 임베드하므로 PDF/PPTX가 아니라 HTML이어야 한다.
- 목표(청중이 얻어갈 것):
  1. TTT가 무엇이고 왜 "fast weights = recurrent state"가 attention/RNN과 다른 압축 방식인지 이해한다.
  2. 그 메커니즘을 robot foundation model에 넣었을 때 어떤 새 능력(one-shot in-context imitation, on-the-fly improvement)이 열리고, context length가 왜 새로운 scaling axis인지 이해한다.

## 3) Glossary (paper terminology — use these exact terms, exact casing)

| 개념 (한국어 노트 표현) | 슬라이드에서 쓸 논문 용어 |
|---|---|
| 제안 모델 이름 | **RoboTTT** (Test-Time-Training Robot Policies). 항상 `RoboTTT`, 소문자 `roboTTT` 등 변형 금지 |
| TTT | **Test-Time Training (TTT)** |
| Fast Weight / 빠른 가중치 | **fast weights** ($W_t$), the **fast model** $f_W(\cdot)$ (here a **two-layer MLP**) |
| Slow Weight | **slow weights** ($\theta_Q, \theta_K, \theta_V$, $W_0$, $\eta$) |
| Inner loop 업데이트 | the **update step** (Eq. 1) — "update then apply" |
| Apply / Read | the **apply step** (Eq. 2) |
| Fast weight 초기값 | the **learned initialization** $W_0$, **meta-learned** through gradients of gradients |
| Inner loss | the **fast weight loss** $\mathcal{L}_{\mathrm{FW}}(\hat v, v) = \lVert \hat v - v \rVert^2$ |
| Outer loss | the **outer task loss** (a **flow-matching** objective) |
| Register Token | **learned register tokens** $R_t$ ($N = 16$), prepended per timestep |
| VLM feature | **vision-language (VL) tokens** $\Phi_t$ |
| Proprioception 토큰 | the **encoded proprioception token** $q_t$ |
| Noised action token | **noised action tokens** $\tilde A_t$; an $H$-step **action chunk** $A_t$ |
| Action head | the **DiT action head** (Diffusion Transformer), 16 DiT layers |
| Gating | **learned $\tanh$ gating**, gate $\tanh(\alpha)$, $\alpha \in \mathbb{R}^d$ initialized near zero (0.001) |
| 시퀀스 학습 시 noise 독립 샘플링 | **sequence action forcing** |
| TBPTT | **truncated backpropagation through time (TBPTT)**, gradients **truncated at segment boundaries**, fast weights **carried over** |
| 사람 영상 모방 | **one-shot imitation from in-context human video demonstrations** |
| DAgger 방식 학습 | **DAgger Distillation** ("failures as context, corrections as targets") |
| Loss 마스킹 | **masking the flow-matching loss**, those timesteps serve as **pure context** |
| 백본 | **GR00T N1.7** (the paper's default backbone) |
| Baseline 이름 | **GR00T N1.7** (= *Single-Step Context*), **GR00T N1.7 Hist.** (= *Short Context*), **GDN** |
| 성능 지표 | **task completion score** (rubric-based, %), **fully successful trials** |
| 태스크 이름 | **Pup Go Car**, **Circuit**, **Gear Bot**; **YAM bimanual** setup |
| 진행 상태 혼동 | **state aliasing** |
| Pretraining 데이터 | tabletop bimanual robot data + **egocentric human data (EgoScale)** |

수식 표기는 논문 Preliminaries를 그대로 따른다:

$$W_t \leftarrow W_{t-1} - \eta \nabla_W \mathcal{L}_{\mathrm{FW}}\!\left(f_{W_{t-1}}(K_t),\, V_t\right) \quad (1)$$
$$O_t = f_{W_t}(Q_t) \quad (2)$$
$$O = \tanh(\alpha) \odot O_{\mathrm{TTT}} + O_{\mathrm{attn}} \quad (3)$$

## 4) 업로드한 시각자료 (assets/ 폴더)

논문 원본 그림이다. **재현·변형·수치 편집 금지**, 원본 그대로 사용할 것.

| 파일 | 논문 | 쓸 슬라이드 |
|---|---|---|
| `teaser.png` | Fig. 1 teaser | S1 |
| `model-arch.png` | Fig. 2 architecture + training + inference | S9 |
| `gating.png` | Fig. 3 $\tanh$ gating 계산 흐름 | S11 |
| `tbptt.svg` | Fig. 4 TBPTT segment / gradient / fast-weight carry | S13 |
| `tasks.png` | Fig. 5 3개 평가 task rollout | S16 |
| `dagger-distillation.png` | Fig. 6 DAgger Distillation loss masking | S15 |
| `main-exp-results.svg` | Fig. 7 main evaluation | S17 |
| `ctx-scaling-results.svg` | Fig. 8 context length scaling | S18 |
| `oneshot-rollout.png` | Fig. 9 사람 시연 → 리셋 → 로봇 재현 | S19 |
| `dagger-distillation-results.svg` | Fig. 10 DAgger Distillation 결과 | S20 |
| `recovery-rollout.png` | Fig. 11 on-the-fly recovery rollout | S20 |
| `ablation.svg` | Fig. 12 ablation | S20 |
| `task-pupgo.png`, `task-gearbot.png`, `task-circuit.png` | Fig. A.2–A.4 task 상세 | S16 (선택) |
| `dataset-episode-len-dist.svg` | Fig. A.1 pretraining trajectory 길이 분포 | 선택 |

각 figure에는 원 논문 그림 번호를 캡션으로 표기할 것 (예: `Fig. 2, Jiang et al. 2026`).

> Tables 1–3은 논문에서 이미지가 아니라 HTML 표다. 아래 §5에 숫자를 그대로 옮겨 뒀으니 슬라이드에서 직접 표로 조판할 것.

## 5) 슬라이드 구성 (장별)

> 각 장: 제목 / 본문 내용 / 시각자료 / 발표자 노트
> S5 앞과 S9 앞에 각각 `Part 1 — Test-Time Training`, `Part 2 — RoboTTT` 섹션 간지를 넣는다(21장 카운트에 미포함).

---

### S1. Title

- **RoboTTT: Context Scaling for Robot Policies**
- Jiang, Chebotar, Zheng, Hu, Ge, Wu, Dai, Reed, Fei-Fei, Zhu, Fan
- arXiv:2607.15275 · 2026
- 시각자료: `teaser.png` (Fig. 1)

---

### S2. Motivation — robot policies barely remember anything

- Most robot foundation models condition on a **single step** or a **short history** (typically 2–8 frames).
- Formally, a robot sequence model learns $\pi(A_t \mid \xi_{<t}, o_t, q_t)$ — but $\lvert \xi_{<t} \rvert$ has stayed tiny.
- Three things break at short context:
  - **Task progress tracking** — visually similar stages cause **state aliasing**; policies repeat or skip stages.
  - **Partial observability** — occlusion and camera motion hide the object of interest.
  - **Failure and recovery** — a policy proceeds to the next stage as if the previous one had succeeded.
- 시각자료: **Diagram A** (§6).
- 발표자 노트: 이 세 가지는 논문이 Sec. 4 정성 분석에서 baseline 실패 양상으로 실제 관찰한 것. 결과 슬라이드에서 그대로 다시 나온다.

---

### S3. What long visuomotor context unlocks

- **One-shot in-context imitation** — a whole human video demonstration compressed into context, then reproduced.
- **On-the-fly policy improvement** — the rollout so far becomes online experience the policy corrects against.
- **Robustness to external perturbations** — condition *within* an episode, return to the perturbed stage.
- **Long-horizon closed-loop performance** — track progress across a multi-stage, five-minute task.
- 시각자료: **Diagram B** (§6).

---

### S4. Why this is hard, and the roadmap

- Naively appending history does not work: **GR00T N1.7 Hist.** scores **39.5%** on Pup Go Car vs **57%** for its no-history counterpart — appended histories introduce spurious correlations and leave the robot temporally out of distribution.
- **Full attention over the rollout** captures long dependencies but KV-cache decoding latency **grows linearly with context** — prohibitive on a real robot.
- **RNN policies** give constant inference cost but classic architectures scale worse than attention.
- ⇒ **RoboTTT**: an RNN-style policy whose **recurrent state is fast weights**, updated by gradient descent at test time.
- 시각자료: **Diagram C** (§6).
- 발표자 노트: 여기서 Part 1(TTT primer)로 넘어간다고 예고.

---

### S5. TTT in one slide: update, then apply

- Project each token: $Q_t = \theta_Q x_t$, $K_t = \theta_K x_t$, $V_t = \theta_V x_t$
  - $K_t$ = **write address**, $V_t$ = **write content**, $Q_t$ = **read query**.
- **Update step** — take one gradient step on the fast weight loss:
  $$W_t \leftarrow W_{t-1} - \eta \nabla_W \mathcal{L}_{\mathrm{FW}}\!\left(f_{W_{t-1}}(K_t), V_t\right), \qquad \mathcal{L}_{\mathrm{FW}}(\hat v, v) = \lVert \hat v - v \rVert^2$$
- **Apply step** — read the updated fast weights:
  $$O_t = f_{W_t}(Q_t)$$
- This happens during **both training and inference**.
- 시각자료: **Diagram D** (§6).

---

### S6. Slow weights vs fast weights

- **Slow weights** — trained normally, frozen at inference: $\theta_Q, \theta_K, \theta_V$, the initialization $W_0$, the learnable inner learning rate $\eta$.
- **Fast weights** — $W_t$, updated at *every* timestep, at training *and* inference time.
- The fast weights play the role of an RNN hidden state, but the state **is the network's parameters**: $s_t^{\mathrm{RNN}} \leftrightarrow W_t^{\mathrm{TTT}}$.
- $W_0$ is **meta-learned through gradients of gradients**, so the *write/read mechanism itself* is optimized for the downstream task.
- 시각자료: **Diagram E** (§6).

---

### S7. RNN vs self-attention vs TTT

- 시각자료: 아래 표를 슬라이드에 직접 조판 (이것이 이 슬라이드의 시각자료):

| Model | Initial state | Update rule | Output rule | Cost |
|---|---|---|---|---|
| Naive RNN | $s_0 = \mathrm{vector}()$ | $s_t = \sigma(\theta_{ss} s_{t-1} + \theta_{sx} x_t)$ | $z_t = \theta_{zs} s_t + \theta_{zx} x_t$ | $O(1)$ |
| Self-attention | $s_0 = \mathrm{list}()$ | $s_t = s_{t-1}.\mathrm{append}(k_t, v_t)$ | $z_t = V_t\,\mathrm{softmax}(K_t^\top q_t)$ | $O(t)$ |
| **TTT** | $W_0 = f.\mathrm{params}()$ | $W_t = W_{t-1} - \eta \nabla \ell(W_{t-1}; x_t)$ | $z_t = f(Q_t; W_t)$ | $O(1)$ |

- Self-attention keeps every $K, V$ explicitly ⇒ per-token read cost **grows with context**.
- RNN and TTT both compress a growing context into a **fixed-size state** — but TTT's state is a **nonlinear network**, a more expressive compressor.
- **Store explicitly, compare at read time** (attention) vs **compress at write time, query the weights at read time** (TTT).

---

### S8. What the fast weights actually store

- Take a **linear** fast model $f_W(x) = Wx$. The update becomes
  $$W_t = W_{t-1} + \underbrace{\eta V_t K_t^\top}_{\text{write term}} - \underbrace{\eta (W_{t-1} K_t) K_t^\top}_{\text{correction term}}$$
- **Write term alone** accumulates to $W_t \approx W_0 + \eta \sum_{i=1}^{t} V_i K_i^\top$ — a growing history $\{(K_i, V_i)\}$ compressed into a fixed-size $W_t$. This is exactly the **outer-product memory** of linear attention: $z_t = \left(\sum_i V_i K_i^\top\right) Q_t$.
- **Correction term** subtracts what the memory already predicts, so only the **prediction residual** $V_t - W_{t-1}K_t$ is written — new information only, not redundant re-writes.
- ⇒ **Gradient-based TTT = fast-weight memory + state-dependent error correction.**
- The paper uses a **nonlinear two-layer MLP** fast model; the ablation shows why (S20).
- 시각자료: **Diagram F** (§6).

---

### S9. RoboTTT architecture

- Instantiated on **GR00T N1.7**: a **VLM backbone** + a **DiT action head**; a **TTT layer is added after the attention layers in each of the 16 DiT layers**.
- Division of labour: **attention operates within a timestep, TTT layers operate across timesteps.**
- DiT input over $T$ timesteps: $[R_1, \Phi_1, q_1, \tilde A_1, \ldots, R_T, \Phi_T, q_T, \tilde A_T]$
  - attention runs on $R_t, q_t, \tilde A_t$ and **cross-attends** to that timestep's VL tokens $\Phi_t$;
  - the per-timestep outputs are concatenated along time, $X = [R_1, q_1, \tilde A_1, \ldots, R_T, q_T, \tilde A_T]$, and passed through the TTT layers (Eq. 1 → Eq. 2).
- **Inference**: start from $W_0$, update fast weights on each observation, propagate forward. Action chunks generated with $k$-step denoising — **inference latency does not grow with context**.
- 시각자료: `model-arch.png` (Fig. 2).

---

### S10. Register tokens: what actually crosses time

- $\Phi_t$ is large — as many tokens as the VLM's image + language tokens. Passing it through TTT every step is too expensive.
- Instead, **$N = 16$ learned register tokens $R_t$** are prepended at each timestep and attend to all other tokens.
- They absorb the VL information inside the attention layer, and **only they (plus $q_t$, $\tilde A_t$) carry information across time** through the TTT layers.
- Ablation preview: register tokens give a further **+18%** — but only when paired with TTT (S20).
- 시각자료: **Diagram G** (§6).

---

### S11. $\tanh$ gating: don't break the pretrained model

- RoboTTT is **initialized from the pretrained GR00T N1.7 weights**; a freshly added TTT layer would otherwise corrupt them.
- Per DiT layer, learn $\alpha \in \mathbb{R}^d$ **initialized near zero (0.001)** and gate:
  $$O = \tanh(\alpha) \odot O_{\mathrm{TTT}} + O_{\mathrm{attn}} \quad (3)$$
- At the start of training $\tanh(\alpha) \approx 0$ ⇒ the model behaves like the pretrained backbone.
- As training proceeds the gate opens, so the model **learns how much memory to use** instead of being forced to use it.
- 시각자료: `gating.png` (Fig. 3).

---

### S12. Sequence training + sequence action forcing

- Train on trajectory sequences: run TTT in the inner loop, compute the outer flow-matching loss **at every timestep**, average:
  $$\mathcal{L}_{\mathrm{fm}}(\xi; W_0) = \frac{1}{T}\sum_{t=1}^{T} \ell_t(\xi_t, W_{t-1})$$
  This is what meta-learns $W_0$ and the projections $\theta_Q, \theta_K, \theta_V$.
- Each training sequence is a full trajectory or a **contiguous sub-trajectory** up to the maximum context length.
- **Sequence action forcing**: sample the flow-matching noise level **independently per action chunk**, $\tau_t = s(1-u)$, $u \sim \mathrm{Beta}(1.5, 1)$, $s = 0.999$.
  - Sharing one noise level across the sequence makes whole sequences uniformly easy or uniformly hard ⇒ **training is unstable**.
- 시각자료: **Diagram H** (§6).

---

### S13. TBPTT: long context under a fixed memory budget

- Full BPTT stores activations for every timestep ⇒ GPU memory grows with sequence length.
- **TBPTT**: split the sequence into segments; **gradients flow only within a segment and are detached at boundaries**, while the **fast weights are carried across boundaries** — so TTT itself continues over the entire sequence.
- ⇒ memory is set by **segment length**, not total sequence length ⇒ arbitrarily long training contexts.
- $W_0$ still gets gradients through the first segment, whose updates originate directly from it.
- 시각자료: `tbptt.svg` (Fig. 4).

---

### S14. Learning from context: mask the loss, keep the update

- Key flexibility: **decouple fast weight updates from slow weight updates.** Mask the flow-matching loss on selected timesteps ⇒ those timesteps are **pure context** — they update fast weights but provide **no imitation target**.
- **Imitation from in-context video demonstrations**: pair a human video sequence $\xi^{\mathrm{video}}$ with a robot trajectory $\xi^{\mathrm{robot}}$ of the same configuration and concatenate them into one training sequence.
  - the video updates fast weights only (its loss is masked);
  - the action loss is computed on the robot trajectory **conditioned on the updated fast weights**.
- At test time, a **single human video of an unseen configuration** yields one-shot imitation. The language prompt is identical across configurations ("assemble circuit"), so the target is identifiable **only from the video**.
- 시각자료: **Diagram I** (§6).

---

### S15. DAgger Distillation — failures as context, corrections as targets

- A DAgger rollout interleaves robot actions $A^{\mathrm{R}}_t$ and human corrections $A^{\mathrm{H}}_t$. **Standard DAgger fine-tunes on the corrections and discards the suboptimal robot actions.**
- But those actions are exactly what reveals *which failure each correction responds to*.
- **DAgger Distillation** uses both, asymmetrically: **fast weights update on the full interaction history**, while the **flow-matching loss is masked to the human corrections only**.
- ⇒ the human's **failure-to-correction mapping is distilled into the fast weights**. At test time the policy corrects itself online; its own corrections re-enter the history exactly as the human's did during training.
- Framed by the authors as **Algorithm Distillation** instantiated in robotics.
- 시각자료: `dagger-distillation.png` (Fig. 6).

---

### S16. Evaluation setup

- **YAM bimanual** setup, three long-horizon real-robot assembly tasks:
  - **Pup Go Car** — toy vehicle assembly, ~2-minute episodes, 8 h of data.
  - **Circuit** — target configuration given by a language prompt *or* a one-shot human video, ~1-minute episodes, 6 h.
  - **Gear Bot** — **ten stages, five minutes**, the longest-horizon task, 5 h.
- Baselines: **GR00T N1.7** (single-step context), **GR00T N1.7 Hist.** (short context), **GDN** (recurrent state, gated delta rule).
- Implementation: TTT layer in each of **16 DiT layers**, fast model = **two-layer MLP**; pretrain **30K steps on 16 NVIDIA GB200** GPUs (context length grown gradually up to 8K), post-train per task at **1K context for 20K steps on 8 GPUs**. Pretraining tunes only the new sequence-modeling layers and freezes the rest of GR00T N1.7; post-training fine-tunes all parameters.
- 시각자료: `tasks.png` (Fig. 5). 선택적으로 `task-pupgo.png` / `task-gearbot.png` / `task-circuit.png` 를 함께 사용.

---

### S17. Main results

- Average **task completion score 79%** — **+87%** over the single-step baseline GR00T N1.7 (42%) and **+41%** over the best baseline GDN (56%).
- On **Gear Bot** (five minutes, ten stages) RoboTTT is the **only** method with full successes.
- Qualitatively: tracks progress through **state aliasing**, performs **strategic recovery** when the drill misses the roof screw, and is more precise under occlusion.
- **History alone is not enough**: GR00T N1.7 Hist. **39.5%** vs GR00T N1.7 **57%** on Pup Go Car. GDN and RoboTTT both keep a fixed-size state — **the difference is the update rule.**
- 시각자료: `main-exp-results.svg` (Fig. 7). 함께 Table 1을 조판:

| Method (fully successful trials) | Pup Go Car | Circuit | Gear Bot |
|---|---|---|---|
| **RoboTTT** | **9 / 20** | **13 / 20** | **2 / 10** |
| GR00T N1.7 | 3 / 20 | 3 / 20 | 0 / 10 |
| GR00T N1.7 Hist. | 0 / 20 | 8 / 20 | 0 / 10 |
| GDN | 3 / 20 | 8 / 20 | 0 / 10 |

---

### S18. Context length is a new scaling axis

- Pretrain RoboTTT and GDN at context lengths from **128 timesteps to 8K** (≈ five minutes at 30 Hz control), then post-train and evaluate closed-loop.
- RoboTTT reaches **71.5% at 8K** — **+63%** over the same model pretrained at **1K (43.9%)** and **+57%** over the best short-context baseline GR00T N1.7 Hist. (45.6%), with **no sign of saturation**.
- **GDN shows no such trend.** The authors attribute this to the update rule: RoboTTT's fast weights are updated by gradient descent and its $W_0$ and update dynamics are **meta-learned**, which longer training sequences shape over more update steps; GDN's linear associative state admits no such meta-learning.
- Below 1K, RoboTTT stays competitive but falls short — the rollout horizon exceeds the training context.
- 시각자료: `ctx-scaling-results.svg` (Fig. 8).
- 발표자 노트: 이 논문이 "for the first time"이라고 주장하는 관찰. 발표의 클라이맥스.

---

### S19. New capability 1–2: one-shot imitation & perturbation robustness

- **One-shot imitation on Circuit** — condition on a single in-context human video of an **unseen** configuration:

| Method | Task completion score | Successful rollouts |
|---|---|---|
| **RoboTTT** | **65%** | **6 / 10** |
| GDN | 33% | 0 / 10 |

  GDN fails entirely — picking wrong components or assembling in the wrong order. Recurrent memory can *encode* context but struggles to *use* it.

- **Robustness to external perturbations** — a human removes the installed roof or a tire; successful recoveries out of 20:

| Method | Roof perturbation | Tire perturbation |
|---|---|---|
| **RoboTTT** | **15 / 20** | **18 / 20** |
| GDN | 13 / 20 | 18 / 20 |
| GR00T N1.7 | 10 / 20 | 11 / 20 |
| GR00T N1.7 Hist. | 3 / 20 | 5 / 20 |

- 시각자료: `oneshot-rollout.png` (Fig. 9), 위 표 2개와 함께.

---

### S20. New capability 3 + ablations

- **DAgger Distillation** on Pup Go Car, from a pool of 100 DAgger trajectories:
  - standard DAgger: **+9%** average across four methods (**+13%** on the two sequence models);
  - **DAgger Distillation: +33%** average — **+36% for RoboTTT**, +29% for GDN, **from the same data**.
  - Suboptimal robot actions are worthless as imitation targets (fine-tuning GR00T N1.7 on full trajectories = corrections alone, **57%** both) — their value is **as context**.
- **Ablations**:
  - removing **sequence action forcing** significantly hurts closed-loop performance;
  - **TTT Linear** beats the baseline but is **27% worse** than the MLP fast model ⇒ expressive nonlinear fast models matter;
  - roadmap: state tokens → **+ action tokens (+23%)** → **+ register tokens (+18%)**;
  - register tokens added to GR00T N1.7 alone **do not help** ⇒ they matter only paired with TTT's temporal modeling.
- 시각자료: `dagger-distillation-results.svg` (Fig. 10) + `ablation.svg` (Fig. 12). `recovery-rollout.png` (Fig. 11)도 함께 쓸 수 있음.

---

### S21. Takeaways & limitations

- **Make the recurrent state a network, not a vector.** TTT fast weights compress an 8K-timestep rollout at constant inference cost — the capability comes from the *update rule*, not just from having a fixed-size state (RoboTTT vs GDN).
- **Long context is not free — it has to be trained for.** Sequence action forcing + TBPTT are what make 8K-timestep training tractable and stable; gating is what keeps the pretrained backbone intact.
- **Context length is a scaling axis.** Closed-loop performance rises steadily from 128 to 8K with no saturation, and long-context capabilities emerge only once context is long enough.
- **Limitations**: long-context training cost; the TTT objective is still the generic $\lVert f_W(K) - V \rVert^2$ (a robotics-oriented objective is open); and it does not handle every deployment failure — combining with **reinforcement learning** to optimize task success directly is the authors' suggested next step.
- 시각자료: **Diagram J** (§6), 또는 `ctx-scaling-results.svg` 재등장.

---

## 6) 다이어그램 스펙 (직접 그릴 것)

figure가 없는 슬라이드용. **논문 결과 그림을 흉내 낸 가짜 플롯을 만들지 말 것** — 아래는 전부 개념도이며 실험 결과를 나타내지 않는다.

**Diagram A (S2) — the context gap.**
"visuomotor context length" 축 하나. 좌→우로 `1 step` · `2–8 steps` · `…` · `8K steps`. 왼쪽 두 구간을 묶어 "state of the art today", 맨 오른쪽에 "RoboTTT (this paper), 3 orders of magnitude". 축 아래 왼쪽 구간에만 실패 모드 3개를 붙인다: `State aliasing` / `Partial observability` / `No recovery`.

**Diagram B (S3) — four unlocks.**
2×2 그리드, 각 칸에 아이콘 + 한 줄. 칸 내용: `One-shot in-context imitation` (사람 아이콘 → 로봇 아이콘, 화살표 라벨 "1 video"), `On-the-fly improvement` (rollout 타임라인 위 ✗ 하나 뒤 ✓), `Perturbation robustness` (손이 부품을 빼는 그림 → 되돌아가는 화살표), `Long-horizon performance` (10칸짜리 스테이지 바).

**Diagram C (S4) — three ways to condition on history.**
좌→우 3개 열. 각 열: 이름 / state 표현 / cost 배지 / 한 줄 캡션.
1. `Concatenate frames` — 프레임 3장 스택 → policy. cost `fixed, small`. 캡션 "spurious correlations, temporally OOD".
2. `Full attention` — 길어지는 KV 캐시 막대 → policy. cost `O(t) decode`. 캡션 "prohibitive on-robot".
3. `RoboTTT — fast weights` — 단일 박스 `W_t` → policy, 그리고 `W_t`로 되돌아오는 self-loop 화살표에 "gradient step". cost `O(1)`. 캡션 "fixed-size, nonlinear, meta-learned".

**Diagram D (S5) — update then apply.**
좌→우 흐름. `x_t` → 세 갈래로 `K_t` / `V_t` / `Q_t`. `K_t`와 `V_t`는 아래쪽 박스 `L_FW = ||f_W(K_t) − V_t||²`로 들어가고, 거기서 위로 향하는 화살표(라벨 "one gradient step, η", **UPDATE**)가 중앙 박스 `W_{t−1} → W_t`를 친다. `Q_t`는 갱신된 `W_t` 박스로 들어가 오른쪽으로 `O_t`를 내보낸다(이 경로 라벨 **APPLY**). 왼쪽에서 `W_{t−1}`이 들어오고 오른쪽으로 `W_t`가 다음 타임스텝으로 나가는 가로 레일을 그려 recurrence를 보이게 할 것.

**Diagram E (S6) — slow vs fast.**
좌우 2단. 왼쪽 `Slow weights`: 목록 `θ_Q, θ_K, θ_V`, `W_0`, `η`, 하단에 `updated in training only · frozen at inference`. 오른쪽 `Fast weights`: `W_t`, 하단에 `updated every timestep · training AND inference`. 두 박스 사이에 화살표 "outer task loss meta-learns W_0 (gradients of gradients)". 오른쪽 박스 아래에 `s_t^RNN ↔ W_t^TTT`.

**Diagram F (S8) — write vs correction.**
가운데에 수식 한 줄 `W_t = W_{t−1} + η V_t K_tᵀ − η (W_{t−1} K_t) K_tᵀ`. 두 항 아래에 각각 브레이스와 라벨: 왼쪽 `write term → context compression` (옆에 `Σ V_i K_iᵀ`), 오른쪽 `correction term → write only the residual V_t − W_{t−1}K_t`. 하단에 대비 배너 2개: `Attention: store explicitly → compare at read time` vs `TTT: compress at write time → query the weights at read time`.

**Diagram G (S10) — register tokens carry the context.**
한 타임스텝 박스 안에 토큰 줄: 다수 토큰 무리 `Φ_t (VL tokens, many)` + `q_t` + `Ã_t` + 16칸 `R_t`. 박스 안쪽 화살표로 "attention (within timestep)" — `R_t`가 나머지 전부와 attend. 박스 밖으로 **오직** `R_t, q_t, Ã_t`만 오른쪽 다음 타임스텝 박스로 이어지는 레일(라벨 `TTT layers — across timesteps`)로 나가고, `Φ_t`는 박스 안에서 끊긴다(✕ 또는 점선 종단). 캡션: "Φ never crosses time — 16 register tokens carry it."

**Diagram H (S12) — sequence action forcing.**
위아래 두 줄 비교. 위 `Shared noise level`: 타임스텝 8칸이 전부 같은 진하기, 라벨 "uniformly hard" / "uniformly easy", 끝에 `unstable`. 아래 `Sequence action forcing`: 8칸이 제각각 다른 진하기, `τ_t ~ Beta(1.5,1)` 표기, 끝에 `stable`.

**Diagram I (S14) — masked loss, unmasked update.**
가로 시퀀스 레일 하나. 왼쪽 절반은 `human video ξ^video` (프레임 아이콘), 오른쪽 절반은 `robot trajectory ξ^robot`. 레일 **아래**에 모든 칸을 관통하는 화살표 `fast weight update — every timestep`. 레일 **위**에는 오른쪽 절반에만 붙는 화살표 `flow-matching loss`; 왼쪽 절반 위에는 `loss masked → pure context`. 우측 끝 캡션 "at test time: one human video → one-shot imitation". S15의 Fig. 6와 같은 시간축 방향을 쓸 것.

**Diagram J (S21) — one-line summary (선택).**
가로 3박스: `Long rollout history` → (화살표 `compress by gradient descent`) → `Fast weights W_t (fixed size)` → (화살표 `query`) → `Action chunk A_t`. 아래 캡션: "constant inference cost, 8K timesteps of context."

## 7) 지켜야 할 것

- **논문에 없는 수치·결과·주장 금지.** 이 brief의 숫자는 전부 논문 본문/표에서 그대로 옮긴 것이다. 새 숫자를 만들지 말고, 반올림하거나 "약 80%" 식으로 바꾸지도 말 것.
- **업로드된 figure는 원본 그대로 사용.** 논문 그림을 재현·재작성한 "가짜 결과 그림"을 만들지 말 것. §6의 diagram은 전부 개념도이며 결과를 나타내지 않는다.
- 각 figure 캡션에 원 논문 그림 번호를 표기 (`Fig. 2, Jiang et al. 2026`).
- 용어는 §3 Glossary만 사용. 특히 baseline 이름은 `GR00T N1.7`, `GR00T N1.7 Hist.`, `GDN` — 임의로 `GR00T`로 줄이지 말 것.
- 슬라이드 문구는 **전부 영어**. 한국어 병기 금지.
- 출력은 **HTML** (`index.html`).
