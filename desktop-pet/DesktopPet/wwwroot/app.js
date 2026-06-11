var MODEL_URL = "https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model@master/Live2D/Senko_Normals/senko.model3.json";

var MOTION_MAP = {
  idle:  ["Idle", "idle"],
  tap:   ["tap_body", "TapBody", "tap"],
  wave:  ["wave", "Wave", "wink"],
};

var app = null;
var model = null;
var dragEnabled = true;
var eyeEnabled = true;
var isDragging = false;
var dragStartX = 0, dragStartY = 0, modelStartX = 0, modelStartY = 0;
var pointerX = 0.5, pointerY = 0.5;
var animId = 0;

function getModelUrl() { return MODEL_URL; }
function setModelUrl(url) { MODEL_URL = url; }

function init() {
  var canvas = document.getElementById("canvas");
  var parent = canvas.parentElement;
  var w = parent.clientWidth;
  var h = parent.clientHeight;

  PIXI.Live2DModel.registerTicker(PIXI.Ticker);

  app = new PIXI.Application({
    width: w, height: h,
    view: canvas,
    backgroundColor: 0x000000,
    backgroundAlpha: 0,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    antialias: true,
  });
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  loadModel();

  // Mouse events
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointerleave", onUp);

  // Eye tracking loop
  function eyeLoop() {
    if (model && eyeEnabled && !isDragging && app) {
      var rect = canvas.getBoundingClientRect();
      if (rect.width > 0) {
        var nx = (pointerX - rect.left) / rect.width;
        var ny = (pointerY - rect.top) / rect.height;
        model.focus((nx - 0.5) * 80, (ny - 0.5) * 50);
      }
    }
    animId = requestAnimationFrame(eyeLoop);
  }
  eyeLoop();

  // Window resize
  window.addEventListener("resize", function() {
    var pw = parent.clientWidth, ph = parent.clientHeight;
    app.renderer.resize(pw, ph);
    if (model) fitModel(model);
  });
}

function loadModel() {
  if (!app) return;
  if (model) {
    app.stage.removeChild(model);
    try { model.destroy(); } catch(e) {}
    model = null;
  }

  var m = new PIXI.Live2DModel();
  PIXI.Live2DFactory.setupLive2DModel(m, { url: MODEL_URL }, { autoInteract: false })
    .then(function() {
      m.anchor.set(0.5, 0.5);
      model = m;
      fitModel(m);
      app.stage.addChild(m);

      // Hit test
      m.on("hit", function(areas) {
        for (var i = 0; i < areas.length; i++) {
          if (areas[i] === "head") { playAction("tap"); return; }
        }
      });
    })
    .catch(function(err) {
      console.error("Model load failed:", err);
      showToast("模型加载失败");
    });
}

function fitModel(m) {
  var w = app.screen.width, h = app.screen.height;
  var maxDim = Math.min(w, h) * 0.5;
  var scale = Math.min(maxDim / Math.max(m.width, m.height, 1), 1);
  m.scale.set(scale, scale);
  m.x = w / 2;
  m.y = h / 2;
}

function playAction(action) {
  if (!model) return;
  if (action === "blink") { blink(); return; }

  var candidates = MOTION_MAP[action];
  if (!candidates) return;

  var internal = model.internalModel;
  if (!internal || !internal.motionManager || !internal.motionManager.definitions) return;

  var defs = internal.motionManager.definitions;
  for (var g in defs) {
    if (!defs.hasOwnProperty(g)) continue;
    var gl = g.toLowerCase();
    for (var ci = 0; ci < candidates.length; ci++) {
      if (gl.indexOf(candidates[ci].toLowerCase()) >= 0) {
        var idx = Math.floor(Math.random() * defs[g].length);
        try { model.motion(g, idx, 2); } catch(e) {}
        return;
      }
    }
  }
}

function blink() {
  var im = model ? model.internalModel : null;
  if (im && im.eyeBlink) {
    im.eyeBlink.setWeight(1);
    im.eyeBlink.setInterval(0);
    setTimeout(function() { if (im.eyeBlink) im.eyeBlink.setWeight(0); }, 150);
  }
}

function onDown(e) {
  if (!model || !dragEnabled) return;
  isDragging = true;
  dragStartX = e.clientX; dragStartY = e.clientY;
  modelStartX = model.x; modelStartY = model.y;
}

function onMove(e) {
  pointerX = e.clientX; pointerY = e.clientY;
  if (isDragging && dragEnabled && model) {
    model.x = modelStartX + (e.clientX - dragStartX);
    model.y = modelStartY + (e.clientY - dragStartY);
  }
}

function onUp() { isDragging = false; }

function showToast(msg) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(function() { el.classList.remove("show"); }, 2000);
}

// UI bindings
document.addEventListener("DOMContentLoaded", function() {
  init();

  document.getElementById("btnDrag").addEventListener("click", function() {
    dragEnabled = !dragEnabled;
    this.classList.toggle("active");
    showToast(dragEnabled ? "拖拽已开启" : "拖拽已关闭");
  });

  document.getElementById("btnEye").addEventListener("click", function() {
    eyeEnabled = !eyeEnabled;
    this.classList.toggle("active");
    showToast(eyeEnabled ? "眼神追踪已开启" : "眼神追踪已关闭");
  });

  document.getElementById("btnTap").addEventListener("click", function() { playAction("tap"); });
  document.getElementById("btnWave").addEventListener("click", function() { playAction("wave"); });
  document.getElementById("btnBlink").addEventListener("click", function() { playAction("blink"); });

  document.getElementById("btnReset").addEventListener("click", function() {
    if (model && app) fitModel(model);
    showToast("已重置位置");
  });
});
