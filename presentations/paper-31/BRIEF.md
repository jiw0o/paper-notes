# 발표자료 생성 요청: Real-Time Chunking (RTC) — **NeurIPS 2025 (Regenerated)**

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
- 타이포: 제목 serif, 본문 sans, accent 1개(warm red). bullet 짧은 구, 문단 금지. 수식은 필요할 때 크게.
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
- 시각자료: `fig03.png`.

### S9. Soft masking vs hard masking
- Hard masking은 frozen region 경계 부근을 매끄럽게 잇지 못하고 급격한 방향 전환을 만듦.
- Soft masking은 gradual transition으로 continuity 보장 및 trajectory 품질 향상.
- 시각자료: `fig04.png`.

--- Experiment & Result (노트 # Experiment & Result) ---

### S10. Simulated evaluation on Kinetix
- Kinetix 12-task benchmark에서 naive async, synchronous, TE, BID와 비교 평가.
- RTC와 BID만 빠른 업데이트의 이점(작은 \(s\)에서 높은 성능)을 온전히 활용.
- 시각자료: `fig05a_exechorizon.png`.

### S11. Performance under high latency
- 다양한 inference delay (\(d\)) 조건에서 solve rate 측정.
- RTC가 모든 baseline을 능가하며, 지연이 커질수록 성능 우위 확대. Soft masking이 성능 향상에 크게 기여.
- 시각자료: `fig05b_delay.png`.

### S12. Soft masking schedule ablation
- 다양한 \(W\) 감쇄 schedule(exponential, linear 등) 중 **exponential decay**가 가장 좋은 성능을 보임.
- 단순 오버라이트 방식의 Diffuser inpainting baseline 대비 guidance 기반 방식의 우수성 입증.
- 시각자료: `fig08.png`.

### S13. Real-world physical execution
- Bimanual manipulation 및 match-lighting 등 dynamic task에서 실시간성 검증.
- Naive async/TE는 지연 상황에서 protective stop 유발; RTC는 고지연에서도 안정적인 완주율을 기록.
- 시각자료: `fig06b_throughput.png`.

### S14. Quantitative progress & throughput
- 시간 경과에 따른 태스크 누적 진행도(progress)와 평균 처리량(throughput) 비교.
- RTC가 baseline 대비 월등히 높은 throughput과 압도적인 주행 안정성을 보여줌.
- 시각자료: `fig06.png`.

### S15. Discussion & Summary
- **Training-free, zero-shot smooth asynchronous execution**의 성공적인 제안.
- Limitations: Denoising step마다 backpropagation 연산 오버헤드($\Pi$GDM)가 존재.
- Future work: Training-time에서 딜레이를 시뮬레이션하여 학습하는 방향성 제시.
- 시각자료: `fig01b_curves.png`.

---

## 6) 다이어그램 스펙(직접 그릴 것)

### D1. Latency Timeline (S2)
- 가로축: Time $t$.
- 위쪽 Line [Controller]: $o_t$ 관측 ➔ Action 실행 $A_{prev}$ ➔ 새 Action $A_{next}$ 수신 및 즉시 실행.
- 아래쪽 Line [VLA Server]: $o_t$ 수신 ➔ **Thinking (Inference Delay $d$)** ➔ 새 Chunk $A_{next}$ 완성하여 Controller로 송신.
- **주석**: "During the inference delay $d$, the physical world continues to move."

### D2. Three Execution Strategies (S5)
- **Synchronous**: [Run s steps] ➔ [Pause & Wait for next chunk] ➔ [Run next s steps]. (계단식 타임라인)
- **Naive Asynchronous**: [Run continuous] ➔ [Switch to next chunk instantly] (경계면에 뾰족한 Acceleration Spike 표시).
- **Temporal Ensemble (TE)**: [Run continuous with weighted average of overlapping chunks] (부드럽지만 optimal trajectory에서 이탈).

### D3. Inpainting Target (S6)
- 가로축: Action sequence index.
- 0부터 $d-1$ 영역: **Frozen Region** (이미 실행되었거나 실행이 보장된 영역, Target $Y$와 일치하도록 고정).
- $d$부터 $H-1$ 영역: **Freshly Generated Region** (Denoising을 통해 새로 생성될 영역).
- 화살표: Frozen region의 마지막 action $A_{d-1}$과 새 chunk의 시작 부분이 매끄럽게 연결되는 흐름.

---

## 7) 지켜야 할 것
- 논문/노트에 **없는 수치·결과·주장 금지**. 불확실하면 비워 두고 표시.
- 용어는 원어 유지. 캡션 출처는 해당 figure의 원 논문 그림 번호를 따른다.


