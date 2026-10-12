import {
  faFire,
  faHeart,
  faHouse,
  faPeopleRoof,
  faUsers,
  faEllipsis,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { useTheme } from '@/hooks/use-theme';
import type { GroupKind } from '@/lib/groups';

// Record<GroupKind, ...> makes TypeScript fail if a kind has no icon
const ICONS: Record<GroupKind, IconDefinition> = {
  couple: faHeart,
  flatmates: faHouse,
  throuple: faUsers,
  family: faPeopleRoof,
  lovers: faFire,
  other: faEllipsis,
};

export function GroupKindIcon({ kind, size = 20 }: { kind: GroupKind; size?: number }) {
  const theme = useTheme();
  // an unknown kind (e.g. a new enum value not yet in the app) falls back to "other"
  return <FontAwesomeIcon icon={ICONS[kind] ?? faEllipsis} size={size} color={theme.accent} />;
}
