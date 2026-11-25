(function () {
  'use strict';
  if (!window.SOLA) return;
  const $ = id => document.getElementById(id);
  const loginPanel = $('login-panel');
  const dashboard = $('dashboard');
  const loginMessage = $('login-message');
  const saveMessage = $('save-message');
  const postList = $('admin-post-list');
  let allPosts = [];
  let slugWasEdited = false;

  function message(node, text, isError) {
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(isError));
  }
  function setLoggedIn(user) {
    const allowed = user && user.email && user.email.toLowerCase() === SOLA.config.ADMIN_EMAIL.toLowerCase();
    loginPanel.hidden = Boolean(allowed);
    dashboard.hidden = !allowed;
    if (!allowed && user) message(loginMessage, 'Tài khoản này chưa được cấp quyền quản trị SOLA.', true);
    return Boolean(allowed);
  }
  function resetForm() {
    $('post-form').reset();
    $('post-id').value = '';
    $('post-slug').value = '';
    $('post-published').checked = true;
    $('editor-heading').textContent = 'Viết bài mới';
    $('cover-upload-message').textContent = '';
    $('product-editor-list').innerHTML = '';
    saveMessage.textContent = '';
    slugWasEdited = false;
  }
  function productEditor(product) {
    const row = document.createElement('div');
    row.className = 'product-editor-row';
    row.dataset.productId = product && product.id ? product.id : '';
    row.innerHTML = `
      <div class="product-editor-top"><strong>Sản phẩm tham khảo</strong><button type="button" class="admin-button danger remove-product">Xóa sản phẩm</button></div>
      <div class="product-editor-grid">
        <input class="product-title" type="text" maxlength="160" placeholder="Tên sản phẩm *" value="${SOLA.escapeHTML(product?.title || '')}">
        <input class="product-price" type="text" maxlength="80" placeholder="Giá tham khảo (không bắt buộc)" value="${SOLA.escapeHTML(product?.price || '')}">
        <textarea class="product-description full" maxlength="500" placeholder="Mô tả ngắn / ghi chú">${SOLA.escapeHTML(product?.description || '')}</textarea>
        <input class="product-image full" type="url" placeholder="URL ảnh sản phẩm (không bắt buộc)" value="${SOLA.escapeHTML(product?.image_url || '')}">
        <input class="product-shopee" type="url" placeholder="Link Shopee" value="${SOLA.escapeHTML(product?.shopee_url || '')}">
        <input class="product-tiktok" type="url" placeholder="Link TikTok Shop" value="${SOLA.escapeHTML(product?.tiktok_url || '')}">
        <input class="product-other full" type="url" placeholder="Link khác (nếu có)" value="${SOLA.escapeHTML(product?.other_url || '')}">
      </div>`;
    row.querySelector('.remove-product').addEventListener('click', () => row.remove());
    $('product-editor-list').appendChild(row);
  }
  function collectProducts() {
    const rows = Array.from(document.querySelectorAll('.product-editor-row'));
    const products = [];
    for (const row of rows) {
      const title = row.querySelector('.product-title').value.trim();
      if (!title) continue;
      const product = {
        post_id: null,
        title,
        price: row.querySelector('.product-price').value.trim() || null,
        description: row.querySelector('.product-description').value.trim() || null,
        image_url: SOLA.safeHttpUrl(row.querySelector('.product-image').value.trim()) || null,
        shopee_url: SOLA.safeHttpUrl(row.querySelector('.product-shopee').value.trim()) || null,
        tiktok_url: SOLA.safeHttpUrl(row.querySelector('.product-tiktok').value.trim()) || null,
        other_url: SOLA.safeHttpUrl(row.querySelector('.product-other').value.trim()) || null,
        active: true,
        sort_order: products.length
      };
      if (row.dataset.productId) product.id = row.dataset.productId;
      const rawLinks = ['.product-image', '.product-shopee', '.product-tiktok', '.product-other'].map(selector => row.querySelector(selector).value.trim()).filter(Boolean);
      if (rawLinks.some(value => !SOLA.safeHttpUrl(value))) throw new Error('Một link sản phẩm không hợp lệ. Hãy dùng URL bắt đầu bằng http:// hoặc https://.');
      products.push(product);
    }
    return products;
  }
  function renderPostList() {
    const q = ($('admin-search').value || '').trim().toLocaleLowerCase('vi');
    const filtered = allPosts.filter(post => !q || [post.title, post.slug, post.category].join(' ').toLocaleLowerCase('vi').includes(q));
    if (!filtered.length) { postList.innerHTML = '<div class="empty-state"><strong>Chưa có bài viết phù hợp.</strong><span>Hãy viết bài mới ở phía trên.</span></div>'; return; }
    postList.innerHTML = filtered.map(post => `<article class="admin-post-row"><div><strong>${SOLA.escapeHTML(post.title || 'Chưa có tiêu đề')}${post.published ? '<span class="admin-status-pill live">ĐÃ XUẤT BẢN</span>' : '<span class="admin-status-pill">BẢN NHÁP</span>'}</strong><small>${SOLA.escapeHTML(SOLA.categoryLabel(post.category))} · ${SOLA.escapeHTML(SOLA.formatDate(post.created_at))} · ${SOLA.escapeHTML(post.slug || '')}</small></div><div class="admin-row-actions"><button type="button" data-edit="${SOLA.escapeHTML(post.id)}">Sửa</button><button type="button" data-delete="${SOLA.escapeHTML(post.id)}" class="delete">Xóa</button></div></article>`).join('');
  }
  async function loadPosts() {
    message($('list-message'), 'Đang tải bài viết...');
    const { data, error } = await SOLA.db.from('posts').select('*').order('created_at', { ascending: false });
    if (error) { message($('list-message'), 'Không tải được bài viết: ' + error.message, true); return; }
    allPosts = data || [];
    renderPostList();
    message($('list-message'), 'Đã tải ' + allPosts.length + ' bài viết.');
    await loadStats();
  }
  async function loadStats() {
    $('stat-total-posts').textContent = String(allPosts.length);
    $('stat-live-posts').textContent = String(allPosts.filter(post => post.published === true).length);
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await SOLA.db.from('click_events').select('id', { count: 'exact', head: true }).gte('created_at', since);
      if (error) throw error;
      $('stat-clicks').textContent = new Intl.NumberFormat('vi-VN').format(count || 0);
    } catch (error) {
      $('stat-clicks').textContent = '—';
      console.debug('Chưa tải được thống kê click:', error.message || error);
    }
  }
  async function editPost(id) {
    const post = allPosts.find(item => String(item.id) === String(id));
    if (!post) return;
    $('post-id').value = post.id;
    $('post-title-input').value = post.title || '';
    $('post-slug').value = post.slug || '';
    $('post-category').value = post.category || 'nha-cua';
    $('post-summary-input').value = post.summary || '';
    $('post-cover-url').value = post.cover_image || '';
    $('post-content-input').value = post.content || '';
    $('legacy-affiliate').value = post.affiliate_link || '';
    $('post-published').checked = post.published === true;
    $('editor-heading').textContent = 'Chỉnh sửa bài viết';
    $('product-editor-list').innerHTML = '';
    try {
      const { data, error } = await SOLA.db.from('post_products').select('*').eq('post_id', post.id).order('sort_order', { ascending: true });
      if (error) throw error;
      (data || []).forEach(productEditor);
    } catch (error) {
      message(saveMessage, 'Chưa đọc được sản phẩm Affiliate. Bạn cần chạy supabase_setup.sql trước. ' + error.message, true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function downloadSitemap() {
    const base = SOLA.config.SITE_URL.replace(/\/$/, '');
    const published = allPosts.filter(post => post.published === true);
    const urls = [base + '/'];
    published.forEach(post => urls.push(base + '/' + SOLA.articleUrl(post)));
    urls.push(base + '/affiliate-disclosure.html');
    const xmlEscape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&apos;');
    const entries = urls.map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n');
    const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${entries}\n</urlset>`;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    message($('list-message'), 'Đã tạo sitemap cho ' + published.length + ' bài viết đã xuất bản. Hãy tải file sitemap.xml lên thư mục gốc GitHub để cập nhật Google.');
  }

  async function deletePost(id) {
    const post = allPosts.find(item => String(item.id) === String(id));
    if (!post || !window.confirm('Xóa bài viết "' + post.title + '"? Thao tác này không thể hoàn tác.')) return;
    const { error } = await SOLA.db.from('posts').delete().eq('id', id);
    if (error) { message($('list-message'), 'Không xóa được: ' + error.message, true); return; }
    message($('list-message'), 'Đã xóa bài viết.');
    await loadPosts();
    if (String($('post-id').value) === String(id)) resetForm();
  }

  $('login-email').value = SOLA.config.ADMIN_EMAIL;
  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('login-email').value.trim().toLowerCase();
    const password = $('login-password').value;
    if (email !== SOLA.config.ADMIN_EMAIL.toLowerCase()) { message(loginMessage, 'Email này không phải email quản trị đã cấu hình.', true); return; }
    $('login-button').disabled = true;
    message(loginMessage, 'Đang xác thực...');
    const { data, error } = await SOLA.db.auth.signInWithPassword({ email, password });
    $('login-button').disabled = false;
    if (error) { message(loginMessage, 'Đăng nhập thất bại: ' + error.message, true); return; }
    if (setLoggedIn(data.user)) { $('login-password').value = ''; message(loginMessage, ''); await loadPosts(); }
    else await SOLA.db.auth.signOut();
  });

  $('logout-button').addEventListener('click', async () => { await SOLA.db.auth.signOut(); setLoggedIn(null); resetForm(); });
  $('post-title-input').addEventListener('input', () => { if (!slugWasEdited) $('post-slug').value = SOLA.slugify($('post-title-input').value); });
  $('post-slug').addEventListener('input', () => { slugWasEdited = true; $('post-slug').value = SOLA.slugify($('post-slug').value); });
  $('add-product-button').addEventListener('click', () => productEditor(null));
  $('reset-form-button').addEventListener('click', resetForm);
  $('admin-search').addEventListener('input', renderPostList);
  $('download-sitemap-button').addEventListener('click', downloadSitemap);
  $('admin-post-list').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit]');
    const remove = event.target.closest('[data-delete]');
    if (edit) editPost(edit.dataset.edit);
    if (remove) deletePost(remove.dataset.delete);
  });

  $('post-cover-file').addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { message($('cover-upload-message'), 'Vui lòng chọn tệp hình ảnh.', true); return; }
    if (file.size > 8 * 1024 * 1024) { message($('cover-upload-message'), 'Ảnh lớn hơn 8 MB. Hãy nén ảnh trước khi tải lên.', true); return; }
    message($('cover-upload-message'), 'Đang tải ảnh lên...');
    const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = 'sola/' + Date.now() + '-' + safeName;
    const { data, error } = await SOLA.db.storage.from(SOLA.config.STORAGE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) { message($('cover-upload-message'), 'Tải ảnh thất bại: ' + error.message, true); return; }
    const publicResult = SOLA.db.storage.from(SOLA.config.STORAGE_BUCKET).getPublicUrl(data.path);
    $('post-cover-url').value = publicResult.data.publicUrl;
    message($('cover-upload-message'), 'Đã tải ảnh lên Storage và điền URL vào trường ảnh bìa.');
  });

  $('post-form').addEventListener('submit', async event => {
    event.preventDefault();
    const title = $('post-title-input').value.trim();
    const slug = SOLA.slugify($('post-slug').value.trim() || title);
    const content = $('post-content-input').value.trim();
    const cover = $('post-cover-url').value.trim();
    const legacy = $('legacy-affiliate').value.trim();
    if (!title || !slug || !content) { message(saveMessage, 'Vui lòng nhập tiêu đề, slug và nội dung bài viết.', true); return; }
    if (cover && !SOLA.safeHttpUrl(cover)) { message(saveMessage, 'URL ảnh bìa không hợp lệ.', true); return; }
    if (legacy && !SOLA.safeHttpUrl(legacy)) { message(saveMessage, 'Link Affiliate cũ không hợp lệ.', true); return; }
    let products;
    try { products = collectProducts(); } catch (error) { message(saveMessage, error.message, true); return; }

    const payload = {
      title,
      slug,
      category: $('post-category').value,
      summary: $('post-summary-input').value.trim() || null,
      cover_image: cover || null,
      affiliate_link: legacy || null,
      content,
      published: $('post-published').checked,
      meta_title: title,
      meta_description: $('post-summary-input').value.trim().slice(0, 300) || null,
      updated_at: new Date().toISOString()
    };
    $('save-post-button').disabled = true;
    message(saveMessage, 'Đang lưu bài viết...');
    let postId = $('post-id').value;
    let result;
    if (postId) {
      result = await SOLA.db.from('posts').update(payload).eq('id', postId).select('id').single();
    } else {
      result = await SOLA.db.from('posts').insert(payload).select('id').single();
    }
    $('save-post-button').disabled = false;
    if (result.error) {
      message(saveMessage, 'Không lưu được bài viết: ' + result.error.message + '. Hãy kiểm tra đã chạy supabase_setup.sql chưa.', true);
      return;
    }
    postId = result.data.id;
    const productRows = products.map(product => ({ ...product, post_id: postId }));
    const { error: deleteError } = await SOLA.db.from('post_products').delete().eq('post_id', postId);
    if (deleteError) {
      message(saveMessage, 'Bài viết đã lưu, nhưng không cập nhật được danh sách sản phẩm: ' + deleteError.message, true);
      await loadPosts();
      return;
    }
    if (productRows.length) {
      const { error: productError } = await SOLA.db.from('post_products').insert(productRows);
      if (productError) {
        message(saveMessage, 'Bài viết đã lưu nhưng sản phẩm chưa lưu được: ' + productError.message, true);
        await loadPosts();
        return;
      }
    }
    message(saveMessage, $('post-published').checked ? 'Đã lưu và xuất bản bài viết thành công.' : 'Đã lưu bài viết dưới dạng bản nháp.');
    $('post-id').value = postId;
    $('post-slug').value = slug;
    await loadPosts();
  });

  (async function init() {
    const { data } = await SOLA.db.auth.getSession();
    if (data && data.session && setLoggedIn(data.session.user)) await loadPosts();
  })();
})();
