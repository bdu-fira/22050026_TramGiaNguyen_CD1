import axios from 'axios';
import { fetchPromotions } from './api';

// Function to get the correct API URL that works for all network devices
const getApiUrl = () => {
  // Use the hostname from the current URL if localhost, otherwise use IP address
  const hostname = window.location.hostname;
    return `http://${hostname}:8000/api`;
};

// Define the API base URL
const API_BASE_URL = getApiUrl();

// Service for interacting with promotions API
export const promotionsService = {
  /**
   * Get all promotions data formatted for the Promotions component
   * Returns featured promotion, current, upcoming and expired promotions
   * @returns {Promise<Object>} The promotions data
   */
  getPromotions: async () => {
    try {
      const promotionsData = await fetchPromotions();
      
      // Format the data to match the structure expected by the Promotions component
      const featuredPromotion = promotionsData.find(promo => promo.featured) || promotionsData[0];
      
      // Filter promotions by status
      const currentPromotions = promotionsData.filter(promo => 
        promo.status === 'current' || promo.status === 'active' || 
        (promo.start_date && promo.end_date && 
          new Date() >= new Date(promo.start_date) && 
          new Date() <= new Date(promo.end_date))
      );
      
      const upcomingPromotions = promotionsData.filter(promo => 
        promo.status === 'upcoming' || 
        (promo.start_date && new Date() < new Date(promo.start_date))
      );
      
      const expiredPromotions = promotionsData.filter(promo => 
        promo.status === 'expired' || 
        (promo.end_date && new Date() > new Date(promo.end_date))
      );
      
      return {
        featured: featuredPromotion ? {
          title: featuredPromotion.title,
          description: featuredPromotion.description || featuredPromotion.content,
          code: featuredPromotion.code || '',
          image: featuredPromotion.img_banner || featuredPromotion.image
        } : null,
        promotions: {
          current: currentPromotions.map(promo => ({
            id: promo.promotion_id,
            title: promo.title,
            description: promo.description || promo.content,
            code: promo.code || '',
            expires: promo.end_date ? new Date(promo.end_date).toLocaleDateString('vi-VN') : 'Không giới hạn',
            image: promo.img_banner || promo.image
          })),
          upcoming: upcomingPromotions.map(promo => ({
            id: promo.promotion_id,
            title: promo.title,
            description: promo.description || promo.content,
            code: 'Coming soon',
            expires: promo.start_date ? `Bắt đầu từ ${new Date(promo.start_date).toLocaleDateString('vi-VN')}` : 'Chưa xác định',
            image: promo.img_banner || promo.image
          })),
          expired: expiredPromotions.map(promo => ({
            id: promo.promotion_id,
            title: promo.title,
            description: promo.description || promo.content,
            code: promo.code || '',
            expires: promo.end_date ? `Đã hết hạn ${new Date(promo.end_date).toLocaleDateString('vi-VN')}` : 'Đã hết hạn',
            image: promo.img_banner || promo.image
          }))
        }
      };
    } catch (error) {
      console.error('Error in promotionsService.getPromotions:', error);
      throw error;
    }
  },

  /**
   * Get details for a specific promotion
   * @param {number} promotionId The ID of the promotion to fetch
   * @returns {Promise<Object>} The promotion details
   */
  getPromotionDetails: async (promotionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/promotions/${promotionId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for promotion ${promotionId}:`, error);
      throw error;
    }
  },

  /**
   * Get products associated with a specific promotion
   * @param {number} promotionId The ID of the promotion
   * @returns {Promise<Array>} Array of products with promotion
   */
  getPromotionProducts: async (promotionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/promotions/${promotionId}/products/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for promotion ${promotionId}:`, error);
      throw error;
    }
  }
};

export default promotionsService; 