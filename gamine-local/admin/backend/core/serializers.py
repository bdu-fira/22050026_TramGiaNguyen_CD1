from rest_framework import serializers
from .models import (
    Admin, Permissions, AuditLog, Users, UserActivityLog, Categories, 
    Products, ProductImages, ProductDetails, Promotions, ProductPromotions, 
    Reviews, Orders, OrderDetails, Cart, Payments, Blog, BlogImages, 
    Careers, Contact, Faq, TermsAndConditions, PrivacyPolicy, CategoryImages, SocialMediaUrls, CareerApplications, NewsletterSubscribers
)

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = ['admin_id', 'username', 'email', 'role', 'created_at', 'is_active']
        
class AdminCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Admin
        fields = ['admin_id', 'username', 'email', 'password', 'role', 'is_active']
        
    def create(self, validated_data):
        if 'password' not in validated_data or not validated_data['password']:
            raise serializers.ValidationError({'password': 'Mật khẩu là bắt buộc khi tạo admin mới'})
            
        admin = Admin(
            username=validated_data['username'],
            email=validated_data['email'],
            role=validated_data.get('role', 'Admin'),
            is_active=validated_data.get('is_active', True)
        )
        admin.set_password(validated_data['password'])
        admin.save()
        return admin
        
    def update(self, instance, validated_data):
        if 'password' in validated_data and validated_data['password']:
            instance.set_password(validated_data.pop('password'))
        return super().update(instance, validated_data)

class PermissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permissions
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = ['log_id', 'admin', 'admin_username', 'action', 'table_name', 'record_id', 'created_at']
        
    def get_admin_username(self, obj):
        if obj.admin:
            return obj.admin.username
        return None

class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        exclude = ['password']
        
class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Users
        fields = ['user_id', 'username', 'email', 'password', 'phone', 'address']
        
    def create(self, validated_data):
        if 'password' not in validated_data or not validated_data['password']:
            raise serializers.ValidationError({'password': 'Mật khẩu là bắt buộc khi tạo người dùng mới'})
            
        user = Users(
            username=validated_data['username'],
            email=validated_data['email'],
            phone=validated_data.get('phone'),
            address=validated_data.get('address')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
        
    def update(self, instance, validated_data):
        if 'password' in validated_data and validated_data['password']:
            instance.set_password(validated_data.pop('password'))
        return super().update(instance, validated_data)

class UserActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = UserActivityLog
        fields = ['log_id', 'user', 'username', 'action', 'created_at', 'device', 'ip_address']
        
    def get_username(self, obj):
        return obj.user.username if obj.user else None

class CategoryImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryImages
        fields = ['image_id', 'image_url', 'is_primary']

class CategoriesSerializer(serializers.ModelSerializer):
    images = CategoryImagesSerializer(many=True, read_only=True)
    
    class Meta:
        model = Categories
        fields = ['category_id', 'name', 'description', 'img_url', 'images']

class ProductImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImages
        fields = ['image_id', 'image_url', 'is_primary']

class ProductDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDetails
        fields = ['product_detail_id', 'specification']

class ProductsSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    images = ProductImagesSerializer(many=True, read_only=True)
    detail = ProductDetailsSerializer(read_only=True)
    discounted_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Products
        fields = ['product_id', 'name', 'description', 'price', 'discounted_price', 'stock_quantity', 
                 'sold_quantity', 'category', 'category_name', 'created_at', 'images', 'detail']
                 
    def get_category_name(self, obj):
        return obj.category.name
        
    def get_discounted_price(self, obj):
        return obj.get_discounted_price()

class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = ['name', 'description', 'price', 'stock_quantity', 'category']

class PromotionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotions
        fields = '__all__'

class ProductPromotionsSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField(read_only=True)
    category_name = serializers.SerializerMethodField(read_only=True)
    promotion_title = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ProductPromotions
        fields = ['product_promotion_id', 'product', 'category', 'promotion', 
                 'product_name', 'category_name', 'promotion_title']
        
    def get_product_name(self, obj):
        if obj.product:
            return obj.product.name
        return None
        
    def get_category_name(self, obj):
        if obj.category:
            return obj.category.name
        return None
        
    def get_promotion_title(self, obj):
        return obj.promotion.title

class ReviewsSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = Reviews
        fields = ['review_id', 'product', 'user', 'username', 'rating', 'comment', 'created_at']
        
    def get_username(self, obj):
        return obj.user.username

class OrderDetailsSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderDetails
        fields = ['order_detail_id', 'product', 'product_name', 'quantity', 'price', 'discounted_price']
        
    def get_product_name(self, obj):
        return obj.product.name
        
    def get_discounted_price(self, obj):
        return obj.product.get_discounted_price()

class OrdersSerializer(serializers.ModelSerializer):
    details = OrderDetailsSerializer(many=True, read_only=True)
    username = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Orders
        fields = [
            'order_id', 'user', 'username', 'customer_name', 'customer_email', 
            'customer_phone', 'shipping_address', 'total_amount', 'order_status', 
            'created_at', 'details', 'payment_method', 'payment_status'
        ]
        
    def get_username(self, obj):
        if obj.user:
            return obj.user.username
        return None
        
    def get_payment_method(self, obj):
        try:
            payment = Payments.objects.get(order=obj)
            return payment.payment_method
        except Payments.DoesNotExist:
            return "Cash on Delivery"  # Mặc định
            
    def get_payment_status(self, obj):
        try:
            payment = Payments.objects.get(order=obj)
            return payment.payment_status
        except Payments.DoesNotExist:
            return "Pending"  # Mặc định

class OrderCreateSerializer(serializers.ModelSerializer):
    details = OrderDetailsSerializer(many=True, write_only=True, required=False)
    
    class Meta:
        model = Orders
        fields = [
            'order_id', 'user', 'customer_name', 'customer_email', 
            'customer_phone', 'shipping_address', 'total_amount', 
            'order_status', 'details'
        ]
    
    def create(self, validated_data):
        details_data = validated_data.pop('details', [])
        order = Orders.objects.create(**validated_data)
        
        for detail in details_data:
            OrderDetails.objects.create(order=order, **detail)
            
        return order
    
    def update(self, instance, validated_data):
        details_data = validated_data.pop('details', None)
        
        # Cập nhật các trường cơ bản của đơn hàng
        instance.user = validated_data.get('user', instance.user)
        instance.customer_name = validated_data.get('customer_name', instance.customer_name)
        instance.customer_email = validated_data.get('customer_email', instance.customer_email)
        instance.customer_phone = validated_data.get('customer_phone', instance.customer_phone)
        instance.shipping_address = validated_data.get('shipping_address', instance.shipping_address)
        instance.total_amount = validated_data.get('total_amount', instance.total_amount)
        instance.order_status = validated_data.get('order_status', instance.order_status)
        instance.save()
        
        # Cập nhật chi tiết đơn hàng nếu được cung cấp
        if details_data is not None:
            # Xóa chi tiết đơn hàng cũ
            OrderDetails.objects.filter(order=instance).delete()
            
            # Thêm chi tiết đơn hàng mới
            for detail in details_data:
                OrderDetails.objects.create(order=instance, **detail)
        
        return instance
    
    def validate(self, data):
        # Đảm bảo có user hoặc thông tin khách hàng
        if not data.get('user') and not data.get('customer_name'):
            raise serializers.ValidationError(
                "Phải cung cấp user_id hoặc customer_name cho đơn hàng"
            )
        return data

class CartSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['cart_id', 'user', 'product', 'product_name', 'product_price', 'quantity', 'order', 'created_at']
        
    def get_product_name(self, obj):
        return obj.product.name
        
    def get_product_price(self, obj):
        return obj.product.price

class CartDetailSerializer(serializers.ModelSerializer):
    product_detail = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['cart_id', 'user', 'product', 'quantity', 'created_at', 'product_detail', 'total_price', 'discounted_price']
    
    def get_product_detail(self, obj):
        product = obj.product
        # Lấy hình ảnh đầu tiên của sản phẩm
        images = product.images.all()
        image_url = None
        
        if images.exists():
            # Ưu tiên lấy hình ảnh chính
            primary_image = images.filter(is_primary=True).first()
            if primary_image:
                image_url = primary_image.image_url
            else:
                # Nếu không có hình ảnh chính, lấy hình ảnh đầu tiên
                image_url = images.first().image_url
        
        # Lấy tên danh mục
        category_name = product.category.name
        
        return {
            'product_id': product.product_id,
            'name': product.name,
            'description': product.description,
            'price': float(product.price),
            'stock_quantity': product.stock_quantity,
            'category_id': product.category.category_id,
            'category_name': category_name,
            'image_url': image_url
        }
    
    def get_total_price(self, obj):
        # Tính tổng giá của sản phẩm trong giỏ hàng (giá cơ bản * số lượng)
        return float(obj.product.price * obj.quantity)
    
    def get_discounted_price(self, obj):
        # Tính giá sau khuyến mãi cho sản phẩm
        discounted_price = obj.product.get_discounted_price()
        return float(discounted_price * obj.quantity)

class PaymentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payments
        fields = '__all__'

class BlogImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogImages
        fields = ['image_id', 'image_url', 'is_primary']

class BlogSerializer(serializers.ModelSerializer):
    images = BlogImagesSerializer(many=True, read_only=True)
    
    class Meta:
        model = Blog
        fields = ['blog_id', 'title', 'content', 'created_at', 'images']

class CareersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Careers
        fields = '__all__'

class CareerApplicationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerApplications
        fields = '__all__'

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

class FaqSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faq
        fields = '__all__'

class TermsAndConditionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TermsAndConditions
        fields = '__all__'

class PrivacyPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivacyPolicy
        fields = '__all__'

class SocialMediaUrlsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaUrls
        fields = '__all__'

class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscribers
        fields = ['id', 'email', 'created_at', 'status']
        read_only_fields = ['id', 'created_at', 'status'] 