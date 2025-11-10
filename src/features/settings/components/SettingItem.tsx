import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Switch, Divider } from 'react-native-paper';
import { Typography } from '@/shared/ui';

/**
 * SettingItem Component
 *
 * Displays a single setting row with label and control (toggle or button).
 * Includes an optional divider between items.
 *
 * @example
 * ```tsx
 * <SettingItem
 *   label="Sound Effects"
 *   type="toggle"
 *   value={soundEnabled}
 *   onChange={(value) => setSoundEnabled(value)}
 * />
 * ```
 */

interface SettingItemProps {
  /** Setting label/title */
  label: string;
  /** Type of control */
  type: 'toggle' | 'select' | 'button';
  /** Current value (for toggle: boolean, for select/button: string) */
  value?: boolean | string;
  /** Change handler */
  onChange?: (value: boolean | string) => void;
  /** Whether to show divider below */
  showDivider?: boolean;
}

export function SettingItem({
  label,
  type,
  value,
  onChange,
  showDivider = true,
}: SettingItemProps) {
  const handleToggle = () => {
    if (type === 'toggle' && onChange) {
      onChange(!(value as boolean));
    }
  };

  const handlePress = () => {
    if ((type === 'select' || type === 'button') && onChange) {
      onChange(value as string);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={type === 'toggle' ? handleToggle : handlePress}
        activeOpacity={type === 'toggle' ? 1 : 0.7}
        accessibilityRole={type === 'toggle' ? 'switch' : 'button'}
        accessibilityLabel={label}
      >
        <View style={styles.labelContainer}>
          <Typography variant="body">{label}</Typography>
        </View>

        <View style={styles.controlContainer}>
          {type === 'toggle' && (
            <Switch
              value={value as boolean}
              onValueChange={handleToggle}
              accessibilityLabel={`Toggle ${label}`}
            />
          )}

          {(type === 'select' || type === 'button') && (
            <Typography variant="body" color="secondary">
              {value as string}
            </Typography>
          )}
        </View>
      </TouchableOpacity>

      {showDivider && <Divider style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  labelContainer: {
    flex: 1,
    marginRight: 16,
  },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    marginHorizontal: 16,
  },
});
