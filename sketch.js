// --- Data Structure ---
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
let oscClick, envClick, oscTone, envTone, engineOsc, noiseOsc, noiseEnv;

// --- Palette ---
const C_BG = 250;
const C_PANEL = 255;
const C_TEXT = 40;
const C_LINE_SUBTLE = 220;
const C_SHADOW_COL = "rgba(0, 0, 0, 0.08)";

// --- Aspect Ratio Logic (16:9 Fixed) ---
const DESIGN_W = 1600;
const DESIGN_H = 900;
let drawScale = 1;
let drawOffX = 0;
let drawOffY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 커서 숨김 (모바일에서는 의미 없으나 PC에서는 숨김)
  // noCursor();

  angleMode(DEGREES);
  rectMode(CENTER);
  textFont("Arial");

  // [수정] 타이틀을 캔버스 그림이 아닌 HTML DOM 요소로 생성 (위치 고정 및 터치 통과를 위해)
  let titleDiv = createDiv("SYNTAX CONSOLE");
  titleDiv.id("syntaxconsole");
  // CSS 스타일 적용 (JS에서 직접 주입)
  titleDiv.style("position", "fixed");
  titleDiv.style("bottom", "0");
  titleDiv.style("left", "0");
  titleDiv.style("width", "100%");
  titleDiv.style("text-align", "center");
  titleDiv.style("padding-bottom", "20px");
  titleDiv.style("font-family", "Arial, sans-serif");
  titleDiv.style("font-weight", "bold");
  titleDiv.style("font-size", "5vw"); // 반응형 폰트 크기
  titleDiv.style("color", "#282828");
  titleDiv.style("z-index", "9999");
  titleDiv.style("pointer-events", "none"); // ★ 핵심: 터치가 글자를 뚫고 지나감
  titleDiv.style("user-select", "none");

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

  initSensors(deckA);
  initSensors(deckB);
}

function draw() {
  background(C_BG);

  // 1. 화면 비율 계산
  let scaleW = width / DESIGN_W;
  let scaleH = height / DESIGN_H;
  drawScale = min(scaleW, scaleH);
  drawOffX = (width - DESIGN_W * drawScale) / 2;
  drawOffY = (height - DESIGN_H * drawScale) / 2;

  // 2. Audio Logic
  if (getAudioContext().state === "running") {
    let vol = mic.getLevel();
    if (vol > 0.01) {
      engineOsc.freq(map(vol, 0, 0.5, 50, 120), 0.1);
      engineOsc.amp(map(vol, 0, 0.5, 0, 0.3), 0.1);
    } else {
      engineOsc.amp(0, 0.1);
    }
  }

  // 3. Physics Logic
  updateDeck(deckA);
  updateDeck(deckB);
  if (crossFaderVal < 0.45) activeDeck = deckA;
  else if (crossFaderVal > 0.55) activeDeck = deckB;

  // 4. Drawing
  push();
  translate(drawOffX, drawOffY);
  scale(drawScale);

  let refSize = min(DESIGN_W, DESIGN_H);
  let deckW = DESIGN_W * 0.35;
  let deckH = DESIGN_H * 0.6;
  let deckY = DESIGN_H * 0.35;
  let scaleBase = min(deckW, deckH) * 0.8;

  drawDeck(
    DESIGN_W * 0.25,
    deckY,
    deckW,
    deckH,
    deckA,
    ["A", "S", "D", "F"],
    scaleBase
  );
  drawDeck(
    DESIGN_W * 0.75,
    deckY,
    deckW,
    deckH,
    deckB,
    ["H", "J", "K", "L"],
    scaleBase
  );
  drawMixer(
    DESIGN_W / 2,
    DESIGN_H / 2,
    DESIGN_W * 0.2,
    DESIGN_H * 0.7,
    refSize
  );

  // [수정] drawBottomTitle() 삭제됨 -> HTML DOM으로 대체

  pop();

  // 5. Cursor
  // 모바일이 아닐 때만 커서 그리기 (선택 사항)
  // if (touches.length === 0) {
  drawInvertedCursor();
  // }

  if (keyIsDown(32)) {
    filter(INVERT);
  }
}

// --------------------------------------------------------
// Mouse & Touch Logic (Updated for Mobile)
// --------------------------------------------------------

function getVirtualMouse() {
  // 실제 마우스/터치 좌표를 1600x900 기준 좌표로 변환
  let vx = (mouseX - drawOffX) / drawScale;
  let vy = (mouseY - drawOffY) / drawScale;
  return { x: vx, y: vy };
}

// [추가] 모바일 드래그 인터랙션 (휠 대체)
function touchMoved() {
  // 브라우저 기본 스크롤 방지
  if (touches.length > 1) return;

  // Y축 움직임 감지 (스크래칭)
  let speed = (mouseY - pmouseY) * 0.5;

  let influenceA = map(crossFaderVal, 0.6, 0.0, 0, 1, true);
  let influenceB = map(crossFaderVal, 0.4, 1.0, 0, 1, true);

  if (influenceA > 0) deckA.targetRotation += speed * influenceA;
  if (influenceB > 0) deckB.targetRotation += speed * influenceB;

  // 하단부 터치 후 가로(X축) 드래그 시 크로스페이더 조절
  if (mouseY > height * 0.6) {
    let xSpeed = (mouseX - pmouseX) * 0.002;
    // 움직임이 있을 때만 업데이트
    if (abs(xSpeed) > 0) {
      crossFaderVal += xSpeed;
      crossFaderVal = constrain(crossFaderVal, 0, 1);
      if (frameCount % 5 === 0) playNoise();
    }
  }

  return false;
}

// [수정] 마우스/터치 클릭 시 버튼 동작 처리
function mousePressed() {
  userStartAudio();
  if (mic) mic.start();
  playClick();

  let vMouse = getVirtualMouse();
  // 중앙(0,0) 기준 좌표가 아닌 좌상단(0,0) 기준 좌표값 그대로 사용 (draw 함수 내 translate 고려)
  // 단, draw 함수에서는 translate(drawOffX, drawOffY) 후 scale(drawScale)을 했으므로
  // vMouse는 이미 스케일과 오프셋이 반영된 1600x900 공간의 좌표임.

  // 믹서나 덱의 좌표계는 DESIGN_W/2 를 중심으로 그려지는 경우가 많음.
  // 따라서 거리 계산을 위해 로컬 좌표 계산
  let localX = vMouse.x - DESIGN_W / 2;
  let localY = vMouse.y - DESIGN_H / 2;

  // 1. Mixer Buttons (Visual Mode)
  let mh = DESIGN_H * 0.7;
  let mw = DESIGN_W * 0.2;
  let ky_start = -mh * 0.3;
  let k_gap = mh * 0.12;

  for (let i = 0; i < 6; i++) {
    let col = i % 2;
    let row = floor(i / 2);
    let kx = col === 0 ? -mw * 0.25 : mw * 0.25;
    let ky = ky_start + row * k_gap;

    // 믹서 버튼 히트 박스
    if (dist(localX, localY, kx, ky) < 30) {
      activeDeck.visualMode = i + 1;
      deckA.sensors = [];
      deckB.sensors = [];
      playTone(80 + i);
      return;
    }
  }

  // 2. Deck Buttons (Track Change)
  // Deck 위치와 크기 (drawDeck 함수와 동일한 로직)
  let deckW = DESIGN_W * 0.35;
  let deckH = DESIGN_H * 0.6;
  // 덱의 중심 Y좌표 (DESIGN_H 기준) -> 로컬 좌표로 변환 필요
  // drawDeck 호출 시: y = DESIGN_H * 0.35
  // 우리가 사용하는 localY는 화면 중앙이 (0,0)이므로:
  let deckCenterY = DESIGN_H * 0.35 - DESIGN_H / 2;

  let btnGap = deckW * 0.2;
  let btnY_Offset = -deckH * 0.4;

  // Deck A Center X (로컬 좌표)
  let deckACenterX = DESIGN_W * 0.25 - DESIGN_W / 2;
  // Deck B Center X (로컬 좌표)
  let deckBCenterX = DESIGN_W * 0.75 - DESIGN_W / 2;

  function checkDeckBtns(deck, centerX) {
    for (let i = 0; i < 4; i++) {
      let bx = (i - 1.5) * btnGap;
      // 버튼의 절대 위치 (로컬 좌표계 상)
      let btnAbsX = centerX + bx;
      let btnAbsY = deckCenterY + btnY_Offset;

      if (dist(localX, localY, btnAbsX, btnAbsY) < 40) {
        // 터치 범위 넉넉하게
        changeTrack(deck, i);
        return true;
      }
    }
    return false;
  }

  if (!checkDeckBtns(deckA, deckACenterX)) {
    checkDeckBtns(deckB, deckBCenterX);
  }
}

// 마우스 휠 (PC용)
function mouseWheel(e) {
  let speed = e.deltaY * 0.5;
  let influenceA = map(crossFaderVal, 0.6, 0.0, 0, 1, true);
  let influenceB = map(crossFaderVal, 0.4, 1.0, 0, 1, true);

  if (influenceA > 0) deckA.targetRotation += speed * influenceA;
  if (influenceB > 0) deckB.targetRotation += speed * influenceB;

  if (abs(e.deltaX) > 5) {
    crossFaderVal += e.deltaX * 0.001;
    crossFaderVal = constrain(crossFaderVal, 0, 1);
    if (frameCount % 5 === 0) playNoise();
  }
  return false;
}

// 키보드 입력 (PC용)
function keyPressed() {
  if (keyCode === 65) changeTrack(deckA, 0);
  if (keyCode === 83) changeTrack(deckA, 1);
  if (keyCode === 68) changeTrack(deckA, 2);
  if (keyCode === 70) changeTrack(deckA, 3);

  if (keyCode === 72) changeTrack(deckB, 0);
  if (keyCode === 74) changeTrack(deckB, 1);
  if (keyCode === 75) changeTrack(deckB, 2);
  if (keyCode === 76) changeTrack(deckB, 3);

  if (key >= "1" && key <= "6") {
    let mode = int(key);
    activeDeck.visualMode = mode;
    deckA.sensors = [];
    deckB.sensors = [];
    playTone(80 + mode);
  }
}

// --------------------------------------------------------
// Logic Helpers
// --------------------------------------------------------
function initSensors(deck) {
  deck.sensors = [];
}

function updateSensors(deck, s) {
  if (deck.sensors.length === 0 || deck.lastVisualMode !== deck.visualMode) {
    deck.sensors = [];
    deck.lastVisualMode = deck.visualMode;

    let r1 = s * 0.18,
      r2 = s * 0.28,
      r3 = s * 0.38,
      baseSize = s * 0.02;
    let mode = deck.visualMode;

    if (mode === 1) {
      // Cross
      let dists = [r1, r2, r3],
        angles = [0, 90, 180, 270];
      for (let d of dists)
        for (let a of angles)
          deck.sensors.push(createSensor(d * cos(a), d * sin(a), baseSize));
    } else if (mode === 2) {
      // Ring
      let counts = [8, 12, 16],
        radii = [r1, r2, r3];
      for (let k = 0; k < 3; k++)
        for (let i = 0; i < counts[k]; i++) {
          let a = (360 / counts[k]) * i;
          deck.sensors.push(
            createSensor(radii[k] * cos(a), radii[k] * sin(a), baseSize)
          );
        }
    } else if (mode === 3) {
      // Scatter
      randomSeed(999);
      for (let i = 0; i < 25; i++) {
        let rChoice = random([r1, r2, r3]),
          r = rChoice + random(-s * 0.02, s * 0.02),
          a = random(360);
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
        let r = map(i, 0, count, s * 0.1, s * 0.45),
          a = i * 20;
        deck.sensors.push(createSensor(r * cos(a), r * sin(a), baseSize));
      }
    } else if (mode === 6) {
      // Grid
      let grid = s * 0.1;
      for (let x = -s * 0.4; x <= s * 0.4; x += grid)
        for (let y = -s * 0.4; y <= s * 0.4; y += grid) {
          if (dist(0, 0, x, y) < s * 0.42 && dist(0, 0, x, y) > s * 0.12)
            deck.sensors.push(createSensor(x, y, baseSize));
        }
    }
  }
}

function createSensor(x, y, base) {
  return { x: x, y: y, base: base, curr: base, target: base };
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

function changeTrack(deck, idx) {
  if (idx < deck.data.length) {
    deck.index = idx;
    deck.targetRotation += 180;
    playClick();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  deckA.sensors = [];
  deckB.sensors = [];
}

// --------------------------------------------------------
// Drawing Components
// --------------------------------------------------------
function drawDeck(x, y, w, h, deck, btnLabels, scaleBase) {
  push();
  translate(x, y);

  applyShadow(20, 5, 5);
  fill(C_PANEL);
  noStroke();
  rect(0, 0, w, h, 20);
  clearShadow();

  let btnY = -h * 0.4;
  let btnGap = w * 0.2;
  // KeyCodes only for PC visual feedback
  let keyCodes = deck.name === "DECK A" ? [65, 83, 68, 70] : [72, 74, 75, 76];

  for (let i = 0; i < 4; i++) {
    let bx = (i - 1.5) * btnGap;
    let btnSize = min(w, h) * 0.08;
    drawRoundBtn(bx, btnY, btnSize, keyCodes[i], btnLabels[i], deck, i);
  }
  drawKineticJogWheel(0, h * 0.15, scaleBase, deck);
  pop();
}

function drawKineticJogWheel(x, y, s, deck) {
  updateSensors(deck, s);
  push();
  translate(x, y);

  applyShadow(15, 4, 4);
  fill(C_PANEL);
  noStroke();
  ellipse(0, 0, s);
  clearShadow();

  noFill();
  stroke(0);
  strokeWeight(1);
  for (let sensor of deck.sensors) {
    ellipse(sensor.x, sensor.y, sensor.curr);
    fill(0);
    noStroke();
    ellipse(sensor.x, sensor.y, s * 0.005);
    noFill();
    stroke(0);
  }

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
  drawTextRing(t1, s * 0.18, uniformTextSize, deck, s);
  drawTextRing(t2, s * 0.28, uniformTextSize, deck, s);
  drawTextRing(t3, s * 0.38, uniformTextSize, deck, s);
  pop();

  noFill();
  stroke(C_LINE_SUBTLE);
  strokeWeight(1);
  ellipse(0, 0, s * 0.1);
  pop();
}

function drawTextRing(str, radius, fontSize, deck, s) {
  textSize(fontSize);
  let chars = str.split("");
  let desiredArcLen = s * 0.05;
  let angleStep = degrees(desiredArcLen / radius);

  for (let i = 0; i < chars.length; i++) {
    let char = chars[i];
    let charLocalAngle = i * angleStep;
    let totalAngle = (charLocalAngle + deck.rotation - 90) % 360;
    let cx = radius * cos(totalAngle);
    let cy = radius * sin(totalAngle);

    for (let sensor of deck.sensors) {
      if (dist(cx, cy, sensor.x, sensor.y) < s * 0.05) sensor.target = s * 0.07;
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

  let ky_start = -h * 0.3,
    k_gap = h * 0.12,
    knobSize = min(w, h) * 0.12;
  for (let i = 0; i < 6; i++) {
    let col = i % 2,
      row = floor(i / 2);
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

  drawRectBtn(0, h * 0.15, w * 0.6, h * 0.08, "SPACE", 32);

  let fy = h * 0.35,
    fw = w * 0.8,
    fh = h * 0.05;
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
  ellipse(w / 2 + 5, -h / 2 + 5, 5);
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

// Helpers
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
