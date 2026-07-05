# 발표자료 생성 요청: Real-Time Chunking (RTC) — **v4 (note-centric)**

> **구성 원칙:**
> - **논리 전개는 노트(paper-notes) 구조를 그대로 따른다.** 노트에 정리된 디테일(수식·하위 항목·분류)은 **다 포함**.
> - Title 다음 **배경 → 문제 → 해결책** 3장으로 high-level 종료. **해결책 슬라이드 = 논문의 contribution.**
> - **실험 슬라이드는 "결과 → 결론"만.** figure가 근거. 아래 금지사항 엄수:
>   - ❌ legend 설명(색이 무엇인지 나열) ❌ "Also…" 같은 군더더기 접두어 ❌ benchmark/setup 설명.
>   - ✅ 딱 두 줄: **결과**(이 그림이 보여주는 것) → **결론**(그래서 무슨 의미).
> - **제목은 짧고 실질적으로.** 군더더기·수식어 없는 명료한 제목.
> - **논문 figure를 웬만하면 다 활용**(원 역할·번호 보존, 캡션에 Figure 번호). 노트는 서사·디테일의 출처.
> - 맨 끝 **Discussion 1장**(핵심 통찰 + limitations). 한 슬라이드 = 한 메시지.

## 1) 논문
- 제목: **Real-Time Execution of Action Chunking Flow Policies** · Kevin Black, Manuel Y. Galliker, Sergey Levine · **NeurIPS 2025** · arXiv:2506.07339
- 링크: https://arxiv.org/abs/2506.07339

## 2) 발표 맥락
- 청중: 랩 그룹 미팅(robot learning / VLA). 길이: 슬라이드 **약 15장**, ~15분.
- 언어: **English throughout.** 아래 Glossary의 논문 원어만 사용(노트 역번역 금지).

## 2-bis) Glossary (paper terminology)
- Real-Time Chunking (**RTC**) · asynchronous / synchronous / naive asynchronous execution
- chunk-to-chunk discontinuity / **bifurcation** · **temporal ensembling (TE)** · **BID** (Bidirectional Decoding)
- inpainting · **freezing** actions guaranteed to execute · flow matching (\(v_\pi\)) · **ΠGDM** guidance · weighted target error · **guidance weight clipping** \(\beta\)
- **soft masking** / **hard masking** · **frozen** / **intermediate** / **freshly generated** region · guidance weight \(W\)
- controller loop / background loop · minimum execution horizon \(s_{\min}\) · inference delay \(d\) · execution horizon \(s\) · prediction horizon \(H\) · feasibility \(d\le s\le H-d\)
- **Kinetix** · bimanual manipulation · \(\pi_{0.5}\) · throughput · protective stop · out-of-distribution (OOD)

## 3) 디자인 방향
- 16:9, clean academic, 여백 넉넉, **슬라이드당 시각자료 1개**, 한 슬라이드 한 메시지.
- **논문 figure 우선**(크게, 캡션 "Figure N"). diagram은 figure 없는 개념 슬라이드에만.
- 제목 serif, 본문 sans, accent 1개(warm red). bullet 짧은 구, 문단 금지. 수식은 필요할 때 크게.
- 출력: **HTML export**, index.html.

## 4) 업로드한 시각자료 (assets/) — 논문 원본 figure (최대한 활용)
> **사용 금지**: `fig05.jpg`(썸네일), `fig09.png`(마스코트).
- `fig01.jpg` — Figure 1 (top) 성냥 켜는 dynamic task. → S1 Title.
- `fig01b_curves.png` — Figure 1 (bottom) position/velocity/**acceleration**(RTC 초록 smooth vs Sync 빨강 spike). → S4 해결책 / S15 Discussion.
- `fig02.png` — Figure 2 chunk 간 **bifurcation**. → S3 문제.
- `fig03.png` — Figure 3 guidance weight 3구간(frozen/intermediate/fresh). **핵심.** → S9 soft masking.
- `fig04.png` — Figure 4 hard vs soft masking trajectory. → S10.
- `fig05b_delay.png` — Figure 5 solve rate vs **inference delay**(12 env+avg). → S12 sim.
- `fig05a_exechorizon.png` — Figure 5 avg solve rate vs **execution horizon**. → S13.
- `fig08.png` — Figure 8/appendix soft-masking **schedule ablation**(exp decay 최고). → S14.
- `fig08b_diffuser.png` — Figure 8 Diffuser inpainting 비교. → S14 보조(옵션).
- `fig06b_throughput.png` — Figure 6 injected delay vs **throughput**. → S16 real.
- `fig06.png` — Figure 6 (top) per-task cumulative progress. → S17.
- `fig07.png` — Figure 7 guidance clipping \(\beta\) 분석. → S8 ΠGDM.
- `fig07b_beta_ablation.png` — Figure 7 \(\beta\) ablation. → S8 보조(옵션).

## 5) 슬라이드 구성 — **노트 흐름 그대로**

### S1. Title
- 제목·저자·NeurIPS 2025 (arXiv:2506.07339). 시각자료: `fig01.jpg`.

--- Overview: 배경 → 문제 → 해결책 (노트 # Overview) ---

### S2. Inference latency in real-time control  *(배경)*
- Policy가 "생각"하는 동안에도 physical world는 계속 변한다.
- Observation → action → controller 전달까지 **latency** 발생 → real-time control 성능 저하.
- Action chunking은 temporally consistent action을 주지만 **latency 자체는 못 없앤다.**
- 시각자료: **Diagram — latency timeline (D1)**.

### S3. Discontinuity at chunk boundaries  *(문제)*
- 새 chunk가 이전과 다른 strategy를 고르면 chunk 경계에서 **discontinuity(bifurcation)**.
- Naive async는 OOD state·acceleration spike 유발.
- 시각자료: `fig02.png`.

### S4. Real-Time Chunking (RTC)  *(해결책 = contribution)*
- 다음 chunk를 현재 chunk 실행과 **병렬 생성**(asynchronous).
- inference 동안 확정 실행될 action은 **freeze**, 나머지는 이전 chunk로 **inpaint**해 continuity 유지.
- **Training-free** — 어떤 diffusion/flow VLA에도 그대로. (+ Kinetix 12-task benchmark, throughput 대폭 향상 입증.)
- 시각자료: `fig01b_curves.png`.

--- 기존 Action Chunk 실행 방식 (노트 # 기존 Action Chunk 실행 방식) ---

### S5. How action chunks are executed
- **Synchronous**: \(s\)개 실행 후 다음 chunk까지 정지 → position-control은 position hold, force-control은 그 개념도 없음.
- **Naive asynchronous**: 실행 중 다음 chunk 생성 → 경계 discontinuity에 크게 취약(OOD, accel spike).
- **Temporal ensemble (TE)**: overlap action 평균 → jerkiness↓지만 optimal은 아님.
- 시각자료: **Diagram — three execution strategies (D2)**.

--- Method (노트 # Method) ---

### S6. Inpainting via flow matching
- Flow matching update: \(A_t^{\tau+1/n}=A_t^\tau+\tfrac1n v_\pi(A_t^\tau,o_t,\tau)\) (\(n\)=denoising steps, \(\tau\in[0,1]\)).
- 예측 clean chunk: \(\hat A_t^1 = A_t^\tau+(1-\tau)v(A_t^\tau,o_t,\tau)\); overlap(이전 chunk)=inpainting target \(Y\).
- 시각자료: **Diagram — inpainting target (D3)** (known \(Y\) 고정 / 나머지 생성).

### S7. Training-free guidance (ΠGDM)
- Velocity field에 gradient-based **guidance term** 추가:
$$v_{\Pi\mathrm{GDM}} = v + \min\!\Big(\beta,\ \tfrac{1-\tau}{\tau r_\tau^2}\Big)(Y-\hat A_t^1)^\top\mathrm{diag}(W)\tfrac{\partial \hat A_t^1}{\partial A_t^\tau}$$
- **Weighted target error** \(\mathcal L_{\text{guide}}=\tfrac12\lVert W^{1/2}(\hat A_t^1-Y)\rVert^2\) 에 대한 descent; \(r_\tau^2=\tfrac{(1-\tau)^2}{\tau^2+(1-\tau)^2}\).
- **Guidance clipping**: upper bound \(\beta\)로 과도한 guidance 제한(\(\tau=0\)에서 finite).
- 시각자료: `fig07.png` (clipping curve + β).

### S8. Soft masking — frozen / intermediate / fresh
- Hard masking의 한계: 앞 \(d\)개만 강제 → 나머지는 자유 생성.
- Soft masking: guidance weight \(W\)로 3구간 — **frozen**(\(i<d\), weight 1) / **intermediate**(\(d\le i<H-s\), **exponential decay**) / **freshly generated**(0).
- 가까운 미래는 강하게, 먼 미래는 약하게 맞춤.
- 시각자료: `fig03.png` (**핵심**).

### S9. Soft vs. hard masking
- Hard masking은 frozen region를 잘 못 맞추고 방향 변화가 급함; soft masking은 매끄럽게 추종.
- 시각자료: `fig04.png`.

### S10. The RTC algorithm
- **Controller loop**: 매 control step \(A_\mathrm{cur}\)에서 action 실행 + 최신 obs 저장, 절대 멈추지 않음.
- **Background loop**: \(t>s_{\min}\) 대기 → 실행된 수 \(s\) 기록(\(A_\mathrm{prev}=A_\mathrm{cur}[s{:}H]\)) → delay history \(Q\)로 \(d=\max(Q)\) 예측 → RTC generation([0,d) full / [d,H−s) exp decay / rest fresh) → \(t-s\)번째 action부터 교체.
- **Feasibility**: \(d\le s\le H-d\); 설정 \(H\ge 2d_{\max}\), \(s_{\min}\le H-d_{\max}\).
- 시각자료: **Diagram — controller ∥ background timeline (D4)**.

--- Experiments (노트 # Experiments) — 결과 → 결론만 ---

### S12. Simulation
- **결과**: inference delay가 커질수록 baseline은 급락, RTC는 solve rate 유지(TE가 가장 빨리 붕괴).
- **결론**: RTC는 **delay가 클수록 강점이 뚜렷한 delay-robust** 방법이다.
- 시각자료: `fig05b_delay.png`.

### S13. Simulation — execution horizon
- **결과**: execution horizon \(s\)가 작을수록 solve rate↑ — RTC·BID만 이 이득을 취함.
- **결론**: RTC는 continuity를 유지해 **짧은 horizon의 reactivity를 살린다.**
- 시각자료: `fig05a_exechorizon.png`.

### S14. Simulation — soft-masking schedule
- **결과**: exponential decay가 최고(linear 근접), no decay/hard masking은 낮음.
- **결론**: continuity의 이득은 **soft(점진) masking**에서 나온다.
- 시각자료: `fig08.png`.

### S16. Real-world bimanual (\(\pi_{0.5}\))
- **결과**: injected latency가 늘어도 RTC throughput 유지 — Synchronous는 선형 저하, TE는 +100/+200ms에서 protective stop으로 0.
- **결론**: RTC는 **실제 로봇에서 latency에 강건하게 throughput을 지킨다.**
- 시각자료: `fig06b_throughput.png`.

### S17. Real-world — per-task
- **결과**: retry 가능한 task는 최종 점수 근접하나 RTC가 더 빨리 progress; precision-sensitive task는 RTC smoothness가 성능으로 직결.
- **결론**: RTC의 이득은 **정밀·비가역 task에서 특히 크다.**
- 시각자료: `fig06.png`.

--- Summarize (노트 # Summarize) ---

### S18. Discussion
- 핵심 통찰: RTC는 inference를 빠르게 만드는 게 **아니라**(자체 latency는 오히려 약간↑) 실행과 inference를 **병렬화**하고 inpainting으로 **경계 continuity**를 유지하는 것.
- Training-free라 diffusion/flow VLA에 바로 적용; sim·real 모두 delay-robust.
- Limitations: 추가 연산 비용, diffusion/flow 계열 전제.
- 시각자료: `fig01b_curves.png` 또는 `fig01.jpg`.

> 슬라이드 번호는 편의상 표기(중간 결번 무시). 최종은 순서대로 재번호.

## 6) 다이어그램 스펙 (figure 없는 개념 슬라이드에만)
**D1 — Latency timeline (S2).** 좌→우 시간축. `[Observe o_t]` → 박스 `Policy inference`(폭=delay d) → `[Emit action]`. inference 구간 위 붉은 음영 "world has moved". 캡션 "action is stale by delay d."

**D2 — Three execution strategies (S5).** 3행 타임라인. Synchronous: chunk1 후 회색 pause gap → chunk2("pauses"). Naive async: 경계에 빨간 수직 점프("OOD jump"). Temporal ensembling: overlap 점선 평균선("averaged → poor"). 좌측 행 이름, 문제점만 accent.

**D3 — Inpainting target (S6).** 새 chunk 셀 배열: 앞 = `known (Y, prev chunk)` 채움, 뒤 = `generate`. 캡션 "freeze what's guaranteed, inpaint the rest."

**D4 — Controller ∥ background timeline (S10).** 시간축 하나에 두 트랙. Controller: 매 스텝 action 소비(작은 박스), "never pauses". Background: `wait t>s_min`→`record s`→`predict d=max(Q)`→`RTC generation`→`swap @ action t−s`. 하단 구간 라벨 `[0,d) full` / `[d,H−s) exp decay` / `[H−s,H) fresh`, 캡션 `d ≤ s ≤ H−d`.

## 7) 지켜야 할 것
- 논리 전개는 노트 구조, 노트 디테일 다 포함. 실험은 **결과→결론 두 줄**(legend/also/setup 설명 금지).
- 제목은 짧고 실질적으로. 논문/노트에 **없는 수치·주장 금지**. 기호(d,s,H,τ,β,W)는 논문 표기.
- 논문 figure 최대한 활용, 번호 보존. `fig05.jpg`/`fig09.png` 금지.
