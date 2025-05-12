from django.core.management.base import BaseCommand
from core.models import Admin

class Command(BaseCommand):
    help = 'Khởi tạo tài khoản admin mặc định'
    
    def handle(self, *args, **options):
        if Admin.objects.count() == 0:
            admin = Admin(
                username='admin',
                email='admin@example.com',
                role='Super Admin'
            )
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Tài khoản admin đã được tạo thành công!'))
        else:
            self.stdout.write(self.style.WARNING('Đã có tài khoản admin trong cơ sở dữ liệu!')) 