// Единый источник истины для всех ключей localStorage / sessionStorage.
// Никогда не дублируйте строки — импортируйте отсюда.

export const SK = {
  // ── sessionStorage (очищается при закрытии вкладки) ──────────────────────
  USER_EMAIL:          'ovora_user_email',
  USER_ROLE:           'userRole',
  IS_AUTHENTICATED:    'isAuthenticated',
  ADMIN_TOKEN:         'ovora_admin_token',

  // ── localStorage (персистентное) ─────────────────────────────────────────
  CURRENT_USER:        'ovora_current_user',
  PERSISTENT_AUTH:     'ovora_auth_persistent',

  // Чаты
  CHATS:               'ovora_chats_v2',
  CHAT_CONTACTS:       'ovora_chat_contacts_v2',
  CHAT_MSGS_PREFIX:    'ovora_msgs_v2_',   // + chatId

  // Поездки / грузы
  PUBLISHED_TRIPS:     'ovora_published_trips',
  ALL_TRIPS:           'ovora_all_trips',
  PUBLISHED_CARGOS:    'ovora_published_cargos',
  ALL_CARGOS:          'ovora_all_cargos',

  // Офферы / отзывы
  CACHED_OFFERS:       'ovora_cached_offers',
  SEEN_OFFER_IDS:      'ovora_seen_offer_ids',
  OFFERS:              'ovora_offers',
  REVIEWS:             'ovora_reviews',

  // Уведомления (настройки)
  NOTIF_PUSH:          'ovora_notif_push',
  NOTIF_OFFERS:        'ovora_notif_offers',
  NOTIF_MESSAGES:      'ovora_notif_messages',
  NOTIF_TRIPS:         'ovora_notif_trips',

  // Отслеживание
  ACTIVE_SHIPMENT:     'ovora_active_shipment',
  SENDER_TRACKING:     'ovora_sender_tracking_trip',
  REVIEWED_TRIPS:      'ovora_reviewed_trips',
  SEARCH_HISTORY:      'ovora_search_history',

  // Avia
  AVIA_SESSION:        'ovora_avia_session',
} as const;

export type StorageKey = typeof SK[keyof typeof SK];
