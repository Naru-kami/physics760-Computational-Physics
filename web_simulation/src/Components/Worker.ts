type PropertyNames = NonNullable<{
  [K in keyof Data]: Data[K] extends (...args: any) => any ? never : K
}[keyof Data]>;

type MethodNames = NonNullable<{
  [K in keyof Data]: Data[K] extends (...args: any) => any ? K : never
}[keyof Data]>;

type DataMethodParameters = {
  [K in MethodNames]: Data[K] extends (...args: infer P) => any ? P : never
};

type CanvasInit = {
  canvas: OffscreenCanvas
  width: number
  height: number
};

type MethodMessage = {
  [K in MethodNames]: DataMethodParameters[K] extends []
  ? { method: K; parameters?: DataMethodParameters[K] }
  : (undefined extends DataMethodParameters[K][0]
    ? { method: K; parameters?: DataMethodParameters[K] }
    : { method: K; parameters: DataMethodParameters[K] })
}[MethodNames];

type PropertyMessage = {
  [K in PropertyNames]: { property: K; value: Data[K] }
}[PropertyNames];


export type DataMessage = (CanvasInit | MethodMessage | PropertyMessage)[];

var CanvasData: Data | undefined;

self.onmessage = function (e: MessageEvent<DataMessage>) {
  const { data } = e;

  for (const instruction of data) {

    if ('canvas' in instruction) {
      const ctx = instruction.canvas.getContext("2d");
      if (ctx) ctx.imageSmoothingEnabled = false;

      CanvasData = new Data(instruction.canvas, instruction.width, instruction.height);
      CanvasData.initializeData();
      CanvasData.render();
      continue;
    }

    if (!CanvasData) continue;

    if ('method' in instruction) {
      // @ts-expect-error
      CanvasData[instruction.method].apply(CanvasData, instruction.parameters ?? []);
      continue;
    }

    if ('property' in instruction) {
      // @ts-expect-error
      CanvasData[instruction.property] = instruction.value;
      continue;
    }

  }
};

class Data {
  #viewport: OffscreenCanvas;
  #canvas: OffscreenCanvas;
  data: Float64Array;
  #pixelData: ImageData;
  beta: number;
  step: () => void;
  #rAF?: number;

  constructor(viewport: OffscreenCanvas, width: number, height: number) {
    this.#viewport = viewport;
    this.#canvas = new OffscreenCanvas(width, height);
    this.#pixelData = new ImageData(width, height);
    this.data = new Float64Array(width * height);
    this.beta = 1;
    this.step = this.metropolis;
  }

  private hslToRgb(h: number, s = 1, l = 0.5) {
    // https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
    h *= 180 / Math.PI;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return [f(0), f(8), f(4)];
  }

  resize(N: number) {
    this.#canvas.width = N;
    this.#canvas.height = N;
    this.#pixelData = new ImageData(N, N);
    this.data = new Float64Array(N * N);
  }

  initializeData() {
    for (let y = 0; y < this.#pixelData.height; y++) {
      for (let x = 0; x < this.#pixelData.width; x++) {
        this.data[y * this.#pixelData.width + x] = 2 * Math.PI * Math.random();
      }
    }
  }

  play(cb?: () => void) {
    this.#rAF = requestAnimationFrame(() => {
      cb?.();
      this.step();
      this.render();
      this.play(cb);
    });
  }

  pause() {
    this.#rAF && cancelAnimationFrame(this.#rAF);
    this.#rAF = undefined;
  }

  magnetization() {
    let sumX = 0, sumY = 0;
    for (let i = 0; i < this.data.length; i++) {
      sumX += Math.cos(this.data[i]);
      sumY += Math.sin(this.data[i]);
    }
    return Math.hypot(sumX, sumY) / this.data.length;
  }

  metropolis() {
    const width = this.#pixelData.width;
    const height = this.#pixelData.height;

    let energy_now: number, energy_after: number, delta: number;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        energy_now = -(
          Math.cos(this.data[y * width + x] - this.data[y * width + ((x + 1) % width)]) +
          Math.cos(this.data[y * width + x] - this.data[y * width + ((x - 1 + width) % width)]) +
          Math.cos(this.data[y * width + x] - this.data[((y + 1) % height) * width + x]) +
          Math.cos(this.data[y * width + x] - this.data[((y - 1 + height) % height) * width + x])
        );

        delta = 2 * Math.PI * Math.random();
        energy_after = -(
          Math.cos(this.data[y * width + x] + delta - this.data[y * width + ((x + 1) % width)]) +
          Math.cos(this.data[y * width + x] + delta - this.data[y * width + ((x - 1 + width) % width)]) +
          Math.cos(this.data[y * width + x] + delta - this.data[((y + 1) % height) * width + x]) +
          Math.cos(this.data[y * width + x] + delta - this.data[((y - 1 + height) % height) * width + x])
        );

        if (energy_after < energy_now || Math.random() < Math.exp(-this.beta * (energy_after - energy_now))) {
          this.data[y * width + x] = (this.data[y * width + x] + delta + 2 * Math.PI) % (2 * Math.PI);
        }
      }
    }
  }

  cluster() {

  }

  render() {
    if (!this.#viewport) return;

    const width = this.#pixelData.width;
    const height = this.#pixelData.height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const [r, g, b] = this.hslToRgb(this.data[y * width + x])
        this.#pixelData.data[(y * width + x) * 4 + 0] = r * 255;
        this.#pixelData.data[(y * width + x) * 4 + 1] = g * 255;
        this.#pixelData.data[(y * width + x) * 4 + 2] = b * 255;
        this.#pixelData.data[(y * width + x) * 4 + 3] = 255;
      }
    }
    this.#canvas.getContext("2d")?.putImageData(this.#pixelData, 0, 0);

    const M = new DOMMatrix().translateSelf(256, 256).scaleSelf(512 / width, 512 / height);
    const ctx = this.#viewport.getContext("2d");
    ctx?.save();
    ctx?.setTransform(M);
    ctx?.drawImage(this.#canvas, -width / 2, -height / 2);
    ctx?.restore();
  }
}