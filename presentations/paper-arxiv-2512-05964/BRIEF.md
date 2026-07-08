# Presentation Brief: Training-Time Action Conditioning for Efficient Real-Time Chunking

## 1) Paper Metadata
- **Title**: Training-Time Action Conditioning for Efficient Real-Time Chunking
- **Authors**: Kevin Black, Allen Z. Ren, Michael Equi, Sergey Levine
- **Venue / Year**: Preprint (arXiv), 2025
- **DOI**: arXiv:2512.05964
- **Link**: https://arxiv.org/abs/2512.05964
- **Thesis**: Instead of resolving action chunk boundaries via expensive backpropagation-based inpainting at inference time, we can simulate inference delay during training so the model directly learns to generate action postfixes conditioned on committed action prefixes—retaining asynchronous execution and continuity benefits while eliminating computational overhead.

## 2) Presentation Context
- **Audience**: Lab Group Meeting / Robotics Researchers.
- **Length**: 12 slides, ~12-15 minutes presentation.
- **Language**: English throughout (using exact paper terminology).
- **Goal**: Convince the audience that Training-Time RTC is a superior, highly practical drop-in replacement for standard Inference-Time RTC (Inpainting) in real-time robot execution systems, offering 20%+ latency reduction and higher robustness under delay.

## 2-bis) Glossary (Paper Terminology)
- **RTC (Real-Time Chunking)**: Real-time execution of action chunking flow policies.
- **Action Chunking**: Grouping multiple predicted actions into a temporal chunk.
- **Action Prefix**: Already committed/executed actions from the previous chunk.
- **Action Postfix**: Actions that remain to be generated for the current chunk.
- **Inference Delay ($d$)**: The duration between starting chunk generation and executing the new chunk.
- **Inference-Time RTC (Inpainting)**: Using backpropagation-based inpainting guidance at test-time to stitch chunks.
- **Training-Time RTC**: The proposed method that simulates delay during training via prefix conditioning.
- **Asynchronous Execution**: Overlapping background policy generation with foreground control execution.
- **Vector-Jacobian Product (VJP)**: Backpropagation-based gradient computation causing inference-time overhead.
- **Flow Matching**: The regression head / framework used to denoise actions.
- **Token-Wise Flow Matching Timesteps**: Allowing different flow-matching timesteps $\tau$ across action tokens.
- **adaLN-Zero**: Adaptive Layer Normalization with zero initialization, modified here for token-specific scale, shift, and gate.

## 3) Design & Aesthetic Direction
- **Format**: 16:9 widescreen, clean academic design.
- **Typography**: Serif titles (e.g., Playfair Display or Georgia) for academic prestige, Sans-serif body (e.g., Inter or Roboto) for high readability.
- **Color Palette**:
 - Main background: Clean off-white / light cream.
 - Text: Dark charcoal (high contrast, readable).
 - Accent Color: Emerald Green or Royal Blue (only one accent, used sparingly to highlight key concepts/lines).
- **Layout Rule**: Negative space is high. Every content slide contains exactly one visual asset (either an uploaded figure or a clearly specified diagram).
- **Content Density**: Max 3-5 bullets per slide, written as concise phrases. Absolutely no dense paragraphs.

## 4) Uploaded Visual Assets (in `assets/` folder)
- `fig01.png` — Figure 1: Timeline illustration of two overlapping action chunks showing the Action Prefix (red). Use on **S3 (Problem)** or **S8 (Inference Setup)**.
- `fig02.png` — Figure 2: Architecture diagram of prefix and postfix tokens going into the Diffusion Transformer. Use on **S6 (Architecture)**.
- `fig03.png` — Figure 3: Simulated results (Solve Rate vs. Inference Delay). Use on **S9 (Sim Experiments)**.
- `fig04.png` — Box Building task in real-world setup. Use on **S10 (Real-World Setup)**.
- `fig05.png` — Espresso Making task in real-world setup. Use on **S10 (Real-World Setup)**.
- `fig06.png` — Figure 5: Success rate and duration bar charts. Use on **S11 (Real-World Results)**.

---

## 5) Slide-by-Slide Outline

### S1. Title Slide
- **Title**: Training-Time Action Conditioning for Efficient Real-Time Chunking
- **Subtitle / Metadata**:
 - Kevin Black, Allen Z. Ren, Michael Equi, Sergey Levine
 - Preprint (arXiv) 2025
- **Visual**: A clean, elegant title card with ample negative space. A stylized, minimalist robot arm icon or a soft, subtle backdrop gradient.
- **Presenter Notes**: Welcome everyone. Today we are presenting "Training-Time Action Conditioning for Efficient Real-Time Chunking", which introduces a highly practical training recipe to make real-time robot control with action-chunking models significantly faster and more robust.

### S2. Background: Action Chunking & Inference Latency
- **Slide Title**: The Real-Time Challenge in Robot Control
- **Bullet Points**:
 - **Inference Latency**: Physical world continues to evolve while the Vision-Language-Action (VLA) policy processes observations and plans actions.
 - **Synchronous Execution**: The robot is forced to freeze/pause between chunks while waiting for the next inference, causing jerky, inefficient movements.
 - **Asynchronous Execution**: Runs policy inference in a background thread while executing the current chunk in the foreground—but chunk transitions become disjointed.
- **Visual (Diagram — Asynchronous Execution Timeline)**:
 - Horizontal timeline.
 - Row 1 (Control Thread): `[Execute Chunk 1 (Actions 1..8)]` ──────→ `[Execute Chunk 2 (Actions 9..16)]`
 - Row 2 (Inference Thread): `[Infer Chunk 2 (takes 100ms)]` ────→ `[Infer Chunk 3]`
 - Highlight the lag/delay $d$ between the end of previous execution and the arrival of the next chunk.
- **Presenter Notes**: In robot control, we deal with large VLA models which take substantial time to run. Standard execution is synchronous—the robot stops and waits for the model. Asynchronous execution is better because the robot keeps moving, but it introduces a gap or transition mismatch between successive action chunks, causing instability.

### S3. Problem: Chunk Boundary Discontinuity & Inference-Time RTC
- **Slide Title**: The Overhead of Inference-Time Stitching
- **Bullet Points**:
 - **Chunk-to-Chunk Discontinuity**: Boundary mismatch if the next chunk chooses a completely different execution path.
 - **Inference-Time RTC (Inpainting)**: Restricts action generation by matching the prefix of the new chunk to the already-committed actions of the previous chunk.
 - **The Computational Bottle-neck**: Requires backpropagation-based Gradient-Guidance (Vector-Jacobian Products) at *every denoising step* to perform inpainting, adding up to 30% latency.
- **Visual**: `fig01.png` (Overlapping Action Chunks illustration with prefix in red and postfix).
- **Presenter Notes**: To stitch these chunks seamlessly, the original Real-Time Chunking (RTC) paper used inference-time inpainting. It takes committed actions as a prefix and guides the diffusion process. However, this guidance requires a backpropagation-based Vector-Jacobian Product at *every single denoising step*. This computational overhead directly opposes our goal of making the control loop faster!

### S4. Core Idea: Training-Time RTC
- **Slide Title**: Moving the Latency Cost to Training Time
- **Bullet Points**:
 - **Shift the Burden**: Instead of correcting chunk boundaries at test time, let the model *directly learn* prefix-conditioned generation.
 - **Simulate the Delay**: During training, we randomly simulate inference delays and force the model to predict only the postfix given the prefix.
 - **Drop-In Replacement**: Retains the full benefits of asynchronous control and boundary continuity with **zero** inference-time inpainting overhead.
- **Visual (Diagram — Inference-Time vs. Training-Time RTC)**:
 - Two columns.
 - Left Column (Inference-Time RTC):
   - `[Test-Time Guidance]` → `[Repeated VJPs / Backprop]` → `[High Latency Cost (+20-30%)]`
 - Right Column (Proposed Training-Time RTC):
   - `[Simulate Delays in Training]` → `[Forward-Only Test-Time Inference]` → `[Zero Overhead / Drop-In Replacement]`
- **Presenter Notes**: The core idea is simple yet powerful: why pay the heavy mathematical cost of inpainting at runtime? Instead, we can shift this cost entirely to the training phase. By simulating delays during training, the model naturally learns how to continue a given prefix, allowing us to perform simple, forward-only generation at test time.

### S5. Formulation: Conditional Action Generation
- **Slide Title**: Mathematical Formulation
- **Bullet Points**:
 - **Standard Policy Objective**:
   - Learns the joint distribution over the full horizon $H$:
   - $$p(A_{t:t+H} \mid o_t)$$
 - **Training-Time RTC Objective**:
   - Learns the conditional distribution of postfix actions $A_{t+d:t+H}$ given observation $o_t$ and prefix actions $A_{t:t+d}$:
   - $$p(A_{t+d:t+H} \mid o_t, A_{t:t+d})$$
 - **Variable Delay**: The delay $d$ is randomly sampled during training to ensure robustness to fluctuating real-world latencies.
- **Presenter Notes**: Mathematically, instead of learning the joint probability of the entire action chunk given an observation, we train the policy to model the conditional distribution of the remaining postfix actions given both the observation and the already committed prefix. Since real-world latency fluctuates, we randomly sample the prefix delay $d$ during training.

### S6. Architecture: Token-Wise Timestep Conditioning
- **Slide Title**: Designing the Conditioning Network
- **Bullet Points**:
 - **The Timestep Mismatch**: Traditional Flow Matching uses a single global denoising timestep $\tau$ for all tokens in a batch.
 - **Token-Wise Flow Matching**:
   - **Prefix Tokens**: Set to $\tau = 1.0$ (fully clean, ground-truth).
   - **Postfix Tokens**: Set to standard sampled $\tau \in [0, 1]$ (noisy, learning to denoise).
 - **adaLN-Zero Modification**: Diffusion Transformer blocks are adapted to apply token-specific scale, shift, and gate.
- **Visual**: `fig02.png` (Conditioning architecture with prefix/postfix and token-wise timesteps).
- **Presenter Notes**: To implement this in a Diffusion Transformer, we encounter a challenge: standard flow matching assumes a single timestep for the entire batch. But here, the prefix tokens are fully clean—which corresponds to timestep 1.0—while postfix tokens are noisy. To handle this, the authors introduce token-wise flow matching timesteps and adapt the adaLN-Zero layer in the DiT to apply token-specific conditioning.

### S7. Training Recipe: Prefix Conditioning
- **Slide Title**: Step-by-Step Training Recipe
- **Bullet Points**:
 - **1. Delay Sampling**: For each training batch, sample delay $d$ from a realistic distribution (e.g., $d \in [0, d_{max}]$).
 - **2. Prefix Placement**: Set the first $d$ tokens to ground-truth actions and assign flow matching timestep $\tau = 1.0$.
 - **3. Postfix Placement**: Fill the remaining $H - d$ tokens with noisy actions at standard sampled timesteps.
 - **4. Masked Loss**: Compute the loss **only** on the postfix tokens, leaving the prefix untouched.
- **Visual (Diagram — Training Input Layout)**:
 - Horizontal block of tokens.
 - Tokens $0$ to $d-1$ (Prefix): `[ GT Action ] [ GT Action ] ...` → Timestep $\tau = 1.0$ (No Loss).
 - Tokens $d$ to $H-1$ (Postfix): `[ Noisy Action ] [ Noisy Action ] ...` → Timestep $\tau \in [0, 1]$ (Compute Flow Matching Loss).
- **Presenter Notes**: Let's look at the training recipe. First, we sample a delay $d$. We set the first $d$ action tokens to the ground-truth trajectory with timestep 1.0. The rest of the tokens are noisy postfix tokens. Crucially, the training loss is only calculated on the postfix tokens. This forces the model to learn to generate a seamless postfix that extends the ground-truth prefix perfectly.

### S8. Test-Time Inference
- **Slide Title**: Executing Training-Time RTC at Inference
- **Bullet Points**:
 - **Control Loop (Foreground)**: Continuously sends committed actions to the robot arm at 50 Hz.
 - **Background Inference Loop**:
   - Predicts the next inference delay $d$ using a running queue of recent latencies.
   - Gathers committed actions $A_{prev}[s:s+d]$ to use as the Prefix.
   - Feeds the Prefix and $o_t$ into the network to generate the Postfix chunk.
 - **Seamless Handover**: The new postfix is appended exactly where the robot will be when generation finishes.
- **Presenter Notes**: At test-time, the robot executes actions in the foreground control loop while the background loop generates the next chunk. We track execution times in a queue to predict the delay $d$. We grab the next $d$ committed actions, feed them as a prefix, and get the postfix. This guarantees that when the model finishes computing, the new action postfix aligns perfectly with where the robot actually is.

### S9. Simulation Experiments: Delay Robustness
- **Slide Title**: Simulation Results (Dynamic Kinetix)
- **Bullet Points**:
 - **Evaluation Setup**: Tested on the Dynamic Kinetix benchmark with a prediction horizon of $H = 8$, varying the delay $d$ from 0 to 4.
 - **Low Delay Regime ($d \le 1$)**: Training-Time RTC achieves comparable solve rates to Inference-Time RTC (Inpainting).
 - **High Delay Regime ($d \ge 2$)**: Training-Time RTC **outperforms** Inference-Time RTC.
 - **Why?** At long delays, test-time inpainting struggle to fit high-dimension constraints post-hoc, while our model is trained directly to generate conditioned trajectories.
- **Visual**: `fig03.png` (Solve Rate vs. Inference Delay graph).
- **Presenter Notes**: In simulation, the authors compared Training-Time RTC with Inference-Time RTC and a naive asynchronous baseline. At low delays, both RTC methods perform similarly. But at delays of 2 or higher, Training-Time RTC significantly outperforms Inference-Time RTC. This is because test-time inpainting struggles to reconcile hard constraints on long prefixes, whereas our model has natively learned to do so.

### S10. Real-World Robot Setup
- **Slide Title**: Real-World Evaluation
- **Bullet Points**:
 - **Base VLA**: $\pi_{0.6}$ base model running with a 50 Hz control loop.
 - **Maximum Latency Target**: Max 200 ms latency ($d = 10$ steps) supported by training with $d \sim \text{Uniform}(0, 10)$.
 - **Tasks**:
   - **Box Building**: High-precision contact-rich task.
   - **Espresso Making**: Complex sequencing task.
- **Visual**: `fig04.png` (Box Building image) and `fig05.png` (Espresso Making image) side-by-side.
- **Presenter Notes**: For real-world validation, they fine-tuned the $\pi_{0.6}$ policy. They targeted up to 200 ms of real-world latency by training with delays sampled uniformly up to 10 steps. They evaluated on two challenging, contact-rich tasks: box building and espresso making.

### S11. Real-World Results: Latency & Speed
- **Slide Title**: Real-World Success & Execution Latency
- **Bullet Points**:
 - **Success Rate**: Training-Time RTC achieves identical success rates to Inference-Time RTC in both tasks.
 - **Execution Time**: Both RTC methods are significantly faster than the Synchronous baseline.
 - **End-to-End Control Latency**:
   - **Training-Time RTC: 108 ms** (20% reduction!)
   - **Inference-Time RTC: 135 ms**
 - Eliminates costly backpropagation-based test-time guidance.
- **Visual**: `fig06.png` (Success Rate and Duration charts).
- **Presenter Notes**: Here are the real-world results. First, in terms of success rate, Training-Time RTC matches the high performance of Inference-Time RTC while being dramatically faster than the synchronous baseline. More importantly, Training-Time RTC drops the average end-to-end latency from 135 ms down to 108 ms—a 20% latency reduction. It achieves this by entirely avoiding the backward pass during inference.

### S12. Summary & Takeaways
- **Slide Title**: Summary: A Fast & Practical Drop-In Recipe
- **Bullet Points**:
 - **Eliminated Test-Time Overhead**: Shifting prefix conditioning to training time removes expensive backprop calculations, reducing latency by 20%.
 - **Robust Under High Delay**: Simulating delays during training makes the model highly resilient to latency spikes in simulation.
 - **Highly Practical**: Act as a **training-recipe / drop-in replacement** for any flow-matching or diffusion action-chunking policy.
 - **Limitations**: Restricted to hard prefix boundaries; requires a pre-defined delay distribution during training.
- **Presenter Notes**: In summary, Training-Time RTC is an elegant and highly practical training recipe. By shifting the prefix conditioning from inference to training, we get a 20% control latency reduction with zero loss in success rate. It's a drop-in replacement for any flow-matching or diffusion-based VLA. Thank you, and I'm happy to take any questions!

---

## 6) Detail Diagram Specifications (to be rendered by Claude Design)

### Diagram 1 (Slide 2: Asynchronous Control Loop)
- **Concept**: Visualizing why delay $d$ occurs.
- **Layout**: Horizontal flowchart.
- **Nodes**:
 - `[Camera/Sensor (t)]` --(sends frame)--> `[VLA Inference]` --(takes ~100ms)--> `[Compute Chunk]`
 - Below: `[Robot Executing Previous Actions]` --(meanwhile)--> `[Current Time t+d reached]`
 - Point out that by the time the VLA finishes, the robot state has moved from $t$ to $t+d$.

### Diagram 2 (Slide 4: Comparison of RTC Strategies)
- **Concept**: Simple side-by-side architecture comparison.
- **Left (Inference-Time RTC)**:
 - `[Input o_t]` → `[Standard Model]` → `[Action Chunk]` → `[Test-Time Inpainting Guidance (Backprop)]` → `[Final Chunk (Slow)]`
- **Right (Training-Time RTC)**:
 - `[Input o_t + Prefix A_prev]` → `[Conditioned Model]` → `[Final Chunk (Fast, Forward-Only)]`

### Diagram 3 (Slide 7: Training Input Token Layout)
- **Concept**: Detailed token-by-token visualization for training.
- **Visual representation**:
 - $H$ sequential blocks labeled $0$ to $H-1$.
 - First $d$ blocks: Colored green, labeled "Prefix Tokens (Ground Truth)", Timestep $\tau = 1.0$, "No Loss Computed".
 - Remaining $H-d$ blocks: Colored yellow/orange, labeled "Postfix Tokens (Noisy Actions)", Timestep $\tau \sim \text{Uniform}(0, 1)$, "Calculate Flow Matching Loss".

---

## 7) Crucial Guardrails & Constraints
- **Do not invent any data or numbers**: All percentages, delays, benchmarks, and task names must strictly match the extracted paper notes.
- **Strictly English**: Even though the notes-snapshot/paper-notes-data is in Korean/English, the output slide text in the presentation must be 100% professional academic English.
- **Source Citations**: Ensure that any image captioned contains the proper figure number as extracted from the original paper HTML (e.g., "Figure 1", "Figure 2", "Figure 5").
- **HTML Export Target**: Specify that the final delivered deck must be compatible with iframe embedding (e.g., `index.html` referencing assets via relative paths).


