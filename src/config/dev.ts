import AsyncStorage from '@react-native-async-storage/async-storage';

// Development Configuration
//
// Auth bypass is DOUBLE-gated: it requires a dev build (__DEV__) AND an
// explicit opt-in via EXPO_PUBLIC_DEV_BYPASS_AUTH=true in your .env.
// It is impossible to ship a build with auth bypassed.
export const DEV_MODE = {
  BYPASS_AUTH: __DEV__ && process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true',
  // Test user for development
  TEST_USER: {
    email: 'user1@example.com',
    password: 'test123',
    name: 'Rahil Sheth',
  },
  // Debug settings
  DEBUG_LOGS: __DEV__,
  USE_MOCK_DATA: false,
};

// Available test users for switching (matching the database setup)
export const DEV_USERS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Rahil Sheth',
    email: 'user1@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'owner',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Jig Sheth',
    email: 'user2@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Aarav Sheth',
    email: 'user3@example.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'member',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Kena Sheth',
    email: 'user4@example.com',
    avatar: 'https://i.pravatar.cc/150?img=4',
    role: 'member',
  },
];

// Current dev user ID (will be updated when switching)
let currentDevUserId = '550e8400-e29b-41d4-a716-446655440001';

export const getCurrentDevUser = () => {
  return DEV_USERS.find(user => user.id === currentDevUserId) || DEV_USERS[0];
};

export const setCurrentDevUser = (userId: string) => {
  currentDevUserId = userId;
  // Store in AsyncStorage for persistence
  AsyncStorage.setItem('dev_current_user_id', userId);
};

export const initializeDevUser = async () => {
  try {
    const storedUserId = await AsyncStorage.getItem('dev_current_user_id');
    if (storedUserId) {
      currentDevUserId = storedUserId;
    }
  } catch (error) {
    console.log('DEV MODE: Error loading stored user ID, using default');
  }
};

export const isDevMode = (): boolean => {
  return DEV_MODE.BYPASS_AUTH;
};

// Enhanced dev utilities
export const getDevUserById = (userId: string) => {
  return DEV_USERS.find(user => user.id === userId);
};

export const getDevUserByEmail = (email: string) => {
  return DEV_USERS.find(user => user.email === email);
};

export const getAllDevUsers = () => {
  return DEV_USERS;
};

export const getCurrentDevUserRole = () => {
  const user = getCurrentDevUser();
  return user?.role || 'member';
};

export const isCurrentUserOwner = () => {
  return getCurrentDevUserRole() === 'owner';
};

export const isCurrentUserAdmin = () => {
  const role = getCurrentDevUserRole();
  return role === 'owner' || role === 'admin';
};
