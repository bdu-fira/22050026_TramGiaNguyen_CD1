# DỰ ÁN GAMINE - NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ GAME

Đây là file giới thiệu chung, chi tiết về cách triển khai và chạy ứng dụng sẽ có trong file README riêng của từng phiên bản bên trên.

## TỔNG QUAN

Dự án Gamine là một nền tảng thương mại điện tử hoàn chỉnh chuyên về các sản phẩm gaming, bao gồm giao diện người dùng và hệ thống quản trị. Dự án được xây dựng với kiến trúc 3 thành phần chính:

1. **Website Người Dùng**: Giao diện cho khách hàng xem và mua sản phẩm (React)
2. **Trang Quản Trị**: Hệ thống quản lý sản phẩm, đơn hàng và người dùng (React + TypeScript)
3. **Backend API**: Xử lý dữ liệu và logic nghiệp vụ (Django)

## CẤU TRÚC DỰ ÁN

Dự án được tổ chức thành hai phiên bản triển khai:

### 1. Phiên Bản Docker (project-docker/)

```
project-docker/
├── gamine-react/           # Website người dùng (React)
├── admin-panel/            # Trang quản trị (React + TypeScript)
├── admin/                  # Backend API (Django)
│   └── backend/            # Mã nguồn Django
├── docker-compose.yml      # Cấu hình Docker Compose
├── .dockerignore           # Danh sách các file bỏ qua khi build Docker
└── README.md               # Hướng dẫn triển khai với Docker
```

### 2. Phiên Bản Phát Triển Cục Bộ (gamine-local/)

```
gamine-local/
├── gamine-react/           # Website người dùng (React)
├── admin-panel/            # Trang quản trị (React + TypeScript)
├── admin/                  # Backend API (Django)
│   └── backend/            # Mã nguồn Django
└── README.md               # Hướng dẫn phát triển cục bộ
```

## TÍNH NĂNG CHÍNH

### 1. Website Người Dùng
- Hiển thị sản phẩm theo danh mục
- Trang chi tiết sản phẩm
- Giỏ hàng và thanh toán
- Đăng ký và đăng nhập tài khoản
- Quản lý thông tin cá nhân và đơn hàng
- Tìm kiếm sản phẩm
- Xem tin tức và khuyến mãi

### 2. Trang Quản Trị
- Quản lý sản phẩm và danh mục
- Quản lý đơn hàng
- Quản lý người dùng
- Quản lý khuyến mãi
- Báo cáo thống kê
- Quản lý nội dung trang web

### 3. Backend API
- RESTful API
- Xác thực người dùng
- Quản lý cơ sở dữ liệu
- Xử lý đơn hàng
- Quản lý sản phẩm và danh mục

## HƯỚNG DẪN TRIỂN KHAI

### A. Triển Khai Với Docker (Khuyến nghị cho môi trường sản xuất)

#### Yêu Cầu Hệ Thống
- Docker và Docker Compose
- Git

#### Các Bước Triển Khai

1. Khởi động dịch vụ:
   ```
   docker-compose up -d
   ```

2. Tạo tài khoản admin:
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
   username = 'admin'  # Đổi thành username mong muốn
   password = 'admin123'  # Đổi mật khẩu
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
   "
   ```

3. Khởi động lại backend:
   ```
   docker-compose restart backend
   ```

4. Truy cập các ứng dụng:
   - Website người dùng: http://localhost:3001
   - Trang quản trị: http://localhost:3000
   - Backend API: http://localhost:8000/api

### B. Phát Triển Cục Bộ

#### Yêu Cầu Hệ Thống
- Node.js (phiên bản 14.0.0 trở lên)
- npm hoặc yarn
- Python 3.8+
- PostgreSQL

#### Các Bước Cài Đặt

1. Cài đặt PostgreSQL và tạo database:
   ```bash
   # Tạo database
   psql -U postgres
   CREATE DATABASE gamine_admin;
   \q
   ```

2. Cài đặt và cấu hình Backend:
   ```bash
   # Di chuyển vào thư mục backend
   cd gamine-local/admin/backend
   
   # Cài đặt dependencies
   pip install -r requirements.txt
   
   # Chạy migrations
   python manage.py migrate
   
   # Tạo admin (chạy script tạo admin)
   python create_admin.py
   
   # Khởi động server
   python manage.py runserver 8000
   ```

3. Cài đặt và khởi động Website Người Dùng:
   ```bash
   # Di chuyển vào thư mục website
   cd gamine-local/gamine-react
   
   # Cài đặt dependencies
   npm install
   
   # Khởi động ứng dụng
   npm start
   ```

4. Cài đặt và khởi động Trang Quản Trị:
   ```bash
   # Di chuyển vào thư mục admin panel
   cd gamine-local/admin-panel
   
   # Cài đặt dependencies
   npm install
   
   # Khởi động ứng dụng
   npm start
   ```

5. Truy cập các ứng dụng:
   - Website người dùng: http://localhost:3000
   - Trang quản trị: http://localhost:3001
   - Backend API: http://localhost:8000/api

## XỬ LÝ SỰ CỐ

### Triển Khai Docker

- **Lỗi kết nối database**: Kiểm tra container PostgreSQL có đang chạy không: `docker ps`
- **Không thể truy cập API**: Kiểm tra logs của backend: `docker-compose logs backend`
- **Frontend không tải**: Kiểm tra logs của frontend: `docker-compose logs admin-panel` hoặc `docker-compose logs gamine-react`

### Phát Triển Cục Bộ

- **Lỗi database**: Kiểm tra PostgreSQL đã chạy và thông tin kết nối trong `settings.py` chính xác
- **Lỗi CORS**: Kiểm tra cấu hình CORS trong `settings.py` đã cho phép domain của frontend
- **Lỗi npm**: Xóa thư mục `node_modules` và chạy lại `npm install`

## CÁC LỆNH DOCKER HỮU ÍCH

- **Xem status các container**: `docker ps`
- **Xem logs của container**: `docker logs <container-name>`
- **Khởi động lại container**: `docker-compose restart <service-name>`
- **Tắt tất cả dịch vụ**: `docker-compose down`
- **Xây dựng lại một dịch vụ**: `docker-compose build <service-name>`
- **Chạy lệnh trong container**: `docker exec -it <container-name> <command>`

## THÔNG TIN BỔ SUNG

### Cấu Hình Database

Mặc định dự án sử dụng PostgreSQL với các thông tin:
- **Database**: gamine_admin
- **Username**: postgres
- **Password**: 1412 (nên thay đổi trong môi trường sản xuất)
- **Host**: localhost (hoặc db nếu sử dụng Docker)
- **Port**: 5432

### Tài Khoản Mặc Định

Sau khi tạo admin thông qua script, bạn có thể đăng nhập vào trang quản trị với:
- **Username**: admin (hoặc username bạn đã tạo)
- **Password**: admin123 (hoặc password bạn đã chọn)

### Kiến Trúc Kỹ Thuật

- **Frontend**: React, TypeScript, Material UI
- **Backend**: Django, Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Deployment**: Docker, Nginx