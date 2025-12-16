// --- Data Structure (Narrative Logic Applied) ---
let deckA_Data = [
  {
    title: "TIME MEMORY",
    desc: "INTERACTING WITH THE FLOW",
    sub: "SYSTEM PROCESSING DATA STREAM A // ",
  },
  {
    title: "PAST FUTURE",
    desc: "RECONSTRUCTING FRAGMENTS",
    sub: "BUFFERING SEQUENCE INITIATED // ",
  },
  {
    title: "CORE LOGIC",
    desc: "SEARCHING FOR PATTERNS",
    sub: "ALGORITHM OPTIMIZATION RUNNING // ",
  },
  {
    title: "DEEP DIVE",
    desc: "NAVIGATING THE LAYERS",
    sub: "DEPTH ANALYSIS COMPLETE // ",
  },
  {
    title: "VOID SPACE",
    desc: "FILLING THE EMPTY VOID",
    sub: "NULL POINTER EXCEPTION ERROR // ",
  },
];
let deckB_Data = [
  {
    title: "SOUND WAVE",
    desc: "VISUALIZING THE AUDIO",
    sub: "FREQUENCY MODULATION SYNC // ",
  },
  {
    title: "ECHO LOOP",
    desc: "REPEATING THE SIGNALS",
    sub: "FEEDBACK LOOP DETECTED // ",
  },
  {
    title: "NOISE GATE",
    desc: "FILTERING INTERFERENCE",
    sub: "THRESHOLD LIMIT REACHED // ",
  },
  {
    title: "PULSE RATE",
    desc: "SYNCHRONIZING BEATS",
    sub: "BPM MATCHING SEQUENCE // ",
  },
  {
    title: "FLAT LINE",
    desc: "TERMINATING PROCESS",
    sub: "CONNECTION TERMINATED // ",
  },
];

// --- Deck Objects ---
let deckA = {
  name: "DECK A",
  data: deckA_Data,
  index: 0,
  rotation: 0,
  targetRotation: 0,
  isLooping: false,
  visualMode: 1,
  sensors: [],
};
let deckB = {
  name: "DECK B",
  data: deckB_Data,
  index: 0,
  rotation: 0,
  targetRotation: 0,
  isLooping: false,
  visualMode: 1,
  sensors: [],
};

// --- Global Variables ---
let crossFaderVal = 0.5;
let activeDeck = deckA;
let mic;

// --- Sound Objects ---
let oscClick, envClick;
let oscTone, envTone;
let engineOsc;
let noiseOsc, noiseEnv;

// --- Palette ---
const C_BG = 250;
const C_PANEL = 255;
const C_TEXT = 40;
const C_LINE_SUBTLE = 220;
const C_SHADOW_COL = "rgba(0, 0, 0, 0.08)";

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  angleMode(DEGREES);
  rectMode(CENTER);
  textFont("Arial");

  mic = new p5.AudioIn();

  oscClick = new p5.Oscillator("square");
  envClick = new p5.Envelope(0.001, 0.05, 0.01, 0.05);
  oscClick.start();
  oscClick.amp(0);

  oscTone = new p5.Oscillator("sine");
  envTone = new p5.Envelope(0.01, 0.2, 0.1, 0.2);
  oscTone.start();
  oscTone.amp(0);

  engineOsc = new p5.Oscillator("sawtooth");
  engineOsc.freq(50);
  engineOsc.start();
  engineOsc.amp(0);

  noiseOsc = new p5.Noise("white");
  noiseEnv = new p5.Envelope(0.01, 0.1, 0, 0.1);
  noiseOsc.start();
  noiseOsc.amp(0);

  // Initialize Sensors
  initSensors(deckA);
  initSensors(deckB);
}

function draw() {
  background(C_BG);

  // Audio Logic
  if (getAudioContext().state === "running") {
    let vol = mic.getLevel();
    if (vol > 0.01) {
      engineOsc.freq(map(vol, 0, 0.5, 50, 120), 0.1);
      engineOsc.amp(map(vol, 0, 0.5, 0, 0.3), 0.1);
    } else {
      engineOsc.amp(0, 0.1);
    }
  }

  // Physics Logic
  updateDeck(deckA);
  updateDeck(deckB);
  if (crossFaderVal < 0.45) activeDeck = deckA;
  else if (crossFaderVal > 0.55) activeDeck = deckB;

  // --- UI Layout (Responsive Scaling) ---
  // 화면의 가로/세로 중 작은 쪽을 기준으로 스케일을 잡습니다.
  // 이렇게 하면 화면 비율이 달라져도 원형과 텍스트의 비율이 깨지지 않습니다.
  let refSize = min(width, height);

  // 전체적인 레이아웃 기준점
  let deckW = width * 0.35;
  let deckH = height * 0.6; // 패널 높이 여유있게
  let deckY = height * 0.35; // 패널 Y 위치

  // 기준 스케일 (Wheel Size Reference)
  // 이 값을 기준으로 모든 내부 요소(텍스트 궤도, 센서 위치)를 계산해야 함
  let scaleBase = min(deckW, deckH) * 0.8;

  drawDeck(
    width * 0.25,
    deckY,
    deckW,
    deckH,
    deckA,
    ["A", "S", "D", "F"],
    scaleBase
  );
  drawDeck(
    width * 0.75,
    deckY,
    deckW,
    deckH,
    deckB,
    ["H", "J", "K", "L"],
    scaleBase
  );

  drawMixer(width / 2, height / 2, width * 0.2, height * 0.7, refSize);

  drawInvertedCursor();

  if (keyIsDown(32)) {
    filter(INVERT);
  }
}

// --------------------------------------------------------
// VARIATION LOGIC (Sensors Grid)
// --------------------------------------------------------
function initSensors(deck) {
  // 센서 초기화 시에는 화면 크기를 알 수 없거나 변할 수 있으므로
  // draw() 루프 내에서 매번 위치를 갱신하거나, 상대 좌표(0.0 ~ 1.0)를 저장해야 함.
  // 여기서는 구조상 상대 좌표를 쓰기보다, updateSensors 함수를 만들어 draw에서 호출하는 방식 사용 권장.
  // 하지만 편의상 여기서 빈 배열로 두고, drawKineticJogWheel에서 위치를 재계산하도록 로직을 변경합니다.
  // (아래 drawKineticJogWheel 함수 참조)
  deck.sensors = [];
}

// 센서 데이터를 매 프레임(또는 리사이즈 시) 갱신하기 위한 헬퍼
// scaleBase: 현재 화면 비율에 맞는 휠의 크기
function updateSensors(deck, s) {
  // 모드가 바뀌었거나, 센서 개수가 0이거나, 화면 크기가 바뀌었을 때 재설정 필요
  // 성능을 위해 매번 push하지 않고, 위치만 업데이트하는 것이 정석이나
  // 여기서는 p5.js 특성상 매번 새로 그려도 무방하게 처리합니다.
  // 다만 충돌 감지를 위해 좌표가 필요하므로, draw 함수 내에서 로컬 좌표계를 공유합니다.

  // *중요* 기존 initSensors 로직을 여기로 가져와서 실시간 스케일(s)을 적용합니다.

  // 기존 센서들의 애니메이션 상태(curr size)를 유지하기 위해
  // 센서 배열을 완전히 비우지 않고, 필요한 경우에만 재생성합니다.
  // (모드가 바뀌었을 때만 초기화)
  if (deck.sensors.length === 0 || deck.lastVisualMode !== deck.visualMode) {
    deck.sensors = [];
    deck.lastVisualMode = deck.visualMode;

    let r1 = s * 0.18;
    let r2 = s * 0.28;
    let r3 = s * 0.38;
    let baseSize = s * 0.02; // 원 크기도 스케일에 비례

    let mode = deck.visualMode;

    if (mode === 1) {
      // Cross
      let dists = [r1, r2, r3];
      let angles = [0, 90, 180, 270];
      for (let d of dists) {
        for (let a of angles) {
          deck.sensors.push(createSensor(d * cos(a), d * sin(a), baseSize));
        }
      }
    } else if (mode === 2) {
      // Ring
      let counts = [8, 12, 16];
      let radii = [r1, r2, r3];
      for (let k = 0; k < 3; k++) {
        for (let i = 0; i < counts[k]; i++) {
          let a = (360 / counts[k]) * i;
          deck.sensors.push(
            createSensor(radii[k] * cos(a), radii[k] * sin(a), baseSize)
          );
        }
      }
    } else if (mode === 3) {
      // Scatter
      let seed = 999;
      randomSeed(seed);
      for (let i = 0; i < 25; i++) {
        let rChoice = random([r1, r2, r3]);
        let r = rChoice + random(-s * 0.02, s * 0.02);
        let a = random(360);
        deck.sensors.push(createSensor(r * cos(a), r * sin(a), baseSize));
      }
    } else if (mode === 4) {
      // Triple Arc
      let count = 12;
      for (let k = 0; k < 3; k++) {
        let r = [r1, r2, r3][k];
        for (let i = 0; i < count; i++) {
          let a = (360 / count) * i + k * 15;
          deck.sensors.push(createSensor(r * cos(a), r * sin(a), baseSize));
        }
      }
    } else if (mode === 5) {
      // Spiral
      let count = 36;
      for (let i = 0; i < count; i++) {
        let r = map(i, 0, count, s * 0.1, s * 0.45);
        let a = i * 20;
        deck.sensors.push(createSensor(r * cos(a), r * sin(a), baseSize));
      }
    } else if (mode === 6) {
      // Grid
      let grid = s * 0.1;
      for (let x = -s * 0.4; x <= s * 0.4; x += grid) {
        for (let y = -s * 0.4; y <= s * 0.4; y += grid) {
          let d = dist(0, 0, x, y);
          if (d < s * 0.42 && d > s * 0.12) {
            deck.sensors.push(createSensor(x, y, baseSize));
          }
        }
      }
    }
  } else {
    // 이미 센서가 있다면, 화면 리사이즈에 맞춰 위치만 업데이트?
    // 반응형을 위해 매 프레임 위치를 다시 계산하는 것이 가장 정확함.
    // 하지만 여기서는 간단하게 모드 변경시에만 재생성하고,
    // 리사이즈 시에는 시각적으로 조금 어긋나더라도 새로고침을 유도하거나,
    // windowResized()에서 sensors를 비워주는 방식을 씁니다.
  }
}

function createSensor(x, y, base) {
  return { x: x, y: y, base: base, curr: base, target: base };
}

// --------------------------------------------------------
// Helpers
// --------------------------------------------------------
function applyShadow(blur = 15, offX = 3, offY = 3) {
  drawingContext.shadowColor = C_SHADOW_COL;
  drawingContext.shadowBlur = blur;
  drawingContext.shadowOffsetX = offX;
  drawingContext.shadowOffsetY = offY;
}
function clearShadow() {
  drawingContext.shadowColor = "transparent";
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
}

function playClick() {
  oscClick.freq(random(800, 1200));
  envClick.play(oscClick);
}
function playTone(note) {
  oscTone.freq(midiToFreq(note));
  envTone.play(oscTone);
}
function playNoise() {
  noiseEnv.play(noiseOsc);
}

function updateDeck(deck) {
  deck.rotation = lerp(deck.rotation, deck.targetRotation, 0.1);
  if (deck.isLooping) deck.rotation += random(-2, 2);
  let speed = abs(deck.rotation - deck.targetRotation);
  if (speed > 5 && frameCount % 6 === 0) playClick();

  for (let sensor of deck.sensors) {
    sensor.curr = lerp(sensor.curr, sensor.target, 0.2);
    sensor.target = sensor.base;
  }
}

// --------------------------------------------------------
// UI COMPONENTS
// --------------------------------------------------------

function drawDeck(x, y, w, h, deck, btnLabels, scaleBase) {
  push();
  translate(x, y);

  // Panel
  applyShadow(20, 5, 5);
  fill(C_PANEL);
  noStroke();
  rect(0, 0, w, h, 20);
  clearShadow();

  // Sampler Buttons (Trigger Tracks)
  // [수정] 위치를 상단으로 더 올림 (-h*0.35 -> -h*0.4)
  let btnY = -h * 0.4;
  let btnGap = w * 0.2; // 간격도 살짝 넓힘

  let keyCodes = [];
  if (deck.name === "DECK A") keyCodes = [65, 83, 68, 70]; // A, S, D, F
  else keyCodes = [72, 74, 75, 76]; // H, J, K, L

  for (let i = 0; i < 4; i++) {
    let bx = (i - 1.5) * btnGap;
    // 버튼 크기도 반응형으로
    let btnSize = min(w, h) * 0.08;
    drawRoundBtn(bx, btnY, btnSize, keyCodes[i], btnLabels[i], deck, i);
  }

  // Kinetic Jog Wheel
  // [수정] 위치를 하단으로 살짝 내림 (버튼과 겹치지 않게)
  // 0.12 -> 0.15
  drawKineticJogWheel(0, h * 0.15, scaleBase, deck);

  pop();
}

function drawKineticJogWheel(x, y, s, deck) {
  // s는 scaleBase (반응형 휠 크기)

  // 센서 업데이트 (반응형 크기 적용)
  updateSensors(deck, s);

  push();
  translate(x, y);

  // Wheel Body
  applyShadow(15, 4, 4);
  fill(C_PANEL);
  noStroke();
  ellipse(0, 0, s);
  clearShadow();

  // Sensors
  noFill();
  stroke(0);
  strokeWeight(1);
  for (let sensor of deck.sensors) {
    ellipse(sensor.x, sensor.y, sensor.curr);
    fill(0);
    noStroke();
    ellipse(sensor.x, sensor.y, s * 0.005); // center dot relative
    noFill();
    stroke(0);
  }

  // Rotating Text (3 Rows)
  push();
  rotate(deck.rotation);

  let t1 = deck.data[deck.index].title;
  let t2 = deck.data[deck.index].desc;
  let t3 = deck.data[deck.index].sub;

  fill(C_TEXT);
  noStroke();
  textAlign(CENTER, CENTER);

  let uniformTextSize = s * 0.045;
  textStyle(NORMAL);

  // --- Draw 3 Rings with Arc-Length Spacing ---
  // 반지름도 scaleBase(s)에 비례
  let r1 = s * 0.18;
  let r2 = s * 0.28;
  let r3 = s * 0.38;

  drawTextRing(t1, r1, uniformTextSize, deck, s);
  drawTextRing(t2, r2, uniformTextSize, deck, s);
  drawTextRing(t3, r3, uniformTextSize, deck, s);

  pop(); // End Rotation

  // Center Decor
  noFill();
  stroke(C_LINE_SUBTLE);
  strokeWeight(1);
  ellipse(0, 0, s * 0.1);

  pop();
}

function drawTextRing(str, radius, fontSize, deck, s) {
  textSize(fontSize);

  let chars = str.split("");

  // Arc Length Spacing
  // 스케일에 따라 자간도 비례해야 함 (s * 0.04 정도)
  let desiredArcLen = s * 0.05;
  let angleStep = degrees(desiredArcLen / radius);

  for (let i = 0; i < chars.length; i++) {
    let char = chars[i];
    let charLocalAngle = i * angleStep;

    // Collision Detection
    let totalAngle = (charLocalAngle + deck.rotation - 90) % 360;
    let cx = radius * cos(totalAngle);
    let cy = radius * sin(totalAngle);

    // 반응 거리도 스케일 비례
    let hitDist = s * 0.05;

    for (let sensor of deck.sensors) {
      if (dist(cx, cy, sensor.x, sensor.y) < hitDist) {
        sensor.target = s * 0.07; // Hit Effect Size
      }
    }

    push();
    rotate(charLocalAngle - 90);
    translate(0, -radius);
    text(char, 0, 0);
    pop();
  }
}

function drawMixer(x, y, w, h, refSize) {
  push();
  translate(x, y);

  applyShadow(20, 5, 5);
  fill(C_PANEL);
  noStroke();
  rect(0, 0, w, h, 20);
  clearShadow();

  // --- 6 Knobs as Mode Switchers ---
  let ky_start = -h * 0.3;
  let k_gap = h * 0.12;
  let knobSize = min(w, h) * 0.12;

  for (let i = 0; i < 6; i++) {
    let col = i % 2;
    let row = floor(i / 2);
    let kx = col === 0 ? -w * 0.25 : w * 0.25;
    let ky = ky_start + row * k_gap;

    let modeNum = i + 1;
    let isActive = activeDeck.visualMode === modeNum;
    let rot = isActive ? frameCount * 5 : -45;

    drawKnob(kx, ky, knobSize, rot, isActive);

    fill(150);
    noStroke();
    textSize(refSize * 0.01);
    text(modeNum, kx, ky + knobSize * 0.8);
  }

  // Buttons (Spacebar)
  let by = h * 0.15;
  drawRectBtn(0, by, w * 0.6, h * 0.08, "SPACE", 32);

  // Crossfader
  let fy = h * 0.35;
  let fw = w * 0.8;
  let fh = h * 0.05;
  stroke(C_LINE_SUBTLE);
  strokeWeight(1);
  line(-fw / 2, fy, fw / 2, fy);
  let kx = map(crossFaderVal, 0, 1, -fw / 2, fw / 2);
  applyShadow(5, 2, 2);
  fill(C_PANEL);
  noStroke();
  rect(kx, fy, w * 0.15, fh, 4);
  clearShadow();
  fill(C_LINE_SUBTLE);
  rect(kx, fy, 2, fh * 0.6);

  drawWaveform(0, -h * 0.05, w * 0.8, 30);
  pop();
}

function drawKnob(x, y, s, rotation, isActive) {
  push();
  translate(x, y);
  if (!isActive) applyShadow(5, 1, 1);
  fill(isActive ? 240 : C_PANEL);
  noStroke();
  ellipse(0, 0, s);
  clearShadow();
  rotate(rotation);
  stroke(isActive ? 0 : C_LINE_SUBTLE);
  strokeWeight(2);
  line(0, 0, 0, -s * 0.4);
  pop();
}

function drawRoundBtn(x, y, s, keyCodeNum, label, deck, targetIndex) {
  let isPressed = keyIsDown(keyCodeNum);
  push();
  translate(x, y);

  let isActive = deck.index === targetIndex;
  let ledCol = isPressed || isActive ? 150 : 240;
  fill(ledCol);
  noStroke();
  ellipse(s * 0.8, -s * 0.8, s * 0.2);

  if (!isPressed) applyShadow(5, 2, 2);
  fill(C_PANEL);
  noStroke();
  if (isPressed) translate(0, 1);
  ellipse(0, 0, s);
  clearShadow();

  fill(C_TEXT);
  textSize(s * 0.4);
  textAlign(CENTER, CENTER);
  text(label, 0, 0);
  pop();
}

function drawRectBtn(x, y, w, h, label, keyCodeNum) {
  let isPressed = keyCodeNum > 0 && keyIsDown(keyCodeNum);

  push();
  translate(x, y);
  let ledCol = isPressed ? 200 : 240;
  fill(ledCol);
  noStroke();
  ellipse(w / 2 + 5, -h / 2 + 5, 5); // Simple LED
  if (!isPressed) applyShadow(5, 2, 2);
  fill(C_PANEL);
  noStroke();
  if (isPressed) translate(0, 1);
  rect(0, 0, w, h, 6);
  clearShadow();
  fill(C_TEXT);
  textSize(h * 0.4);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  text(label, 0, 0);
  pop();
}

function drawWaveform(x, y, w, h) {
  let vol = 0;
  if (getAudioContext().state === "running") vol = mic.getLevel();
  push();
  translate(x, y);
  noFill();
  stroke(C_LINE_SUBTLE);
  strokeWeight(1);
  beginShape();
  for (let i = -w / 2; i < w / 2; i += 3) {
    let amp =
      map(noise(i * 0.1 + frameCount * 0.1), 0, 1, 0, h) * (vol * 5 + 0.2);
    vertex(i, amp * sin(i * 10));
  }
  endShape();
  pop();
}

function drawInvertedCursor() {
  push();
  blendMode(DIFFERENCE);
  noStroke();
  fill(255);
  ellipse(mouseX, mouseY, 30);
  pop();
}

function mouseWheel(e) {
  let speed = e.deltaY * 0.5;
  let influenceA = map(crossFaderVal, 0.6, 0.0, 0, 1, true);
  let influenceB = map(crossFaderVal, 0.4, 1.0, 0, 1, true);

  if (influenceA > 0) {
    deckA.targetRotation += speed * influenceA;
  }
  if (influenceB > 0) {
    deckB.targetRotation += speed * influenceB;
  }

  if (abs(e.deltaX) > 5) {
    crossFaderVal += e.deltaX * 0.001;
    crossFaderVal = constrain(crossFaderVal, 0, 1);
    if (frameCount % 5 === 0) playNoise();
  }
  return false;
}

function keyPressed() {
  // Key Mapping
  if (keyCode === 65) changeTrack(deckA, 0); // A
  if (keyCode === 83) changeTrack(deckA, 1); // S
  if (keyCode === 68) changeTrack(deckA, 2); // D
  if (keyCode === 70) changeTrack(deckA, 3); // F

  if (keyCode === 72) changeTrack(deckB, 0); // H
  if (keyCode === 74) changeTrack(deckB, 1); // J
  if (keyCode === 75) changeTrack(deckB, 2); // K
  if (keyCode === 76) changeTrack(deckB, 3); // L

  if (key >= "1" && key <= "6") {
    let mode = int(key);
    activeDeck.visualMode = mode;
    // Force reset sensors
    deckA.sensors = [];
    deckB.sensors = [];
    playTone(80 + mode);
  }
}

function changeTrack(deck, idx) {
  if (idx < deck.data.length) {
    deck.index = idx;
    deck.targetRotation += 180;
    playClick();
  }
}

function mousePressed() {
  userStartAudio();
  mic.start();
  playClick();

  let mx = width / 2;
  let my = height / 2;
  let localX = mouseX - mx;
  let localY = mouseY - my;
  // Layout values relative to mixer center
  let mh = height * 0.7;
  let mw = width * 0.2; // approx mixer width

  let ky_start = -mh * 0.3;
  let k_gap = mh * 0.12;

  for (let i = 0; i < 6; i++) {
    let col = i % 2;
    let row = floor(i / 2);
    let kx = col === 0 ? -mw * 0.25 : mw * 0.25;
    let ky = ky_start + row * k_gap;

    if (dist(localX, localY, kx, ky) < 20) {
      activeDeck.visualMode = i + 1;
      deckA.sensors = [];
      deckB.sensors = [];
      playTone(80 + i);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Force sensor update on resize
  deckA.sensors = [];
  deckB.sensors = [];
}
