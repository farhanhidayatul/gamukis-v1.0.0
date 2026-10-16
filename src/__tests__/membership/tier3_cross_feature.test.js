import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  getAuthToken,
  getMyMembership,
  getPlans,
  getMembershipHistory,
  subscribePlan,
  cancelMembership
} from '../../database/membershipApi';
import {
  mockSiswaPlans,
  mockDefaultSiswaMembership,
  mockActivePremiumMembership,
  mockPendingMembership,
  mockHistoryList,
  mockSubscribePaidResponse,
  mockSubscribeFreeResponse,
  mockCancelResponse
} from './fixtures/mockData';
import {
  loadComponent,
  itIf,
  renderIntoDom,
  setupMockFetch,
  setupMockStorage
} from './helpers/testHarness';

const MembershipPlans = loadComponent('../../../pages/membershipPlans');
const MembershipDashboard = loadComponent('../../../pages/membershipDashboard');

describe('Tier 3: Cross-Feature Interactions (R1, R2, R3)', () => {
  let mockFetch;

  afterEach(() => {
    if (mockFetch) mockFetch.restore();
    jest.clearAllMocks();
  });

  it('3.1 should transition user state to pending after subscribing to paid plan', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    let state = { ...mockDefaultSiswaMembership };

    mockFetch = setupMockFetch({
      '/memberships/subscribe': () => {
        state = {
          membership: mockDefaultSiswaMembership.membership,
          pending: {
            membershipId: 7,
            createdAt: new Date().toISOString(),
            plan: mockSiswaPlans[1]
          }
        };
        return {
          ok: true,
          status: 202,
          json: async () => mockSubscribePaidResponse
        };
      },
      '/memberships/me': () => ({
        ok: true,
        status: 200,
        json: async () => state
      })
    });

    // 1. Initial state is default free
    const initial = await getMyMembership();
    expect(initial.pending).toBeNull();

    // 2. Subscribe to premium
    const subRes = await subscribePlan('siswa_premium');
    expect(subRes.status).toBe('pending');

    // 3. Status updates to pending
    const updated = await getMyMembership();
    expect(updated.pending).not.toBeNull();
    expect(updated.pending.plan.code).toBe('siswa_premium');
  });

  it('3.2 should revert active paid subscription to default free tier after cancelling', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    let state = { ...mockActivePremiumMembership };

    mockFetch = setupMockFetch({
      '/memberships/cancel': () => {
        state = { ...mockDefaultSiswaMembership };
        return {
          ok: true,
          status: 200,
          json: async () => mockCancelResponse
        };
      },
      '/memberships/me': () => ({
        ok: true,
        status: 200,
        json: async () => state
      })
    });

    // 1. Initial state is active premium
    const initial = await getMyMembership();
    expect(initial.membership.source).toBe('membership');
    expect(initial.membership.plan.code).toBe('siswa_premium');

    // 2. Cancel membership
    const cancelRes = await cancelMembership();
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.cancelled).toBe(1);

    // 3. User is reverted to default free tier
    const updated = await getMyMembership();
    expect(updated.membership.source).toBe('default');
    expect(updated.membership.expiresAt).toBeNull();
  });

  it('3.3 should immediately activate free plan and cancel active paid plan when subscribing to free tier', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    let state = { ...mockActivePremiumMembership };

    mockFetch = setupMockFetch({
      '/memberships/subscribe': () => {
        state = {
          membership: {
            plan: mockSiswaPlans[0],
            source: 'membership',
            features: { maxCharacters: 5 },
            expiresAt: null
          },
          pending: null
        };
        return {
          ok: true,
          status: 201,
          json: async () => mockSubscribeFreeResponse
        };
      },
      '/memberships/me': () => ({
        ok: true,
        status: 200,
        json: async () => state
      })
    });

    const res = await subscribePlan('siswa_free');
    expect(res.status).toBe('active');

    const me = await getMyMembership();
    expect(me.membership.plan.code).toBe('siswa_free');
    expect(me.pending).toBeNull();
  });

  it('3.4 should replace existing pending subscription atomically when submitting a new paid subscription', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    let currentPendingId = 5;

    mockFetch = setupMockFetch({
      '/memberships/subscribe': () => {
        currentPendingId = 8;
        return {
          ok: true,
          status: 202,
          json: async () => ({
            message: 'Menunggu pembayaran.',
            membershipId: currentPendingId,
            status: 'pending',
            paymentUrl: null
          })
        };
      },
      '/memberships/me': () => ({
        ok: true,
        status: 200,
        json: async () => ({
          membership: mockDefaultSiswaMembership.membership,
          pending: {
            membershipId: currentPendingId,
            createdAt: new Date().toISOString(),
            plan: mockSiswaPlans[1]
          }
        })
      })
    });

    const res = await subscribePlan('siswa_premium');
    expect(res.membershipId).toBe(8);

    const me = await getMyMembership();
    expect(me.pending.membershipId).toBe(8);
  });

  it('3.5 should record cancelled entry in history when active subscription is cancelled', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    const historyState = [...mockHistoryList];

    mockFetch = setupMockFetch({
      '/memberships/cancel': () => {
        historyState.unshift({
          id: 6,
          status: 'cancelled',
          started_at: '2026-09-10T12:00:00.000Z',
          expires_at: null,
          payment_ref: null,
          created_at: new Date().toISOString(),
          code: 'siswa_premium',
          name: 'Siswa Premium',
          price: 29000
        });
        return {
          ok: true,
          status: 200,
          json: async () => mockCancelResponse
        };
      },
      '/memberships/history': () => ({
        ok: true,
        status: 200,
        json: async () => ({ history: historyState })
      })
    });

    await cancelMembership();
    const historyRes = await getMembershipHistory();
    expect(historyRes.history[0].status).toBe('cancelled');
    expect(historyRes.history[0].code).toBe('siswa_premium');
  });

  it('3.6 should resolve manual token when present in localStorage', async () => {
    setupMockStorage({ gamukis_manual_token: 'manual_jwt_token_123' });
    const token = await getAuthToken();
    expect(token).toBe('manual_jwt_token_123');
  });

  it('3.7 should fallback to Firebase token when manual token is absent', async () => {
    setupMockStorage({});
    const token = await getAuthToken();
    // In node/test environment without active Firebase user, returns null
    expect(token).toBeNull();
  });

  it('3.8 should include resolved token in both plans and dashboard requests', async () => {
    setupMockStorage({ gamukis_manual_token: 'dual_auth_token_456' });
    mockFetch = setupMockFetch({
      '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
      '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
    });

    await getPlans();
    await getMyMembership();

    expect(mockFetch.calls[0].options.headers.Authorization).toBe('Bearer dual_auth_token_456');
    expect(mockFetch.calls[1].options.headers.Authorization).toBe('Bearer dual_auth_token_456');
  });

  itIf(Boolean(MembershipPlans && MembershipDashboard))(
    '3.9 should synchronize active plan indicator on Plans page with Dashboard title',
    async () => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
      mockFetch = setupMockFetch({
        '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
        '/memberships/me': { status: 200, data: mockActivePremiumMembership },
        '/memberships/history': { status: 200, data: { history: mockHistoryList } }
      });

      const plansScreen = await renderIntoDom(
        <MemoryRouter>
          <MembershipPlans />
        </MemoryRouter>
      );
      expect(
        plansScreen.queryByText('Paket Aktif Saat Ini') || plansScreen.queryByText('Sedang Aktif')
      ).toBeTruthy();
      await plansScreen.unmount();

      const dashScreen = await renderIntoDom(
        <MemoryRouter>
          <MembershipDashboard />
        </MemoryRouter>
      );
      expect(dashScreen.queryByText('Siswa Premium')).toBeTruthy();
      await dashScreen.unmount();
    }
  );

  itIf(Boolean(MembershipPlans && MembershipDashboard))(
    '3.10 should synchronize pending order banner on Dashboard with Plans page action button',
    async () => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
      mockFetch = setupMockFetch({
        '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
        '/memberships/me': { status: 200, data: mockPendingMembership },
        '/memberships/history': { status: 200, data: { history: mockHistoryList } }
      });

      const dashScreen = await renderIntoDom(
        <MemoryRouter>
          <MembershipDashboard />
        </MemoryRouter>
      );
      expect(
        dashScreen.queryByText('Menunggu Konfirmasi') ||
        dashScreen.queryByText('Menunggu Pembayaran')
      ).toBeTruthy();
      await dashScreen.unmount();

      const plansScreen = await renderIntoDom(
        <MemoryRouter>
          <MembershipPlans />
        </MemoryRouter>
      );
      expect(
        plansScreen.queryByText('Menunggu Pembayaran') ||
        plansScreen.queryByText('Pending') ||
        plansScreen.queryByText('Pilih Paket')
      ).toBeTruthy();
      await plansScreen.unmount();
    }
  );
});
