import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { fetchBlogs, createBlog, uploadBlogImage } from '../services/api';
import './News.css';

function News() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const { blogId } = useParams();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  
  // New state for the blog editor
  const [showEditor, setShowEditor] = useState(false);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSummary, setBlogSummary] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blogImage, setBlogImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // You would implement proper auth check here
  const [apiError, setApiError] = useState(null); // Thêm state để theo dõi lỗi API

  useEffect(() => {
    // Check if user is admin
    // In a real app, this would be based on authentication
    setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    
    // Fetch blogs from API
    fetchBlogsData();
  }, [blogId]);

  const fetchBlogsData = async () => {
    // Reset lỗi API
    setApiError(null);
    
    try {
      const blogsData = await fetchBlogs();
      
      if (!blogsData || blogsData.length === 0) {
        setApiError("Không có bài viết nào trong cơ sở dữ liệu.");
        return;
      }
      
      // Chuyển đổi dữ liệu từ định dạng DB sang định dạng frontend
      const formattedBlogs = blogsData.map(blog => {
        // Xử lý nội dung để loại bỏ các thẻ HTML trong phần tóm tắt
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = blog.content;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        const cleanSummary = plainText.substring(0, 150) + '...';
        
        return {
          id: blog.blog_id,
          title: blog.title,
          summary: cleanSummary,
          content: blog.content,
          // Lấy ảnh đầu tiên hoặc ảnh được đánh dấu là primary
          image: blog.images && blog.images.length > 0 
            ? (blog.images.find(img => img.is_primary)?.image_url || blog.images[0].image_url)
            : '../assets/images/New Gear Drop.png',
          category: blog.category || 'Blog', // Lấy category từ API nếu có
          author: blog.author || 'Admin', // Lấy author từ API nếu có
          date: blog.created_at,
          featured: blog.featured || false,
        };
      });
      
      // Set categories - có thể lấy từ API riêng nếu cần
      const uniqueCategories = [...new Set(formattedBlogs.map(article => article.category))];
      setCategories(['all', ...uniqueCategories]);
      
      // Set featured article
      const featured = formattedBlogs.find(article => article.featured) || formattedBlogs[0];
      setFeaturedArticle(featured);
      
      // Set all articles
      setArticles(formattedBlogs);
      
      // If blogId is provided, show the specific blog
      if (blogId) {
        const article = formattedBlogs.find(article => article.id === parseInt(blogId));
        if (article) {
          setSelectedArticle(article);
        } else {
          setApiError(`Không tìm thấy bài viết với ID ${blogId}`);
        }
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      // Hiển thị lỗi cụ thể thay vì dùng dữ liệu mẫu
      if (error.response) {
        // Lỗi từ server với response status code
        setApiError(`Lỗi từ máy chủ: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Lỗi không nhận được response
        setApiError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ backend đã được chạy chưa.");
      } else {
        // Lỗi không xác định
        setApiError(`Lỗi không xác định: ${error.message}`);
      }
    }
  };

  // Convert HTML to EditorState for editing
  const convertHtmlToEditorState = (html) => {
    if (!html) return EditorState.createEmpty();
    const contentBlock = htmlToDraft(html);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
      return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
  };

  // Handle image upload for the editor
  const handleImageUpload = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ data: { link: reader.result } });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload for blog thumbnail
  const handleBlogImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBlogImage(file);
      
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit new blog
  const handleSubmitBlog = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
      
      // Tạo dữ liệu blog để gửi lên API
      const blogData = {
        title: blogTitle,
        content: htmlContent,
      };
      
      // Gửi blog content trước để lấy blog_id
      const blogResponse = await createBlog(blogData);
      const newBlogId = blogResponse.blog_id;
      
      // Nếu có ảnh, tiến hành upload ảnh
      if (blogImage) {
        const formData = new FormData();
        formData.append('image', blogImage);
        formData.append('blog_id', newBlogId);
        formData.append('is_primary', true); // Đánh dấu là ảnh chính
        
        await uploadBlogImage(formData);
      }
      
      // Reset form và fetch lại blogs
      setShowEditor(false);
      setBlogTitle('');
      setBlogSummary('');
      setBlogCategory('');
      setEditorState(EditorState.createEmpty());
      setBlogImage(null);
      setPreviewImage('');
      fetchBlogsData();
      
      alert('Bài viết đã được đăng thành công!');
    } catch (error) {
      console.error('Lỗi khi đăng bài viết:', error);
      alert('Không thể đăng bài viết. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc bài viết dựa trên danh mục và từ khóa tìm kiếm
  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get current posts for pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredArticles
    .filter(article => !article.featured || selectedCategory !== 'all' || searchTerm)
    .slice(indexOfFirstPost, indexOfLastPost);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < Math.ceil(filteredArticles.length / postsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    
    // Đối với ngôn ngữ tiếng Việt, có thể cần chỉnh sửa thêm để hiển thị "ngày" trước ngày
    const formattedDate = date.toLocaleDateString('vi-VN', options);
    
    // Thêm chữ "ngày" trước ngày nếu định dạng không tự thêm
    return formattedDate;
  };

  // Xử lý khi người dùng chọn một danh mục
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedArticle(null); // Đóng bài viết chi tiết khi chuyển danh mục
    setCurrentPage(1); // Reset to first page when changing category
  };

  // Xử lý khi người dùng tìm kiếm
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Xử lý khi người dùng chọn một bài viết
  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    // Không sử dụng useNavigate để tránh tải lại trang, nhưng vẫn cập nhật URL
    window.history.pushState({}, '', `/news/${article.id}`);
  };

  // Quay lại danh sách bài viết
  const handleBackToList = () => {
    setSelectedArticle(null);
    window.history.pushState({}, '', '/news');
  };

  // Toggle blog editor
  const toggleEditor = () => {
    setShowEditor(!showEditor);
    if (!showEditor) {
      // Reset editor state when opening
      setBlogTitle('');
      setBlogSummary('');
      setBlogCategory('');
      setEditorState(EditorState.createEmpty());
      setBlogImage(null);
      setPreviewImage('');
    }
  };

  return (
    <div className="page-container news-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circle top-right"></div>
      <div className="cyber-circle bottom-left"></div>
      <div className="cyber-line left"></div>
      <div className="cyber-line right"></div>
      
      {/* Hiển thị thông báo lỗi API nếu có */}
      {apiError && (
        <div className="api-error-message">
          <h3>Có lỗi xảy ra</h3>
          <p>{apiError}</p>
          <button className="submit-btn" onClick={fetchBlogsData}>Thử lại</button>
        </div>
      )}
      
      {!selectedArticle && !showEditor ? (
        <>
          {/* Header */}
          <div className="news-header">
            <h2>Tin Tức Mới Nhất</h2>
            <p>Cập nhật thông tin mới nhất từ GaMine</p>
            {isAdmin && (
              <button 
                className="create-blog-btn submit-btn" 
                onClick={toggleEditor}
                style={{ marginTop: '20px' }}
              >
                Tạo Bài Viết Mới
              </button>
            )}
          </div>

          {/* Hiển thị nội dung chính nếu không có lỗi API */}
          {!apiError && (
          <div className="news-content">
            <div className="news-section">
                <h3>Khám Phá Bài Viết</h3>
              <div className="news-filters">
                <div className="search-bar form-group">
                  <input
                    type="text"
                      placeholder="Tìm kiếm tin tức..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <div className="category-filters">
                  {categories.map(category => (
                    <button
                      key={category}
                      className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category)}
                    >
                        {category === 'all' ? 'Tất Cả' : (category.charAt(0).toUpperCase() + category.slice(1))}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Featured Article */}
              {featuredArticle && selectedCategory === 'all' && !searchTerm && (
                <div className="featured-article">
                  <div className="featured-image">
                    <img src={featuredArticle.image} alt={featuredArticle.title} />
                      <div className="featured-badge">Nổi Bật</div>
                  </div>
                  <div className="featured-content">
                    <h2>{featuredArticle.title}</h2>
                    <p className="featured-meta">
                      <span className="category">{featuredArticle.category}</span>
                      <span className="dot">•</span>
                      <span className="date">{formatDate(featuredArticle.date)}</span>
                      <span className="dot">•</span>
                        <span className="author">Đăng bởi {featuredArticle.author}</span>
                    </p>
                    <p className="featured-summary">{featuredArticle.summary}</p>
                    <button 
                      className="submit-btn" 
                      onClick={() => handleArticleSelect(featuredArticle)}
                    >
                        Đọc Bài Viết
                    </button>
                  </div>
                </div>
              )}

              {/* Articles Grid */}
              <div className="articles-grid">
                {currentPosts.map(article => (
                  <div 
                    className="article-card" 
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                  >
                    <div className="article-image">
                      <img src={article.image} alt={article.title} />
                      <div className="article-category">{article.category}</div>
                    </div>
                    <div className="article-info">
                      <p className="article-date">{formatDate(article.date)}</p>
                      <h3 className="article-title">{article.title}</h3>
                      <p className="article-summary">{article.summary}</p>
                        <p className="article-author">Đăng bởi {article.author}</p>
                      </div>
                  </div>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <div className="no-results">
                    <p>Không tìm thấy bài viết nào. Vui lòng điều chỉnh tìm kiếm hoặc bộ lọc.</p>
                </div>
              )}
              
              {/* Pagination */}
              {filteredArticles.length > postsPerPage && (
                <div className="pagination">
                  <button 
                    onClick={prevPage} 
                    className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
                    disabled={currentPage === 1}
                  >
                    &laquo; Trước
                  </button>
                  
                  <div className="pagination-numbers">
                    {Array.from({ length: Math.ceil(filteredArticles.filter(article => !article.featured || selectedCategory !== 'all' || searchTerm).length / postsPerPage) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => paginate(index + 1)}
                        className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={nextPage} 
                    className={`pagination-button ${currentPage === Math.ceil(filteredArticles.filter(article => !article.featured || selectedCategory !== 'all' || searchTerm).length / postsPerPage) ? 'disabled' : ''}`}
                    disabled={currentPage === Math.ceil(filteredArticles.filter(article => !article.featured || selectedCategory !== 'all' || searchTerm).length / postsPerPage)}
                  >
                    Tiếp &raquo;
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
        </>
      ) : showEditor ? (
        /* Blog Editor */
        <div className="news-content">
          <div className="news-section blog-editor-container">
            <button className="back-button" onClick={toggleEditor}>
              ← Hủy và Quay Lại Danh Sách
            </button>
            
            <h2 className="editor-title">Tạo Bài Viết Mới</h2>
            
            <form onSubmit={handleSubmitBlog} className="blog-form">
              <div className="form-group">
                <label htmlFor="blogTitle">Tiêu Đề Bài Viết</label>
                <input
                  type="text"
                  id="blogTitle"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  required
                  placeholder="Nhập tiêu đề hấp dẫn..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="blogSummary">Tóm Tắt</label>
                <textarea
                  id="blogSummary"
                  value={blogSummary}
                  onChange={(e) => setBlogSummary(e.target.value)}
                  required
                  placeholder="Viết một tóm tắt ngắn về bài viết của bạn..."
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="blogCategory">Danh Mục</label>
                <select
                  id="blogCategory"
                  value={blogCategory}
                  onChange={(e) => setBlogCategory(e.target.value)}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories
                    .filter(cat => cat !== 'all')
                    .map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  <option value="new">+ Thêm Danh Mục Mới</option>
                </select>
              </div>
              
              {blogCategory === 'new' && (
                <div className="form-group">
                  <label htmlFor="newCategory">Tên Danh Mục Mới</label>
                  <input
                    type="text"
                    id="newCategory"
                    onChange={(e) => setBlogCategory(e.target.value)}
                    required
                    placeholder="Nhập tên danh mục mới..."
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="blogImage">Hình Ảnh Nổi Bật</label>
                <input
                  type="file"
                  id="blogImage"
                  accept="image/*"
                  onChange={handleBlogImageChange}
                  required
                />
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Xem trước" />
                  </div>
                )}
              </div>
              
              <div className="form-group editor-container">
                <label>Nội Dung Bài Viết</label>
                <Editor
                  editorState={editorState}
                  wrapperClassName="editor-wrapper"
                  editorClassName="editor-main"
                  onEditorStateChange={setEditorState}
                  toolbar={{
                    options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'emoji', 'image', 'history'],
                    inline: { inDropdown: false },
                    list: { inDropdown: true },
                    textAlign: { inDropdown: true },
                    link: { inDropdown: true },
                    history: { inDropdown: true },
                    image: {
                      uploadCallback: handleImageUpload,
                      alt: { present: true, mandatory: false },
                      previewImage: true,
                    },
                  }}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={toggleEditor}
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang Đăng...' : 'Đăng Bài Viết'}
                </button>
            </div>
            </form>
          </div>
        </div>
      ) : (
        /* Article Detail View */
        <div className="news-content">
          <div className="news-section">
            <button className="back-button" onClick={handleBackToList}>
              ← Quay Lại Danh Sách
            </button>

            <h2 className="article-title">{selectedArticle.title}</h2>
            
            <div className="article-meta">
              <span className="category">{selectedArticle.category}</span>
              <span className="dot">•</span>
              <span className="date">{formatDate(selectedArticle.date)}</span>
              <span className="dot">•</span>
              <span className="author">Đăng bởi {selectedArticle.author}</span>
            </div>

            <div className="article-hero-image">
              <img src={selectedArticle.image} alt={selectedArticle.title} />
            </div>

            {/* Xử lý nội dung bài viết để loại bỏ các thuộc tính style không mong muốn */}
            <div className="article-content">
              {(() => {
                let processedContent = selectedArticle.content;
                
                // Kiểm tra nếu có style attribute thì xử lý
                if (selectedArticle.content.includes('style=')) {
                  processedContent = processedContent
                    // Loại bỏ thuộc tính background-color
                    .replace(/background-color:\s*rgb\([^)]+\)/g, 'background-color: transparent')
                    // Thay đổi màu chữ cho phù hợp với theme tối
                    .replace(/color:\s*rgb\([^)]+\)/g, 'color: inherit')
                    // Loại bỏ font-family không cần thiết
                    .replace(/font-family:[^;]+;/g, '')
                    // Đảm bảo font-size phù hợp
                    .replace(/font-size:[^;]+;/g, '')
                    // Loại bỏ các thuộc tính style khác không cần thiết
                    .replace(/style="([^"]*)"/g, (match, styles) => {
                      // Giữ lại text-align nếu có
                      const textAlign = styles.match(/text-align:\s*[^;]+;/);
                      return textAlign ? `style="${textAlign[0]}"` : '';
                    });
                }
                
                return <div dangerouslySetInnerHTML={{ __html: processedContent }}></div>;
              })()}
            </div>

            <div className="article-tags">
              {selectedArticle.tags && selectedArticle.tags.map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>

            <div className="share-section">
              <h4>Chia sẻ bài viết:</h4>
              <div className="share-buttons">
                <button className="share-button facebook">Facebook</button>
                <button className="share-button twitter">Twitter</button>
                <button className="share-button linkedin">LinkedIn</button>
                <button className="share-button copy">Sao Chép Liên Kết</button>
              </div>
            </div>

            <h3 className="related-heading">Bài Viết Liên Quan</h3>
            <div className="related-articles">
              {articles
                .filter(article => 
                  article.id !== selectedArticle.id && 
                  (article.category === selectedArticle.category || 
                   (article.tags && selectedArticle.tags && 
                    article.tags.some(tag => selectedArticle.tags.includes(tag))))
                )
                .slice(0, 3)
                .map(article => (
                  <div 
                    className="related-article-card" 
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                  >
                    <div className="related-article-image">
                      <img src={article.image} alt={article.title} />
                    </div>
                    <div className="related-article-info">
                      <h4>{article.title}</h4>
                      <p className="related-article-date">{formatDate(article.date)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default News; 