# Dự Án Gamine - Cửa Hàng Điện Tử Gaming

## Tổng Quan

Dự án này là một nền tảng thương mại điện tử hoàn chỉnh chuyên về các sản phẩm gaming, bao gồm cả giao diện người dùng và hệ thống quản trị. Dự án được chia thành ba phần chính:

1. **Website Chính (gamine-react)**: Giao diện người dùng cuối được xây dựng bằng React.js
2. **Trang Quản Trị (admin-panel)**: Hệ thống quản lý sản phẩm, đơn hàng và người dùng được xây dựng bằng React và TypeScript
3. **Backend (admin/backend)**: API và xử lý dữ liệu được xây dựng bằng Django

## Lưu Ý Quan Trọng

**Khi clone repository này, các thư mục `node_modules` sẽ không được bao gồm do kích thước lớn. Bạn cần chạy lệnh `npm install` trong các thư mục `gamine-react` và `admin-panel` để tạo lại các thư mục `node_modules` với các dependencies cần thiết:**

```bash
# Tạo lại node_modules cho Website người dùng
cd gamine-react
npm install

# Tạo lại node_modules cho Trang quản trị
cd admin-panel
npm install
```

Việc này sẽ cài đặt tự động tất cả các dependencies được liệt kê trong file `package.json` tương ứng.

## Cấu Trúc Dự Án

```
project/
├── gamine-react/           # Website chính cho người dùng (React)
│   ├── public/             # Tài nguyên tĩnh
│   ├── src/                # Mã nguồn
│   │   ├── api/            # Các hàm gọi API
│   │   ├── assets/         # Hình ảnh, icons, fonts
│   │   ├── components/     # Components tái sử dụng
│   │   ├── contexts/       # React contexts (quản lý trạng thái)
│   │   ├── css/            # CSS global
│   │   ├── pages/          # Các trang của ứng dụng
│   │   └── services/       # Các dịch vụ (auth, API calls)
│   ├── package.json        # Các dependencies
│   └── README.md           # Hướng dẫn
│
├── admin-panel/            # Trang quản trị (React + TypeScript)
│   ├── public/             # Tài nguyên tĩnh
│   ├── src/                # Mã nguồn
│   │   ├── components/     # Components tái sử dụng
│   │   ├── contexts/       # React contexts
│   │   ├── layout/         # Layout components
│   │   ├── pages/          # Các trang quản trị
│   │   ├── services/       # Các dịch vụ API
│   │   ├── types/          # Định nghĩa TypeScript
│   │   └── utils/          # Các hàm tiện ích
│   ├── package.json        # Các dependencies
│   └── tsconfig.json       # Cấu hình TypeScript
│
└── admin/backend/          # Backend API (Django)
    ├── core/               # Core functionality
    ├── routes/             # API routes
    ├── backend/            # Django project settings
    ├── urls/               # URL configurations
    ├── sql/                # SQL scripts
    ├── db/                 # Database related files
    ├── manage.py           # Django management script
    └── requirements.txt    # Python dependencies
```

## Tính Năng Chính

### Website Người Dùng (gamine-react)
- Hiển thị sản phẩm theo danh mục
- Trang chi tiết sản phẩm
- Giỏ hàng và thanh toán
- Đăng ký và đăng nhập tài khoản
- Quản lý trang cá nhân và đơn hàng
- Tin tức và khuyến mãi
- Trang hỗ trợ khách hàng

### Trang Quản Trị (admin-panel)
- Quản lý sản phẩm và danh mục
- Quản lý đơn hàng
- Quản lý người dùng
- Quản lý khuyến mãi
- Báo cáo thống kê
- Quản lý nội dung trang web

### Backend (admin/backend)
- RESTful API
- Xác thực người dùng
- Quản lý cơ sở dữ liệu
- Xử lý đơn hàng
- Quản lý sản phẩm và danh mục

## Luồng Hoạt Động Hệ Thống

### Luồng Đăng Ký/Đăng Nhập
1. Người dùng đăng ký tài khoản trên website
2. Hệ thống gửi email xác nhận
3. Người dùng xác nhận và đăng nhập
4. Hệ thống tạo JWT token và lưu vào localStorage

### Luồng Mua Hàng
1. Người dùng duyệt sản phẩm và thêm vào giỏ hàng
2. Người dùng chọn thanh toán và nhập thông tin giao hàng
3. Hệ thống xác nhận đơn hàng và gửi email xác nhận
4. Admin xử lý đơn hàng thông qua trang quản trị

### Luồng Quản Trị
1. Admin đăng nhập vào trang quản trị
2. Quản lý danh mục, sản phẩm, đơn hàng và người dùng
3. Xem báo cáo thống kê và phân tích dữ liệu

## Các Quy Trình

### Quy Trình Quản Lý Sản Phẩm
1. Tạo danh mục sản phẩm
2. Thêm sản phẩm mới với hình ảnh, mô tả và giá cả
3. Cập nhật thông tin và tồn kho
4. Quản lý trạng thái hiển thị và khuyến mãi

### Quy Trình Xử Lý Đơn Hàng
1. Tiếp nhận đơn hàng mới
2. Xác nhận thanh toán
3. Chuẩn bị sản phẩm và giao hàng
4. Cập nhật trạng thái đơn hàng
5. Xử lý hoàn trả (nếu có)

### Quy Trình Quản Lý Người Dùng
1. Xem danh sách người dùng
2. Kiểm tra lịch sử mua hàng
3. Quản lý quyền truy cập
4. Hỗ trợ đặt lại mật khẩu

## Công Nghệ Sử Dụng

### Website Người Dùng
- React.js
- React Router
- HTML/CSS
- React Icons
- Axios
- React Toastify

### Trang Quản Trị
- React.js với TypeScript
- Ant Design
- React Router
- Recharts (cho biểu đồ)
- React Draft WYSIWYG (trình soạn thảo văn bản)
- Axios
- Notistack

### Backend
- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Celery (xử lý tác vụ bất đồng bộ)

## Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js (phiên bản 14.0.0 trở lên)
- npm hoặc yarn
- Python 3.8+ 
- PostgreSQL

### Cài Đặt Backend & Database
1. Di chuyển vào thư mục `admin/backend`:
```bash
cd admin/backend
```

2. Cài đặt các dependencies Python:
```bash
pip install -r requirements.txt
```

3. Thiết lập cơ sở dữ liệu:
```bash
# Tạo database PostgreSQL
psql -U postgres
CREATE DATABASE gamine_admin;
\q

# Chạy migrations
python manage.py migrate
```

4. Tạo tài khoản admin:
```bash
# Tạo file tạo tài khoản admin mới, ví dụ: create_admin.py
nano create_admin.py
```

Thêm nội dung sau vào file create_admin.py:
```python
from django.contrib.auth.hashers import make_password
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

# Thông tin admin mới
username = 'admin'  # Đổi thành username mong muốn
password = 'admin123'  # Đổi thành mật khẩu mong muốn
email = 'admin@example.com'  # Đổi email
role = 'Super Admin'

# Sử dụng hàm make_password của Django để mã hóa đúng
hashed_password = make_password(password)
print(f'Mật khẩu đã mã hóa: {hashed_password}')

# Kiểm tra xem admin đã tồn tại chưa
with connection.cursor() as cursor:
    cursor.execute('SELECT admin_id FROM core_admin WHERE username = %s', [username])
    exists = cursor.fetchone()
    
    if exists:
        print(f'Admin với username {username} đã tồn tại!')
    else:
        # Chèn vào cơ sở dữ liệu
        cursor.execute('''
        INSERT INTO core_admin (username, password, role, email, created_at, is_active) 
        VALUES (%s, %s, %s, %s, %s, %s)
        ''', [username, hashed_password, role, email, datetime.now(), True])
        
        print(f'Đã tạo admin mới: {username} - {email} - {role}')
        print(f'Mật khẩu đăng nhập: {password}')
```

Chạy script tạo admin:
```bash
python create_admin.py
```

5. Khởi chạy server backend:
```bash
python manage.py runserver 8000
```

6. Truy cập API tại [http://localhost:8000/api/](http://localhost:8000/api/)

### Cài Đặt Website Người Dùng
1. Di chuyển vào thư mục `gamine-react`:
```bash
cd gamine-react
```

2. Cài đặt các dependencies:
```bash
npm install
```

3. Khởi chạy ứng dụng ở môi trường phát triển:
```bash
# Thiết lập port và host
set PORT=3000
set HOST=localhost

# Trên Windows:
npm start

# Trên Linux/MacOS:
PORT=3000 HOST=localhost npm start
```

4. Truy cập ứng dụng tại [http://localhost:3000](http://localhost:3000)

### Cài Đặt Trang Quản Trị
1. Di chuyển vào thư mục `admin-panel`:
```bash
cd admin-panel
```

2. Cài đặt các dependencies:
```bash
npm install
```

3. Khởi chạy ứng dụng ở môi trường phát triển:
```bash
# Thiết lập port và host
set PORT=3001
set HOST=localhost

# Trên Windows:
npm start

# Trên Linux/MacOS:
PORT=3001 HOST=localhost npm start
```

4. Truy cập trang quản trị tại [http://localhost:3001](http://localhost:3001)

## Hướng Dẫn Chạy Dự Án

Để chạy toàn bộ hệ thống, cần thực hiện theo các bước sau:

1. Khởi động database PostgreSQL:
```bash
# Trên Windows
net start postgresql

# Trên Linux
sudo systemctl start postgresql

# Trên MacOS
brew services start postgresql
```

2. Khởi động backend API:
```bash
cd admin/backend
python manage.py runserver 8000
```

3. Khởi động website người dùng:
```bash
cd gamine-react

# Thiết lập port và host
# Trên Windows:
set PORT=3000
set HOST=localhost #hoặc bất cứ ip nào máy hỗ trợ
npm start

# Trên Linux/MacOS:
PORT=3000 HOST=localhost npm start
```

4. Khởi động trang quản trị:
```bash
cd admin-panel

# Thiết lập port và host
# Trên Windows:
set PORT=3001
set HOST=localhost #hoặc bất cứ ip nào máy hỗ trợ
npm start

# Trên Linux/MacOS:
PORT=3001 HOST=localhost npm start
```

5. Truy cập các ứng dụng:
   - Website: [http://localhost:3000](http://localhost:3000)
   - Admin panel: [http://localhost:3001](http://localhost:3001)
   - Backend API: [http://localhost:8000/api/](http://localhost:8000/api/)

## Xây Dựng Để Triển Khai

### Website Người Dùng
```bash
cd gamine-react
npm run build
```

### Trang Quản Trị
```bash
cd admin-panel
npm run build
```

### Backend
```bash
# Cấu hình settings.py cho môi trường production
cd admin/backend
python manage.py collectstatic
```

Các tệp build của frontend sẽ được tạo trong thư mục `build` của mỗi project.

## Cấu Hình Hệ Thống

### Cấu Hình Database
1. Tạo file `.env` trong thư mục `admin/backend`:
```
DB_NAME=gamine_db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your-secret-key
DEBUG=False
```

### Cấu Hình Cloudinary (Để tải lên hình ảnh sản phẩm)

Trang quản trị sử dụng Cloudinary để lưu trữ hình ảnh. Để cấu hình:

1. Đăng ký tài khoản miễn phí tại [Cloudinary](https://cloudinary.com/users/register/free)
2. Sau khi đăng nhập, truy cập Dashboard để lấy thông tin:
   - Cloud name: Hiển thị ở góc trên bên phải
   - API Key và API Secret: Tab Settings > Security

3. Tạo một Upload Preset:
   - Đi đến Settings > Upload
   - Tìm đến phần "Upload presets" và nhấn "Add upload preset"
   - Đặt Signing Mode là "Unsigned"
   - Đặt Preset name là "gamine_preset" (hoặc tên bạn muốn)
   - Lưu các thay đổi

4. Cập nhật file cấu hình trong ứng dụng:
   - Mở file `admin-panel/src/pages/ProductManagement.tsx`
   - Cập nhật các biến sau:
     ```javascript
     const CLOUDINARY_UPLOAD_PRESET = 'gamine_preset'; // hoặc tên preset bạn đã tạo
     const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'; // thay bằng cloud name của bạn
     ```

## Tài Liệu Bổ Sung

### Design System
Dự án sử dụng thiết kế theo phong cách "Cyberpunk/Gaming" với các yếu tố:
- Hiệu ứng neon
- Gradient màu sắc sống động
- Các yếu tố mạch điện
- Hiệu ứng glitch
- Giao diện kiểu holographic

### API Endpoints
Dự án sử dụng các API endpoint được định nghĩa trong file `services/api.js`. Để phát triển, bạn cần cấu hình URL API backend trong file này.

Các endpoint chính của backend:
- `GET /api/products/` - Lấy danh sách sản phẩm
- `GET /api/products/:id/` - Lấy chi tiết sản phẩm
- `GET /api/categories/` - Lấy danh sách danh mục
- `POST /api/users/register/` - Đăng ký tài khoản
- `POST /api/users/login/` - Đăng nhập
- `POST /api/orders/` - Tạo đơn hàng
- `GET /api/orders/:id/` - Xem chi tiết đơn hàng
- `GET /api/users/profile/` - Lấy thông tin người dùng
