const NUM_PARTICLES = 2 ** 14;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = (canvas.width = canvas.offsetWidth);
const HEIGHT = (canvas.height = canvas.offsetHeight);

const GRAIN_SIZE = Math.floor(Math.sqrt((WIDTH * HEIGHT) / NUM_PARTICLES));

const GRID_HEIGHT = Math.floor(HEIGHT / GRAIN_SIZE);
const GRID_WIDTH = Math.floor(WIDTH / GRAIN_SIZE);

function createGridArray(height, width) {
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
    this.eraseButton = document.getElementById("erase");
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

  drawBlockOfSand(x, y) {
    for (let i = -2; i < 2; i++) {
      for (let j = -2; j < 2; j++) {
        if (this.hasSand(x + i, y + j)) {
          continue;
        }
        this.createSand(x + i, y + j);
      }
    }
  }

  eraseBlockOfSand(x, y) {
    for (let i = -2; i < 2; i++) {
      for (let j = -2; j < 2; j++) {
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
      ? "(press ESC to cancel)"
      : "";
  }

  init() {
    window.requestAnimationFrame(this.render);
    setInterval(this.update, 1000 / 60);

    let drawing = false;

    const resetButton = document.getElementById("reset");

    resetButton.addEventListener("click", () => {
      this.reset();
    });

    this.eraseButton.addEventListener("click", () => {
      this.onEraseStateChange(!this.erasing);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.onEraseStateChange(false);
      }
    });

    canvas.addEventListener("mousedown", (e) => {
      drawing = true;
      const [x, y] = [
        Math.floor((e.clientX - e.target.offsetLeft) / GRAIN_SIZE),
        Math.floor((e.clientY - e.target.offsetTop) / GRAIN_SIZE),
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
        Math.floor((e.clientX - e.target.offsetLeft) / GRAIN_SIZE),
        Math.floor((e.clientY - e.target.offsetTop) / GRAIN_SIZE),
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
    this.color = (this.color + 0.1) % 360;

    document
      .getElementById("sand")
      .setAttribute("style", `--sand-color: hsl(${this.color} 70% 50%)`);

    const gridArray = createGridArray(GRID_HEIGHT, GRID_WIDTH);

    for (let i = 0; i < gridArray.length; i++) {
      const [x, y] = gridArray[i];

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
        grain.draw(x, y);
      }
    }

    window.requestAnimationFrame(this.render);
  }
}

class SandParticle {
  constructor(color) {
    this.color = `hsl(${color}, 70%, 50%)`;
    this.speed = GRAIN_SIZE * 1;
  }

  draw(x, y) {
    ctx.fillStyle = this.color;
    ctx.fillRect(x * GRAIN_SIZE, y * GRAIN_SIZE, GRAIN_SIZE, GRAIN_SIZE);
  }
}

new SandBox();
