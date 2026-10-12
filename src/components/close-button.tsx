import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';

// Closes a modal. The header gives it the standard place (top right).
export function CloseButton() {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.close')}
      hitSlop={12}
      // with no history (e.g. opened by a link) there is nothing to go back to
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <FontAwesomeIcon icon={faXmark} size={20} color={theme.text} />
    </Pressable>
  );
}
