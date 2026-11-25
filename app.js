/* SOLA shared frontend helpers */
(function () {
  'use strict';

  const config = window.SOLA_CONFIG;
  if (!config) {
    console.error('Thiếu config.js. Hãy tải config.js trước app.js.');
    return;
  }
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Không tải được Supabase JS. Kiểm tra kết nối CDN.');
    return;
  }

  const db = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const CATEGORY_LABELS = {
    'nha-cua': 'Nhà cửa',
    'vat-lieu': 'Vật liệu',
    'gia-dung': 'Gia dụng',
    'cong-nghe': 'Công nghệ',
    'review': 'Review',
    'kien-thuc': 'Kiến thức'
  };

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function safeHttpUrl(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (!/^https?:\/\//i.test(raw)) return '';
    try {
      const parsed = new URL(raw);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch (_) {
      return '';
    }
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  }

  function categoryLabel(category) {
    const key = String(category || '').trim();
    return CATEGORY_LABELS[key] || key.replace(/-/g, ' ') || 'Chia sẻ';
  }

  function stripMarkup(value) {
    const text = String(value || '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_`~|-]/g, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  }

  function getExcerpt(post, maxLength) {
    const source = post && (post.summary || post.content || '');
    const text = stripMarkup(source);
    const limit = Number(maxLength) > 0 ? Number(maxLength) : 150;
    return text.length > limit ? text.slice(0, limit).trim() + '…' : text;
  }

  function articleUrl(post) {
    if (post && post.slug) return 'post.html?slug=' + encodeURIComponent(post.slug);
    return 'post.html?id=' + encodeURIComponent(post && post.id != null ? post.id : '');
  }

  function setMeta(name, content, attribute) {
    if (!content) return;
    const attr = attribute || 'name';
    let node = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (!node) {
      node = document.createElement('meta');
      node.setAttribute(attr, name);
      document.head.appendChild(node);
    }
    node.setAttribute('content', content);
  }

  function setCanonical(url) {
    let node = document.querySelector('link[rel="canonical"]');
    if (!node) {
      node = document.createElement('link');
      node.rel = 'canonical';
      document.head.appendChild(node);
    }
    node.href = safeHttpUrl(url) || config.SITE_URL;
  }

  function setArticleSEO(post) {
    const title = post.meta_title || post.title || config.SITE_NAME;
    const description = post.meta_description || post.summary || getExcerpt(post, 155) || 'Góc nhìn thực tế về nhà ở, nội thất và sản phẩm cho không gian sống.';
    const canonical = config.SITE_URL + '/' + articleUrl(post);
    document.title = title + ' | ' + config.SITE_BRAND;
    setMeta('description', description);
    setMeta('og:type', 'article', 'property');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', canonical, 'property');
    const image = safeHttpUrl(post.cover_image);
    if (image) setMeta('og:image', image, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setCanonical(canonical);
  }

  async function fetchPublishedPosts(limit) {
    let query = db.from('posts').select('*').eq('published', true).order('created_at', { ascending: false });
    if (Number(limit) > 0) query = query.limit(Number(limit));
    const result = await query;
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function trackClick(details) {
    if (!details || !details.postId) return;
    try {
      await db.from('click_events').insert({
        post_id: details.postId,
        product_id: details.productId || null,
        platform: details.platform || 'other',
        destination_url: safeHttpUrl(details.url) || null
      });
    } catch (error) {
      // Theo dõi click không được làm gián đoạn thao tác mở liên kết của người đọc.
      console.debug('Không ghi được click Affiliate:', error);
    }
  }

  window.SOLA = {
    config,
    db,
    CATEGORY_LABELS,
    escapeHTML,
    safeHttpUrl,
    slugify,
    formatDate,
    categoryLabel,
    getExcerpt,
    articleUrl,
    setMeta,
    setCanonical,
    setArticleSEO,
    fetchPublishedPosts,
    trackClick
  };
})();
