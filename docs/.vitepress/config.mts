import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ngantri Docs',
  description: 'Food Court Ordering System Documentation',

  themeConfig: {
    nav: [
      { text: 'Overview', link: '/guide/overview' },
      { text: 'Setup', link: '/guide/setup' },
      { text: 'Customer', link: '/guide/customer' },
      { text: 'Merchant', link: '/guide/merchant' },
      { text: 'Admin', link: '/guide/admin' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/guide/overview' },
          { text: 'Setup & Quick Start', link: '/guide/setup' }
        ]
      },
      {
        text: 'User Guides',
        items: [
          { text: 'Customer Guide', link: '/guide/customer' },
          { text: 'Merchant Guide', link: '/guide/merchant' },
          { text: 'Admin Guide', link: '/guide/admin' }
        ]
      },
      {
        text: 'Maintenance',
        items: [
          { text: 'Troubleshooting', link: '/guide/troubleshooting' }
        ]
      }
    ]
  }
})
