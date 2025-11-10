import type { ModerationStatus, VerificationStatus } from '@us/types';

export type ModeratedPhoto = {
  id: string;
  url: string;
  status: ModerationStatus;
  rejectionReason?: string;
};

export type SampleProfile = {
  id: string;
  name: string;
  age: number;
  distanceMi: number;
  bio: string;
  avatar: string;
  photos: ModeratedPhoto[];
};

export type SampleMatch = SampleProfile & {
  matchPercent: number;
  lastActive: string;
  lastMessage: string;
};

export type SampleUser = {
  id: string;
  name: string;
  email: string;
  age: number;
  location: string;
  avatar: string;
  bio: string;
  interests: string[];
  verificationStatus: VerificationStatus | 'unverified';
  photos: ModeratedPhoto[];
};

const approvedPhoto = (id: string, url: string): ModeratedPhoto => ({ id, url, status: 'approved' });
const pendingPhoto = (id: string, url: string): ModeratedPhoto => ({ id, url, status: 'pending' });
const rejectedPhoto = (id: string, url: string, rejectionReason?: string): ModeratedPhoto => ({
  id,
  url,
  status: 'rejected',
  rejectionReason,
});

export const sampleProfiles: SampleProfile[] = [
  {
    id: 'bot-1',
    name: 'Sarah',
    age: 26,
    distanceMi: 3,
    bio: 'Living my best life ✨',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-1-primary', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&auto=format'),
      approvedPhoto('bot-1-alt', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format'),
    ],
  },
  {
    id: 'bot-2',
    name: 'Emma',
    age: 24,
    distanceMi: 5,
    bio: 'Thanks for matching! 😊',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-2-primary', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&auto=format'),
      pendingPhoto('bot-2-alt', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&auto=format'),
    ],
  },
  {
    id: 'bot-3',
    name: 'Lena',
    age: 27,
    distanceMi: 2,
    bio: 'Coffee + hikes + good convo.',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-3-primary', 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=1200&auto=format'),
      approvedPhoto('bot-3-alt', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&auto=format'),
    ],
  },
  {
    id: 'bot-4',
    name: 'Maya',
    age: 25,
    distanceMi: 8,
    bio: 'Photographer • dog mom 🐶',
    avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-4-primary', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=1200&auto=format'),
      rejectedPhoto(
        'bot-4-alt',
        'https://images.unsplash.com/photo-1541534401786-2077eed87a9f?w=1200&auto=format',
        'Waiting on updated consent from photographer.',
      ),
    ],
  },
  {
    id: 'bot-5',
    name: 'Ava',
    age: 23,
    distanceMi: 6,
    bio: 'Museum hopper & foodie.',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-5-primary', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format'),
      approvedPhoto('bot-5-alt', 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=1200&auto=format'),
    ],
  },
  {
    id: 'bot-6',
    name: 'Olivia',
    age: 28,
    distanceMi: 4,
    bio: 'Runner, reader, ramen enthusiast.',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-6-primary', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format'),
      approvedPhoto('bot-6-alt', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&auto=format'),
    ],
  },
  {
    id: 'bot-7',
    name: 'Zoe',
    age: 25,
    distanceMi: 10,
    bio: 'Concerts & road trips.',
    avatar: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-7-primary', 'https://images.unsplash.com/photo-1520975930495-4f2b234f1cf7?w=1200&auto=format'),
      approvedPhoto('bot-7-alt', 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=1200&auto=format'),
    ],
  },
  {
    id: 'bot-8',
    name: 'Mila',
    age: 22,
    distanceMi: 1,
    bio: 'Studying CS, loves puzzles.',
    avatar: 'https://images.unsplash.com/photo-1547130540-41003c4b20a8?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-8-primary', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format'),
      pendingPhoto('bot-8-alt', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1200&auto=format'),
    ],
  },
  {
    id: 'bot-9',
    name: 'Nora',
    age: 29,
    distanceMi: 7,
    bio: 'Into design & baking.',
    avatar: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-9-primary', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format'),
      approvedPhoto('bot-9-alt', 'https://images.unsplash.com/photo-1520975930495-4f2b234f1cf7?w=1200&auto=format'),
    ],
  },
  {
    id: 'bot-10',
    name: 'Ella',
    age: 26,
    distanceMi: 9,
    bio: 'Studio art • cat person.',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&auto=format',
    photos: [
      approvedPhoto('bot-10-primary', 'https://images.unsplash.com/photo-1541534401786-2077eed87a9f?w=1200&auto=format'),
      approvedPhoto('bot-10-alt', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=1200&auto=format'),
    ],
  },
];

const matchNotes = [
  'You both loved the new rooftop spot in Williamsburg.',
  'Shared playlists swapped. Last track: “Lemonade” 🍋',
  'Coffee meetup penciled in for this weekend.',
  'Compared travel photos for hours last night.',
  'Queued up a co-op game session.',
  'Deep dive on favorite Studio Ghibli scenes.',
];

export const sampleMatches: SampleMatch[] = sampleProfiles.slice(0, 6).map((profile, index) => ({
  ...profile,
  matchPercent: [98, 95, 93, 90, 88, 87][index % 6],
  lastActive: index === 0 ? 'Active now' : `${index + 1}h ago`,
  lastMessage: matchNotes[index % matchNotes.length],
}));

export const demoUserPhotos: ModeratedPhoto[] = [
  approvedPhoto('demo-1', sampleProfiles[0].photos[0].url),
  pendingPhoto('demo-2', sampleProfiles[1].photos[0].url),
  rejectedPhoto('demo-3', sampleProfiles[2].photos[1].url, 'Looks like a stock image — pick another one.'),
];

export const demoUser: SampleUser = {
  id: 'demo-user',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  age: 27,
  location: 'Brooklyn, NY',
  avatar: sampleProfiles[0].avatar,
  bio: 'Product designer exploring thoughtful AI matches. Loves coffee shop playlists.',
  interests: ['Design', 'AI', 'Coffee', 'Running'],
  verificationStatus: 'unverified',
  photos: demoUserPhotos,
};
