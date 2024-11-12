const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = (canvas.width = canvas.offsetWidth);
const HEIGHT = (canvas.height = canvas.offsetHeight);
const GRAIN_SIZE = 10;

ctx.fillStyle = "#2F3337";

ctx.fillRect(0, 0, WIDTH, HEIGHT);

let color = 0;

const speed = GRAIN_SIZE * 1;
class Sandbox {
  constructor() {
    this.sand = [];
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    3;
    this.spamSand = false;
    this.init();
  }

  init() {
    window.requestAnimationFrame(this.render);

    setInterval(this.update, 1000 / 60);

    let drawing = false;

    canvas.addEventListener("mousedown", (e) => {
      this.drawBlockOfSand(
        e.clientX - e.target.offsetLeft,
        e.clientY - e.target.offsetTop
      );
      drawing = true;
    });

    window.addEventListener("mouseup", (e) => {
      drawing = false;
    });

    canvas.addEventListener("mousemove", (e) => {
      if (drawing) {
        this.drawBlockOfSand(
          e.clientX - e.target.offsetLeft,
          e.clientY - e.target.offsetTop
        );
      }
    });
  }

  drawBlockOfSand(x, y, size = 2) {
    const { x: x1, y: y1 } = this.normalizePoint(x, y);
    for (let i = -size / 2; i < size / 2; i++) {
      for (let j = -size / 2; j < size / 2; j++) {
        if (this.sand.some((grain) => grain.x == x1 + i * GRAIN_SIZE && grain.y == y1 + j * GRAIN_SIZE)) {
          continue;
        }
        this.sand.push(
          new Sand(x1 + i * GRAIN_SIZE, y1 + j * GRAIN_SIZE, this)
        );
      }
    }
  }

  normalizePoint(x, y) {
    return {
      x: Math.floor(x / GRAIN_SIZE) * GRAIN_SIZE,
      y: Math.floor(y / GRAIN_SIZE) * GRAIN_SIZE,
    };
  }

  update() {
    if (this.spamSand) {
      this.sand.push(new Sand(this.normalizePoint(Math.random() * WIDTH), 0));
    }
    for (const grain of this.sand) {
      grain.update(this.sand);
    }
    color += 0.2;
    if (color > 360) {
      color = 0;
    }
  }

  render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#2F3337";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (const grain of this.sand) {
      grain.draw();
    }

    window.requestAnimationFrame(this.render);
  }
}

class Sand {
  /**
   *
   * @param {Number} x
   * @param {Number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = GRAIN_SIZE;
    this.height = GRAIN_SIZE;
    this.speed = GRAIN_SIZE * 1;
    this.color = color;
    this.stopped = false;
  }

  /**
   * @param {Array<Sand>} sand
   */
  hasGrainBelow(sand) {
    for (const grain of sand) {
      if (
        [this.x == grain.x, this.y + this.height == grain.y].every((v) => v)
      ) {
        return true;
      }
    }
    return false;
  }
  /**
   * @param {Array<Sand>} sand
   */
  hasGrainBelowLeft(sand) {
    for (const grain of sand) {
      if (
        [this.x - this.width == grain.x, this.y + this.height == grain.y].every(
          (v) => v
        )
      ) {
        return true;
      }
    }
    return false;
  }
  /**
   * @param {Array<Sand>} sand
   */
  hasGrainBelowRight(sand) {
    for (const grain of sand) {
      if (
        [this.x + this.width == grain.x, this.y + this.height == grain.y].every(
          (v) => v
        )
      ) {
        return true;
      }
    }
    return false;
  }
  /**
   * @param {Array<Sand>} sand
   */
  goDownLeft(sand) {
    if (this.y >= HEIGHT - this.height) {
      return (this.y = HEIGHT - this.height);
    }

    if (this.hasGrainBelowLeft(sand) || this.x <= 0) {
      return false;
    }
    this.x -= this.width;
    this.y += this.width;
    return true;
  }
  /**
   * @param {Array<Sand>} sand
   */
  goDownRight(sand) {
    if (this.y >= HEIGHT - this.height) {
      return (this.y = HEIGHT - this.height);
    }
    if (this.hasGrainBelowRight(sand) || this.x >= WIDTH - this.width) {
      return false;
    }
    this.x += this.width;
    this.y += this.width;
    return true;
  }
  /**
   * @param {Array<Sand>} sand
   */
  update(sand) {
    if (this.y >= HEIGHT - this.height) {
      this.stopped = true;
      return (this.y = HEIGHT - this.height);
    }
    if (this.hasGrainBelow(sand)) {
      let shouldStop = false;
      const goLeftFirst = Math.random() > 0.5;
      if (goLeftFirst) {
        shouldStop = !(this.goDownLeft(sand) || this.goDownRight(sand));
      } else {
        shouldStop = !(this.goDownRight(sand) || this.goDownLeft(sand));
      }

      if (shouldStop) {
        this.stopped = true;
      }

      return
    }
    this.y += this.speed;
  }

  draw() {
    ctx.fillStyle = `hsl(${this.color}, 100%, 50%)`;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

new Sandbox();
