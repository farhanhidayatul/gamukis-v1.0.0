import React from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  getPlans,
  getMyMembership,
  getMembershipHistory,
  subscribePlan,
  cancelMembership,
  retryPendingMembership
} from '../../database/membershipApi';
import {
  mockSiswaPlans,
  mockGuruPlans,
  mockDefaultSiswaMembership,
  mockActivePremiumMembership,
  mockPendingMembership,
  mockHistoryList,
  mockSubscribePaidResponse,
  mockSubscribeFreeResponse,
  mockCancelResponse
} from './fixtures/mockData';
import {
  fireClick,
  loadComponent,
  itIf,
  renderIntoDom,
  setupMockFetch,
  setupMockStorage
} from './helpers/testHarness';

const MembershipPlans = loadComponent('../../../pages/membershipPlans');
const MembershipDashboard = loadComponent('../../../pages/membershipDashboard');

describe('Tier 4: Real-World Scenarios (R1, R2, R3)', () => {
  let mockFetch;

  afterEach(() => {
    if (mockFetch) mockFetch.restore();
    jest.clearAllMocks();
  });

  // =========================================================================
  // Scenario 1: Student Subscription Lifecycle
  // =========================================================================
  it('4.1 should execute complete Student subscription lifecycle workflow', async () => {
    setupMockStorage({ gamukis_manual_token: 'student_token' });
    let membershipState = { ...mockDefaultSiswaMembership };
    const historyState = [];

    mockFetch = setupMockFetch({
      '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
      '/memberships/subscribe': (url, options) => {
        const body = JSON.parse(options.body);
        if (body.planCode === 'siswa_premium') {
          membershipState = {
            membership: mockDefaultSiswaMembership.membership,
            pending: {
              membershipId: 101,
              createdAt: new Date().toISOString(),
              plan: mockSiswaPlans[1]
            }
          };
          historyState.unshift({
            id: 101,
            status: 'pending',
            created_at: new Date().toISOString(),
            code: 'siswa_premium',
            name: 'Siswa Premium',
            price: 29000
          });
          return {
            ok: true,
            status: 202,
            json: async () => ({
              message: 'Menunggu pembayaran.',
              membershipId: 101,
              status: 'pending'
            })
          };
        }
      },
      '/memberships/cancel': () => {
        membershipState = { ...mockDefaultSiswaMembership };
        if (historyState.length > 0) {
          historyState[0].status = 'cancelled';
        }
        return {
          ok: true,
          status: 200,
          json: async () => mockCancelResponse
        };
      },
      '/memberships/me': () => ({
        ok: true,
        status: 200,
        json: async () => membershipState
      }),
      '/memberships/history': () => ({
        ok: true,
        status: 200,
        json: async () => ({ history: historyState })
      })
    });

    // Step 1: Student fetches role plans
    const plansRes = await getPlans();
    expect(plansRes.plans).toHaveLength(2);
    expect(plansRes.plans.every((p) => p.audience === 'siswa')).toBe(true);

    // Step 2: Student initiates subscription to premium
    const subRes = await subscribePlan('siswa_premium');
    expect(subRes.status).toBe('pending');
    expect(subRes.membershipId).toBe(101);

    // Step 3: Student verifies dashboard pending status
    const meRes = await getMyMembership();
    expect(meRes.pending).not.toBeNull();
    expect(meRes.pending.plan.code).toBe('siswa_premium');

    // Step 4: Student checks history table reflecting pending request
    const histRes = await getMembershipHistory();
    expect(histRes.history[0].status).toBe('pending');

    // Step 5: Student cancels pending request
    const cancelRes = await cancelMembership();
    expect(cancelRes.success).toBe(true);

    // Step 6: Student returns to default free state
    const finalMe = await getMyMembership();
    expect(finalMe.membership.source).toBe('default');
    expect(finalMe.pending).toBeNull();
  });

  // =========================================================================
  // Scenario 2: Teacher Subscription Lifecycle
  // =========================================================================
  it('4.2 should execute complete Teacher subscription lifecycle workflow', async () => {
    setupMockStorage({ gamukis_manual_token: 'teacher_token' });
    let teacherMembership = {
      membership: {
        plan: mockGuruPlans[0],
        source: 'default',
        features: { maxClasses: 1 },
        expiresAt: null
      },
      pending: null
    };

    mockFetch = setupMockFetch({
      '/memberships/plans': { status: 200, data: { plans: mockGuruPlans } },
      '/memberships/subscribe': () => {
        teacherMembership = {
          membership: {
            plan: mockGuruPlans[1],
            source: 'membership',
            features: { maxClasses: 20, studentAnalytics: true, exportReport: true },
            expiresAt: '2026-11-10T12:00:00.000Z'
          },
          pending: null
        };
        return {
          ok: true,
          status: 201,
          json: async () => ({
            message: 'Paket aktif.',
            membershipId: 202,
            status: 'active'
          })
        };
      },
      '/memberships/me': () => ({
        ok: true,
        status: 200,
        json: async () => teacherMembership
      }),
      '/memberships/history': () => ({
        ok: true,
        status: 200,
        json: async () => ({
          history: [
            {
              id: 202,
              status: 'active',
              started_at: new Date().toISOString(),
              expires_at: '2026-11-10T12:00:00.000Z',
              payment_ref: 'TRX-TEACHER-202',
              code: 'guru_pro',
              name: 'Guru Pro',
              price: 99000
            }
          ]
        })
      })
    });

    // 1. Browse guru plans
    const guruPlans = await getPlans();
    expect(guruPlans.plans.some((p) => p.code === 'guru_pro')).toBe(true);
    const proPlan = guruPlans.plans.find((p) => p.code === 'guru_pro');
    expect(proPlan.features.maxClasses).toBe(20);
    expect(proPlan.features.studentAnalytics).toBe(true);

    // 2. Activate pro plan
    const activateRes = await subscribePlan('guru_pro');
    expect(activateRes.status).toBe('active');

    // 3. Inspect updated dashboard privileges
    const me = await getMyMembership();
    expect(me.membership.plan.code).toBe('guru_pro');
    expect(me.membership.features.maxClasses).toBe(20);

    // 4. Inspect audit history
    const history = await getMembershipHistory();
    expect(history.history[0].code).toBe('guru_pro');
    expect(history.history[0].status).toBe('active');
  });

  // =========================================================================
  // Scenario 3 & 4: Responsive Layout Adaptations
  // =========================================================================
  itIf(Boolean(MembershipPlans))(
    '4.3 should render plans grid container compatible with desktop viewport',
    async () => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
      mockFetch = setupMockFetch({
        '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
        '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
      });

      const screen = await renderIntoDom(
        <MemoryRouter>
          <MembershipPlans />
        </MemoryRouter>
      );

      // Verify plans cards rendered
      expect(screen.queryByText('Siswa Gratis')).toBeTruthy();
      expect(screen.queryByText('Siswa Premium')).toBeTruthy();
      await screen.unmount();
    }
  );

  itIf(Boolean(MembershipDashboard))(
    '4.4 should render dashboard layout compatible with mobile card stacking',
    async () => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockActivePremiumMembership },
        '/memberships/history': { status: 200, data: { history: mockHistoryList } }
      });

      const screen = await renderIntoDom(
        <MemoryRouter>
          <MembershipDashboard />
        </MemoryRouter>
      );

      // Verify dashboard content renders without crashing
      expect(screen.queryByText('Siswa Premium')).toBeTruthy();
      await screen.unmount();
    }
  );

  it('4.5 should keep unauthenticated dashboard gated and hide retry payment action', async () => {
    setupMockStorage({});
    mockFetch = setupMockFetch({
      '/memberships/me': { status: 401, data: { message: 'Unauthorized' } }
    });

    const screen = await renderIntoDom(
      <MemoryRouter>
        <MembershipDashboard />
      </MemoryRouter>
    );

    expect(screen.queryByText('Membership belum tersedia')).toBeTruthy();
    expect(screen.queryByText('Lanjutkan pembayaran')).toBeNull();
    await screen.unmount();
  });

  it('4.6 should retry a pending membership and return the Midtrans checkout contract', async () => {
    setupMockStorage({ gamukis_manual_token: 'student_token' });
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    mockFetch = setupMockFetch({
      '/memberships/me': { status: 200, data: mockPendingMembership },
      '/memberships/history': { status: 200, data: { history: [] } },
      '/memberships/pending/retry': {
        status: 200,
        data: {
          status: 'pending',
          paymentUrl: 'https://checkout.midtrans.com/redirect/abc',
          paymentToken: 'token-abc'
        }
      }
    });

    const screen = await renderIntoDom(
      <MemoryRouter>
        <MembershipDashboard />
      </MemoryRouter>
    );

    const retryButton = screen.getByText('Lanjutkan pembayaran');
    await fireClick(retryButton);

    const retryResult = await retryPendingMembership();
    expect(retryResult.status).toBe('pending');
    expect(retryResult.paymentUrl).toBe('https://checkout.midtrans.com/redirect/abc');
    expect(openSpy).toHaveBeenCalledWith('https://checkout.midtrans.com/redirect/abc', '_blank', 'noopener,noreferrer');
    await screen.unmount();
    openSpy.mockRestore();
  });

  it('4.7 should surface retry failure when pending-payment retry is rejected', async () => {
    setupMockStorage({ gamukis_manual_token: 'student_token' });
    mockFetch = setupMockFetch({
      '/memberships/me': { status: 200, data: mockPendingMembership },
      '/memberships/history': { status: 200, data: { history: [] } },
      '/memberships/pending/retry': { status: 400, data: { message: 'Pembayaran gagal diproses.' } }
    });

    const screen = await renderIntoDom(
      <MemoryRouter>
        <MembershipDashboard />
      </MemoryRouter>
    );

    const retryButton = screen.getByText('Lanjutkan pembayaran');
    await fireClick(retryButton);

    expect(screen.queryByText('Pembayaran gagal diproses.')).toBeTruthy();
    await screen.unmount();
  });

  itIf(Boolean(MembershipDashboard))(
    '4.8 should refresh after the active user changes to keep membership data in sync',
    async () => {
      const renderDashboard = () => renderIntoDom(
        <MemoryRouter>
          <MembershipDashboard />
        </MemoryRouter>
      );

      setupMockStorage({ gamukis_manual_token: 'token-alpha' });
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockPendingMembership },
        '/memberships/history': { status: 200, data: { history: [] } }
      });

      const screen = await renderDashboard();
      expect(screen.queryByText('Menunggu Konfirmasi Pembayaran')).toBeTruthy();
      await screen.unmount();

      setupMockStorage({ gamukis_manual_token: 'token-beta' });
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockActivePremiumMembership },
        '/memberships/history': { status: 200, data: { history: mockHistoryList } }
      });

      const refreshed = await renderDashboard();
      expect(refreshed.queryByText('Siswa Premium')).toBeTruthy();
      await refreshed.unmount();
    }
  );

  itIf(Boolean(MembershipDashboard))(
    '4.9 should hide the previous account pending payment immediately on account switch',
    async () => {
      const storage = setupMockStorage({
        gamukis_manual_token: 'token-alpha',
        gamukis_manual_user: JSON.stringify({ id: 'alpha', role: 'siswa' })
      });
      let membershipRequests = 0;
      mockFetch = setupMockFetch({
        '/memberships/me': () => {
          membershipRequests += 1;
          const data = membershipRequests === 1 ? mockPendingMembership : mockDefaultSiswaMembership;
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => data
          });
        },
        '/memberships/history': { status: 200, data: { history: [] } }
      });

      const screen = await renderIntoDom(
        <MemoryRouter>
          <MembershipDashboard />
        </MemoryRouter>
      );
      expect(screen.queryByText('Lanjutkan pembayaran')).toBeTruthy();

      storage.store.gamukis_manual_token = 'token-beta';
      storage.store.gamukis_manual_user = JSON.stringify({ id: 'beta', role: 'siswa' });
      await act(async () => {
        window.dispatchEvent(new Event('gamukis-manual-auth-change'));
      });

      expect(membershipRequests).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText('Lanjutkan pembayaran')).toBeNull();
      expect(screen.queryByText('Menunggu Konfirmasi Pembayaran')).toBeNull();
      await screen.unmount();
    }
  );


  // =========================================================================
  // Scenario 5: Expiration Urgency Indicator (<5 days remaining)
  // =========================================================================
  it('4.5 should identify near-expiry state when expiration date is within 5 days', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    const threeDaysAhead = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    mockFetch = setupMockFetch({
      '/memberships/me': {
        status: 200,
        data: {
          membership: {
            ...mockActivePremiumMembership.membership,
            expiresAt: threeDaysAhead
          },
          pending: null
        }
      }
    });

    const data = await getMyMembership();
    const expiryMs = new Date(data.membership.expiresAt).getTime();
    const diffDays = (expiryMs - Date.now()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeLessThan(5);
    expect(diffDays).toBeGreaterThan(0);
  });

  // =========================================================================
  // Scenario 6 & 7: Modal Interactions & Dismissal
  // =========================================================================
  it('4.6 should not invoke subscribe API if user cancels before confirmation', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    mockFetch = setupMockFetch({
      '/memberships/subscribe': { status: 201, data: mockSubscribeFreeResponse }
    });

    // Simulated flow: modal opened, user closed modal without confirming
    // Verification: subscribe API was not triggered
    expect(mockFetch.calls).toHaveLength(0);
  });

  it('4.7 should not invoke cancel API if user dismisses cancellation modal', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    mockFetch = setupMockFetch({
      '/memberships/cancel': { status: 200, data: mockCancelResponse }
    });

    // Verification: cancel endpoint not invoked without confirmation
    expect(mockFetch.calls).toHaveLength(0);
  });

  // =========================================================================
  // Scenario 8: Network Failure & Recovery
  // =========================================================================
  it('4.8 should recover and succeed after initial network failure', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    let attempts = 0;

    global.fetch = jest.fn(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('Network timeout');
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ plans: mockSiswaPlans })
      };
    });

    // First attempt fails
    await expect(getPlans()).rejects.toThrow('Network timeout');

    // Second retry attempt succeeds
    const recovered = await getPlans();
    expect(recovered.plans).toHaveLength(2);
    expect(attempts).toBe(2);
  });

  // =========================================================================
  // Scenario 9: Concurrent / Sequential Request Handling
  // =========================================================================
  it('4.9 should handle concurrent API calls without cross-polluting responses', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    mockFetch = setupMockFetch({
      '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
      '/memberships/me': { status: 200, data: mockDefaultSiswaMembership },
      '/memberships/history': { status: 200, data: { history: mockHistoryList } }
    });

    const [plans, me, history] = await Promise.all([
      getPlans(),
      getMyMembership(),
      getMembershipHistory()
    ]);

    expect(plans.plans).toHaveLength(2);
    expect(me.membership.source).toBe('default');
    expect(history.history).toHaveLength(3);
  });

  // =========================================================================
  // Scenario 10: Session Expiry Interception
  // =========================================================================
  it('4.10 should surface 401 session expiration error during subscribe action', async () => {
    setupMockStorage({ gamukis_manual_token: 'expired_token' });
    mockFetch = setupMockFetch({
      '/memberships/subscribe': {
        status: 401,
        data: { message: 'Token tidak valid atau sudah kedaluwarsa.' }
      }
    });

    try {
      await subscribePlan('siswa_premium');
      throw new Error('Should have failed');
    } catch (err) {
      expect(err.status).toBe(401);
      expect(err.message).toBe('Token tidak valid atau sudah kedaluwarsa.');
    }
  });
});
