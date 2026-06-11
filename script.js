// ===================== PRODUCT DATA =====================
const products = [
  {
    id: 1, name: "无线降噪耳机", category: "电子产品", categoryEn: "electronics",
    price: 899, originalPrice: 1299, desc: "主动降噪，40小时续航，舒适佩戴体验",
    emoji: "🎧", badge: "hot", badgeText: "热卖"
  },
  {
    id: 2, name: "极简手表", category: "服饰配饰", categoryEn: "accessories",
    price: 459, originalPrice: null, desc: "超薄表盘，真皮表带，生活防水",
    emoji: "⌚", badge: "new", badgeText: "新品"
  },
  {
    id: 3, name: "北欧台灯", category: "生活家居", categoryEn: "home",
    price: 299, originalPrice: 399, desc: "三档调光，护眼柔光，简约设计",
    emoji: "🪔", badge: "", badgeText: ""
  },
  {
    id: 4, name: "蓝牙音箱", category: "电子产品", categoryEn: "electronics",
    price: 699, originalPrice: null, desc: "360°环绕音效，IPX7防水，派对模式",
    emoji: "🔊", badge: "sale", badgeText: "特惠"
  },
  {
    id: 5, name: "帆布双肩包", category: "服饰配饰", categoryEn: "accessories",
    price: 259, originalPrice: 329, desc: "大容量多功能，防泼水面料",
    emoji: "🎒", badge: "", badgeText: ""
  },
  {
    id: 6, name: "智能咖啡机", category: "生活家居", categoryEn: "home",
    price: 1999, originalPrice: null, desc: "一键研磨冲泡，APP远程控制",
    emoji: "☕", badge: "new", badgeText: "新品"
  },
  {
    id: 7, name: "运动手环", category: "电子产品", categoryEn: "electronics",
    price: 399, originalPrice: 599, desc: "心率血氧监测，14天续航",
    emoji: "💪", badge: "hot", badgeText: "热卖"
  },
  {
    id: 8, name: "真丝围巾", category: "服饰配饰", categoryEn: "accessories",
    price: 329, originalPrice: null, desc: "100%桑蚕丝，手工卷边，礼盒包装",
    emoji: "🧣", badge: "", badgeText: ""
  },
  {
    id: 9, name: "香薰加湿器", category: "生活家居", categoryEn: "home",
    price: 189, originalPrice: 259, desc: "超声波雾化，静音运行，氛围灯",
    emoji: "💨", badge: "sale", badgeText: "特惠"
  },
  {
    id: 10, name: "便携充电宝", category: "电子产品", categoryEn: "electronics",
    price: 159, originalPrice: null, desc: "20000mAh大容量，快充协议，轻薄",
    emoji: "🔋", badge: "", badgeText: ""
  },
  {
    id: 11, name: "羊毛围巾", category: "服饰配饰", categoryEn: "accessories",
    price: 289, originalPrice: null, desc: "澳洲美利奴羊毛，柔软亲肤",
    emoji: "🧣", badge: "", badgeText: ""
  },
  {
    id: 12, name: "陶瓷茶具套装", category: "生活家居", categoryEn: "home",
    price: 459, originalPrice: 589, desc: "手工拉坯，釉下彩，6件套礼盒",
    emoji: "🍵", badge: "new", badgeText: "新品"
  }
];

const categories = [
  { name: "全部", icon: "📋", filter: "all" },
  { name: "电子产品", icon: "💻", filter: "electronics" },
  { name: "生活家居", icon: "🏠", filter: "home" },
  { name: "服饰配饰", icon: "👔", filter: "accessories" }
];

// ===================== STATE =====================
let cart = JSON.parse(localStorage.getItem("shopCart")) || [];
let currentFilter = "all";
let searchQuery = "";

// ===================== DOM REFS =====================
const productsGrid = document.getElementById("productsGrid");
const categoriesGrid = document.getElementById("categoriesGrid");
const filterButtons = document.getElementById("filterButtons");
const searchInput = document.getElementById("searchInput");
const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const cartBody = document.getElementById("cartBody");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const menuToggle = document.getElementById("menuToggle");
const headerNav = document.querySelector(".header__nav");

// ===================== RENDER CATEGORIES =====================
function renderCategories() {
  categoriesGrid.innerHTML = categories.map(cat =>
    `<div class="category__card" data-filter="${cat.filter}">
      <span class="category__icon">${cat.icon}</span>
      <span class="category__name">${cat.name}</span>
    </div>`
  ).join("");

  categoriesGrid.querySelectorAll(".category__card").forEach(el => {
    el.addEventListener("click", () => {
      currentFilter = el.dataset.filter;
      updateFilterButtons();
      renderProducts();
      document.getElementById("products").scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ===================== RENDER FILTERS =====================
function renderFilters() {
  categories.forEach((cat, i) => {
    if (i === 0) return;
    const btn = document.createElement("button");
    btn.className = `filter__btn${cat.filter === currentFilter ? " filter__btn--active" : ""}`;
    btn.dataset.filter = cat.filter;
    btn.textContent = cat.name;
    btn.addEventListener("click", () => {
      currentFilter = cat.filter;
      updateFilterButtons();
      renderProducts();
    });
    filterButtons.appendChild(btn);
  });
}

function updateFilterButtons() {
  filterButtons.querySelectorAll(".filter__btn").forEach(btn => {
    btn.classList.toggle("filter__btn--active", btn.dataset.filter === currentFilter);
  });
}

// ===================== RENDER PRODUCTS =====================
function renderProducts() {
  const filtered = products.filter(p => {
    const matchFilter = currentFilter === "all" || p.categoryEn === currentFilter;
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML = `<div class="products__empty">
      <span class="products__empty-icon">🔍</span>
      <p>没有找到匹配的商品</p>
    </div>`;
    return;
  }

  productsGrid.innerHTML = filtered.map(p => {
    const badgeHtml = p.badge ? `<span class="product__badge product__badge--${p.badge}">${p.badgeText}</span>` : "";
    const originalHtml = p.originalPrice ? `<span class="product__price-original">¥${p.originalPrice}</span>` : "";
    const inCart = cart.find(c => c.id === p.id);
    const btnText = inCart ? "已添加 ✓" : "加入购物车";
    const btnClass = inCart ? "product__btn product__btn--added" : "product__btn";

    return `<div class="product__card">
      <div class="product__image">
        ${badgeHtml}
        <span>${p.emoji}</span>
      </div>
      <div class="product__body">
        <div class="product__category">${p.category}</div>
        <div class="product__name">${p.name}</div>
        <div class="product__desc">${p.desc}</div>
        <div class="product__footer">
          <div>
            <span class="product__price">¥${p.price}</span>
            ${originalHtml}
          </div>
          <button class="${btnClass}" data-id="${p.id}">${btnText}</button>
        </div>
      </div>
    </div>`;
  }).join("");

  productsGrid.querySelectorAll(".product__btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      if (btn.classList.contains("product__btn--added")) return;
      addToCart(id);
      btn.textContent = "已添加 ✓";
      btn.classList.add("product__btn--added");
    });
  });
}

// ===================== CART =====================
function addToCart(id) {
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    const product = products.find(p => p.id === id);
    cart.push({ id, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast("已加入购物车", "success");
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
  renderProducts();
}

function updateQuantity(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("shopCart", JSON.stringify(cart));
}

function updateCartUI() {
  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const count = cart.reduce((sum, c) => sum + c.qty, 0);
  cartCount.textContent = count;
  cartTotal.textContent = `¥${total.toFixed(2)}`;
  renderCartItems();
}

function renderCartItems() {
  if (cart.length === 0) {
    cartBody.innerHTML = `<div class="cart-sidebar__empty">
      <span class="cart-empty__icon">🛒</span>
      <p>购物车还是空的</p>
      <span class="cart-empty__sub">快去逛逛吧</span>
    </div>`;
    return;
  }

  cartBody.innerHTML = cart.map(c => `
    <div class="cart-item">
      <div class="cart-item__image">${c.emoji}</div>
      <div class="cart-item__info">
        <div class="cart-item__name">${c.name}</div>
        <div class="cart-item__price">¥${c.price}</div>
        <div class="cart-item__actions">
          <button class="cart-item__qty-btn" data-id="${c.id}" data-delta="-1">−</button>
          <span class="cart-item__qty">${c.qty}</span>
          <button class="cart-item__qty-btn" data-id="${c.id}" data-delta="1">+</button>
          <button class="cart-item__remove" data-id="${c.id}">移除</button>
        </div>
      </div>
    </div>
  `).join("");

  cartBody.querySelectorAll(".cart-item__qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      updateQuantity(parseInt(btn.dataset.id), parseInt(btn.dataset.delta));
      renderProducts();
    });
  });

  cartBody.querySelectorAll(".cart-item__remove").forEach(btn => {
    btn.addEventListener("click", () => {
      removeFromCart(parseInt(btn.dataset.id));
      renderProducts();
    });
  });
}

// ===================== TOAST =====================
function showToast(msg, type) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}

// ===================== SIDEBAR =====================
function openCart() { cartSidebar.classList.add("open"); document.body.style.overflow = "hidden"; }
function closeCart() { cartSidebar.classList.remove("open"); document.body.style.overflow = ""; }

// ===================== HEADER SCROLL =====================
const header = document.querySelector(".header");
let lastScroll = 0;
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 20);
});

// ===================== EVENTS =====================
cartBtn.addEventListener("click", openCart);
cartOverlay.addEventListener("click", closeCart);
cartClose.addEventListener("click", closeCart);

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderProducts();
});

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("active");
  headerNav.classList.toggle("open");
});

headerNav.querySelectorAll(".header__link").forEach(link => {
  link.addEventListener("click", () => {
    menuToggle.classList.remove("active");
    headerNav.classList.remove("open");
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

// ===================== INIT =====================
renderCategories();
renderFilters();
renderProducts();
updateCartUI();
