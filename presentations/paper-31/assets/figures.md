# Figures for 2506.07339

Source: https://arxiv.org/html/2506.07339

## fig01.jpg
- caption: Figure 1 : Top: Real-time chunking (RTC) enables the robot to perform highly dexterous and dynamic tasks, such as lighting a match—even in the presence of inference delays in excess of 300 milliseconds, corresponding to more than 30% of the model’s prediction horizon. Bottom: RTC performs the same robot motion 20% faster than synchronous inference [ 5 , 30 , 8 , 24 , 31 , 59 ] , and smoother than all competing methods, including temporal ensembling [ 68 ] . The shown positions, velocities, and accelerations correspond to the shoulder joint of one arm, and are taken from the first 10 seconds of a real autonomous match-lighting rollout.
- source: https://arxiv.org/html/2506.07339/candle_frame1.jpg

## fig02.png
- caption: Figure 2 : An illustration of a typical bifurcation between consecutive chunks.
Inference is started between timesteps 3 and 4. The original chunk that was executing, { a t } \{a_{t}\} (black), had planned to go above the obstacle while the newly generated chunk { a t ′ } \{a_{t}^{\prime}\} (red) goes below the obstacle. However, { a t ′ } \{a_{t}^{\prime}\} is not available until d = 7 d=7 steps later. A naive asynchronous algorithm might jump from a 10 a_{10} to a 11 ′ a_{11}^{\prime} , inducing a very high, out-of-distribution acceleration. Temporal ensembling [ 68 ] , i.e., interpolating between chunks, reduces the acceleration but produces poor actions.
- source: https://arxiv.org/html/2506.07339/x2.png

## fig03.png
- caption: Figure 3 : A diagram illustrating how action generation attends to the previous action chunk in real-time chunking. If inference starts after the execution of a − 1 a_{-1} and the inference delay is d = 4 d=4 , then the newly generated chunk will not be available until after a 3 a_{3} is consumed. Therefore, a 0 : 3 a_{0:3} are “frozen” and are attended to with a full guidance weight of 1. In the intermediate region, a 4 : 10 a_{4:10} , actions from the previous chunk are available but may be updated, since inference will have finished before a 4 a_{4} is needed. This region is attended to with an exponentially decreasing guidance weight. Finally, the last s = 5 s=5 actions are beyond the end of the previous chunk, and need to be freshly generated. The execution horizon, s s , is a hyperparameter constrained by d ≤ s ≤ H − d d\leq s\leq H-d .
- source: https://arxiv.org/html/2506.07339/x3.png

## fig04.png
- caption: Figure 4 : A comparison of naive inpainting (hard masking) and our proposed soft masking method: note that hard masking does not match the frozen region very well and produces faster changes in direction.
- source: https://arxiv.org/html/2506.07339/x4.png

## fig05.jpg
- caption: Figure 5 : Top left: Kinetix environments; each involves getting a green object on the left to touch a blue one on the right. Bottom left: Execution horizon vs. solve rate with a fixed inference delay of 1. Only RTC and BID take full advantage of faster updates, showing strictly increasing performance with decreasing execution horizon. Right: Inference delay vs. solve rate with a fixed execution horizon of s = max ⁡ ( d , 1 ) s=\max(d,1) . RTC outperforms all baselines. Furthermore, soft masking (Sec. 3.2 ) improves performance at lower inference delays and execution horizons. Each data point represents 2048 trials, and 95% Wilson score intervals are shaded in.
- source: https://arxiv.org/html/2506.07339/x5.jpg

## fig06.png
- caption: Figure 6 : Top: Controller steps (equivalent to elapsed time with inference pauses removed multiplied by 50Hz) vs. cumulative progress for each task, aggregated across all delays. Progress is measured in discrete steps corresponding to the subsections of each task. Left: Time (including inference pauses) vs. cumulative progress aggregated across all tasks. The x-axis is log scale to better show progress during both short and long-horizon tasks. Right: Inference delay vs. average throughput, defined as the proportion of task completed divided by duration of episode averaged over episodes. Error bars are ± 1 \pm 1 SEM. Average throughput gives a balanced view of both speed and performance for each method. Neither TE variant can run at +100 or +200ms of injected latency, causing such high oscillations that the robot’s protective stop is triggered.
- source: https://arxiv.org/html/2506.07339/x15.png

## fig07.png
- caption: Figure 7 : Top left: The graph of the value 1 − τ τ ⋅ r τ 2 \frac{1-\tau}{\tau\cdot r^{2}_{\tau}} from Eq. 2 , which we clip at β \beta . At τ = 0 \tau=0 , clipping is needed to make the value finite. With 5 denoising steps, if β ≥ 4.25 \beta\geq 4.25 , the clipping only determines the guidance weight for the first step ( τ = 0 \tau=0 ). Top right: An ablation of β \beta in our simulated benchmark. Increasing β \beta provides no marginal benefit beyond β = 5 \beta=5 . Bottom left: Example real robot action chunks generated from the same noise with 5 denoising steps ( n = 5 n=5 ) and 100 denoising steps ( n = 100 n=100 ), with lower opacities corresponding to higher guidance weight clipping ( β = { 5 , 20 , 50 , 150 } \beta=\{5,20,50,150\} ). With 5 denoising steps, the generated action chunks diverge when β \beta is too high. Bottom right:  β \beta vs. maximum acceleration (second discrete difference) for a batch of 325 action chunks generated with d = 15 d=15 and n = 5 n=5 . Higher β \beta leads to more jerkiness, a proxy for out-of-distribution actions.
- source: https://arxiv.org/html/2506.07339/x17.png

## fig08.png
- caption: Figure 8 : Left: Simulated ablation over different schedules for soft masking weights (Eq. 5 ). Exponential decay performs the best overall, although linear decay is very close behind. Right: Comparison with the inpainting algorithm from Diffuser [ 26 ] , which overwrites a portion of the action chunk with the desired actions at each denoising step. While this simpler (and cheaper) inpainting method still provides some benefit, it is outperformed by our guidance-based approach.
- source: https://arxiv.org/html/2506.07339/x19.png

## fig09.png
- caption: Mascot Sammy
- source: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAOCAYAAAD5YeaVAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wKExQZLWTEaOUAAAAddEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIFRoZSBHSU1Q72QlbgAAAdpJREFUKM9tkL+L2nAARz9fPZNCKFapUn8kyI0e4iRHSR1Kb8ng0lJw6FYHFwv2LwhOpcWxTjeUunYqOmqd6hEoRDhtDWdA8ApRYsSUCDHNt5ul13vz4w0vWCgUnnEc975arX6ORqN3VqtVZbfbTQC4uEHANM3jSqXymFI6yWazP2KxWAXAL9zCUa1Wy2tXVxheKA9YNoR8Pt+aTqe4FVVVvz05O6MBhqUIBGk8Hn8HAOVy+T+XLJfLS4ZhTiRJgqIoVBRFIoric47jPnmeB1mW/9rr9ZpSSn3Lsmir1fJZlqWlUonKsvwWwD8ymc/nXwVBeLjf7xEKhdBut9Hr9WgmkyGEkJwsy5eHG5vN5g0AKIoCAEgkEkin0wQAfN9/cXPdheu6P33fBwB4ngcAcByHJpPJl+fn54mD3Gg0NrquXxeLRQAAwzAYj8cwTZPwPH9/sVg8PXweDAauqqr2cDjEer1GJBLBZDJBs9mE4zjwfZ85lAGg2+06hmGgXq+j3+/DsixYlgVN03a9Xu8jgCNCyIegIAgx13Vfd7vdu+FweG8YRkjXdWy329+dTgeSJD3ieZ7RNO0VAXAPwDEAO5VKndi2fWrb9jWl9Esul6PZbDY9Go1OZ7PZ9z/lyuD3OozU2wAAAABJRU5ErkJggg==
