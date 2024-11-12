const NUM_PARTICLES = 2**14;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = (canvas.width = canvas.offsetWidth);
const HEIGHT = (canvas.height = canvas.offsetHeight);

const GRAIN_SIZE = Math.floor(Math.sqrt((WIDTH * HEIGHT) / NUM_PARTICLES));

const GRID_HEIGHT = Math.floor(HEIGHT / GRAIN_SIZE);
const GRID_WIDTH = Math.floor(WIDTH / GRAIN_SIZE);

const mapKey = (x, y) => `${x},${y}`;

class SandBox {
  constructor() {
    this.sand = new Map();
    this.color = 0;
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

  createEmptySpace() {
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        this.emptyCell(x, y);
      }
    }
  }

  init() {
    this.createEmptySpace();
    window.requestAnimationFrame(this.render);
    setInterval(this.update, 1000 / 60);

    let drawing = false;

    canvas.addEventListener("mousedown", (e) => {
      this.drawBlockOfSand(
        Math.floor((e.clientX - e.target.offsetLeft) / GRAIN_SIZE),
        Math.floor((e.clientY - e.target.offsetTop) / GRAIN_SIZE)
      );
      drawing = true;
    });

    window.addEventListener("mouseup", (e) => {
      drawing = false;
    });

    canvas.addEventListener("mousemove", (e) => {
      if (drawing) {
        this.drawBlockOfSand(
          Math.floor((e.clientX - e.target.offsetLeft) / GRAIN_SIZE),
          Math.floor((e.clientY - e.target.offsetTop) / GRAIN_SIZE)
        );
      }
    });
  }

  update() {
    this.color += 0.2;
    if (this.color > 360) {
      this.color = 0;
    }

    for (let y = GRID_HEIGHT; y >= 0; y--) {
      for (let x = GRID_WIDTH; x >= 0; x--) {
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
  }

  render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#2F3337";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const [xy, grain] of this.sand.entries()) {
      const [x, y] = xy.split(",").map(Number);
      if (grain) {
        grain.draw(x, y);
      }
    }

    window.requestAnimationFrame(this.render);
  }
}

class SandParticle {
  constructor(color) {
    this.color = `hsl(${color}, 80%, 40%)`;
    this.speed = GRAIN_SIZE * 1;
  }

  draw(x, y) {
    ctx.fillStyle = this.color;
    ctx.fillRect(x * GRAIN_SIZE, y * GRAIN_SIZE, GRAIN_SIZE, GRAIN_SIZE);
  }
}

new SandBox();
