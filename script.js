/*
 * 焦糖美食指南的 JavaScript
 * 主要功能：加载数据、渲染列表、搜索筛选、增删改、收藏和本地保存。
 */

const STORAGE_KEY = 'caramelo-foods-v1';

// 示例数据：每一条美食都是一个对象，所有对象放在 foods 数组中。
const sampleFoods = [
  { id: 1, name: '巷口牛肉面', location: '南门小吃街', type: '小吃', price: 22, rating: 4.8, desc: '汤头很鲜，牛肉给得大方；加一份卤蛋刚刚好。', favorite: true, createdAt: 3 },
  { id: 2, name: '三号食堂·铁板饭', location: '三号食堂二层', type: '食堂', price: 18, rating: 4.3, desc: '午饭高峰也出餐很快，黑椒鸡排是不会出错的选择。', favorite: false, createdAt: 2 },
  { id: 3, name: '晚风咖啡馆', location: '梧桐路 18 号', type: '咖啡甜品', price: 35, rating: 4.6, desc: '适合下午摸鱼，海盐焦糖拿铁和巴斯克都值得点。', favorite: true, createdAt: 1 },
  { id: 4, name: '阿婆砂锅粉', location: '东门菜市场旁', type: '小吃', price: 16, rating: 4.5, desc: '酸辣开胃，雨天来一碗非常舒服。', favorite: false, createdAt: 0 },
  { id: 5, name: '一口鲜·家常菜', location: '大学城美食街', type: '餐馆', price: 48, rating: 4.7, desc: '三四个人聚餐很合适，鱼香肉丝和干锅花菜推荐。', favorite: false, createdAt: -1 }
];

let foods = loadFoods();
let favoriteMode = 'all';

// 两个简写函数：$ 查找一个元素，$$ 查找多个元素。
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// 从 localStorage 读取数据；如果第一次打开，就使用示例数据。
function loadFoods() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : sampleFoods.slice();
  } catch (error) {
    return sampleFoods.slice();
  }
}

// localStorage 只能保存字符串，所以先把数组转换成 JSON 字符串。
function saveFoods() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
}

// 处理用户输入，避免输入内容直接破坏页面 HTML。
function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

// 根据当前数据生成“类型筛选”下拉选项。
function renderTypeOptions() {
  const types = foods.map((food) => food.type).filter((type, index, list) => list.indexOf(type) === index);
  const select = $('#typeFilter');
  const oldValue = select.value;

  select.innerHTML = '<option value="all">全部类型</option>' +
    types.map((type) => `<option>${escapeHTML(type)}</option>`).join('');

  if (types.includes(oldValue)) select.value = oldValue;
}

// 根据关键词、类型和收藏状态筛选，再按照下拉框的方式排序。
function getVisibleFoods() {
  const keyword = $('#searchInput').value.trim().toLowerCase();
  const type = $('#typeFilter').value;
  const sort = $('#sortSelect').value;

  const result = foods.filter((food) => {
    const text = `${food.name} ${food.location} ${food.type} ${food.desc}`.toLowerCase();
    const matchesKeyword = !keyword || text.includes(keyword);
    const matchesType = type === 'all' || food.type === type;
    const matchesFavorite = favoriteMode === 'all' || food.favorite;
    return matchesKeyword && matchesType && matchesFavorite;
  });

  result.sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'priceLow') return a.price - b.price;
    if (sort === 'name') return a.name.localeCompare(b.name, 'zh-CN');
    return b.createdAt - a.createdAt;
  });

  return result;
}

// 根据 foods 数组重新生成页面，这是“数据变化后页面同步更新”的核心函数。
function render() {
  renderTypeOptions();
  const visibleFoods = getVisibleFoods();

  $('#resultCount').textContent = `${visibleFoods.length} 道美食`;
  $('#foodGrid').innerHTML = visibleFoods.map((food) => `
    <article class="food-card">
      <div class="food-body">
        <div class="food-head">
          <h3>${escapeHTML(food.name)}</h3>
          <span class="rating">★ ${Number(food.rating).toFixed(1)}</span>
        </div>
        <p class="food-meta">${escapeHTML(food.location)} · ¥${food.price}/人</p>
        <p class="food-desc">${escapeHTML(food.desc || '暂无简介')}</p>
        <div class="card-actions">
          <button data-action="favorite" data-id="${food.id}">
            ${food.favorite ? '♥ 已收藏' : '♡ 收藏'}
          </button>
          <button data-action="edit" data-id="${food.id}">编辑信息</button>
          <button data-action="delete" data-id="${food.id}">删除</button>
        </div>
      </div>
    </article>
  `).join('');

  $('#emptyState').hidden = visibleFoods.length !== 0;
  $('#totalStat').textContent = foods.length;
  $('#favoriteStat').textContent = foods.filter((food) => food.favorite).length;
  $('#ratingStat').textContent = foods.length
    ? (foods.reduce((sum, food) => sum + Number(food.rating), 0) / foods.length).toFixed(1)
    : '0.0';
}

// 打开表单：没有 food 是新增，有 food 是编辑。
function openModal(food = null) {
  $('#foodForm').reset();
  $('#editId').value = food ? food.id : '';
  $('#modalTitle').textContent = food ? '修改美食信息' : '分享一条美食';
  $('#formError').textContent = '';

  if (food) {
    $('#nameInput').value = food.name;
    $('#locationInput').value = food.location;
    $('#formType').value = food.type;
    $('#priceInput').value = food.price;
    $('#ratingInput').value = food.rating;
    $('#descInput').value = food.desc || '';
  }

  $('#modalBackdrop').hidden = false;
  $('#nameInput').focus();
}

function closeModal() {
  $('#modalBackdrop').hidden = true;
}

// 事件委托：统一处理动态生成的收藏、编辑和删除按钮。
$('#foodGrid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const id = Number(button.dataset.id);
  const food = foods.find((item) => item.id === id);

  if (button.dataset.action === 'favorite') {
    food.favorite = !food.favorite;
    saveFoods();
    render();
  }

  if (button.dataset.action === 'edit') openModal(food);

  if (button.dataset.action === 'delete' && confirm(`确定删除“${food.name}”吗？`)) {
    foods = foods.filter((item) => item.id !== id);
    saveFoods();
    render();
  }
});

// 表单提交：有 id 就修改，没有 id 就新增。
$('#foodForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const data = {
    name: $('#nameInput').value.trim(),
    location: $('#locationInput').value.trim(),
    type: $('#formType').value,
    price: Number($('#priceInput').value),
    rating: Number($('#ratingInput').value),
    desc: $('#descInput').value.trim()
  };

  if (!data.name || !data.location || isNaN(data.price) || isNaN(data.rating)) {
    $('#formError').textContent = '请把带 * 的信息填写完整。';
    return;
  }

  if (data.price < 0 || data.rating < 1 || data.rating > 5) {
    $('#formError').textContent = '价格不能为负数，评分请填写 1 到 5。';
    return;
  }

  const id = Number($('#editId').value);
  if (id) {
    const index = foods.findIndex((food) => food.id === id);
    foods[index].name = data.name;
    foods[index].location = data.location;
    foods[index].type = data.type;
    foods[index].price = data.price;
    foods[index].rating = data.rating;
    foods[index].desc = data.desc;
  } else {
    data.id = Date.now();
    data.favorite = false;
    data.createdAt = Date.now();
    foods.unshift(data);
  }

  saveFoods();
  render();
  closeModal();
});

// 搜索、筛选、排序发生变化时，重新渲染列表。
$('#searchInput').addEventListener('input', render);
$('#typeFilter').addEventListener('change', render);
$('#sortSelect').addEventListener('change', render);

// “全部 / 我的收藏”切换。
$$('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    $$('.chip').forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
    favoriteMode = chip.dataset.favorite;
    render();
  });
});

// 打开新增表单的几个入口。
$('#addCtaBtn').addEventListener('click', () => openModal());

$('#closeModalBtn').addEventListener('click', closeModal);
$('#modalBackdrop').addEventListener('click', (event) => {
  if (event.target.id === 'modalBackdrop') closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});

// 随机推荐一条美食。
$('#randomBtn').addEventListener('click', () => {
  const food = foods[Math.floor(Math.random() * foods.length)];
  if (food) $('#heroPick').textContent = `${food.name} · ¥${food.price}`;
});

// 恢复最初的示例数据。
$('#clearDataBtn').addEventListener('click', () => {
  if (confirm('恢复为初始示例数据？你新增的内容会被清除。')) {
    foods = sampleFoods.slice();
    saveFoods();
    render();
  }
});

// 页面打开时先渲染一次。
render();
