import { createTheme } from '@mantine/core'

// Palette monochrome : le « primary » va du gris clair au noir pur,
// pour un rendu entièrement noir et blanc dans toute l'application.
const mono = [
  '#f8f8f8',
  '#eeeeee',
  '#dddddd',
  '#bbbbbb',
  '#999999',
  '#666666',
  '#444444',
  '#2a2a2a',
  '#151515',
  '#000000',
]

export const theme = createTheme({
  colors: { mono },
  primaryColor: 'mono',
  primaryShade: 9,
  black: '#000000',
  white: '#ffffff',
  defaultRadius: 'sm',
  components: {
    InputWrapper: {
      styles: { required: { color: '#000000' } },
    },
    Paper: {
      defaultProps: { shadow: 'none', withBorder: true },
      styles: { root: { borderColor: '#000000' } },
    },
    Button: {
      defaultProps: { radius: 'sm' },
    },
    Badge: {
      defaultProps: { radius: 'sm' },
    },
    Modal: {
      styles: { content: { border: '1px solid #000000' } },
    },
  },
})
