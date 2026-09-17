import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Standard 4-color "G" mark, per Google's sign-in button brand guidelines.
export function GoogleIcon({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

// White "f" mark for use on Facebook's brand-blue button background.
export function FacebookIcon({ size = 18, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M22,0H2C0.9,0,0,0.9,0,2v20c0,1.1,0.9,2,2,2h11v-8.6h-3v-3.6h3V9.2c0-3.3,2-5.1,5-5.1c1.4,0,2.7,0.1,3,0.2v3.5h-2.1 c-1.6,0-1.9,0.8-1.9,1.9v2.5h3.8l-0.5,3.6h-3.3V24H22c1.1,0,2-0.9,2-2V2C24,0.9,23.1,0,22,0z"
      />
    </Svg>
  );
}
