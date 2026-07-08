# Figures for 2512.05964

Source: https://arxiv.org/html/2512.05964

## fig01.png
- caption: Figure 1 : A diagram illustrating two overlapping action chunks. The d d actions between t t and t + d t+d , taken from the previous chunk, are the action prefix (red). From the diagram, we can easily see that we must satisfy the constraint t + d ≤ t − s + H → d ≤ H − s t+d\leq t-s+H\to d\leq H-s to have a valid action prefix. Note that inference-time RTC uses all H − s H-s overlapping actions (red and yellow) to guide the generation of the current chunk, whereas training-time RTC only uses the first d d actions (red).
- source: https://arxiv.org/html/2512.05964/x1.png

## fig02.png
- caption: Figure 2 : An illustration of our conditioning architecture, as applied to a standard diffusion transformer such as the π 0.6 \pi_{0.6} action expert. We always feed in ground-truth, non-noisy prefix actions, while learning to denoise the postfix actions. The flow matching timestep differs between tokens, which indicates the inference delay to the model.
- source: https://arxiv.org/html/2512.05964/x2.png

## fig03.png
- caption: Figure 3 : Simulated results: inference delay vs. solve rate with a fixed execution horizon of s = max ⁡ ( d , 1 ) s=\max(d,1) . Training-time RTC performs better than inference-time RTC at inference delays of 2 or higher.
Each data point represents 2048 trials, and 95% Wilson score intervals are shaded in.
- source: https://arxiv.org/html/2512.05964/x3.png

## fig04.png
- caption: (a)  Box building task
- source: https://arxiv.org/html/2512.05964/box.png

## fig05.png
- caption: (b)  Espresso making task
- source: https://arxiv.org/html/2512.05964/coffee.png

## fig06.png
- caption: Figure 5 : Real-world results: success rate and duration for espresso making and box building. Training-time and inference-time RTC perform similarly, while both improving speed over synchronous inference. Error bars represent 68% Wilson score intervals for success rate and ± 1 \pm 1 SEM for duration.
- source: https://arxiv.org/html/2512.05964/x4.png

## fig07.png
- caption: Mascot Sammy
- source: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAOCAYAAAD5YeaVAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wKExQZLWTEaOUAAAAddEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIFRoZSBHSU1Q72QlbgAAAdpJREFUKM9tkL+L2nAARz9fPZNCKFapUn8kyI0e4iRHSR1Kb8ng0lJw6FYHFwv2LwhOpcWxTjeUunYqOmqd6hEoRDhtDWdA8ApRYsSUCDHNt5ul13vz4w0vWCgUnnEc975arX6ORqN3VqtVZbfbTQC4uEHANM3jSqXymFI6yWazP2KxWAXAL9zCUa1Wy2tXVxheKA9YNoR8Pt+aTqe4FVVVvz05O6MBhqUIBGk8Hn8HAOVy+T+XLJfLS4ZhTiRJgqIoVBRFIoric47jPnmeB1mW/9rr9ZpSSn3Lsmir1fJZlqWlUonKsvwWwD8ymc/nXwVBeLjf7xEKhdBut9Hr9WgmkyGEkJwsy5eHG5vN5g0AKIoCAEgkEkin0wQAfN9/cXPdheu6P33fBwB4ngcAcByHJpPJl+fn54mD3Gg0NrquXxeLRQAAwzAYj8cwTZPwPH9/sVg8PXweDAauqqr2cDjEer1GJBLBZDJBs9mE4zjwfZ85lAGg2+06hmGgXq+j3+/DsixYlgVN03a9Xu8jgCNCyIegIAgx13Vfd7vdu+FweG8YRkjXdWy329+dTgeSJD3ieZ7RNO0VAXAPwDEAO5VKndi2fWrb9jWl9Esul6PZbDY9Go1OZ7PZ9z/lyuD3OozU2wAAAABJRU5ErkJggg==

