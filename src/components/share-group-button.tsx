import { faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Pressable, Share } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';

// Opens the phone's share sheet with the invite code. Lives in the group header.
export function ShareGroupButton({ name, code }: { name: string; code: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('groups.shareCode')}
      hitSlop={12}
      onPress={() =>
        Share.share({ message: t('groups.shareMessage', { name, code }) }).catch(() => {
          // the share sheet failed to open: nothing useful to tell the user
        })
      }>
      <FontAwesomeIcon icon={faShareNodes} size={20} color={theme.text} />
    </Pressable>
  );
}
