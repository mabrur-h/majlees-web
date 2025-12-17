// Auth Types
export interface User {
  id: string;
  email: string | null;
  googleId?: string | null;
  name?: string;
  profilePhotoUrl?: string | null;
  authProvider?: 'google' | 'telegram';
  telegramId?: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramLanguageCode?: string;
  telegramIsPremium?: boolean;
  telegramPhotoUrl?: string;
  createdAt: string;
}

// Telegram Auth Response
export interface TelegramAuthResponse {
  success: boolean;
  data?: {
    user: User;
    tokens: AuthTokens;
    isNewUser: boolean;
  };
  error?: ApiError;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    tokens: AuthTokens;
  };
  error?: ApiError;
}

// API Types
export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Lecture Types
export type LectureStatus =
  | 'uploaded'
  | 'extracting'
  | 'transcribing'
  | 'summarizing'
  | 'completed'
  | 'failed';

export type SummarizationType = 'lecture' | 'custdev';

export type Language = 'uz' | 'ru' | 'en';

export interface TranscriptionSegment {
  index?: number;
  startTime?: number;
  endTime?: number;
  startTimeMs?: number;
  endTimeMs?: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  text: string;
  speaker?: string;
}

export interface Transcription {
  fullText: string;
  wordCount: number;
  segments: TranscriptionSegment[];
}

export interface Chapter {
  startTime: number;
  endTime: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  title: string;
  summary: string;
}

export interface KeyPoint {
  index: number;
  title: string;
  description?: string;
  timestamp?: number;
  timestampFormatted?: string;
  importance?: number;
}

export interface LectureSummary {
  overview: string;
  chapters: Chapter[];
  custdevData?: CustDevData;
}

// CustDev Types
export interface CallSummary {
  title: string;
  overview: string;
  customerMood: string;
}

export interface PainPoint {
  painPoint: string;
  impact: string;
  timestampMs?: number;
}

export interface PositiveFeedback {
  feature: string;
  benefit: string;
  timestampMs?: number;
}

export interface ProductSuggestion {
  type: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  relatedPainPoint?: string;
}

export interface ActionItem {
  owner: string;
  action: string;
  priority: 'High' | 'Medium' | 'Low';
  timestampMs?: number;
}

// Mind Map Types
export interface MindMapCentralNode {
  label: string;
  description: string;
}

export interface MindMapCustomerProfile {
  label: string;
  items: Array<{ key: string; value: string }>;
}

export interface MindMapNeedsAndGoals {
  label: string;
  items: Array<{ goal: string; priority: 'High' | 'Medium' | 'Low' }>;
}

export interface MindMapPainPoints {
  label: string;
  items: Array<{ pain: string; severity: 'Critical' | 'Major' | 'Minor'; emotion: string }>;
}

export interface MindMapJourneyStage {
  label: string;
  currentStage: string;
  touchpoints: string[];
}

export interface MindMapOpportunities {
  label: string;
  items: Array<{ opportunity: string; effort: 'High' | 'Medium' | 'Low'; impact: 'High' | 'Medium' | 'Low' }>;
}

export interface MindMapKeyInsights {
  label: string;
  patterns: string[];
  quotes: Array<{ text: string; context: string }>;
}

export interface MindMapActionItems {
  label: string;
  items: ActionItem[];
}

export interface MindMapConnection {
  from: string;
  to: string;
  reason: string;
}

export interface MindMap {
  centralNode: MindMapCentralNode;
  branches: {
    customerProfile?: MindMapCustomerProfile;
    needsAndGoals?: MindMapNeedsAndGoals;
    painPoints?: MindMapPainPoints;
    journeyStage?: MindMapJourneyStage;
    opportunities?: MindMapOpportunities;
    keyInsights?: MindMapKeyInsights;
    actionItems?: MindMapActionItems;
  };
  connections?: MindMapConnection[];
}

export interface CustDevData {
  callSummary?: CallSummary;
  keyPainPoints?: PainPoint[];
  positiveFeedback?: PositiveFeedback[];
  productSuggestions?: ProductSuggestion[];
  internalActionItems?: ActionItem[];
  mindMap?: MindMap;
}

// Folder Types
export interface Folder {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  lectureCount?: number;
  createdAt: string;
  updatedAt: string;
  children?: Folder[];
}

export interface FolderCreateRequest {
  name: string;
  color?: string;
  parentId?: string;
}

export interface FolderUpdateRequest {
  name?: string;
  color?: string | null;
  parentId?: string | null;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  color?: string;
  lectureCount?: number;
  createdAt: string;
}

export interface TagCreateRequest {
  name: string;
  color?: string;
}

export interface TagUpdateRequest {
  name?: string;
  color?: string | null;
}

// Lecture Entity
export interface Lecture {
  id: string;
  title?: string;
  originalFilename: string;
  fileSizeBytes: number;
  status: LectureStatus;
  language?: Language;
  summarizationType: SummarizationType;
  durationSeconds?: number;
  durationFormatted?: string;
  audioUrl?: string;
  errorMessage?: string;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
  transcription?: Transcription;
  summary?: LectureSummary;
  keyPoints?: KeyPoint[];
  tags?: Tag[];
}

export interface LectureUpdateRequest {
  title?: string;
  language?: Language;
  folderId?: string | null;
}

export interface LecturesResponse {
  data: Lecture[];
  pagination: PaginationInfo;
}

export interface LectureDetailResponse {
  lecture: Lecture;
}

// Lightweight Status Response (for polling)
export interface LectureStatusLight {
  id: string;
  status: LectureStatus;
  progress: number;
  errorMessage: string | null;
}

// Batch Status Response
export interface BatchStatusResponse {
  statuses: Record<string, LectureStatusLight>;
}

// Separate content responses for lazy loading
export interface TranscriptResponse {
  transcription: Transcription & {
    pagination?: PaginationInfo;
  };
}

export interface SummaryResponse {
  summary: LectureSummary;
  keyPoints?: KeyPoint[];
}

export interface SummaryOnlyResponse {
  summary: LectureSummary;
}

export interface KeyPointsResponse {
  keyPoints: KeyPoint[];
}

export interface CustDevResponse {
  callSummary?: CallSummary;
  keyPainPoints?: PainPoint[];
  positiveFeedback?: PositiveFeedback[];
  productSuggestions?: ProductSuggestion[];
  internalActionItems?: ActionItem[];
  mindMap?: MindMap;
}

export interface MindMapResponse {
  mindMap: MindMap;
}

export interface PainPointsResponse {
  keyPainPoints: PainPoint[];
}

export interface SuggestionsResponse {
  productSuggestions: ProductSuggestion[];
}

export interface ActionsResponse {
  internalActionItems: ActionItem[];
}

export interface UserStats {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}

// Share Types
export interface LectureShare {
  id: string;
  lectureId: string;
  slug: string;
  isPublic: boolean;
  showTranscription: boolean;
  showSummary: boolean;
  showKeyPoints: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShareRequest {
  customSlug?: string;
  showTranscription?: boolean;
  showSummary?: boolean;
  showKeyPoints?: boolean;
}

export interface UpdateShareRequest {
  isPublic?: boolean;
  showTranscription?: boolean;
  showSummary?: boolean;
  showKeyPoints?: boolean;
}

export interface ShareResponse {
  share: LectureShare;
  shareUrl: string;
}

export interface CheckSlugResponse {
  slug: string;
  available: boolean;
}

// Public shared lecture response (no auth required)
export interface PublicLectureResponse {
  slug: string;
  title: string | null;
  durationSeconds: number | null;
  durationFormatted: string | null;
  language: string;
  summarizationType: SummarizationType;
  createdAt: string;
  ownerName?: string | null;
  transcription?: {
    fullText: string;
    wordCount: number | null;
    segments: TranscriptionSegment[];
  } | null;
  summary?: {
    overview: string;
    chapters: Chapter[] | null;
  } | null;
  keyPoints?: KeyPoint[] | null;
}

// Upload Types
export interface UploadMetadata {
  filename: string;
  filetype: string;
  title: string;
  language: Language;
  summarizationType: SummarizationType;
}

export interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  displayNameUz: string | null;
  priceUzs: number;
  minutesPerMonth: number;
  description: string | null;
  descriptionUz: string | null;
  features: string[] | null;
  featuresUz: string[] | null;
  isActive: boolean;
  sortOrder: number;
}

export interface MinutePackage {
  id: string;
  name: string;
  displayName: string;
  displayNameUz: string | null;
  priceUzs: number;
  minutes: number;
  description: string | null;
  descriptionUz: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface MinutesBalance {
  planMinutesRemaining: number;
  planMinutesTotal: number;
  planMinutesUsed: number;
  bonusMinutes: number;
  totalAvailable: number;
  billingCycleStart: string;
  billingCycleEnd: string;
  planName: string;
  planDisplayName: string;
  status: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  billingCycleStart: string;
  billingCycleEnd: string;
  minutesIncluded: number;
  minutesUsed: number;
  bonusMinutes: number;
  status: string;
  plan?: SubscriptionPlan;
}

export interface MinuteTransaction {
  id: string;
  type: 'deduction' | 'refund' | 'bonus' | 'package_purchase' | 'plan_reset';
  minutes: number;
  description: string | null;
  lectureId: string | null;
  createdAt: string;
}

export interface PlansResponse {
  plans: SubscriptionPlan[];
}

export interface PackagesResponse {
  packages: MinutePackage[];
}

export interface BalanceResponse {
  balance: MinutesBalance;
}

export interface SubscriptionResponse {
  subscription: UserSubscription | null;
}

export interface ActivatePlanResponse {
  subscription?: UserSubscription;
  payment?: {
    id: string;
    userId: string;
    paymentType: string;
    planId: string;
    amountUzs: number;
    provider: string;
    status: string;
    createdAt: string;
    planName: string;
    planDisplayName: string;
  };
  paymentUrl?: string;
  message: string;
  requiresPayment?: boolean;
}

export interface PurchasePackageResponse {
  transaction?: {
    id: string;
    type: string;
    minutes: number;
    description: string | null;
    createdAt: string;
  };
  payment?: {
    id: string;
    userId: string;
    paymentType: string;
    packageId: string;
    amountUzs: number;
    provider: string;
    status: string;
    createdAt: string;
    packageName: string;
    packageDisplayName: string;
  };
  paymentUrl?: string;
  message: string;
  requiresPayment?: boolean;
}

export interface TransactionsResponse {
  transactions: MinuteTransaction[];
  pagination: PaginationInfo;
}

// Account Linking Types
export interface LinkedAccountsStatus {
  google: {
    linked: boolean;
    email?: string | null;
  };
  telegram: {
    linked: boolean;
    username?: string | null;
  };
}

export interface InitTelegramLinkResponse {
  token: string;
  deepLink: string;
  expiresIn: number;
}

export interface InitGoogleLinkResponse {
  token: string;
  expiresIn: number;
}

export interface CompleteGoogleLinkResponse {
  user: User;
  merged: boolean;
  message: string;
}

export interface UnlinkResponse {
  message: string;
}
