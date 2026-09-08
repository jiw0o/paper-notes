# Figures — RoboTTT: Context Scaling for Robot Policies (arXiv:2607.15275v1)

All files downloaded from `https://arxiv.org/html/2607.15275v1/`. Figure numbers are
the paper's. Nothing here is redrawn or altered.

| File | Paper ref | What it shows |
|---|---|---|
| `teaser.png` | Fig. 1 (uncaptioned) | Teaser / pull figure. |
| `model-arch.png` | Fig. 2 | RoboTTT model architecture, training, and inference. TTT layers are added after the attention layers in the DiT action head: attention operates within each timestep, while TTT layers operate across timesteps. Training uses a sequence flow-matching loss with sequence action forcing, sampling the noise level independently per action chunk. Inference starts from the learned initialization $W_0$, updating fast weights on each observation and propagating them forward. |
| `gating.png` | Fig. 3 | Computation flow with $\tanh$ gating. The TTT output is weighted by the learned gate $\tanh(\alpha)$ before being added to the attention output. |
| `tbptt.svg` | Fig. 4 | TBPTT. Gradients are truncated at segment boundaries; fast weights carry over, so TTT continues over the entire sequence. |
| `tasks.png` | Fig. 5 | Evaluation tasks. Three long-horizon assembly tasks on a YAM bimanual setup; each row is one rollout. Top Pup Go Car (2-min episodes), middle Circuit (1-min), bottom Gear Bot (ten stages, five minutes). |
| `dagger-distillation.png` | Fig. 6 | DAgger Distillation. During sequence training, all executed actions update the fast weights, but the flow-matching loss is computed only on human corrections. |
| `main-exp-results.svg` | Fig. 7 | Main evaluation: task completion scores on three assembly tasks. Rubric-based, percent; higher is better. |
| `ctx-scaling-results.svg` | Fig. 8 | Closed-loop performance scales with pretraining context length (128 to 8K timesteps). RoboTTT improves steadily with no sign of saturation; GDN does not benefit. |
| `oneshot-rollout.png` | Fig. 9 | One-shot imitation from an in-context human video. Human demonstrates an unseen configuration (frames 1-3), scene is reset (frame 4), RoboTTT reproduces the assembly (row 2). |
| `dagger-distillation-results.svg` | Fig. 10 | DAgger Distillation results on Pup Go Car, fine-tuning on a pool of 100 DAgger trajectories. |
| `recovery-rollout.png` | Fig. 11 | On-the-fly recovery learned through DAgger Distillation: RoboTTT misses the roof screw, re-attempts twice, then succeeds. |
| `ablation.svg` | Fig. 12 | Ablation on Pup Go Car: sequence action forcing, fast-model architecture (MLP vs. linear), and the component roadmap (state tokens, + action tokens, + register tokens). |
| `dataset-episode-len-dist.svg` | Fig. A.1 | Trajectory length distribution of the pretraining mixture. |
| `task-pupgo.png` | Fig. A.2 | The "Pup Go Car" task (screwing, drilling, bimanual handoffs, car flip). |
| `task-gearbot.png` | Fig. A.3 | The "Gear Bot" task (gears, wheels, two flips, robot head, remote drive). |
| `task-circuit.png` | Fig. A.4 | The "Circuit" task (two or three components on a board, power on). |

## Not available as images

Tables 1-3 are HTML tables in the paper, not figures. Their numbers are transcribed
into `../BRIEF.md` so the deck can typeset them natively.
