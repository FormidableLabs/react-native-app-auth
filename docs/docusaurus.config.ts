import { themes as prismThemes } from 'prism-react-renderer';
import { Config } from '@docusaurus/types';

const config: Config = {
  title: 'React Native App Auth',
  tagline: 'React native bridge for AppAuth - an SDK for communicating with OAuth2 providers.',
  favicon: 'img/nearform-icon.svg',
  url: 'https://commerce.nearform.com/',
  baseUrl: '/open-source/react-native-app-auth',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      {
        hashed: true,
        indexBlog: false,
      },
    ],
  ],
  plugins: [
    async function myPlugin() {
      return {
        name: 'tailwind-plugin',
        configurePostCss(postcssOptions) {
          postcssOptions.plugins = [
            require('postcss-import'),
            require('tailwindcss'),
            require('autoprefixer'),
          ];
          return postcssOptions;
        },
      };
    },
  ],
  themeConfig: {
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    metadata: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
    ],
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    navbar: {
      title: 'React Native App Auth',
      logo: {
        alt: 'NearForm Logo',
        src: 'img/nearform-logo-white.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'sidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/FormidableLabs/react-native-app-auth',
          'aria-label': 'GitHub Repository',
          className: 'header-github-link',
          position: 'right',
        },
      ],
    },
    footer: {
      logo: {
        alt: 'Nearform logo',
        src: 'img/nearform-logo-white.svg',
        href: 'https://commerce.nearform.com',
        width: 100,
        height: 100,
      },
      copyright: `Copyright © 2013-${new Date().getFullYear()} Nearform`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['diff', 'diff-ts'],
    },
  },
};

export default config;
