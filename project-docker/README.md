# Dự Án Thương Mại Điện Tử Game

Dự án này bao gồm:
- API Backend Django (`/admin/backend`)
- Ứng dụng React cho Trang Quản Trị (`/admin-panel`)
- Ứng dụng React cho Trang Người Dùng (`/gamine-react`)
- Cơ sở dữ liệu PostgreSQL

## Lưu Ý Quan Trọng

**Khi clone repository này, các thư mục `node_modules` sẽ không được bao gồm do kích thước lớn. Nếu bạn muốn phát triển dự án mà không sử dụng Docker, bạn cần chạy lệnh `npm install` trong các thư mục `gamine-react` và `admin-panel` để tạo lại các thư mục `node_modules` với các dependencies cần thiết:**

```bash
# Tạo lại node_modules cho Website người dùng
cd gamine-react
npm install

# Tạo lại node_modules cho Trang quản trị
cd admin-panel
npm install
```

Việc này sẽ cài đặt tự động tất cả các dependencies được liệt kê trong file `package.json` tương ứng.

**Lưu ý:** Nếu bạn sử dụng Docker và Docker Compose theo hướng dẫn bên dưới, các thư mục `node_modules` sẽ được tự động tạo trong quá trình build.

## Thiết Lập Docker

### Yêu Cầu Hệ Thống
- Docker và Docker Compose đã được cài đặt
- Git

### Bắt Đầu Nhanh

1. Chạy với Docker Compose (sẽ tự động build và khởi động các dịch vụ):
   ```
   docker-compose up -d
   ```

2. Truy cập các ứng dụng:
   - Trang Người Dùng: http://localhost:3001
   - Trang Quản Trị: http://localhost:3000
   - API Backend: http://localhost:8000/api

### Các Dịch Vụ

- **Cơ sở dữ liệu PostgreSQL**: Chạy trên cổng 5432
- **Backend Django**: Chạy trên cổng 8000
- **Frontend Trang Quản Trị**: Chạy trên cổng 3000
- **Frontend Trang Người Dùng**: Chạy trên cổng 3001

### Phát Triển

Để thực hiện thay đổi cho bất kỳ dịch vụ nào:

1. Thực hiện các thay đổi mã nguồn
2. Xây dựng lại dịch vụ đã thay đổi:
   ```
   docker-compose build <tên-dịch-vụ>
   docker-compose up -d <tên-dịch-vụ>
   ```

## Cấu Trúc Dự Án

```
project-docker/
├── gamine-react/           # Website chính cho người dùng (React)
├── admin-panel/            # Trang quản trị (React + TypeScript)
├── admin/                  # Backend API (Django)
├── docker-compose.yml      # Cấu hình Docker Compose
├── .dockerignore           # Danh sách các file bỏ qua khi build Docker
└── README.md               # Hướng dẫn này
```

## Sử Dụng API

API backend có thể truy cập tại đường dẫn `/api` và tự động sử dụng hostname của mạng hiện tại thay vì hardcode localhost.

## Tạo Tài Khoản Admin

### Cách 1: Sử dụng script create_admin.py
```
docker exec -it gamine-backend python create_admin.py
```

### Cách 2: Tạo admin trực tiếp bằng lệnh Python
Để tạo tài khoản admin mới:
```
docker exec -it gamine-backend python -c "
from django.contrib.auth.hashers import make_password
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

# Thông tin admin mới
username = 'newadmin'  # Đổi thành username mới
password = 'admin123'
email = 'newadmin@example.com'  # Đổi email
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
"
```

Sau khi tạo tài khoản admin, khởi động lại container backend:
```
docker-compose restart backend
```

## Tính Năng Chính

### Website Người Dùng (gamine-react)
- Hiển thị sản phẩm theo danh mục
- Trang chi tiết sản phẩm
- Giỏ hàng và thanh toán
- Đăng ký và đăng nhập tài khoản
- Quản lý trang cá nhân và đơn hàng

### Trang Quản Trị (admin-panel)
- Quản lý sản phẩm và danh mục
- Quản lý đơn hàng
- Quản lý người dùng
- Quản lý khuyến mãi
- Báo cáo thống kê

### Backend (admin/backend)
- RESTful API
- Xác thực người dùng
- Quản lý cơ sở dữ liệu
- Xử lý đơn hàng
- Quản lý sản phẩm và danh mục

## Xử Lý Sự Cố

- **Vấn đề kết nối cơ sở dữ liệu**: Kiểm tra container PostgreSQL có đang chạy không: `docker ps`
- **Không thể truy cập API**: Kiểm tra log của backend: `docker-compose logs backend`
- **Frontend không tải**: Kiểm tra log của frontend: `docker-compose logs admin-panel` hoặc `docker-compose logs gamine-react`
- **Xem logs của tất cả các dịch vụ**: `docker-compose logs`

## Các Lệnh Docker Hữu Ích

- **Khởi động tất cả dịch vụ**: `docker-compose up -d`
- **Dừng tất cả dịch vụ**: `docker-compose down`
- **Xem trạng thái dịch vụ**: `docker-compose ps`
- **Khởi động lại một dịch vụ**: `docker-compose restart <tên-dịch-vụ>`
