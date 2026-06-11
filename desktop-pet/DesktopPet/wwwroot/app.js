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

function debug(msg) {
  console.log("[Pet]", msg);
}

function init() {
  debug("Initializing...");

  // Check if Live2D is available
  if (typeof PIXI === "undefined") {
    showToast("错误: PIXI.js 未加载");
    return;
  }
  if (typeof PIXI.Live2DModel === "undefined") {
    showToast("错误: Live2D 引擎未加载 (pixi-live2d-display)");
    debug("PIXI keys: " + Object.keys(PIXI).filter(function(k) { return k.indexOf("Live") >= 0 || k.indexOf("live") >= 0; }).join(", "));
    return;
  }

  var canvas = document.getElementById("canvas");
  if (!canvas) { showToast("错误: 找不到 Canvas"); return; }

  var parent = canvas.parentElement;
  var w = parent.clientWidth;
  var h = parent.clientHeight;
  debug("Canvas size: " + w + "x" + h);

  PIXI.Live2DModel.registerTicker(PIXI.Ticker);

  try {
    app = new PIXI.Application({
      width: w, height: h,
      view: canvas,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      antialias: true,
    });
  } catch(e) {
    showToast("PIXI 初始化失败: " + e.message);
    return;
  }

  canvas.style.width = "100%";
  canvas.style.height = "100%";
  debug("PIXI app created");

  loadModel();

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointerleave", onUp);

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

  window.addEventListener("resize", function() {
    var pw = parent.clientWidth, ph = parent.clientHeight;
    app.renderer.resize(pw, ph);
    if (model) fitModel(model);
  });
}

function loadModel() {
  if (!app) return;
  if (model) { app.stage.removeChild(model); try { model.destroy(); } catch(e) {} model = null; }

  debug("Loading model from: " + MODEL_URL);
  showToast("正在加载模型...");

  var m = new PIXI.Live2DModel();
  PIXI.Live2DFactory.setupLive2DModel(m, { url: MODEL_URL }, { autoInteract: false })
    .then(function() {
      m.anchor.set(0.5, 0.5);
      model = m;
      fitModel(m);
      app.stage.addChild(m);
      debug("Model loaded successfully");
      showToast("模型已加载");

      m.on("hit", function(areas) {
        debug("Hit: " + areas.join(", "));
        for (var i = 0; i < areas.length; i++) {
          if (areas[i] === "head") { playAction("tap"); return; }
        }
      });
    })
    .catch(function(err) {
      console.error("[Pet] Model load ERROR:", err);
      debug("Model load failed: " + (err.message || err));
      showToast("模型加载失败: " + (err.message || "未知错误，请查看控制台"));
    });
}

function fitModel(m) {
  var w = app.screen.width, h = app.screen.height;
  var maxDim = Math.min(w, h) * 0.5;
  var scale = Math.min(maxDim / Math.max(m.width, m.height, 1), 1);
  m.scale.set(scale, scale);
  m.x = w / 2;
  m.y = h / 2;
  debug("Model fitted: scale=" + scale.toFixed(3) + ", pos=" + m.x.toFixed(0) + "x" + m.y.toFixed(0));
}

function playAction(action) {
  if (!model) { debug("No model to play action"); return; }
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
        try { model.motion(g, idx, 2); debug("Playing: " + g + "[" + idx + "]"); } catch(e) {}
        return;
      }
    }
  }
  debug("No motion found for: " + action);
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
  el._timer = setTimeout(function() { el.classList.remove("show"); }, 3000);
}

// UI bindings
document.addEventListener("DOMContentLoaded", function() {
  debug("DOM ready");
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
