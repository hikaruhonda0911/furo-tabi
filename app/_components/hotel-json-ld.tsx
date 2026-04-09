import type { Hotel } from '@/types/hotel';

type HotelJsonLdProps = {
  hotels: Hotel[];
};

export function HotelJsonLd({ hotels }: HotelJsonLdProps) {
  const items = hotels.map((hotel) => ({
    '@type': 'Hotel',
    name: hotel.name,
    image: hotel.imageUrl,
    ...(hotel.reviewAverage
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: hotel.reviewAverage,
            bestRating: 5,
          },
        }
      : {}),
    ...(hotel.hotelInformationUrl ? { url: hotel.hotelInformationUrl } : {}),
    priceRange: `¥${hotel.price.toLocaleString()}〜`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires inline script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
