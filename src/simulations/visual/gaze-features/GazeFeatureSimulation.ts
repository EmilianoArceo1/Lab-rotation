import { degreesToRadians } from "../../../math/angles";
import {
  buildGazeFeatures,
  GAZE_SIGNAL_ORDER,
  type GazeSignal,
} from "../../../math/statistics/gazeFeatures";
import { describe } from "../../../math/statistics/statistics";
import type {
  SimulationContext,
  SimulationModule,
} from "../../../core/simulation/types";
import {
  createButton,
  createSlider,
  createToggle,
} from "../../../ui/controls/controls";
import { GazeRenderer } from "./GazeRenderer";
import { SignalPlot } from "./SignalPlot";

type Mode = "fixation" | "horizontal" | "vertical" | "random";
const emptySamples = (): Record<GazeSignal, number[]> => ({
  Lx: [],
  Ly: [],
  Lz: [],
  Rx: [],
  Ry: [],
  Rz: [],
});
const gazeVector = (
  horizontal: number,
  vertical: number,
): [number, number, number] => {
  const h = degreesToRadians(horizontal),
    v = degreesToRadians(vertical);
  return [Math.sin(h) * Math.cos(v), Math.sin(v), Math.cos(h) * Math.cos(v)];
};

export class GazeFeatureSimulation implements SimulationModule {
  readonly metadata = {
    id: "gaze-feature-extraction",
    slug: "visual/gaze-features",
    title: "Gaze Estimation and Feature Extraction",
    modality: "visual" as const,
    topic: "Gaze",
    description:
      "Explore how frame-level 3D gaze vectors become six temporal signals and 36 statistical features.",
  };
  private renderer: GazeRenderer | null = null;
  private plot: SignalPlot | null = null;
  private samples = emptySamples();
  private playing = true;
  private elapsed = 0;
  private accumulator = 0;
  private selected: GazeSignal = "Lx";
  private mode: Mode = "horizontal";
  private sync = true;
  private left = { h: 0, v: 0 };
  private right = { h: 0, v: 0 };
  private refresh: () => void = () => {};

  mount(context: SimulationContext): void {
    this.renderer = new GazeRenderer(context.viewport);
    context.viewport.insertAdjacentHTML(
      "beforeend",
      '<div class="gaze-key"><span class="left-eye">Left gaze</span><span class="right-eye">Right gaze</span></div>',
    );
    const modeLabel = document.createElement("label");
    modeLabel.className = "select-control";
    modeLabel.innerHTML = "<span>Synthetic trajectory</span>";
    const mode = document.createElement("select");
    [
      ["fixation", "Stable fixation"],
      ["horizontal", "Horizontal scanning"],
      ["vertical", "Vertical scanning"],
      ["random", "Random movement"],
    ].forEach(([value, label]) => mode.add(new Option(label, value)));
    mode.value = this.mode;
    mode.addEventListener("change", () => {
      this.mode = mode.value as Mode;
      this.reset();
    });
    modeLabel.append(mode);
    context.controls.append(modeLabel);
    const play = createButton("Pause", () => {
      this.playing = !this.playing;
      play.textContent = this.playing ? "Pause" : "Play";
    });
    context.controls.append(
      play,
      createButton("Reset samples", () => this.reset()),
      createToggle("Eyes synchronized", true, (value) => {
        this.sync = value;
        rightControls.forEach((control) =>
          control.element.classList.toggle("disabled", value),
        );
      }),
    );
    const sliders = (side: "left" | "right") =>
      (["h", "v"] as const).map((axis) =>
        createSlider({
          label: `${side === "left" ? "Left" : "Right"} ${axis === "h" ? "horizontal" : "vertical"}`,
          min: axis === "h" ? -45 : -30,
          max: axis === "h" ? 45 : 30,
          step: 1,
          value: 0,
          unit: "°",
          onInput: (value) => {
            this[side][axis] = value;
            if (this.sync) this.right = { ...this.left };
            this.mode = "fixation";
            mode.value = "fixation";
            this.refresh();
          },
        }),
      );
    const leftControls = sliders("left"),
      rightControls = sliders("right");
    [...leftControls, ...rightControls].forEach((control) =>
      context.controls.append(control.element),
    );
    rightControls.forEach((control) =>
      control.element.classList.add("disabled"),
    );

    const shell = document.createElement("div");
    shell.className = "gaze-content";
    shell.innerHTML =
      '<section class="gaze-panel signal-panel"><div class="section-heading"><div><p class="eyebrow">View 2 · synchronized signals</p><h2>Six temporal components</h2></div><span>shared time axis</span></div><div class="plot-host"></div></section><section class="gaze-panel stats-panel"><div class="section-heading"><div><p class="eyebrow">View 3 · aggregation</p><h2>Selected-signal statistics</h2></div><select class="signal-select" aria-label="Selected gaze signal"></select></div><div class="current-vectors"></div><div class="stat-values"></div><div class="equations">g<sub>L</sub>(t) = [Lx, Ly, Lz]ᵀ &nbsp; g<sub>R</sub>(t) = [Rx, Ry, Rz]ᵀ<br>μ = (1/n) Σxᵢ &nbsp; σ = √((1/n) Σ(xᵢ − μ)²)</div></section><section class="gaze-panel pipeline"><b>Video frames</b><i>↓</i><b>Left/right 3D gaze vectors</b><i>↓</i><b>6 temporal signals</b><i>↓</i><b>6 statistics per signal</b><i>↓</i><b>36D feature vector</b></section><section class="gaze-panel loss-panel"><p class="eyebrow">What gets lost?</p><h2>Order is not preserved</h2><div class="sequence-compare"><code>−.8 → −.2 → .4 → .9</code><code>.9 → .4 → −.2 → −.8</code></div><p>These trajectories have identical summary statistics in a different temporal order.</p><p><strong>Statistical aggregation produces a fixed-size representation independent of video length, but it removes information about the exact temporal order of gaze movements.</strong></p><details><summary>Inspect gazeFeatures ∈ R³⁶</summary><code class="feature-vector"></code></details><small>Synthetic trajectories illustrate feature extraction only. They do not indicate deception or truth.</small></section></div>';
    context.content.append(shell);
    this.plot = new SignalPlot(
      shell.querySelector<HTMLElement>(".plot-host")!,
      this.samples,
    );
    const signalSelect =
      shell.querySelector<HTMLSelectElement>(".signal-select")!;
    GAZE_SIGNAL_ORDER.forEach((signal) =>
      signalSelect.add(new Option(signal, signal)),
    );
    signalSelect.addEventListener("change", () => {
      this.selected = signalSelect.value as GazeSignal;
      this.refresh();
    });
    const stats = shell.querySelector<HTMLElement>(".stat-values")!,
      vectors = shell.querySelector<HTMLElement>(".current-vectors")!,
      features = shell.querySelector<HTMLElement>(".feature-vector")!;
    this.refresh = () => {
      const left = gazeVector(this.left.h, this.left.v),
        right = gazeVector(this.right.h, this.right.v);
      this.renderer?.setGaze(left, right);
      vectors.innerHTML = `<span>gL = [${left.map((v) => v.toFixed(3)).join(", ")}]</span><span>gR = [${right.map((v) => v.toFixed(3)).join(", ")}]</span>`;
      const values = this.samples[this.selected];
      if (values.length) {
        const labels = [
          "Mean",
          "Std. deviation",
          "Skewness",
          "Excess kurtosis",
          "Minimum",
          "Maximum",
        ];
        stats.innerHTML = describe(values)
          .map(
            (value, index) =>
              `<div><span>${labels[index]}</span><strong>${value.toFixed(4)}</strong></div>`,
          )
          .join("");
        features.textContent = buildGazeFeatures(this.samples)
          .map((v) => v.toFixed(3))
          .join(", ");
      } else {
        stats.innerHTML = "<p>Press Play to collect samples.</p>";
        features.textContent = "No samples yet.";
      }
      this.plot?.update(this.samples);
    };
    context.animation.setUpdate((delta, time) => this.update(delta, time));
    context.animation.start();
    this.refresh();
  }

  private update(delta: number, _time: number): void {
    this.renderer?.render();
    if (!this.playing) return;
    this.elapsed += delta;
    this.accumulator += delta;
    if (this.accumulator < 0.1) return;
    this.accumulator = 0;
    const t = this.elapsed;
    switch (this.mode) {
      case "horizontal":
        this.left = { h: 32 * Math.sin(t * 1.25), v: 3 * Math.sin(t * 0.5) };
        break;
      case "vertical":
        this.left = { h: 3 * Math.sin(t * 0.6), v: 24 * Math.sin(t * 1.2) };
        break;
      case "random":
        this.left = {
          h: 22 * Math.sin(t * 1.7) + 11 * Math.sin(t * 3.1),
          v: 13 * Math.sin(t * 1.13) + 7 * Math.cos(t * 2.7),
        };
        break;
      case "fixation":
        break;
    }
    if (this.sync) this.right = { ...this.left };
    const left = gazeVector(this.left.h, this.left.v),
      right = gazeVector(this.right.h, this.right.v);
    [...left, ...right].forEach((value, index) => {
      const signal = GAZE_SIGNAL_ORDER[index];
      this.samples[signal].push(value);
      if (this.samples[signal].length > 120) this.samples[signal].shift();
    });
    this.refresh();
  }
  reset(): void {
    this.samples = emptySamples();
    this.elapsed = 0;
    this.accumulator = 0;
    this.refresh();
  }
  destroy(): void {
    this.plot?.destroy();
    this.renderer?.destroy();
    this.plot = null;
    this.renderer = null;
  }
}
