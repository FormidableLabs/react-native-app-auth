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
            name: 'nuka',
            link: 'https://commerce.nearform.com/open-source/nuka-carousel',
            description:
              'Small, fast and accessibility-first React carousel library with easily customizable UI and behavior to fit your brand and site.',
          },
          {
            name: 'spectacle',
            link: 'https://commerce.nearform.com/open-source/spectacle',
            description:
              'A React.js based library for creating sleek presentations using JSX syntax with the ability to live demo your code!',
          },
          {
            name: 'envy',
            link: 'https://github.com/FormidableLabs/envy',
            description:
              'Envy will trace the network calls from every application in your stack and allow you to view them in a central place.',
          },
          {
            name: 'victory',
            link: 'https://commerce.nearform.com/open-source/victory/',
            description: 'React.js components for modular charting and data visualization.',
          },
        ]}
      />
    </Layout>
  );
}
