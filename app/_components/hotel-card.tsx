'use client';

import { Bath, Flame, KeyRound, Star } from 'lucide-react';
import Image from 'next/image';

import { UiButton } from '@/components/ui/button';
import { trackAffiliateLinkClick, trackHotelCardClick } from '@/lib/analytics';
import type { Hotel } from '@/types/hotel';

type HotelCardProps = {
  hotel: Hotel;
  position: number;
};

export function HotelCard({ hotel, position }: HotelCardProps) {
  const hasFacilities =
    hotel.hasPublicBath || hotel.hasSauna || hotel.hasPrivateBath;
  const displayImage = hotel.imageUrl || hotel.googlePhotoUrl;

  const handleDetailClick = () => {
    // ホテルカードクリック（位置情報付き）を記録
    trackHotelCardClick({
      hotel_name: hotel.name,
      hotel_id: hotel.id,
      area: hotel.area,
      position,
    });

    // アフィリエイトリンクのクリックを記録（最重要イベント）
    const provider = hotel.hotelInformationUrl.includes('jalan')
      ? 'jalan'
      : 'rakuten';

    trackAffiliateLinkClick({
      hotel_name: hotel.name,
      hotel_id: hotel.id,
      affiliate_provider: provider,
      link_url: hotel.hotelInformationUrl,
    });
  };

  return (
    <article className="rounded-sm bg-white shadow-[var(--shadow-card)]">
      <div className="relative aspect-video overflow-hidden bg-border/30">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={hotel.roomName || hotel.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            画像準備中
          </div>
        )}
        <div className="absolute right-4 top-4 flex flex-col gap-1">
          {hotel.tags.includes('separate-bath') && (
            <span className="rounded-[var(--radius-badge)] bg-primary-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              バストイレ別
            </span>
          )}
          {hotel.tags.includes('shower-only') && (
            <span className="rounded-[var(--radius-badge)] bg-primary-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              シャワーブース
            </span>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between">
          {hotel.googleRating > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <span className="text-muted/50">Google口コミ</span>
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {hotel.googleRating.toFixed(1)}
              <span className="text-muted/60">
                ({hotel.googleReviewCount.toLocaleString()})
              </span>
            </span>
          )}
          <p className="text-sm text-muted">{hotel.area}</p>
        </div>
        <h3 className="mb-4 line-clamp-2 text-xl">{hotel.name}</h3>

        {hasFacilities && (
          <div className="mb-6 flex flex-wrap gap-2">
            {hotel.hasPublicBath && (
              <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                <Bath className="size-3.5" />
                大浴場
              </span>
            )}
            {hotel.hasSauna && (
              <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                <Flame className="size-3.5" />
                サウナ
              </span>
            )}
            {hotel.hasPrivateBath && (
              <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                <KeyRound className="size-3.5" />
                貸切風呂
              </span>
            )}
          </div>
        )}

        <div className="flex items-end justify-between border-t border-border pt-4">
          <div>
            {hotel.priceType === 'vacancy' ? (
              <>
                <span className="text-2xl font-medium">
                  ¥{hotel.price.toLocaleString()}
                </span>
                <span className="ml-1 text-sm text-muted">/ 泊</span>
              </>
            ) : hotel.priceType === 'minimum' ? (
              <>
                <span className="text-2xl font-medium">
                  ¥{hotel.price.toLocaleString()}
                </span>
                <span className="ml-1 text-sm text-muted">〜</span>
              </>
            ) : (
              <span className="text-sm text-muted">料金は詳細ページで確認</span>
            )}
          </div>
          <UiButton
            href={hotel.hotelInformationUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="px-5 py-2 no-underline"
            onClick={handleDetailClick}
          >
            詳細を見る
          </UiButton>
        </div>
      </div>
    </article>
  );
}
