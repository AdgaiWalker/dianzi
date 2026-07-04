// 从 @dianzi/shared re-export 所有共享类型，保持现有 import 路径兼容
export type {
  Domain,
  CampusDomain,
  ExperienceTab,
  Topic,
  Tool,
  Article,
  User,
  UserSolution,
  ThemeMode,
  Language,
  ExportFormat,
  LibraryMode,
  ContentStatus,
  ContentVisibility,
  ContentItem,
  ContentAsset,
  FolderMeta,
  AnalyticsEvent,
  UserStats,
  PlatformStats,
} from '@dianzi/shared';

// enum 必须用值导出
export { ContentType } from '@dianzi/shared';

// 站点特有类型
export type UserCenterTab = 'profile' | 'solutions' | 'favorites' | 'credits' | 'notifications' | 'settings';
