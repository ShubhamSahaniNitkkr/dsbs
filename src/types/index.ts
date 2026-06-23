export interface InstagramMedia {
  type: 'reel' | 'post';
  url: string;
  shortcode: string;
}

export interface MediaRotationItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  poster?: string;
}

export interface MediaGalleryItem {
  id: string;
  title: string;
  story: string;
  image: string;
  before?: string;
  after?: string;
  instagram?: InstagramMedia;
  featured?: boolean;
}

export interface GalleryItem extends MediaGalleryItem {}

export interface GalleryData {
  bridal: GalleryItem[];
  engagement: GalleryItem[];
  haldi: GalleryItem[];
  reception: GalleryItem[];
  party: GalleryItem[];
  anniversary: GalleryItem[];
  hair: GalleryItem[];
}

export interface Transformation {
  id: string;
  brideName: string;
  event: string;
  before: string;
  after: string;
  beforeType?: 'image' | 'video';
  afterType?: 'image' | 'video';
  story: string;
  packageUsed: string;
  instagram?: InstagramMedia;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  priceLabel?: string;
  mostPopular?: boolean;
  startingFrom?: boolean;
  includes: string[];
  description?: string;
}

export interface Testimonial {
  id: string;
  type: 'video' | 'google' | 'text';
  name: string;
  rating: number;
  text: string;
  event?: string;
  instagram?: InstagramMedia;
  date?: string;
  image?: string;
  modelId?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  slug: string;
}

export interface TeamMember {
  name: string;
  role: string;
  certification?: string;
  bio: string;
  philosophy?: string;
  image: string;
  instagram?: string;
  isFounder?: boolean;
}

export interface WorkInProgressItem {
  src: string;
  type: 'image' | 'video';
}

export interface WorkInProgress {
  enabled: boolean;
  label: string;
  title: string;
  subtitle: string;
  items: WorkInProgressItem[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface SiteConfig {
  brand: string;
  tagline: string;
  location: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  domain: string;
  seo?: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
  };
  stats: {
    happyBrides: number;
    yearsExperience: number;
    googleRating: number;
  };
  certifications: string[];
  whatsappMessages: {
    consultation: string;
    package: string;
    general: string;
    payment: string;
  };
  heroReel?: InstagramMedia;
}

export interface PaymentConfig {
  upiId: string;
  qrImage: string;
  displayName: string;
  advanceNote: string;
  sectionLabel?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  defaultAdvance: number;
  packagesAdvance: Record<string, number>;
  instructions: string[];
  formEndpoint: string;
  accessKey: string;
  notificationEmail: string;
}

export interface SocialConfig {
  instagram: {
    handle: string;
    url: string;
    featuredReels: InstagramMedia[];
  };
  googleReviews: {
    url: string;
    rating: number;
    totalReviews: number;
  };
}

export type GalleryCategory = keyof GalleryData;

export type ModelCategory = 'bridal' | 'engagement' | 'reception' | 'party' | 'haldi';

export interface ClientModel {
  id: string;
  title: string;
  category: ModelCategory;
  cover: string | null;
  video: string | null;
  videos: string[];
  photos: string[];
}

export interface SeoPageConfig {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string;
  galleryCategory: GalleryCategory;
  featuredPackageId: string;
}
