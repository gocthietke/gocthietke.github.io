GOC THIET KE SOLA - BO MA NGUON WEBSITE MOI
===========================================

BO FILE
-------
index.html              Trang chủ: chuyên mục, tìm kiếm, lọc bài, bài nổi bật.
post.html               Trang đọc bài viết.
post.js                 Đọc bài theo slug HOẶC id, mục lục, sản phẩm Affiliate.
admin.html              Trang quản trị đăng nhập.
admin.js                Tạo/sửa/xóa bài, upload ảnh, quản lý nhiều sản phẩm.
style.css               Giao diện responsive desktop/mobile.
config.js               Cấu hình Supabase + thông tin liên hệ.
app.js                  Hàm dùng chung, truy vấn bài đã xuất bản, kiểm tra URL.
supabase_setup.sql      SQL bổ sung cột/bảng, RLS, quyền admin, Storage.
robots.txt              Quy tắc crawler.
sitemap.xml             Sitemap cơ bản ban đầu.
affiliate-disclosure.html Trang công khai chính sách Affiliate.
404.html                Trang lỗi 404.

LƯU Ý ẢNH BANNER
----------------
Website mới vẫn dùng file hero-original.jpg đang có trong repository. Không xóa file này.
Các ảnh bìa bài viết cũ vẫn giữ nguyên URL trong cột posts.cover_image.
Website không phụ thuộc ảnh chân dung DSC08182_(2).jpg ở footer nữa, tránh lỗi ảnh cũ.

CÀI ĐẶT THEO THỨ TỰ
-------------------
1. SAO LƯU
   - GitHub: tải ZIP repository hiện tại hoặc tạo branch backup trước khi thay file.
   - Supabase: vào Database > Backups (hoặc xuất dữ liệu bảng posts) trước khi chạy SQL.

2. THAY FILE GITHUB
   - Giải nén ZIP bộ SOLA mới.
   - Tải các file trong thư mục này lên thư mục gốc repository gocthietke.github.io.
   - Ghi đè các file trùng tên.
   - GIỮ NGUYÊN hero-original.jpg và các ảnh/tài nguyên khác đang có trong repository.
   - Commit thay đổi vào branch main. GitHub Pages đang dùng file index.html ở thư mục gốc.

3. TẠO TÀI KHOẢN QUẢN TRỊ SUPABASE
   - Vào Supabase > Authentication > Users > Add user.
   - Tạo user email: nhunhu13061@gmail.com (hoặc email quản trị riêng bạn sử dụng).
   - Đặt mật khẩu mạnh và xác nhận email (nếu có lựa chọn Auto Confirm User thì bật cho user quản trị).
   - Không bật đăng ký tài khoản công khai cho khách truy cập.

4. CHẠY SQL
   - Mở Supabase > SQL Editor > New query.
   - Mở file supabase_setup.sql, copy toàn bộ nội dung và dán vào SQL Editor, nhấn Run.
   - Script giữ lại dữ liệu bảng posts, thêm các cột summary/meta/updated_at, tạo post_products và click_events.
   - Script thay thế các policy RLS hiện có trên bảng public.posts bằng chính sách chỉ đọc công khai bài đã xuất bản và chỉ email admin mới được quản trị.
   - Script tạo/điều chỉnh bucket Storage công khai posts và cho phép admin tải ảnh lên.
   - Nếu email quản trị khác nhunhu13061@gmail.com, hãy thay cùng email ở 2 nơi: dòng ADMIN_EMAIL trong config.js và email trong hàm is_sola_admin() ở file SQL TRƯỚC KHI CHẠY.

5. ĐĂNG NHẬP VÀ KIỂM TRA
   - Mở https://gocthietke.github.io/admin.html
   - Đăng nhập bằng user/password vừa tạo.
   - Thử tạo 1 bài nháp (không bật Xuất bản) để kiểm tra lưu dữ liệu.
   - Vào trang chủ để chắc chắn bản nháp không xuất hiện.
   - Mở admin, sửa bài và bật Xuất bản để kiểm tra hiển thị.
   - Thử tải ảnh bìa và thêm sản phẩm với link Shopee/TikTok Shop.

6. CẬP NHẬT SITEMAP KHI CÓ BÀI MỚI
   - Trong Admin, nhấn nút “Tải sitemap mới”.
   - Tải file sitemap.xml vừa tạo lên thư mục gốc GitHub (ghi đè sitemap.xml cũ).
   - robots.txt đã trỏ tới https://gocthietke.github.io/sitemap.xml.

CẤU TRÚC CŨ ĐƯỢC GIỮ
--------------------
Bảng posts cũ vẫn là bảng chính, giữ các cột id, created_at, title, slug, content,
cover_image, published, category, affiliate_link. Không xóa bài viết hoặc ảnh cũ.
Các trường mới được thêm bằng ADD COLUMN IF NOT EXISTS.

BẢO MẬT
-------
- config.js chỉ chứa Supabase Publishable Key, được thiết kế để xuất hiện ở frontend.
- Tuyệt đối không dán Service Role Key hoặc Secret Key vào bất kỳ file HTML/JS nào.
- RLS phải được bật và giữ theo script SQL. Admin phải đăng nhập bằng email được cấp quyền.
- Nên dùng mật khẩu quản trị riêng, không dùng chung mật khẩu email cá nhân.

GIỚI HẠN SEO CẦN BIẾT
--------------------
GitHub Pages là hosting tĩnh. Trang bài viết này lấy nội dung từ Supabase bằng JavaScript,
nên title/meta từng bài được cập nhật ở trình duyệt sau khi tải dữ liệu. Đây không phải SSR.
Bộ sitemap được admin tạo ra giúp bot phát hiện URL bài viết, nhưng để có SEO mạnh nhất
với preview mạng xã hội ổn định cho từng bài, về sau nên chuyển sang quy trình tạo trang
HTML tĩnh cho mỗi bài hoặc dùng hosting có server-side rendering.

NẾU CÓ LỖI
----------
- “Invalid API key”: kiểm tra SUPABASE_URL và SUPABASE_PUBLISHABLE_KEY trong config.js.
- “permission denied”/“row-level security”: kiểm tra đã tạo Auth user đúng email và chạy SQL thành công.
- Không tải được ảnh: kiểm tra bucket Storage tên posts và policy upload.
- Không lưu bài mới: kiểm tra migration có tạo default cho posts.id và cột summary/meta chưa.
- Nếu bạn thay email admin, phải đồng bộ ở config.js và SQL.
