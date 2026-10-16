/**
 * Authoritative Mock Data Fixtures for Gamukis Membership Tests
 * Derived from spec_survey.md and PROJECT.md backend schema specifications.
 */

export const mockSiswaPlans = [
  {
    id: 1,
    code: 'siswa_free',
    name: 'Siswa Gratis',
    audience: 'siswa',
    price: 0,
    durationDays: null,
    features: {
      maxCharacters: 5
    },
    isActive: true
  },
  {
    id: 2,
    code: 'siswa_premium',
    name: 'Siswa Premium',
    audience: 'siswa',
    price: 29000,
    durationDays: 30,
    features: {
      maxCharacters: 10,
      extraAvatars: true,
      progressReport: true
    },
    isActive: true
  }
];

export const mockGuruPlans = [
  {
    id: 3,
    code: 'guru_free',
    name: 'Guru Gratis',
    audience: 'guru',
    price: 0,
    durationDays: null,
    features: {
      maxClasses: 1
    },
    isActive: true
  },
  {
    id: 4,
    code: 'guru_pro',
    name: 'Guru Pro',
    audience: 'guru',
    price: 99000,
    durationDays: 30,
    features: {
      maxClasses: 20,
      studentAnalytics: true,
      exportReport: true
    },
    isActive: true
  }
];

export const mockAdminPlans = [
  ...mockSiswaPlans,
  ...mockGuruPlans
];

export const mockDefaultSiswaMembership = {
  membership: {
    plan: mockSiswaPlans[0],
    source: 'default',
    features: {
      maxCharacters: 5
    },
    expiresAt: null
  },
  pending: null
};

export const mockActivePremiumMembership = {
  membership: {
    plan: mockSiswaPlans[1],
    source: 'membership',
    features: {
      maxCharacters: 10,
      extraAvatars: true,
      progressReport: true
    },
    expiresAt: '2026-11-09T15:34:09.000Z'
  },
  pending: null
};

export const mockPendingMembership = {
  membership: {
    plan: mockSiswaPlans[0],
    source: 'default',
    features: {
      maxCharacters: 5
    },
    expiresAt: null
  },
  pending: {
    membershipId: 5,
    createdAt: '2026-10-10T16:00:00.000Z',
    plan: mockSiswaPlans[1]
  }
};

export const mockAdminMembership = {
  membership: {
    plan: null,
    source: 'administrator',
    features: {
      unlimited: true,
      maxCharacters: 50
    },
    expiresAt: null
  },
  pending: null
};

export const mockHistoryList = [
  {
    id: 5,
    status: 'pending',
    started_at: null,
    expires_at: null,
    payment_ref: null,
    created_at: '2026-10-10T16:00:00.000Z',
    code: 'siswa_premium',
    name: 'Siswa Premium',
    price: 29000
  },
  {
    id: 3,
    status: 'active',
    started_at: '2026-09-10T12:00:00.000Z',
    expires_at: '2026-10-10T12:00:00.000Z',
    payment_ref: 'PAY-123456',
    created_at: '2026-09-10T12:00:00.000Z',
    code: 'siswa_premium',
    name: 'Siswa Premium',
    price: 29000
  },
  {
    id: 1,
    status: 'cancelled',
    started_at: '2026-08-10T10:00:00.000Z',
    expires_at: null,
    payment_ref: null,
    created_at: '2026-08-10T10:00:00.000Z',
    code: 'siswa_free',
    name: 'Siswa Gratis',
    price: 0
  }
];

export const mockEmptyHistory = [];

export const mockSubscribeFreeResponse = {
  message: 'Paket aktif.',
  membershipId: 6,
  status: 'active'
};

export const mockSubscribePaidResponse = {
  message: 'Menunggu pembayaran.',
  membershipId: 7,
  status: 'pending',
  paymentUrl: null
};

export const mockCancelResponse = {
  success: true,
  cancelled: 1
};

export const mockCancelZeroResponse = {
  success: true,
  cancelled: 0
};

export const mockCancelTwoResponse = {
  success: true,
  cancelled: 2
};


describe('Mock Data Fixtures Integrity', () => {
  it('should export valid plan collections and user states', () => {
    expect(mockSiswaPlans).toHaveLength(2);
    expect(mockGuruPlans).toHaveLength(2);
    expect(mockAdminPlans).toHaveLength(4);
    expect(mockDefaultSiswaMembership.membership.source).toBe('default');
    expect(mockActivePremiumMembership.membership.source).toBe('membership');
    expect(mockPendingMembership.pending.membershipId).toBe(5);
    expect(mockHistoryList).toHaveLength(3);
  });
});
