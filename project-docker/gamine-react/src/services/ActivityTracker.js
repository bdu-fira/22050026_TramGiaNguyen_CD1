import { trackUserActivity } from './api';

/**
 * Utility class for tracking user activities throughout the application
 */
class ActivityTracker {
  /**
   * Track page view
   * @param {string} pagePath - The path of the page being viewed
   */
  trackPageView(pagePath) {
    trackUserActivity({
      action_type: 'page_view',
      page_path: pagePath
    });
  }

  /**
   * Track search action
   * @param {string} searchQuery - The search query entered by the user
   */
  trackSearch(searchQuery) {
    trackUserActivity({
      action_type: 'search',
      search_query: searchQuery
    });
  }

  /**
   * Track product view
   * @param {number} productId - The ID of the product being viewed
   */
  trackProductView(productId) {
    trackUserActivity({
      action_type: 'product_view',
      product_id: productId
    });
  }

  /**
   * Track category view
   * @param {number} categoryId - The ID of the category being viewed
   */
  trackCategoryView(categoryId) {
    trackUserActivity({
      action_type: 'category_view',
      category_id: categoryId
    });
  }

  /**
   * Track any custom action
   * @param {string} actionType - The type of action
   * @param {Object} data - Any additional data to track
   */
  trackCustomAction(actionType, data = {}) {
    trackUserActivity({
      action_type: actionType,
      ...data
    });
  }

  /**
   * Track promotion view
   * @param {number} promotionId - The ID of the promotion being viewed
   */
  trackPromotionView(promotionId) {
    console.log(`ActivityTracker: User viewed promotion ${promotionId}`);
    return trackUserActivity({
      activity_type: 'promotion_view',
      promotion_id: promotionId
    });
  }
}

// Create a singleton instance
const activityTracker = new ActivityTracker();
export default activityTracker; 