import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ngantri Docs',
  description: 'Food Court Ordering System Documentation',

  themeConfig: {
    nav: [
      { text: 'Overview', link: '/guide/overview' },
      { text: 'Setup', link: '/guide/setup' },
      { text: 'Operations', link: '/guide/operations' },
      { text: 'Learn More', link: '/guide/learn-more' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Overview', link: '/guide/overview' },
          { text: 'Setup & Quick Start', link: '/guide/setup' },
          { text: 'Operations & Maintenance', link: '/guide/operations' },
          { text: 'Learn More', link: '/guide/learn-more' }
        ]
      }
    ]
  }
})
