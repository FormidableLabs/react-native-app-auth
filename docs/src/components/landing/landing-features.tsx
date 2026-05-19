import React from 'react';
import { Divider } from './divider';
import { NFLinkButton } from './nf-link-button';

export const LandingFeatures = ({
  cta,
  heading,
  description,
  list,
  showDivider,
}: {
  cta: { link: string; text: string };
  heading: string;
  description?: string;
  list: {
    imgSrc: string;
    alt: string;
    title: string;
    body?: string;
    html?: { __html: string };
  }[];
  showDivider?: boolean;
}) => (
  <div className="flex flex-col text-left mx-16 lg:mx-32 xl:mx-64 my-12">
    {showDivider && <Divider />}
    <h2 className="my-8 text-4xl font-semibold">{heading}</h2>
    {description && <p className="text-lg leading-8">{description}</p>}
    <ul className="grid grid-cols-6 items-start content-start justify-items-start justify-between gap-12 list-none pl-0">
      {list.map(({ alt, body, imgSrc, title, html }, i) => (
        <li key={i} className="flex flex-col items-center text-center">
          <img src={imgSrc} alt={alt} className="max-h-24" />
          <span className="mt-8 text-2xl font-semibold">{title}</span>
          <span dangerouslySetInnerHTML={html} className="mt-2 text-lg leading-8 mx-3">
            {body}
          </span>
        </li>
      ))}
    </ul>
    <NFLinkButton link={cta.link} text={cta.text} />
  </div>
);
