(function () {
  'use strict';
  const grid = document.getElementById('article-grid');
  const featured = document.getElementById('featured-article');
  const searchInput = document.getElementById('article-search');
  const status = document.getElementById('article-status');
  if (!grid || !featured || !window.SOLA) return;

  let posts = [];
  let activeFilter = 'all';
  let searchText = '';

  function renderFeatured(post) {
    if (!post) { featured.innerHTML = ''; return; }
    const image = SOLA.safeHttpUrl(post.cover_image);
    featured.innerHTML = `
      <article class="feature-card">
        <a class="feature-image ${image ? '' : 'is-fallback'}" href="${SOLA.escapeHTML(SOLA.articleUrl(post))}" aria-label="Đọc ${SOLA.escapeHTML(post.title)}">
          ${image ? `<img src="${SOLA.escapeHTML(image)}" alt="${SOLA.escapeHTML(post.title)}" loading="eager" onerror="this.remove();this.parentElement.classList.add('is-fallback')">` : ''}
          <span class="feature-image-label">BÀI VIẾT NỔI BẬT</span>
        </a>
        <div class="feature-copy"><p class="eyebrow">${SOLA.escapeHTML(SOLA.categoryLabel(post.category))} · ${SOLA.escapeHTML(SOLA.formatDate(post.created_at))}</p>
          <h3><a href="${SOLA.escapeHTML(SOLA.articleUrl(post))}">${SOLA.escapeHTML(post.title || 'Bài viết')}</a></h3>
          <p>${SOLA.escapeHTML(SOLA.getExcerpt(post, 220))}</p>
          <a class="text-link" href="${SOLA.escapeHTML(SOLA.articleUrl(post))}">Đọc bài viết <span aria-hidden="true">↗</span></a>
        </div>
      </article>`;
  }

  function renderGrid(items) {
    if (!items.length) {
      grid.innerHTML = '<div class="empty-state"><strong>Chưa tìm thấy bài viết phù hợp.</strong><span>Thử từ khóa hoặc chuyên mục khác nhé.</span></div>';
      status.textContent = '';
      return;
    }
    grid.innerHTML = items.map(post => {
      const image = SOLA.safeHttpUrl(post.cover_image);
      return `<article class="article-card">
        <a class="article-image ${image ? '' : 'is-fallback'}" href="${SOLA.escapeHTML(SOLA.articleUrl(post))}" tabindex="-1" aria-hidden="true">
          ${image ? `<img src="${SOLA.escapeHTML(image)}" alt="" loading="lazy" onerror="this.remove();this.parentElement.classList.add('is-fallback')">` : ''}
        </a>
        <div class="article-card-body"><div class="article-meta"><span>${SOLA.escapeHTML(SOLA.categoryLabel(post.category))}</span><time>${SOLA.escapeHTML(SOLA.formatDate(post.created_at))}</time></div>
          <h3><a href="${SOLA.escapeHTML(SOLA.articleUrl(post))}">${SOLA.escapeHTML(post.title || 'Bài viết')}</a></h3>
          <p>${SOLA.escapeHTML(SOLA.getExcerpt(post, 135))}</p>
          <a class="text-link" href="${SOLA.escapeHTML(SOLA.articleUrl(post))}">Đọc tiếp <span aria-hidden="true">↗</span></a>
        </div></article>`;
    }).join('');
    status.textContent = 'Hiển thị ' + items.length + ' bài viết';
  }

  function applyFilters() {
    const q = searchText.toLocaleLowerCase('vi');
    const filtered = posts.filter(post => {
      const matchesCategory = activeFilter === 'all' || String(post.category || '').toLowerCase() === activeFilter;
      const haystack = [post.title, post.summary, post.content, post.category].join(' ').toLocaleLowerCase('vi');
      return matchesCategory && (!q || haystack.includes(q));
    });
    const hasFilter = activeFilter !== 'all' || Boolean(searchText);
    const lead = !hasFilter && filtered.length ? filtered[0] : null;
    renderFeatured(lead);
    renderGrid(lead ? filtered.slice(1, 9) : filtered.slice(0, 9));
  }

  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('is-active', item === button));
    document.querySelectorAll('[data-category]').forEach(item => item.classList.toggle('is-selected', item.dataset.category === activeFilter));
    applyFilters();
    document.getElementById('bai-viet').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.category || 'all';
    searchText = '';
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('is-active', item.dataset.filter === activeFilter));
    document.querySelectorAll('[data-category]').forEach(item => item.classList.toggle('is-selected', item === button));
    applyFilters();
    document.getElementById('bai-viet').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  if (searchInput) searchInput.addEventListener('input', event => { searchText = event.target.value.trim(); applyFilters(); });

  async function init() {
    try {
      posts = await SOLA.fetchPublishedPosts(60);
      if (!posts.length) {
        featured.innerHTML = '';
        grid.innerHTML = '<div class="empty-state"><strong>Chưa có bài viết được xuất bản.</strong><span>Các bài viết mới sẽ xuất hiện tại đây.</span></div>';
        status.textContent = '';
        return;
      }
      applyFilters();
    } catch (error) {
      console.error('Không tải được bài viết:', error);
      featured.innerHTML = '';
      grid.innerHTML = '<div class="empty-state"><strong>Chưa thể tải bài viết.</strong><span>Vui lòng tải lại trang sau ít phút.</span></div>';
      status.textContent = 'Lỗi kết nối dữ liệu. Kiểm tra Supabase và chính sách RLS.';
    }
  }
  init();
})();
