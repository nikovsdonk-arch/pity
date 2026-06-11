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

function debug(msg) { console.log("[Pet]", msg); }

function init() {
  debug("Initializing...");

  if (typeof PIXI === "undefined") { showToast("PIXI.js 未加载"); return; }

  // cubism4 UMD exports to PIXI.live2d
  var L2D = PIXI.live2d;
  if (!L2D || !L2D.Live2DModel) {
    showToast("Live2D 引擎未加载 (pixi-live2d-display)");
    debug("PIXI keys: " + Object.keys(PIXI).filter(function(k) { return k.indexOf("live") >= 0 || k.indexOf("Live") >= 0; }).join(", "));
    if (L2D) debug("live2d keys: " + Object.keys(L2D).join(", "));
    return;
  }

  var canvas = document.getElementById("canvas");
  if (!canvas) { showToast("找不到 Canvas"); return; }

  var parent = canvas.parentElement;
  var w = parent.clientWidth, h = parent.clientHeight;
  debug("Canvas size: " + w + "x" + h);

  L2D.Live2DModel.registerTicker(PIXI.Ticker);

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
  bindEvents(canvas);
  startEyeLoop(canvas);

  window.addEventListener("resize", function() {
    var pw = parent.clientWidth, ph = parent.clientHeight;
    if (app) app.renderer.resize(pw, ph);
    if (model) fitModel(model);
  });
}

function loadModel() {
  if (!app) return;
  if (model) { app.stage.removeChild(model); try { model.destroy(); } catch(e) {} model = null; }

  var L2D = PIXI.live2d;
  debug("Loading model from: " + MODEL_URL);
  showToast("正在加载模型...");

  var m = new L2D.Live2DModel();
  L2D.Live2DFactory.setupLive2DModel(m, { url: MODEL_URL }, { autoInteract: false })
    .then(function() {
      m.anchor.set(0.5, 0.5);
      model = m;
      fitModel(m);
      app.stage.addChild(m);
      debug("Model loaded OK");
      showToast("模型已加载");

      m.on("hit", function(areas) {
        for (var i = 0; i < areas.length; i++) {
          if (areas[i] === "head") { playAction("tap"); return; }
        }
      });
    })
    .catch(function(err) {
      console.error("[Pet] Model load ERROR:", err);
      debug("Load failed: " + (err && err.message ? err.message : err));
      showToast("模型加载失败: " + (err && err.message ? err.message : "未知错误"));
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
  var im = model.internalModel;
  if (!im || !im.motionManager || !im.motionManager.definitions) return;
  var defs = im.motionManager.definitions;
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
}

function blink() {
  var im = model ? model.internalModel : null;
  if (im && im.eyeBlink) {
    im.eyeBlink.setWeight(1);
    im.eyeBlink.setInterval(0);
    setTimeout(function() { if (im.eyeBlink) im.eyeBlink.setWeight(0); }, 150);
  }
}

function bindEvents(canvas) {
  canvas.addEventListener("pointerdown", function(e) {
    if (!model || !dragEnabled) return;
    isDragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    modelStartX = model.x; modelStartY = model.y;
  });
  canvas.addEventListener("pointermove", function(e) {
    pointerX = e.clientX; pointerY = e.clientY;
    if (isDragging && dragEnabled && model) {
      model.x = modelStartX + (e.clientX - dragStartX);
      model.y = modelStartY + (e.clientY - dragStartY);
    }
  });
  canvas.addEventListener("pointerup", function() { isDragging = false; });
  canvas.addEventListener("pointerleave", function() { isDragging = false; });
}

function startEyeLoop(canvas) {
  function tick() {
    if (model && eyeEnabled && !isDragging && app) {
      var rect = canvas.getBoundingClientRect();
      if (rect.width > 0) {
        var nx = (pointerX - rect.left) / rect.width;
        var ny = (pointerY - rect.top) / rect.height;
        model.focus((nx - 0.5) * 80, (ny - 0.5) * 50);
      }
    }
    animId = requestAnimationFrame(tick);
  }
  tick();
}

function showToast(msg) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(function() { el.classList.remove("show"); }, 3000);
}

// UI
document.addEventListener("DOMContentLoaded", function() {
  debug("DOM ready");
  init();

  var btns = {
    drag: document.getElementById("btnDrag"),
    eye: document.getElementById("btnEye"),
    tap: document.getElementById("btnTap"),
    wave: document.getElementById("btnWave"),
    blink: document.getElementById("btnBlink"),
    reset: document.getElementById("btnReset"),
  };

  btns.drag.addEventListener("click", function() {
    dragEnabled = !dragEnabled;
    this.classList.toggle("active");
    showToast(dragEnabled ? "拖拽已开启" : "拖拽已关闭");
  });
  btns.eye.addEventListener("click", function() {
    eyeEnabled = !eyeEnabled;
    this.classList.toggle("active");
    showToast(eyeEnabled ? "眼神追踪已开启" : "眼神追踪已关闭");
  });
  btns.tap.addEventListener("click", function() { playAction("tap"); });
  btns.wave.addEventListener("click", function() { playAction("wave"); });
  btns.blink.addEventListener("click", function() { playAction("blink"); });
  btns.reset.addEventListener("click", function() {
    if (model && app) fitModel(model);
    showToast("已重置位置");
  });
});
