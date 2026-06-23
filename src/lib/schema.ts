import site from '../data/site.json';
import social from '../data/social.json';
import testimonials from '../data/testimonials.json';
import faq from '../data/faq.json';
import packages from '../data/packages.json';
import models from '../data/models.json';

interface SchemaProps {
  type?: 'home' | 'service';
  serviceName?: string;
  serviceDescription?: string;
  pageUrl?: string;
}

function absoluteUrl(pathOrUrl: string) {
  const value = String(pathOrUrl || '').trim();
  if (!value) return site.domain;
  if (value.startsWith('http')) return value;
  return `${site.domain}${value.startsWith('/') ? value : `/${value}`}`;
}

function mediaUrl(src: string) {
  return src.startsWith('http') ? src : `${site.domain}${src}`;
}

export function getLocalBusinessSchema() {
  const sameAs = [social.instagram.url];
  if (social.googleReviews.url && !social.googleReviews.url.includes('/example/')) {
    sameAs.push(social.googleReviews.url);
  }

  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'BeautySalon'],
    '@id': `${site.domain}/#business`,
    name: site.brand,
    description: site.tagline,
    url: site.domain,
    telephone: site.phone,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Patna',
      addressRegion: 'Bihar',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 25.5941,
      longitude: 85.1376,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: social.googleReviews.rating,
      reviewCount: social.googleReviews.totalReviews,
    },
    priceRange: '₹₹₹',
    image: mediaUrl(site.seo?.ogImage || '/media/logo.png'),
    sameAs,
    areaServed: { '@type': 'City', name: 'Patna' },
    knowsAbout: [
      'Bridal Makeup',
      'Engagement Makeup',
      'Haldi Makeup',
      'Reception Makeup',
      'HD Makeup',
      'Airbrush Makeup',
    ],
  };
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.domain}/#website`,
    name: site.brand,
    url: site.domain,
    description: site.seo?.description || site.tagline,
    publisher: { '@id': `${site.domain}/#business` },
    inLanguage: 'en-IN',
  };
}

export function getPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Deep Shikha',
    jobTitle: 'Lakmé Certified Bridal Makeup Artist',
    worksFor: { '@id': `${site.domain}/#business` },
    url: site.domain,
    sameAs: [social.instagram.url],
    knowsAbout: ['Bridal Makeup', 'Hair Styling', 'Airbrush Makeup'],
  };
}

export function getFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function getReviewSchema() {
  const reviews = testimonials.filter((t) => t.type === 'text' || t.type === 'google');
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${site.brand} - Bridal Makeup Services`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: site.stats.googleRating,
      reviewCount: social.googleReviews.totalReviews,
    },
    review: reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      reviewBody: r.text,
    })),
  };
}

export function getServiceListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Makeup Packages',
    itemListElement: packages.map((pkg, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: pkg.name,
        description: pkg.description,
        offers: {
          '@type': 'Offer',
          price: pkg.price,
          priceCurrency: 'INR',
        },
        provider: { '@id': `${site.domain}/#business` },
      },
    })),
  };
}

export function getImageGallerySchema() {
  const items = models.models || [];
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `${site.brand} Portfolio`,
    description: 'Client bridal and event makeup work',
    image: items
      .flatMap((m) => m.photos || [])
      .slice(0, 20)
      .map((src) => ({
        '@type': 'ImageObject',
        contentUrl: mediaUrl(src),
      })),
  };
}

export function getServiceSchema(serviceName: string, description: string, pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description,
    provider: {
      '@type': 'BeautySalon',
      name: site.brand,
      url: site.domain,
    },
    areaServed: {
      '@type': 'City',
      name: 'Patna',
    },
    url: absoluteUrl(pageUrl),
  };
}

export function getBreadcrumbSchema(serviceName: string, pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site.domain },
      { '@type': 'ListItem', position: 2, name: serviceName, item: absoluteUrl(pageUrl) },
    ],
  };
}

export function getAllSchemas(props: SchemaProps = {}) {
  const schemas: object[] = [
    getWebSiteSchema(),
    getLocalBusinessSchema(),
    getPersonSchema(),
    getFAQSchema(),
    getReviewSchema(),
    getServiceListSchema(),
    getImageGallerySchema(),
  ];
  if (props.type === 'service' && props.serviceName) {
    schemas.push(
      getServiceSchema(
        props.serviceName,
        props.serviceDescription || '',
        props.pageUrl || '',
      ),
    );
    schemas.push(getBreadcrumbSchema(props.serviceName, props.pageUrl || ''));
  }
  return schemas;
}
