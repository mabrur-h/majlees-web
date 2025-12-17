import type {
  ApiResponse,
  AuthResponse,
  TelegramAuthResponse,
  Lecture,
  LecturesResponse,
  LectureDetailResponse,
  LectureUpdateRequest,
  LectureStatusLight,
  BatchStatusResponse,
  TranscriptResponse,
  SummaryResponse,
  SummaryOnlyResponse,
  KeyPointsResponse,
  CustDevResponse,
  MindMapResponse,
  PainPointsResponse,
  SuggestionsResponse,
  ActionsResponse,
  UserStats,
  User,
  Folder,
  FolderCreateRequest,
  FolderUpdateRequest,
  Tag,
  TagCreateRequest,
  TagUpdateRequest,
  CreateShareRequest,
  UpdateShareRequest,
  ShareResponse,
  CheckSlugResponse,
  PublicLectureResponse,
  PlansResponse,
  PackagesResponse,
  BalanceResponse,
  SubscriptionResponse,
  ActivatePlanResponse,
  PurchasePackageResponse,
  TransactionsResponse,
  LinkedAccountsStatus,
  InitTelegramLinkResponse,
  InitGoogleLinkResponse,
  CompleteGoogleLinkResponse,
  UnlinkResponse,
} from '../types';

// API URL configuration
const getDefaultApiUrl = () => {
  // Check localStorage first (can be set via Settings page)
  const storedUrl = localStorage.getItem('apiUrl');
  if (storedUrl) return storedUrl;

  const hostname = window.location.hostname;

  // If accessing from localhost, use localhost:3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // For ngrok/Telegram: Use relative URL (empty string)
  // Vite proxy will forward /api requests to localhost:3000
  return '';
};

const DEFAULT_API_URL = getDefaultApiUrl();

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = localStorage.getItem('apiUrl') || DEFAULT_API_URL;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
    localStorage.setItem('apiUrl', this.baseUrl);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json() as ApiResponse<T>;

    // Handle authentication errors - clear tokens and trigger re-auth
    // This handles cases like: user deleted after account merge, token expired, etc.
    if (response.status === 401 ||
        (data.success === false && data.error?.code === 'USER_NOT_FOUND')) {
      this.clearTokens();
      // Dispatch event so auth store can react
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return data;
  }

  // Health Check
  async testConnection(): Promise<{ ok: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        return { ok: true, status: data.status || 'OK' };
      }
      return { ok: false, error: `Server responded with ${response.status}` };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      this.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }

    return response as AuthResponse;
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      this.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }

    return response as AuthResponse;
  }

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/v1/auth/me');
  }

  logout(): void {
    this.clearTokens();
  }

  // Telegram Web App Authentication
  async telegramAuth(initDataRaw: string): Promise<TelegramAuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/telegram/webapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `tma ${initDataRaw}`,
      },
    });

    const data = await response.json();

    if (data.success && data.data) {
      this.setTokens(
        data.data.tokens.accessToken,
        data.data.tokens.refreshToken
      );
    }

    return data as TelegramAuthResponse;
  }

  // Google Sign-In Authentication
  async googleAuth(idToken: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    if (response.success && response.data) {
      this.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }

    return response as AuthResponse;
  }

  // Lectures
  async getLectures(
    page = 1,
    limit = 10,
    status?: string,
    fields: 'minimal' | 'full' = 'minimal'
  ): Promise<ApiResponse<LecturesResponse>> {
    let url = `/api/v1/lectures?page=${page}&limit=${limit}&fields=${fields}`;
    if (status) url += `&status=${status}`;

    const response = await this.request<Lecture[]>(url);

    // Transform response to match expected format
    if (response.success) {
      return {
        success: true,
        data: {
          data: (response as any).data || [],
          pagination: (response as any).pagination || {
            page,
            limit,
            total: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      };
    }

    return response as any;
  }

  async getLecture(id: string): Promise<ApiResponse<LectureDetailResponse>> {
    return this.request(`/api/v1/lectures/${id}`);
  }

  async updateLecture(id: string, data: LectureUpdateRequest): Promise<ApiResponse<{ lecture: Lecture }>> {
    return this.request(`/api/v1/lectures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLecture(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/lectures/${id}`, { method: 'DELETE' });
  }

  // Lecture Status (for efficient polling)
  async getLectureStatusLight(id: string): Promise<ApiResponse<LectureStatusLight>> {
    return this.request(`/api/v1/lectures/${id}/status/light`);
  }

  async getLectureStatusBatch(ids: string[]): Promise<ApiResponse<BatchStatusResponse>> {
    return this.request('/api/v1/lectures/status', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // Lecture Content (for lazy loading)
  async getLectureTranscript(
    id: string,
    page?: number,
    limit = 50
  ): Promise<ApiResponse<TranscriptResponse>> {
    let url = `/api/v1/lectures/${id}/transcript`;
    if (page !== undefined) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.request(url);
  }

  async getLectureSummary(id: string): Promise<ApiResponse<SummaryResponse>> {
    return this.request(`/api/v1/lectures/${id}/summary`);
  }

  async getLectureSummaryOnly(id: string): Promise<ApiResponse<SummaryOnlyResponse>> {
    return this.request(`/api/v1/lectures/${id}/summary-only`);
  }

  async getLectureKeyPoints(id: string): Promise<ApiResponse<KeyPointsResponse>> {
    return this.request(`/api/v1/lectures/${id}/keypoints`);
  }

  // CustDev Content (for lazy loading)
  async getCustDevData(id: string): Promise<ApiResponse<CustDevResponse>> {
    return this.request(`/api/v1/lectures/${id}/custdev`);
  }

  async getCustDevMindMap(id: string): Promise<ApiResponse<MindMapResponse>> {
    return this.request(`/api/v1/lectures/${id}/custdev/mindmap`);
  }

  async getCustDevPainPoints(id: string): Promise<ApiResponse<PainPointsResponse>> {
    return this.request(`/api/v1/lectures/${id}/custdev/painpoints`);
  }

  async getCustDevSuggestions(id: string): Promise<ApiResponse<SuggestionsResponse>> {
    return this.request(`/api/v1/lectures/${id}/custdev/suggestions`);
  }

  async getCustDevActions(id: string): Promise<ApiResponse<ActionsResponse>> {
    return this.request(`/api/v1/lectures/${id}/custdev/actions`);
  }

  // User Stats
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.request('/api/v1/users/stats');
  }

  // Lecture Tags
  async getLectureTags(lectureId: string): Promise<ApiResponse<{ tags: Tag[] }>> {
    return this.request(`/api/v1/lectures/${lectureId}/tags`);
  }

  async setLectureTags(lectureId: string, tagIds: string[]): Promise<ApiResponse<{ tags: Tag[] }>> {
    return this.request(`/api/v1/lectures/${lectureId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tagIds }),
    });
  }

  async addTagToLecture(lectureId: string, tagId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/v1/lectures/${lectureId}/tags/${tagId}`, {
      method: 'POST',
    });
  }

  async removeTagFromLecture(lectureId: string, tagId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/v1/lectures/${lectureId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  }

  // Folders
  async getFolders(): Promise<ApiResponse<{ folders: Folder[] }>> {
    return this.request('/api/v1/folders');
  }

  async getFoldersTree(): Promise<ApiResponse<{ folders: Folder[] }>> {
    return this.request('/api/v1/folders/tree');
  }

  async getFolder(id: string): Promise<ApiResponse<{ folder: Folder }>> {
    return this.request(`/api/v1/folders/${id}`);
  }

  async createFolder(data: FolderCreateRequest): Promise<ApiResponse<{ folder: Folder }>> {
    return this.request('/api/v1/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFolder(id: string, data: FolderUpdateRequest): Promise<ApiResponse<{ folder: Folder }>> {
    return this.request(`/api/v1/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFolder(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/v1/folders/${id}`, { method: 'DELETE' });
  }

  // Tags
  async getTags(counts = false): Promise<ApiResponse<{ tags: Tag[] }>> {
    const url = counts ? '/api/v1/tags?counts=true' : '/api/v1/tags';
    return this.request(url);
  }

  async getTag(id: string): Promise<ApiResponse<{ tag: Tag }>> {
    return this.request(`/api/v1/tags/${id}`);
  }

  async createTag(data: TagCreateRequest): Promise<ApiResponse<{ tag: Tag }>> {
    return this.request('/api/v1/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTag(id: string, data: TagUpdateRequest): Promise<ApiResponse<{ tag: Tag }>> {
    return this.request(`/api/v1/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/v1/tags/${id}`, { method: 'DELETE' });
  }

  // Get upload endpoint for TUS
  getUploadEndpoint(): string {
    return `${this.baseUrl}/api/v1/uploads`;
  }

  getAuthHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  // Lecture Sharing
  async createShare(lectureId: string, data?: CreateShareRequest): Promise<ApiResponse<ShareResponse>> {
    return this.request(`/api/v1/lectures/${lectureId}/share`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async getShare(lectureId: string): Promise<ApiResponse<ShareResponse>> {
    return this.request(`/api/v1/lectures/${lectureId}/share`);
  }

  async updateShare(lectureId: string, data: UpdateShareRequest): Promise<ApiResponse<ShareResponse>> {
    return this.request(`/api/v1/lectures/${lectureId}/share`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteShare(lectureId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/v1/lectures/${lectureId}/share`, {
      method: 'DELETE',
    });
  }

  async checkSlugAvailability(slug: string): Promise<ApiResponse<CheckSlugResponse>> {
    return this.request('/api/v1/shares/check-slug', {
      method: 'POST',
      body: JSON.stringify({ slug }),
    });
  }

  // Get the full share URL for a given slug (frontend URL, not API)
  getShareUrl(slug: string): string {
    // Use window.location.origin for the frontend URL
    const frontendUrl = window.location.origin;
    return `${frontendUrl}?share=${slug}`;
  }

  // Get public lecture by slug (no auth required)
  async getPublicLecture(slug: string): Promise<ApiResponse<PublicLectureResponse>> {
    // This endpoint doesn't require authentication
    const response = await fetch(`${this.baseUrl}/api/v1/s/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  // Subscription - Plans
  async getPlans(): Promise<ApiResponse<PlansResponse>> {
    return this.request('/api/v1/subscription/plans');
  }

  // Subscription - Packages
  async getPackages(): Promise<ApiResponse<PackagesResponse>> {
    return this.request('/api/v1/subscription/packages');
  }

  // Subscription - Balance
  async getBalance(): Promise<ApiResponse<BalanceResponse>> {
    return this.request('/api/v1/subscription/balance');
  }

  // Subscription - Current subscription
  async getSubscription(): Promise<ApiResponse<SubscriptionResponse>> {
    return this.request('/api/v1/subscription/me');
  }

  // Subscription - Activate plan by name
  async activatePlan(planName: string): Promise<ApiResponse<ActivatePlanResponse>> {
    return this.request('/api/v1/subscription/activate-plan-by-name', {
      method: 'POST',
      body: JSON.stringify({ planName }),
    });
  }

  // Subscription - Purchase package by name
  async purchasePackage(packageName: string): Promise<ApiResponse<PurchasePackageResponse>> {
    return this.request('/api/v1/subscription/purchase-package-by-name', {
      method: 'POST',
      body: JSON.stringify({ packageName }),
    });
  }

  // Subscription - Transaction history
  async getTransactions(page = 1, limit = 20): Promise<ApiResponse<TransactionsResponse>> {
    return this.request(`/api/v1/subscription/transactions?page=${page}&limit=${limit}`);
  }

  // Account Linking - Get linked accounts status
  async getLinkedAccountsStatus(): Promise<ApiResponse<LinkedAccountsStatus>> {
    return this.request('/api/v1/auth/link/status');
  }

  // Account Linking - Initialize Telegram linking (for Google users)
  async initTelegramLink(): Promise<ApiResponse<InitTelegramLinkResponse>> {
    return this.request('/api/v1/auth/link/telegram/init', {
      method: 'POST',
    });
  }

  // Account Linking - Initialize Google linking (for Telegram users)
  async initGoogleLink(): Promise<ApiResponse<InitGoogleLinkResponse>> {
    return this.request('/api/v1/auth/link/google/init', {
      method: 'POST',
    });
  }

  // Account Linking - Complete Google linking
  async completeGoogleLink(token: string, idToken: string): Promise<ApiResponse<CompleteGoogleLinkResponse>> {
    return this.request('/api/v1/auth/link/google/complete', {
      method: 'POST',
      body: JSON.stringify({ token, idToken }),
    });
  }

  // Account Linking - Unlink Google account
  async unlinkGoogle(): Promise<ApiResponse<UnlinkResponse>> {
    return this.request('/api/v1/auth/unlink/google', {
      method: 'POST',
    });
  }

  // Account Linking - Unlink Telegram account
  async unlinkTelegram(): Promise<ApiResponse<UnlinkResponse>> {
    return this.request('/api/v1/auth/unlink/telegram', {
      method: 'POST',
    });
  }
}

// Singleton instance
export const api = new ApiService();
