import os
import django
import hashlib
from datetime import datetime

# Thiết lập môi trường Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Kết nối database
from django.db import connections

# Thông tin admin mới
username = 'admin'
email = 'admin@example.com'
password = 'admin123'  # Mật khẩu ban đầu
role = 'Super Admin'

# Mã hóa mật khẩu (pbkdf2_sha256)
hashed_password = f"pbkdf2_sha256$600000${username}${hashlib.sha256(password.encode()).hexdigest()}"

# Chèn vào cơ sở dữ liệu
with connections['default'].cursor() as cursor:
    cursor.execute("""
    INSERT INTO core_admin (username, password, role, email, created_at, is_active) 
    VALUES (%s, %s, %s, %s, %s, %s)
    """, [username, hashed_password, role, email, datetime.now(), True])
    
    print(f"Đã tạo admin mới: {username} - {email} - {role}")