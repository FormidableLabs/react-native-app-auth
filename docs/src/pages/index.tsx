import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import { LandingHero } from '../components/landing/landing-hero';
import { LandingBanner } from '../components/landing/landing-banner';
import { LandingFeaturedProjects } from '../components/landing/landing-featured-projects';
import { LandingFeatures } from '../components/landing/landing-features';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <div className="dark:bg-gray-500 bg-gray-200 dark:text-white text-theme-2">
        <LandingHero
          heading={siteConfig.title}
          body={siteConfig.tagline}
          copyText="yarn add react-native-app-auth"
          navItems={[
            { link: '/open-source/react-native-app-auth/docs', title: 'Documentation' },
            {
              link: '/open-source/react-native-app-auth/docs/category/providers',
              title: 'Examples',
            },
            {
              link: 'https://github.com/FormidableLabs/react-native-app-auth',
              title: 'Github',
            },
          ]}
        ></LandingHero>
      </div>
      <LandingFeatures
        cta={{
          link: '/open-source/react-native-app-auth/docs/category/providers',
          text: 'Explore tested providers',
        }}
        heading="OAuth"
        description="Supports most OpenID and OAuth providers that implement the OAuth2 spec."
        list={[]}
      />
      <LandingBanner
        showDivider
        heading="Get Started"
        body="React Native App Auth is an SDK for communicating with OAuth2 providers. It wraps the native AppAuth-iOS and AppAuth-Android libraries and can support PKCE."
        cta={{ link: '/open-source/react-native-app-auth/docs', text: 'Documentation' }}
      />
      <LandingFeaturedProjects
        showDivider
        heading="Other Open Source from Nearform_Commerce"
        projects={[
          {
            name: 'victory',
            title: 'Victory Native',
            link: 'https://commerce.nearform.com/open-source/victory-native/',
            description: 'A charting library for React Native with a focus on performance and customization.',
          },
          {
            name: 'owl',
            title: 'React Native Owl',
            link: 'https://commerce.nearform.com/open-source/react-native-owl/',
            description:
              'Visual Regression Testing for React Native',
          },
          {
            name: 'urql',
            title:'URQL',
            link: 'https://commerce.nearform.com/open-source/urql',
            description:
              'The highly customizable and versatile GraphQL client for React, Svelte, Vue, or plain JavaScript, with which you add on features like normalized caching as you grow.',
          },
          {
            name: 'groqd',
            title: 'GROQD',
            link: 'https://commerce.nearform.com/open-source/groqd',
            description:
              'Typesafe Query Builder for GROQ, Sanity\'s open-source query language',
          },
        ]}
      />
    </Layout>
  );
}
