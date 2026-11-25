(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const id = params.get('id');
  const errorBox = document.getElementById('post-error');
  const article = document.getElementById('post-layout');
  const contentEl = document.getElementById('post-content');

  function showError() { errorBox.hidden = false; article.hidden = true; }
  function makeTOC() {
    const headings = contentEl.querySelectorAll('h2, h3');
    if (!headings.length) return;
    const list = document.getElementById('toc-list');
    headings.forEach((heading, index) => {
      const anchorId = 'muc-luc-' + (index + 1);
      heading.id = anchorId;
      const li = document.createElement('li');
      if (heading.tagName.toLowerCase() === 'h3') li.className = 'toc-h3';
      const a = document.createElement('a');
      a.href = '#' + anchorId;
      a.textContent = heading.textContent;
      li.appendChild(a);
      list.appendChild(li);
    });
    document.getElementById('toc-container').hidden = false;
  }

  function makeProductCard(product, postId) {
    const card = document.createElement('article');
    card.className = 'product-card';
    const imageUrl = SOLA.safeHttpUrl(product.image_url);
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = product.title || 'Sản phẩm tham khảo';
      img.loading = 'lazy';
      img.onerror = () => img.remove();
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'product-image-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      card.appendChild(placeholder);
    }
    const body = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = product.title || 'Sản phẩm tham khảo';
    body.appendChild(title);
    if (product.description) {
      const description = document.createElement('p');
      description.textContent = product.description;
      body.appendChild(description);
    }
    if (product.price) {
      const price = document.createElement('div');
      price.className = 'product-price';
      price.textContent = product.price;
      body.appendChild(price);
    }
    const actions = document.createElement('div');
    actions.className = 'product-actions';
    [['shopee_url', 'Xem trên Shopee', 'shopee'], ['tiktok_url', 'Xem trên TikTok Shop', 'tiktok'], ['other_url', 'Xem sản phẩm', 'other']].forEach(([field, label, platform]) => {
      const url = SOLA.safeHttpUrl(product[field]);
      if (!url) return;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'nofollow sponsored noopener noreferrer';
      link.textContent = label;
      if (platform === 'tiktok') link.className = 'secondary';
      link.addEventListener('click', () => SOLA.trackClick({ postId, productId: product.id, platform, url }));
      actions.appendChild(link);
    });
    if (actions.childElementCount) body.appendChild(actions);
    card.appendChild(body);
    return card;
  }

  async function loadProducts(post) {
    const section = document.getElementById('post-affiliate');
    const grid = document.getElementById('product-grid');
    try {
      const { data, error } = await SOLA.db.from('post_products').select('*').eq('post_id', post.id).eq('active', true).order('sort_order', { ascending: true });
      if (error) throw error;
      if (data && data.length) {
        data.forEach(product => grid.appendChild(makeProductCard(product, post.id)));
        section.hidden = false;
        return;
      }
    } catch (error) {
      // Có thể bảng Affiliate chưa được tạo; liên kết cũ vẫn được hiển thị bên dưới.
      console.info('Chưa tải được danh sách sản phẩm Affiliate:', error.message || error);
    }
    const legacyUrl = SOLA.safeHttpUrl(post.affiliate_link);
    if (legacyUrl) {
      const link = document.createElement('a');
      link.className = 'legacy-affiliate';
      link.href = legacyUrl;
      link.target = '_blank';
      link.rel = 'nofollow sponsored noopener noreferrer';
      link.textContent = 'Xem sản phẩm tham khảo ↗';
      link.addEventListener('click', () => SOLA.trackClick({ postId: post.id, platform: 'other', url: legacyUrl }));
      grid.appendChild(link);
      section.hidden = false;
    }
  }

  async function loadRelated(post) {
    if (!post.category) return;
    try {
      const { data, error } = await SOLA.db.from('posts').select('id,title,slug,category,created_at').eq('published', true).eq('category', post.category).neq('id', post.id).order('created_at', { ascending: false }).limit(3);
      if (error || !data || !data.length) return;
      const grid = document.getElementById('related-grid');
      grid.innerHTML = data.map(item => `<article class="related-card"><span>${SOLA.escapeHTML(SOLA.categoryLabel(item.category))}</span><h3><a href="${SOLA.escapeHTML(SOLA.articleUrl(item))}">${SOLA.escapeHTML(item.title || 'Bài viết')}</a></h3><a class="text-link" href="${SOLA.escapeHTML(SOLA.articleUrl(item))}">Đọc tiếp ↗</a></article>`).join('');
      document.getElementById('related-section').hidden = false;
    } catch (error) { console.debug('Không tải được bài liên quan:', error); }
  }

  async function loadPost() {
    if (!window.SOLA || (!slug && !id)) { showError(); return; }
    try {
      let query = SOLA.db.from('posts').select('*').eq('published', true);
      query = slug ? query.eq('slug', slug) : query.eq('id', id);
      const { data: post, error } = await query.maybeSingle();
      if (error || !post) { showError(); return; }

      article.hidden = false;
      document.getElementById('post-title').textContent = post.title || 'Bài viết';
      document.getElementById('post-category').textContent = SOLA.categoryLabel(post.category);
      document.getElementById('post-meta').textContent = SOLA.formatDate(post.created_at);
      SOLA.setArticleSEO(post);

      if (post.cover_image) {
        const cover = document.getElementById('post-cover');
        const coverUrl = SOLA.safeHttpUrl(post.cover_image);
        if (coverUrl) {
          cover.src = coverUrl;
          cover.alt = post.title || 'Ảnh bìa bài viết';
          cover.hidden = false;
          cover.onerror = () => { cover.hidden = true; };
        }
      }
      if (post.summary) {
        const summary = document.getElementById('post-summary');
        summary.textContent = post.summary;
        summary.hidden = false;
      }
      const source = window.marked ? window.marked.parse(post.content || '') : '<p>' + SOLA.escapeHTML(post.content || '') + '</p>';
      contentEl.innerHTML = window.DOMPurify ? DOMPurify.sanitize(source, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'] }) : SOLA.escapeHTML(post.content || '').replace(/\n/g, '<br>');
      contentEl.querySelectorAll('a').forEach(link => {
        const rawHref = link.getAttribute('href') || '';
        if (rawHref.startsWith('#')) return;
        const href = SOLA.safeHttpUrl(rawHref);
        if (!href) { link.removeAttribute('href'); return; }
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      });
      contentEl.querySelectorAll('img').forEach(img => {
        const src = SOLA.safeHttpUrl(img.getAttribute('src'));
        if (!src) { img.remove(); return; }
        img.src = src;
        img.loading = 'lazy';
      });
      makeTOC();
      await loadProducts(post);
      loadRelated(post);

      document.getElementById('share-button').addEventListener('click', async () => {
        const shareData = { title: post.title || 'Góc Thiết Kế SOLA', url: window.location.href };
        try {
          if (navigator.share) await navigator.share(shareData);
          else if (navigator.clipboard) { await navigator.clipboard.writeText(window.location.href); alert('Đã sao chép đường dẫn bài viết.'); }
          else window.prompt('Sao chép đường dẫn bài viết:', window.location.href);
        } catch (error) { if (error.name !== 'AbortError') console.warn(error); }
      }, { once: true });
    } catch (error) {
      console.error('Lỗi tải bài viết:', error);
      showError();
    }
  }
  loadPost();
})();
