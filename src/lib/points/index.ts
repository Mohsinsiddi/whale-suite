/**
 * Whale Suite Points & Privacy Score System
 *
 * Re-export everything from config for easy importing
 */

export {
  // Action Configuration
  POINT_ACTIONS,
  type PointAction,

  // Badge Configuration
  BADGE_TIERS,
  type BadgeTier,

  // SDK Registry
  SDK_REGISTRY,
  type SdkId,

  // Privacy Score Configuration
  PRIVACY_SCORE_CONFIG,

  // Helper Functions
  calculatePoints,
  calculatePrivacyScore,
  getActionsForSdk,
  getActionsForCategory,

  // Legacy exports (for backwards compatibility)
  POINT_VALUES,
  BADGE_MULTIPLIERS,
} from './config';
