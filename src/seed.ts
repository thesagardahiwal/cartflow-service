import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PromotionCampaign } from './repositories/models/PromotionCampaign';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cartflow';

const seedCampaigns = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing campaigns to avoid duplicates during testing
    await PromotionCampaign.deleteMany({});

    const campaigns = [
      {
        campaignName: 'Summer Value Sale (10% off > ₹5,000)',
        type: 'VALUE_DISCOUNT',
        threshold: 5000,
        percentage: 10,
        active: true,
        priority: 10
      },
      {
        campaignName: 'Premium Spender Bonus (20% off > ₹10,000)',
        type: 'PREMIUM_BONUS',
        threshold: 10000,
        percentage: 20,
        active: true,
        priority: 20 // Higher priority
      },
      {
        campaignName: 'Bulk Buyer Reward (₹500 off >= 10 items)',
        type: 'BULK_REWARD',
        threshold: 10,
        fixedReward: 500,
        active: true,
        priority: 5
      },
      {
        campaignName: 'Category Diversity (5% off >= 2 categories)',
        type: 'CATEGORY_REWARD',
        threshold: 2,
        percentage: 5,
        active: true,
        priority: 1
      }
    ];

    await PromotionCampaign.insertMany(campaigns);
    console.log('Successfully seeded Promotion Campaigns!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedCampaigns();
