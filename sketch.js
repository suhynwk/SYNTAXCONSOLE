// ==========================================
// SYNTAX CONSOLE - FINAL TOUCH VERSION
// ==========================================

// --- Data Structure ---
let deckA_Data = [
  { title: "TIME MEMORY", desc: "INTERACTING WITH THE FLOW", sub: "SYSTEM PROCESSING DATA STREAM A // " },
  { title: "PAST FUTURE", desc: "RECONSTRUCTING FRAGMENTS", sub: "BUFFERING SEQUENCE INITIATED // " },
  { title: "CORE LOGIC", desc: "SEARCHING FOR PATTERNS", sub: "ALGORITHM OPTIMIZATION RUNNING // " },
  { title: "DEEP DIVE", desc: "NAVIGATING THE LAYERS", sub: "DEPTH ANALYSIS COMPLETE // " },
  { title: "VOID SPACE", desc: "FILLING THE EMPTY VOID", sub: "NULL POINTER EXCEPTION ERROR // " },
];
let deckB_Data = [
  { title: "SOUND WAVE", desc: "VISUALIZING THE AUDIO", sub: "FREQUENCY MODULATION SYNC // " },
  { title: "ECHO LOOP", desc: "REPEATING THE SIGNALS", sub: "FEEDBACK LOOP DETECTED // " },
  { title: "NOISE GATE", desc: "FILTERING INTERFERENCE", sub: "THRESHOLD LIMIT REACHED // " },
  { title: "PULSE RATE", desc: "SYNCHRONIZING BEATS", sub: "BPM MATCHING SEQUENCE // " },
  { title: "FLAT LINE", desc: "TERMINATING PROCESS", sub: "CONNECTION TERMINATED // " },
];

// --- Global Variables ---
let deckA = { name: "DECK A", data: deckA_Data, index: 0, rotation: 0, targetRotation: 0, isLooping: false, visualMode: 1, sensors: [] };
let deckB = { name: "DECK B", data: deckB_Data, index: 0, rotation: 0, targetRotation: 0, isLooping: false, visualMode: 1, sensors: [] };
let crossFaderVal = 0.5;
let activeDeck = deckA;
let mic;

// --- Sound Objects ---
let oscClick, envClick, oscTone, envTone, engineOsc, noiseOsc, noiseEnv;

// --- Constants ---
const DESIGN_W = 1600;
const DESIGN_H = 900;
let drawScale = 1;
let drawOffX = 0;
let drawOffY = 0;

// --- Colors ---
const C_BG = 250;
const C_PANEL = 255;
const C_TEXT = 40;
const C_LINE_SUBTLE = 220;
const C_SHADOW_COL = "rgba(0, 0, 0, 0.08)";

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  rectMode(CENTER);
  textFont("Arial");

  // [HTML 타이틀 생성] - 에러 방지를 위해 p5 dom 기능 사용
  let titleDiv = createDiv('SYNTAX CONSOLE');
  titleDiv.id('syntaxconsole');
  titleDiv.style('position', 'fixed');
  titleDiv.style('bottom', '0');
  titleDiv.style('left', '0');
  titleDiv.style('width', '100%');
  titleDiv.style('text-align', 'center');
  titleDiv.style('padding-bottom', '20px');
  titleDiv.style('font-family', 'Arial, sans-serif');
  titleDiv.style('font-weight', 'bold');
  titleDiv.style('font-size', '5vw');
  titleDiv.style('color', '#282828');
  titleDiv.style('z-index', '9999');
  titleDiv.style('pointer-events', 'none');
  titleDiv.style('user-select', 'none');

  // [Audio Setup] - 안전장치 추가
  try {
    mic = new p5.AudioIn();
    
    oscClick = new p5.Oscillator("square");
    envClick = new p5.Envelope(0.001, 0.05, 0.01, 0.05);
    oscClick.start(); oscClick.amp(0);

    oscTone = new p5.Oscillator("sine");
    envTone = new p5.Envelope(0.01, 0.2, 0.1, 0.2);
    oscTone.start(); oscTone.amp(0);

    engineOsc = new p5.Oscillator("sawtooth");
    engineOsc.freq(50);
    engineOsc.start(); engineOsc.amp(0);

    noiseOsc = new p5.Noise("white");
    noiseEnv = new p5.Envelope(0.01, 0.1, 0, 0.1);
    noiseOsc.start(); noiseOsc.amp(0);
  } catch (e) {
    console.log("Audio Init Error: " + e);
  }

  initSensors(deckA);
  initSensors(deckB);
}

function draw() {
  background(C_BG);

  // 화면 비율 계산
  let scaleW = width / DESIGN_W;
  let scaleH = height / DESIGN_H;
  drawScale = min(scaleW, scaleH);
  drawOffX = (width - DESIGN_W * drawScale) / 2;
  drawOffY = (height - DESIGN_H * drawScale) / 2;

  // Audio Processing
  if (getAudioContext().state === "running" && mic) {
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

  // Drawing
  push();
  translate(drawOffX, drawOffY);
  scale(drawScale);

  let refSize = min(DESIGN_W, DESIGN_H);
  let deckW = DESIGN_W * 0.35;
  let deckH = DESIGN_H * 0.6;
  let deckY = DESIGN_H * 0.35;
  let scaleBase = min(deckW, deckH) * 0.8;

  drawDeck(DESIGN_W * 0.25, deckY, deckW, deckH, deckA, ["A", "S", "D", "F"], scaleBase);
  drawDeck(DESIGN_W * 0.75, deckY, deckW, deckH, deckB, ["H", "J", "K", "L"], scaleBase);
  drawMixer(DESIGN_W / 2, DESIGN_H / 2, DESIGN_W * 0.2, DESIGN_H * 0.7, refSize);

  pop();

  // 커서 또는 터치 가이드
  if (touches.length > 0) {
    // 터치 시 시각적 피드백
    noFill();
    stroke(0, 50);
    strokeWeight(2);
    ellipse(mouseX, mouseY, 40);
  } else {
    drawInvertedCursor();
  }

  if (keyIsDown(32)) filter(INVERT);
}

// --------------------------------------------------------
// ★ INTERACTION LOGIC (Fixed) ★
// --------------------------------------------------------

// 터치 드래그 (덱 돌리기 / 크로스페이더)
function touchMoved() {
  // 1. 움직임 계산
  let diffY = mouseY - pmouseY; 
  let diffX = mouseX - pmouseX;

  // 2. 영역별 동작
  if (mouseY > height * 0.75) {
     // 하단: 크로스페이더
     if (abs(diffX) > 0) {
       crossFaderVal += diffX * 0.002;
       crossFaderVal = constrain(crossFaderVal, 0, 1);
       if (frameCount % 5 === 0) playNoise();
     }
  } else {
    // 상단: 덱 스크래칭
    let rotSpeed = diffY * 1.5; 
    if (mouseX < width / 2) {
      deckA.targetRotation += rotSpeed;
    } else {
      deckB.targetRotation += rotSpeed;
    }
  }
  return false; // 스크롤 방지
}

// PC 마우스 드래그 대응
function mouseDragged() {
  if (touches.length === 0) {
    touchMoved();
  }
  return false;
}

// 터치/클릭 시작 (버튼 누르기)
function touchStarted() {
  startAudioContext(); // 오디오 켜기
  handleTap(mouseX, mouseY);
  return false;
}

function mousePressed() {
  if (touches.length === 0) {
    startAudioContext();
    handleTap(mouseX, mouseY);
  }
}

// 오디오 시작 헬퍼
function startAudioContext() {
  if (getAudioContext().state !== 'running') {
    userStartAudio();
  }
  if (mic) {
    try { mic.start(); } catch(e) {}
  }
}

// 탭 처리 (버튼 인식)
function handleTap(mx, my) {
  playClick();
  
  // 좌표 변환
  let vx = (mx - drawOffX) / drawScale;
  let vy = (my - drawOffY) / drawScale;
  let localX = vx - DESIGN_W / 2;
  let localY = vy - DESIGN_H / 2;

  // 1. Mixer Buttons
  let mh = DESIGN_H * 0.7;
  let mw = DESIGN_W * 0.2;
  let ky_start = -mh * 0.3;
  let k_gap = mh * 0.12;

  for (let i = 0; i < 6; i++) {
    let col = i % 2;
    let row = floor(i / 2);
    let kx = col === 0 ? -mw * 0.25 : mw * 0.25;
    let ky = ky_start + row * k_gap;
    if (dist(localX, localY, kx, ky) < 60) {
      activeDeck.visualMode = i + 1;
      deckA.sensors = []; deckB.sensors = [];
      playTone(80 + i);
      return; 
    }
  }

  // 2. Deck Buttons
  let deckW = DESIGN_W * 0.35;
  let deckH = DESIGN_H * 0.6;
  let deckCenterY = (DESIGN_H * 0.35) - (DESIGN_H / 2);
  let btnGap = deckW * 0.2;
  let btnY_Offset = -deckH * 0.4;
  
  let deckACenterX = (DESIGN_W * 0.25) - (DESIGN_W / 2);
  let deckBCenterX = (DESIGN_W * 0.75) - (DESIGN_W / 2);

  function checkDeckBtns(deck, centerX) {
    for (let i = 0; i < 4; i++) {
      let bx = (i - 1.5) * btnGap;
      let absX = centerX + bx;
      let absY = deckCenterY + btnY_Offset;
      if (dist(localX, localY, absX, absY) < 70) {
        changeTrack(deck, i);
        return true;
      }
    }
    return false;
  }
  
  if(!checkDeckBtns(deckA, deckACenterX)) {
    checkDeckBtns(deckB, deckBCenterX);
  }
}

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
    deckA.sensors = []; deckB.sensors = [];
    playTone(80 + mode);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  deckA.sensors = []; deckB.sensors = [];
}

// --------------------------------------------------------
// Drawing Functions
// --------------------------------------------------------
function drawDeck(x, y, w, h, deck, btnLabels, scaleBase) {
  push();
  translate(x, y);
  applyShadow(20, 5, 5);
  fill(C_PANEL); noStroke();
  rect(0, 0, w, h, 20);
  clearShadow();

  let btnY = -h * 0.4;
  let btnGap = w * 0.2;
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
  fill(C_PANEL); noStroke();
  ellipse(0, 0, s);
  clearShadow();

  noFill(); stroke(0); strokeWeight(1);
  for (let sensor of deck.sensors) {
    ellipse(sensor.x, sensor.y, sensor.curr);
    fill(0); noStroke();
    ellipse(sensor.x, sensor.y, s * 0.005);
    noFill(); stroke(0);
  }

  push();
  rotate(deck.rotation);
  let t1 = deck.data[deck.index].title;
  let t2 = deck.data[deck.index].desc;
  let t3 = deck.data[deck.index].sub;
  fill(C_TEXT); noStroke();
  textAlign(CENTER, CENTER);
  let uniformTextSize = s * 0.045;
  textStyle(NORMAL);
  drawTextRing(t1, s * 0.18, uniformTextSize, deck, s);
  drawTextRing(t2, s * 0.28, uniformTextSize, deck, s);
  drawTextRing(t3, s * 0.38, uniformTextSize, deck, s);
  pop();

  noFill(); stroke(C_LINE_SUBTLE); strokeWeight(1);
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
  fill(C_PANEL); noStroke();
  rect(0, 0, w, h, 20);
  clearShadow();

  let ky_start = -h * 0.3, k_gap = h * 0.12, knobSize = min(w, h) * 0.12;
  for (let i = 0; i < 6; i++) {
    let col = i % 2, row = floor(i / 2);
    let kx = col === 0 ? -w * 0.25 : w * 0.25;
    let ky = ky_start + row * k_gap;
    let modeNum = i + 1;
    let isActive = activeDeck.visualMode === modeNum;
    let rot = isActive ? frameCount * 5 : -45;
    drawKnob(kx, ky, knobSize, rot, isActive);
    fill(150); noStroke();
    textSize(refSize * 0.01);
    text(modeNum, kx, ky + knobSize * 0.8);
  }

  drawRectBtn(0, h * 0.15, w * 0.6, h * 0.08, "SPACE", 32);

  let fy = h * 0.35, fw = w * 0.8, fh = h * 0.05;
  stroke(C_LINE_SUBTLE); strokeWeight(1);
  line(-fw / 2, fy, fw / 2, fy);
  let kx = map(crossFaderVal, 0, 1, -fw / 2, fw / 2);
  applyShadow(5, 2, 2);
  fill(C_PANEL); noStroke();
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
  fill(isActive ? 240 : C_PANEL); noStroke();
  ellipse(0, 0, s);
  clearShadow();
  rotate(rotation);
  stroke(isActive ? 0 : C_LINE_SUBTLE); strokeWeight(2);
  line(0, 0, 0, -s * 0.4);
  pop();
}

function drawRoundBtn(x, y, s, keyCodeNum, label, deck, targetIndex) {
  let isPressed = keyIsDown(keyCodeNum);
  push();
  translate(x, y);
  let isActive = deck.index === targetIndex;
  let ledCol = isPressed || isActive ? 150 : 240;
  fill(ledCol); noStroke();
  ellipse(s * 0.8, -s * 0.8, s * 0.2);
  if (!isPressed) applyShadow(5, 2, 2);
  fill(C_PANEL); noStroke();
  if (isPressed) translate(0, 1);
  ellipse(0, 0, s);
  clearShadow();
  fill(C_TEXT); textSize(s * 0.4); textAlign(CENTER, CENTER);
  text(label, 0, 0);
  pop();
}

function drawRectBtn(x, y, w, h, label, keyCodeNum) {
  let isPressed = keyCodeNum > 0 && keyIsDown(keyCodeNum);
  push();
  translate(x, y);
  let ledCol = isPressed ? 200 : 240;
  fill(ledCol); noStroke();
  ellipse(w / 2 + 5, -h / 2 + 5, 5);
  if (!isPressed) applyShadow(5, 2, 2);
  fill(C_PANEL); noStroke();
  if (isPressed) translate(0, 1);
  rect(0, 0, w, h, 6);
  clearShadow();
  fill(C_TEXT); textSize(h * 0.4); textStyle(NORMAL); textAlign(CENTER, CENTER);
  text(label, 0, 0);
  pop();
}

function drawWaveform(x, y, w, h) {
  let vol = 0;
  if (getAudioContext().state === "running" && mic) vol = mic.getLevel();
  push();
  translate(x, y);
  noFill(); stroke(C_LINE_SUBTLE); strokeWeight(1);
  beginShape();
  for (let i = -w / 2; i < w / 2; i += 3) {
    let amp = map(noise(i * 0.1 + frameCount * 0.1), 0, 1, 0, h) * (vol * 5 + 0.2);
    vertex(i, amp * sin(i * 10));
  }
  endShape();
  pop();
}

function drawInvertedCursor() {
  push(); blendMode(DIFFERENCE); noStroke(); fill(255);
  ellipse(mouseX, mouseY, 30);
  pop();
}

function initSensors(deck) { deck.sensors = []; }
function updateSensors(deck, s) {
  if (deck.sensors.length === 0 || deck.lastVisualMode !== deck.visualMode) {
    deck.sensors = []; deck.lastVisualMode = deck.visualMode;
    let r1 = s * 0.18, r2 = s * 0.28, r3 = s * 0.38, baseSize = s * 0.02;
    let mode = deck.visualMode;
    if (mode === 1) { 
      let dists = [r1, r2, r3], angles = [0, 90, 180, 270];
      for (let d of dists) for (let a of angles) deck.sensors.push(createSensor(d * cos(a), d * sin(a), baseSize));
    } else if (mode === 2) { 
      let counts = [8, 12, 16], radii = [r1, r2, r3];
      for (let k = 0; k < 3; k++) for (let i = 0; i < counts[k]; i++) {
        let a = (360 / counts[k]) * i; deck.sensors.push(createSensor(radii[k] * cos(a), radii[k] * sin(a), baseSize));
      }
    } else if (mode === 3) { 
      randomSeed(999);
      for (let i = 0; i < 25; i++) {
        let rChoice = random([r1, r2, r3]), r = rChoice + random(-s * 0.02, s * 0.02), a = random(360);
        deck.sensors.push(createSensor(r * cos(a), r * sin(a), baseSize));
      }
    } else if (mode === 4) { 
      let count = 12;
      for (let k = 0; k < 3; k++) {
        let r = [r1, r2, r3][k];
        for (let i = 0; i < count; i++) {
          let a = (360 / count) * i + k * 15;
          deck.sensors.push(createSensor(r * cos(a), r * sin(a), baseSize));
        }
      }
    } else if (mode === 5) { 
      let count = 36;
      for (let i = 0; i < count; i++) {
        let r = map(i, 0, count, s * 0.1, s * 0.45), a = i * 20;
        deck.sensors.push(createSensor(r * cos(a), r * sin(a), baseSize));
      }
    } else if (mode === 6) { 
      let grid = s * 0.1;
      for (let x = -s * 0.4; x <= s * 0.4; x += grid) for (let y = -s * 0.4; y <= s * 0.4; y += grid) {
        if (dist(0, 0, x, y) < s * 0.42 && dist(0, 0, x, y) > s * 0.12) deck.sensors.push(createSensor(x, y, baseSize));
      }
    }
  }
}
function createSensor(x, y, base) { return { x: x, y: y, base: base, curr: base, target: base }; }
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
  if (idx < deck.data.length) { deck.index = idx; deck.targetRotation += 180; playClick(); }
}
function applyShadow(blur = 15, offX = 3, offY = 3) {
  drawingContext.shadowColor = C_SHADOW_COL; drawingContext.shadowBlur = blur;
  drawingContext.shadowOffsetX = offX; drawingContext.shadowOffsetY = offY;
}
function clearShadow() {
  drawingContext.shadowColor = "transparent"; drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetX = 0; drawingContext.shadowOffsetY = 0;
}
function playClick() { if(oscClick) { oscClick.freq(random(800, 1200)); envClick.play(oscClick); } }
function playTone(note) { if(oscTone) { oscTone.freq(midiToFreq(note)); envTone.play(oscTone); } }
function playNoise() { if(noiseOsc) noiseEnv.play(noiseOsc); }
