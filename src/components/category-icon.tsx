import {
  faBaby,
  faBroom,
  faCartShopping,
  faClipboardList,
  faEllipsis,
  faPeopleRoof,
  faShirt,
  faUtensils,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { useTheme } from '@/hooks/use-theme';
import type { CategoryId } from '@/lib/categories';

// Icons live here (not in lib/categories.ts) so the keyword detector stays free of
// UI imports. Record<CategoryId, ...> makes TypeScript fail if a category has no icon.
const ICONS: Record<CategoryId, IconDefinition> = {
  family: faPeopleRoof,
  care: faBaby,
  shopping: faCartShopping,
  cleaning: faBroom,
  admin: faClipboardList,
  laundry: faShirt,
  food: faUtensils,
  other: faEllipsis,
};

type Props = {
  category: CategoryId;
  size?: number;
  // defaults to the normal text colour
  color?: string;
};

export function CategoryIcon({ category, size = 20, color }: Props) {
  const theme = useTheme();
  return <FontAwesomeIcon icon={ICONS[category]} size={size} color={color ?? theme.text} />;
}
