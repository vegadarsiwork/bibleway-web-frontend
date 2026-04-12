export const ENDPOINTS = {
  auth: {
    register: "/accounts/register/",
    login: "/accounts/login/",
    logout: "/accounts/logout/",
    refreshToken: "/accounts/token/refresh/",
    verifyEmail: "/accounts/verify-email/",
    resendOtp: "/accounts/auth/resend-otp/",
    passwordReset: "/accounts/password-reset/",
    passwordResetConfirm: "/accounts/password-reset/confirm/",
    changePassword: "/accounts/change-password/",
    googleAuth: "/accounts/google-auth/",
  },
  profile: {
    me: "/accounts/profile/",
    userSearch: "/accounts/users/search/",
    userDetail: (userId: string) => `/accounts/users/${userId}/`,
    follow: (userId: string) => `/accounts/users/${userId}/follow/`,
    followers: (userId: string) => `/accounts/users/${userId}/followers/`,
    following: (userId: string) => `/accounts/users/${userId}/following/`,
    block: (userId: string) => `/accounts/users/${userId}/block/`,
    blockedUsers: "/accounts/blocked-users/",
  },
  social: {
    posts: "/social/posts/",
    postDetail: (postId: string) => `/social/posts/${postId}/`,
    postReact: (postId: string) => `/social/posts/${postId}/react/`,
    postComments: (postId: string) => `/social/posts/${postId}/comments/`,
    postShare: (postId: string) => `/social/posts/${postId}/share/`,
    prayers: "/social/prayers/",
    prayerDetail: (prayerId: string) => `/social/prayers/${prayerId}/`,
    prayerReact: (prayerId: string) => `/social/prayers/${prayerId}/react/`,
    prayerComments: (prayerId: string) =>
      `/social/prayers/${prayerId}/comments/`,
    prayerShare: (prayerId: string) => `/social/prayers/${prayerId}/share/`,
    mediaUpload: "/social/media/upload/",
    commentDetail: (commentId: string) => `/social/comments/${commentId}/`,
    replies: (commentId: string) => `/social/comments/${commentId}/replies/`,
    replyDetail: (commentId: string, replyId: string) =>
      `/social/comments/${commentId}/replies/${replyId}/`,
    reportCreate: "/social/reports/",
  },
  bible: {
    sections: "/bible/sections/",
    chapters: (sectionId: string) => `/bible/sections/${sectionId}/chapters/`,
    pages: (chapterId: string) => `/bible/chapters/${chapterId}/pages/`,
    pageDetail: (pageId: string) => `/bible/pages/${pageId}/`,
    search: "/bible/search/",
    apiBibleBibles: "/bible/api-bible/bibles",
    apiBibleBooks: (bibleId: string) =>
      `/bible/api-bible/bibles/${bibleId}/books`,
    apiBibleChapters: (bibleId: string, bookId: string) =>
      `/bible/api-bible/bibles/${bibleId}/books/${bookId}/chapters`,
    apiBibleChapter: (bibleId: string, chapterId: string) =>
      `/bible/api-bible/bibles/${bibleId}/chapters/${chapterId}`,
    apiBibleSearch: (bibleId: string) =>
      `/bible/api-bible/bibles/${bibleId}/search`,
    bookmarks: "/bible/bookmarks/",
    bookmarkDetail: (id: string) => `/bible/bookmarks/${id}/`,
    highlights: "/bible/highlights/",
    highlightDetail: (id: string) => `/bible/highlights/${id}/`,
    notes: "/bible/notes/",
    noteDetail: (id: string) => `/bible/notes/${id}/`,
    pageComments: (pageId: string) => `/bible/pages/${pageId}/comments/`,
  },
  shop: {
    products: "/shop/products/",
    productSearch: "/shop/products/search/",
    productDetail: (productId: string) => `/shop/products/${productId}/`,
    purchaseCreate: "/shop/purchases/",
    purchaseList: "/shop/purchases/list/",
    download: (productId: string) => `/shop/downloads/${productId}/`,
  },
  notifications: {
    list: "/notifications/",
    markRead: "/notifications/read/",
    unreadCount: "/notifications/unread-count/",
    delete: (id: string) => `/notifications/${id}/`,
    registerToken: "/notifications/device-tokens/",
    deregisterToken: "/notifications/device-tokens/deregister/",
  },
  analytics: {
    recordView: "/analytics/views/",
    postAnalytics: (postId: string) => `/analytics/posts/${postId}/`,
    userAnalytics: "/analytics/me/",
    boostCreate: "/analytics/boosts/",
    boostList: "/analytics/boosts/list/",
    boostAnalytics: (boostId: string) =>
      `/analytics/boosts/${boostId}/analytics/`,
  },
  verseOfDay: {
    today: "/verse-of-day/today/",
    byDate: (dateStr: string) => `/verse-of-day/${dateStr}/`,
  },
  chat: {
    conversations: "/chat/conversations/",
    messages: (conversationId: string) =>
      `/chat/conversations/${conversationId}/messages/`,
    markRead: (conversationId: string) =>
      `/chat/conversations/${conversationId}/messages/mark-read/`,
    unreadCount: "/chat/unread-count/",
    translateMessage: "/chat/messages/translate/",
  },
} as const;
