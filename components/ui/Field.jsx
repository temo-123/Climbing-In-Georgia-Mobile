import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Form row: label (+ optional required mark / hint) and the website's
// form-control look. Pass `children` instead of input props for custom
// controls (chips, pickers).
export function FieldLabel({ label, required, hint }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.req}> *</Text>}
      </Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function Field({ label, required, hint, children, style, multiline, ...inputProps }, ref) {
  return (
    <View style={[styles.field, style]}>
      {!!label && <FieldLabel label={label} required={required} hint={hint} />}
      {children ?? (
        <TextInput
          ref={ref}
          style={[styles.input, multiline && styles.multiline]}
          placeholderTextColor={COLORS.muted}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...inputProps}
        />
      )}
    </View>
  );
}

export default forwardRef(Field);

export const inputStyle = {
  borderWidth: 1,
  borderColor: COLORS.line,
  borderRadius: RADII.md,
  backgroundColor: COLORS.surface,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  fontFamily: FONTS.body,
  color: COLORS.ink,
};

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  labelRow: { marginBottom: 6 },
  label: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2 },
  req: { color: COLORS.danger },
  hint: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: 2, lineHeight: 17 },
  input: inputStyle,
  multiline: { minHeight: 96, paddingTop: 12 },
});
