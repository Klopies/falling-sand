const NUM_PARTICLES = 2 ** 14;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = (canvas.width = canvas.offsetWidth);
const HEIGHT = (canvas.height = canvas.offsetHeight);

const GRAIN_SIZE = Math.floor(Math.sqrt((WIDTH * HEIGHT) / NUM_PARTICLES));

const GRID_HEIGHT = Math.floor(HEIGHT / GRAIN_SIZE);
const GRID_WIDTH = Math.floor(WIDTH / GRAIN_SIZE);

function createReverseGridArray(height, width) {
  let array = [];
  for (let y = height; y >= 0; y--) {
    for (let x = width; x >= 0; x--) {
      array.push([x, y]);
    }
  }
  return array;
}

const mapKey = (x, y) => `${x},${y}`;

class SandBox {
  constructor() {
    this.sand = new Map();
    this.color = 180;
    this.erasing = false;
    this.trippy = false;
    this.eraseButton = document.getElementById("erase");
    this.resetButton = document.getElementById("reset");
    this.trippyButton = document.getElementById("trippy");
    this.gridArray = createReverseGridArray(GRID_HEIGHT, GRID_WIDTH);
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.init();
  }

  createSand(x, y, value = new SandParticle(this.color)) {
    return this.sand.set(mapKey(x, y), value);
  }

  emptyCell(x, y) {
    return this.sand.delete(mapKey(x, y));
  }

  getSand(x, y) {
    return this.sand.get(mapKey(x, y));
  }

  enumerateSand() {
    return Array.from(this.sand.entries()).map(([xy, grain]) => [
      xy.split(",").map(Number),
      grain,
    ]);
  }

  hasSand(x, y) {
    return this.sand.has(mapKey(x, y));
  }

  moveDown(x, y) {
    this.createSand(x, y + 1, this.getSand(x, y));
    this.emptyCell(x, y);
  }

  moveDownAndLeft(x, y) {
    if (x - 1 < 0) {
      return false;
    }
    if (this.hasSand(x - 1, y + 1)) {
      return false;
    }
    this.createSand(x - 1, y + 1, this.getSand(x, y));
    this.emptyCell(x, y);
    return true;
  }

  moveDownAndRight(x, y) {
    if (x >= GRID_WIDTH) {
      return false;
    }
    if (this.hasSand(x + 1, y + 1)) {
      return false;
    }
    this.createSand(x + 1, y + 1, this.getSand(x, y));
    this.emptyCell(x, y);
    return true;
  }

  drawBlockOfSand(x, y, size = 4) {
    for (let i = -size; i < size; i++) {
      for (let j = -size; j < size; j++) {
        if (this.hasSand(x + i, y + j)) {
          continue;
        }
        this.createSand(x + i, y + j);
      }
    }
  }

  eraseBlockOfSand(x, y, size = 4) {
    for (let i = -size; i < size; i++) {
      for (let j = -size; j < size; j++) {
        if (this.hasSand(x + i, y + j)) {
          this.emptyCell(x + i, y + j);
        }
      }
    }
  }

  onEraseStateChange(active) {
    this.erasing = active;
    active
      ? this.eraseButton.classList.add("active")
      : this.eraseButton.classList.remove("active");

    document.getElementById("action").innerHTML = active ? "erase" : "draw";
    document.getElementById("info").innerHTML = active
      ? "erasing... (press ESC to cancel)"
      : "";
  }

  onTrippyStateChange(active) {
    this.trippy = active;
    active
      ? this.trippyButton.classList.add("active")
      : this.trippyButton.classList.remove("active");
  }

  init() {
    window.requestAnimationFrame(this.render);
    setInterval(this.update, 1000 / 120);

    let drawing = false;

    this.resetButton.addEventListener("click", () => {
      this.reset();
    });

    this.eraseButton.addEventListener("click", () => {
      this.onEraseStateChange(!this.erasing);
    });

    this.trippyButton.addEventListener("click", () => {
      this.onTrippyStateChange(!this.trippy);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.onEraseStateChange(false);
      }
    });

    canvas.addEventListener("mousedown", (e) => {
      drawing = true;
      console.log(e.layerX);
      const [x, y] = [
        Math.floor(e.layerX / GRAIN_SIZE),
        Math.floor(e.layerY / GRAIN_SIZE),
      ];
      if (drawing) {
        this.erasing ? this.eraseBlockOfSand(x, y) : this.drawBlockOfSand(x, y);
      }
    });

    window.addEventListener("mouseup", (e) => {
      drawing = false;
    });

    canvas.addEventListener("mousemove", (e) => {
      const [x, y] = [
        Math.floor(e.layerX / GRAIN_SIZE),
        Math.floor(e.layerY / GRAIN_SIZE),
      ];
      if (drawing) {
        this.erasing ? this.eraseBlockOfSand(x, y) : this.drawBlockOfSand(x, y);
      }
    });
  }

  reset() {
    this.sand = new Map();
  }

  update() {
    this.color = (this.color + 0.3) % 360;

    document
      .getElementById("sand")
      .setAttribute("style", `--sand-color: hsl(${this.color} 70% 50%)`);

    this.trippyButton.setAttribute(
      "style",
      `--trippy-color: hsl(${this.color} 70% 50%)`
    );

    for (let i = 0; i < this.gridArray.length; i++) {
      const [x, y] = this.gridArray[i];

      if (!this.hasSand(x, y)) {
        continue;
      }
      if (y == GRID_HEIGHT) {
        continue;
      }
      if (this.hasSand(x, y + 1)) {
        const goLeftFirst = Math.random() > 0.5;
        if (goLeftFirst) {
          this.moveDownAndLeft(x, y) ?? this.moveDownAndRight(x, y);
          continue;
        }
        this.moveDownAndRight(x, y) ?? this.moveDownAndLeft(x, y);
        continue;
      }
      this.moveDown(x, y);
    }
  }

  render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#2F3337";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const [[x, y], grain] of this.enumerateSand()) {
      if (grain) {
        grain.draw(x, y, this.trippy, this.color);
      }
    }

    window.requestAnimationFrame(this.render);
  }
}

class SandParticle {
  constructor(color) {
    this.color = color;
    this.speed = GRAIN_SIZE * 1;
  }

  getColor(trippyMode = false, currentColor = this.color) {
    const value = trippyMode ? (this.color + currentColor) % 360 : this.color;
    return `hsl(${value}, 70%, 50%)`;
  }

  draw(x, y, trippyMode = false, currentColor = this.color) {
    ctx.fillStyle = this.getColor(trippyMode, currentColor);
    ctx.fillRect(x * GRAIN_SIZE, y * GRAIN_SIZE, GRAIN_SIZE, GRAIN_SIZE);
  }
}

new SandBox();
