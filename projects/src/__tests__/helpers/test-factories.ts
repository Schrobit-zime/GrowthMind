/**
 * 测试数据工厂
 * 用于生成测试数据，确保测试数据的一致性和可维护性
 */

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createTestRecord = (overrides = {}) => ({
  id: 'test-record-id',
  title: 'Test Record',
  content: 'Test content',
  userId: 'test-user-id',
  type: 'mood',
  value: 8,
  date: '2026-06-21',
  note: 'Test note',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createTestGoal = (overrides = {}) => ({
  id: 'test-goal-id',
  title: 'Test Goal',
  description: 'Test goal description',
  userId: 'test-user-id',
  targetValue: 100,
  currentValue: 50,
  startDate: '2026-06-01',
  endDate: '2026-12-31',
  status: 'in-progress',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createTestAnalysis = (overrides = {}) => ({
  id: 'test-analysis-id',
  userId: 'test-user-id',
  type: 'mood',
  period: 'weekly',
  data: { average: 7.5, trend: 'up' },
  insights: ['Your mood has improved this week'],
  createdAt: new Date().toISOString(),
  ...overrides
});

export const createTestSupervise = (overrides = {}) => ({
  id: 'test-supervise-id',
  supervisorId: 'supervisor-user-id',
  supervisedId: 'supervised-user-id',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createTestReminder = (overrides = {}) => ({
  id: 'test-reminder-id',
  userId: 'test-user-id',
  title: 'Test Reminder',
  description: 'Test reminder description',
  time: '09:00',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createTestGateway = (overrides = {}) => ({
  id: 'test-gateway-id',
  name: 'Test Gateway',
  url: 'https://api.example.com',
  apiKey: 'test-api-key',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});