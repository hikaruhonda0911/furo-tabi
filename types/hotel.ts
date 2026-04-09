export type Hotel = {
  id: number;
  name: string;
  price: number;
  priceType: 'vacancy' | 'minimum' | 'none';
  imageUrl: string;
  reviewAverage: number | null;
  roomName: string;
  tags: string[];
  separateBathRooms: string[];
  showerOnlyRooms: string[];
  hotelInformationUrl: string;
  area: string;
  hasPublicBath: boolean;
  hasSauna: boolean;
  hasPrivateBath: boolean;
  googleRating: number;
  googleReviewCount: number;
  googlePhotoUrl: string;
  latitude: number;
  longitude: number;
};

export type AreaOption = {
  id: string;
  label: string;
};

export type RegionConfig = {
  name: string;
  ids: string[];
};
