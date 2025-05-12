import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

with connections['default'].cursor() as cursor:
    # Kiểm tra xem bảng đã tồn tại chưa
    cursor.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'core_socialmediaurls')")
    exists = cursor.fetchone()[0]
    
    if not exists:
        print("Tạo bảng core_socialmediaurls...")
        cursor.execute("""
        CREATE TABLE core_socialmediaurls (
            id SERIAL PRIMARY KEY,
            facebook VARCHAR(255) NULL,
            instagram VARCHAR(255) NULL,
            twitter VARCHAR(255) NULL,
            discord VARCHAR(255) NULL,
            youtube VARCHAR(255) NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Thêm mẫu dữ liệu đầu tiên
        cursor.execute("""
        INSERT INTO core_socialmediaurls (facebook, instagram, twitter, discord, youtube)
        VALUES ('', '', '', '', '')
        """)
        print("Đã tạo bảng core_socialmediaurls thành công!")
    else:
        print("Bảng core_socialmediaurls đã tồn tại!") 