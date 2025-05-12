import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

with connections['default'].cursor() as cursor:
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
    tables = cursor.fetchall()
    for table in tables:
        print(table[0]) 