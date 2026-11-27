export type PlanId = "pro" | "max";
export type SubscriptionStatus =
  | "inactive"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";
export type AssetClass = "stocks" | "crypto" | "futures" | "options";
export type ExperienceLevel =
  | "just_starting"
  | "1_3_years"
  | "3_7_years"
  | "7_plus";

export type Profile = {
  id: string;
  email: string;
  firstName: string;
  avatarUrl: string | null;
  plan: PlanId;
  assetClass: AssetClass[];
  experience: ExperienceLevel;
  currency: string;
  timezone: string;
  twoFactorEnabled: boolean;
  linkedBrokers: number;
  renewsAt: string;
  cardLast4: string;
  onboardingComplete: boolean;
  subscriptionStatus: SubscriptionStatus;
};

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  avgVolume?: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  priceAvg50?: number;
  priceAvg200?: number;
  dayLow?: number;
  dayHigh?: number;
  yearLow?: number;
  yearHigh?: number;
  vsSma50?: number;
  vsSma200?: number;
  volRatio?: number;
  signal?: string;
};

export type ScreenerField =
  | "marketCap"
  | "pe"
  | "eps"
  | "volume"
  | "avgVolume"
  | "volRatio"
  | "changePct"
  | "price"
  | "vsSma50"
  | "vsSma200";

export type ScreenerFilter = {
  id: string;
  field: ScreenerField;
  op: "gt" | "lt" | "gte" | "lte";
  value: number;
  label: string;
};

export type AlertType =
  | "PRICE_TARGET"
  | "VOLATILITY"
  | "VOLUME_SURGE"
  | "RSI_OVERBOUGHT"
  | "RSI_OVERSOLD"
  | "EARNINGS";

export type LiveAlert = {
  id: string;
  symbol: string;
  name?: string;
  types: AlertType[];
  isNew?: boolean;
  description: string;
  price: number;
  changePct: number;
  createdAt: string;
};

export type NotificationPrefs = {
  priceTargets: boolean;
  volumeSpikes: boolean;
  earnings: boolean;
  weeklyDigest: boolean;
};

export type WatchlistItem = Quote;
