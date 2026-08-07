import { StyleSheet } from 'react-native'

// Single source of truth for the app's theme color — was hardcoded as
// '#279fbb' independently in dozens of files.
export const COLORS = {
  primary: '#279fbb',
}

export const gStyle = StyleSheet.create({
    main_container: {
        flex: 1,
        padding: 16,
    },
      h1: {
      fontSize: 26
    },
    h2: {
      fontSize: 20
    },
    h3: {
      fontSize: 16
    },
    h4: {
      fontSize: 12
    },
    p: {
        fontSize: 12
    },
    center: {
        fontSize: 12
    },
})