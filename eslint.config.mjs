import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt().append(
  { ignores: ['backend/'] },
  // Prettier decides how tags close.
  { rules: { 'vue/html-self-closing': 'off' } },
)
