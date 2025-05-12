from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from decimal import Decimal

# Models dựa trên cấu trúc cơ sở dữ liệu

class Admin(models.Model):
    admin_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=50, default='Admin')
    email = models.EmailField(max_length=100, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    @property
    def is_authenticated(self):
        return True
        
    @property
    def is_anonymous(self):
        return False
        
    def get_username(self):
        return self.username
        
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def __str__(self):
        return self.username

class Permissions(models.Model):
    permission_id = models.AutoField(primary_key=True)
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE)
    table_name = models.CharField(max_length=100)
    can_create = models.BooleanField(default=True)
    can_read = models.BooleanField(default=True)
    can_update = models.BooleanField(default=True)
    can_delete = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('admin', 'table_name')
    
    def __str__(self):
        return f"{self.admin.username} - {self.table_name}"

class AuditLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True)
    action = models.TextField()
    table_name = models.CharField(max_length=100, null=True)
    record_id = models.IntegerField(null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.admin.username if self.admin else 'Unknown'} - {self.action}"

class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)
    email = models.EmailField(max_length=100, unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    @property
    def is_authenticated(self):
        return True
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def __str__(self):
        return self.username

class UserActivityLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    action = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    device = models.CharField(max_length=255, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.action}"

class Categories(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    img_url = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return self.name

class CategoryImages(models.Model):
    image_id = models.AutoField(primary_key=True)
    category = models.ForeignKey(Categories, related_name='images', on_delete=models.CASCADE)
    image_url = models.TextField()
    is_primary = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Image for {self.category.name}"

class Products(models.Model):
    product_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField()
    sold_quantity = models.IntegerField(default=0)
    category = models.ForeignKey(Categories, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name
        
    def get_discounted_price(self):
        """Tính giá sau khuyến mãi cho sản phẩm"""
        # Lấy khuyến mãi áp dụng cho sản phẩm
        product_promotions = ProductPromotions.objects.filter(product=self)
        
        # Lấy khuyến mãi áp dụng cho danh mục
        category_promotions = ProductPromotions.objects.filter(category=self.category)
        
        # Tìm mức giảm giá cao nhất
        max_discount = 0
        for pp in list(product_promotions) + list(category_promotions):
            if pp.promotion.discount_percentage > max_discount:
                max_discount = pp.promotion.discount_percentage
        
        # Tính giá sau khuyến mãi
        if max_discount > 0:
            # Chuyển đổi max_discount thành Decimal để tránh lỗi khi thực hiện phép tính với Decimal
            max_discount_decimal = Decimal(str(max_discount))
            discount_factor = Decimal('1') - (max_discount_decimal / Decimal('100'))
            discounted_price = self.price * discount_factor
            return round(discounted_price, 2)
        
        return self.price

class ProductImages(models.Model):
    image_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Products, related_name='images', on_delete=models.CASCADE)
    image_url = models.TextField()
    is_primary = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Image for {self.product.name}"

class ProductDetails(models.Model):
    product_detail_id = models.AutoField(primary_key=True)
    product = models.OneToOneField(Products, related_name='detail', on_delete=models.CASCADE)
    specification = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"Details for {self.product.name}"

class Promotions(models.Model):
    promotion_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    discount_percentage = models.IntegerField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    img_banner = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return self.title

class ProductPromotions(models.Model):
    product_promotion_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Products, on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(Categories, on_delete=models.CASCADE, null=True, blank=True)
    promotion = models.ForeignKey(Promotions, on_delete=models.CASCADE)
    
    def __str__(self):
        if self.product:
            return f"Product: {self.product.name} - {self.promotion.title}"
        elif self.category:
            return f"Category: {self.category.name} - {self.promotion.title}"
        return f"Promotion: {self.promotion.title}"
    
    def clean(self):
        # Đảm bảo ít nhất một trong hai trường product hoặc category có giá trị
        if not self.product and not self.category:
            from django.core.exceptions import ValidationError
            raise ValidationError("Phải chọn ít nhất một sản phẩm hoặc danh mục")
        # Đảm bảo không cả hai trường product và category cùng có giá trị
        if self.product and self.category:
            from django.core.exceptions import ValidationError
            raise ValidationError("Chỉ có thể chọn sản phẩm hoặc danh mục, không phải cả hai")

class Reviews(models.Model):
    review_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Products, on_delete=models.CASCADE)
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name}"

class Orders(models.Model):
    ORDER_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('In transit', 'In transit'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    
    order_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, null=True, blank=True)
    customer_name = models.CharField(max_length=100, null=True, blank=True)
    customer_email = models.EmailField(max_length=100, null=True, blank=True)
    customer_phone = models.CharField(max_length=20, null=True, blank=True)
    shipping_address = models.TextField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        if self.user:
            return f"Order #{self.order_id} - {self.user.username}"
        return f"Order #{self.order_id} - {self.customer_name or 'Guest'}"

class OrderDetails(models.Model):
    order_detail_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Orders, related_name='details', on_delete=models.CASCADE)
    product = models.ForeignKey(Products, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"Order #{self.order.order_id} - {self.product.name}"

class Cart(models.Model):
    cart_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    product = models.ForeignKey(Products, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    order = models.ForeignKey(Orders, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name}"

class Payments(models.Model):
    payment_id = models.AutoField(primary_key=True)
    order = models.OneToOneField(Orders, on_delete=models.CASCADE)
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=50, default='Pending')
    transaction_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Payment for Order #{self.order.order_id}"

class Blog(models.Model):
    blog_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.title

class BlogImages(models.Model):
    image_id = models.AutoField(primary_key=True)
    blog = models.ForeignKey(Blog, related_name='images', on_delete=models.CASCADE)
    image_url = models.TextField()
    is_primary = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Image for {self.blog.title}"

class Careers(models.Model):
    job_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.title

class CareerApplications(models.Model):
    application_id = models.AutoField(primary_key=True)
    career = models.ForeignKey(Careers, related_name='applications', on_delete=models.CASCADE)
    applicant_name = models.CharField(max_length=255, null=True, blank=True)
    applicant_email = models.EmailField(max_length=255, null=True, blank=True)
    cv_link = models.URLField(max_length=500, verbose_name="CV Google Drive Link")
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Career Application"
        verbose_name_plural = "Career Applications"
    
    def __str__(self):
        return f"Application for {self.career.title}"

class Contact(models.Model):
    contact_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    phone = models.CharField(max_length=20, null=True, blank=True)
    message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name

class Faq(models.Model):
    faq_id = models.AutoField(primary_key=True)
    question = models.TextField()
    answer = models.TextField()
    
    def __str__(self):
        return self.question[:50]

class TermsAndConditions(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.title

class PrivacyPolicy(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.title

class SocialMediaUrls(models.Model):
    id = models.AutoField(primary_key=True)
    facebook = models.URLField(max_length=255, null=True, blank=True)
    instagram = models.URLField(max_length=255, null=True, blank=True)
    twitter = models.URLField(max_length=255, null=True, blank=True, verbose_name="X")
    discord = models.URLField(max_length=255, null=True, blank=True)
    youtube = models.URLField(max_length=255, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return "Social Media URLs"
    
    class Meta:
        verbose_name = "Social Media URLs"
        verbose_name_plural = "Social Media URLs"
        db_table = "core_socialmediaurls"  # Chỉ định tên bảng rõ ràng

class NewsletterSubscribers(models.Model):
    id = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=255, unique=True)
    created_at = models.DateTimeField(default=timezone.now, blank=True, null=True)
    status = models.CharField(max_length=20, default="active")
    
    def __str__(self):
        return self.email
    
    class Meta:
        managed = False  # Tell Django the table already exists
        verbose_name = "Newsletter Subscriber"
        verbose_name_plural = "Newsletter Subscribers"
        db_table = "newsletter_subscribers"  # Match the table name we saw in the database
