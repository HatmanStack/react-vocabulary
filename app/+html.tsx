import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const SITE_URL = 'https://vocabulary.hatstack.fun';
const SITE_TITLE = 'Vocabulary Learning App - Master 360+ Words with Interactive Quizzes';
const SITE_DESCRIPTION = 'Build your vocabulary with 360+ words across 18 themed lists. Interactive quizzes, progress tracking, achievements, and cloud sync. Free vocabulary builder for all ages.';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary Meta Tags */}
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content="vocabulary app, vocabulary builder, word learning, vocabulary quiz, learn new words, vocabulary practice, educational app, word games" />
        <meta name="author" content="HatStack" />
        <meta name="theme-color" content="#6200ee" />
        <link rel="canonical" href={SITE_URL} />
        <link rel="manifest" href="/manifest.json" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <meta property="og:site_name" content="Vocabulary Learning App" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={SITE_URL} />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Vocabulary Learning App',
              description: SITE_DESCRIPTION,
              url: SITE_URL,
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web, iOS, Android',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                { '@type': 'Question', name: 'How do I start learning?', acceptedAnswer: { '@type': 'Answer', text: 'From the home screen, select a vocabulary list. Then choose a difficulty level. The quiz will start automatically.' } },
                { '@type': 'Question', name: 'What are the different question types?', acceptedAnswer: { '@type': 'Answer', text: 'Multiple Choice (choose from 4 options) and Fill-in-the-Blank (type the missing word).' } },
                { '@type': 'Question', name: 'How does progress tracking work?', acceptedAnswer: { '@type': 'Answer', text: 'Each word has a mastery level (0-3) based on your answers. View progress in the Statistics screen.' } },
                { '@type': 'Question', name: 'What are achievements?', acceptedAnswer: { '@type': 'Answer', text: 'Rewards for reaching learning milestones. Complete quizzes, learn words, and maintain streaks to unlock them.' } },
                { '@type': 'Question', name: 'Can I reset my progress?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, go to Settings > Data > Danger Zone > Reset All Progress.' } },
              ],
            }),
          }}
        />

        {/* Expo injects styles here via ScrollViewStyleReset */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
