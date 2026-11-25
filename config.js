/*
 * SOLA WEBSITE CONFIGURATION
 * Chỉ chứa Publishable Key dùng ở frontend. KHÔNG đặt Service Role / Secret Key tại đây.
 */
window.SOLA_CONFIG = Object.freeze({
  SITE_NAME: 'Góc Thiết Kế',
  SITE_BRAND: 'SOLA',
  SITE_URL: 'https://gocthietke.github.io',
  SUPABASE_URL: 'https://youdayfwoygyudcgpkpf.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_b8rHawI1m1qFnSLjPMrSZw_oR_Tkwk7',
  STORAGE_BUCKET: 'posts',
  // Email này được dùng làm tài khoản quản trị mặc định và phải trùng với email trong file SQL.
  // Nếu dùng email khác để đăng nhập Supabase, hãy sửa đồng thời ở config.js và supabase_setup.sql.
  ADMIN_EMAIL: 'nhunhu13061@gmail.com',
  CONTACT: {
    email: 'nhunhu13061@gmail.com',
    phone1: '0912539316',
    phone1Label: '0912 539 316',
    phone2: '0989780177',
    phone2Label: '0989 780 177',
    zalo: 'https://zalo.me/0912539316',
    facebook: 'https://www.facebook.com/quynh.nhu.674793?locale=vi_VN',
    address: '969 Trần Hưng Đạo, P. Quy Nhơn, T. Gia Lai'
  }
});
