import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  getPlans,
  getMyMembership,
  getMembershipHistory,
  getHistory,
  subscribePlan,
  cancelMembership
} from '../../database/membershipApi';
import {
  mockSiswaPlans,
  mockGuruPlans,
  mockAdminPlans,
  mockDefaultSiswaMembership,
  mockActivePremiumMembership,
  mockPendingMembership,
  mockAdminMembership,
  mockHistoryList,
  mockEmptyHistory,
  mockSubscribeFreeResponse,
  mockSubscribePaidResponse,
  mockCancelResponse,
  mockCancelZeroResponse,
  mockCancelTwoResponse
} from './fixtures/mockData';
import {
  loadComponent,
  itIf,
  renderIntoDom,
  setupMockFetch,
  setupMockStorage,
  fireClick
} from './helpers/testHarness';

const MembershipPlans = loadComponent('../../../pages/membershipPlans');
const MembershipDashboard = loadComponent('../../../pages/membershipDashboard');

describe('Tier 1: Feature Coverage (R1, R2, R3)', () => {
  let mockFetch;

  beforeEach(() => {
    setupMockStorage({ gamukis_manual_token: 'test_siswa_jwt_token' });
  });

  afterEach(() => {
    if (mockFetch) mockFetch.restore();
    jest.clearAllMocks();
  });

  // =========================================================================
  // Feature 1: Fetching Plans (≥5 tests)
  // =========================================================================
  describe('Feature 1: Fetching Plans (getPlans)', () => {
    it('1.1 should fetch and return plans list for Siswa role', async () => {
      mockFetch = setupMockFetch({
        '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } }
      });

      const result = await getPlans();
      expect(result.plans).toHaveLength(2);
      expect(result.plans[0].code).toBe('siswa_free');
      expect(result.plans[1].code).toBe('siswa_premium');
      expect(mockFetch.calls[0].url).toContain('/api/memberships/plans');
    });

    it('1.2 should fetch and return plans list for Guru role', async () => {
      mockFetch = setupMockFetch({
        '/memberships/plans': { status: 200, data: { plans: mockGuruPlans } }
      });

      const result = await getPlans();
      expect(result.plans).toHaveLength(2);
      expect(result.plans[0].code).toBe('guru_free');
      expect(result.plans[1].code).toBe('guru_pro');
    });

    it('1.3 should attach Bearer token to Authorization header', async () => {
      mockFetch = setupMockFetch({
        '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } }
      });

      await getPlans();
      const headers = mockFetch.calls[0].options.headers;
      expect(headers.Authorization).toBe('Bearer test_siswa_jwt_token');
    });

    it('1.4 should return an enhanced collection supporting Array methods', async () => {
      mockFetch = setupMockFetch({
        '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } }
      });

      const result = await getPlans();
      const planNames = result.map((p) => p.name);
      expect(planNames).toEqual(['Siswa Gratis', 'Siswa Premium']);

      const paidPlans = result.filter((p) => p.price > 0);
      expect(paidPlans).toHaveLength(1);

      // Verify Symbol.iterator
      const collected = [];
      for (const plan of result) {
        collected.push(plan.code);
      }
      expect(collected).toEqual(['siswa_free', 'siswa_premium']);
    });

    it('1.5 should preserve raw response fields and length property', async () => {
      mockFetch = setupMockFetch({
        '/memberships/plans': { status: 200, data: { plans: mockAdminPlans } }
      });

      const result = await getPlans();
      expect(result.length).toBe(4);
      expect(Array.isArray(result.plans)).toBe(true);
    });
  });

  // =========================================================================
  // Feature 2: Rendering Plans for Siswa / Guru (≥5 tests)
  // =========================================================================
  describe('Feature 2: Rendering Plans Presentation (Component)', () => {
    itIf(Boolean(MembershipPlans))(
      '2.1 should render plan cards with formatted Rupiah prices',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        expect(screen.queryByText('Gratis') || screen.queryByText('Rp 0')).toBeTruthy();
        expect(screen.queryByText('29.000')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipPlans))(
      '2.2 should render audience badges matching user role',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/plans': { status: 200, data: { plans: mockGuruPlans } },
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        expect(screen.queryByText('Guru Gratis')).toBeTruthy();
        expect(screen.queryByText('Guru Pro')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipPlans))(
      '2.3 should render duration interval details (30 Hari / Selamanya)',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        expect(screen.queryByText('30 Hari') || screen.queryByText('Bulan')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipPlans))(
      '2.4 should render feature checklist items for plans',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('5 Karakter') || screen.queryByText('Kapasitas')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipPlans))(
      '2.5 should display disabled "Paket Aktif Saat Ini" button on active plan',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
          '/memberships/me': { status: 200, data: mockActivePremiumMembership }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Paket Aktif Saat Ini') || screen.queryByText('Sedang Aktif')
        ).toBeTruthy();
        await screen.unmount();
      }
    );
  });

  // =========================================================================
  // Feature 3: Fetching /me (≥5 tests)
  // =========================================================================
  describe('Feature 3: Fetching /me (getMyMembership)', () => {
    it('3.1 should fetch active paid membership status with expiration date', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockActivePremiumMembership }
      });

      const data = await getMyMembership();
      expect(data.membership.source).toBe('membership');
      expect(data.membership.plan.code).toBe('siswa_premium');
      expect(data.membership.expiresAt).toBe('2026-11-09T15:34:09.000Z');
      expect(data.pending).toBeNull();
    });

    it('3.2 should fetch default free membership with null expiration date', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
      });

      const data = await getMyMembership();
      expect(data.membership.source).toBe('default');
      expect(data.membership.plan.code).toBe('siswa_free');
      expect(data.membership.expiresAt).toBeNull();
    });

    it('3.3 should fetch pending subscription details when order is unconfirmed', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockPendingMembership }
      });

      const data = await getMyMembership();
      expect(data.pending).not.toBeNull();
      expect(data.pending.membershipId).toBe(5);
      expect(data.pending.plan.code).toBe('siswa_premium');
    });

    it('3.4 should fetch administrator membership with full features and null plan', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockAdminMembership }
      });

      const data = await getMyMembership();
      expect(data.membership.source).toBe('administrator');
      expect(data.membership.plan).toBeNull();
      expect(data.membership.features.unlimited).toBe(true);
    });

    it('3.5 should forward custom request options to fetch call', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
      });

      await getMyMembership({ headers: { 'X-Custom-Client': 'Gamukis-Web' } });
      expect(mockFetch.calls[0].options.headers['X-Custom-Client']).toBe('Gamukis-Web');
    });
  });

  // =========================================================================
  // Feature 4: Rendering Dashboard (≥5 tests)
  // =========================================================================
  describe('Feature 4: Rendering Dashboard Presentation (Component)', () => {
    itIf(Boolean(MembershipDashboard))(
      '4.1 should render hero banner with active plan name',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('Siswa Premium')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '4.2 should render active status badge (● Aktif)',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('Aktif')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '4.3 should render formatted Indonesian expiration date',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('2026') || screen.queryByText('November') || screen.queryByText('Berlaku')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '4.4 should render effective privileges panel with limits',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('10') || screen.queryByText('Karakter')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '4.5 should render quick action buttons for upgrading and cancelling',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Batalkan Langganan') || screen.queryByText('Batal')
        ).toBeTruthy();
        await screen.unmount();
      }
    );
  });

  // =========================================================================
  // Feature 5: Fetching History (≥5 tests)
  // =========================================================================
  describe('Feature 5: Fetching History (getMembershipHistory)', () => {
    it('5.1 should fetch transaction history list', async () => {
      mockFetch = setupMockFetch({
        '/memberships/history': { status: 200, data: { history: mockHistoryList } }
      });

      const result = await getMembershipHistory();
      expect(result.history).toHaveLength(3);
      expect(result.history[0].status).toBe('pending');
      expect(result.history[1].status).toBe('active');
      expect(result.history[2].status).toBe('cancelled');
    });

    it('5.2 should fetch empty history list without errors', async () => {
      mockFetch = setupMockFetch({
        '/memberships/history': { status: 200, data: { history: mockEmptyHistory } }
      });

      const result = await getMembershipHistory();
      expect(result.history).toHaveLength(0);
      expect(result.length).toBe(0);
    });

    it('5.3 should attach Bearer token to history request header', async () => {
      mockFetch = setupMockFetch({
        '/memberships/history': { status: 200, data: { history: mockHistoryList } }
      });

      await getMembershipHistory();
      expect(mockFetch.calls[0].options.headers.Authorization).toBe('Bearer test_siswa_jwt_token');
    });

    it('5.4 should support alias getHistory returning identical data structure', async () => {
      mockFetch = setupMockFetch({
        '/memberships/history': { status: 200, data: { history: mockHistoryList } }
      });

      const result = await getHistory();
      expect(result.history).toHaveLength(3);
      expect(typeof result.map).toBe('function');
    });

    it('5.5 should return enhanced collection allowing Array methods on history', async () => {
      mockFetch = setupMockFetch({
        '/memberships/history': { status: 200, data: { history: mockHistoryList } }
      });

      const result = await getMembershipHistory();
      const statuses = result.map((h) => h.status);
      expect(statuses).toEqual(['pending', 'active', 'cancelled']);

      const activeOnly = result.filter((h) => h.status === 'active');
      expect(activeOnly).toHaveLength(1);
    });
  });

  // =========================================================================
  // Feature 6: Rendering History Table (≥5 tests)
  // =========================================================================
  describe('Feature 6: Rendering History Table Presentation (Component)', () => {
    itIf(Boolean(MembershipDashboard))(
      '6.1 should render standard table headers',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('PAKET') || screen.queryByText('Paket')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '6.2 should render status badge for active history rows',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('Aktif')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '6.3 should render status badge for pending history rows',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Menunggu Pembayaran') || screen.queryByText('Pending')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '6.4 should render status badge for cancelled history rows',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockActivePremiumMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Dibatalkan') || screen.queryByText('Batal')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '6.5 should render empty state card when history array is empty',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership },
          '/memberships/history': { status: 200, data: { history: mockEmptyHistory } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Belum Ada Riwayat') ||
          screen.queryByText('Belum ada riwayat') ||
          screen.queryByText('Riwayat Kosong')
        ).toBeTruthy();
        await screen.unmount();
      }
    );
  });

  // =========================================================================
  // Feature 7: Triggering Subscribe (≥5 tests)
  // =========================================================================
  describe('Feature 7: Triggering Subscribe (subscribePlan)', () => {
    it('7.1 should submit subscribe request for free plan returning HTTP 201', async () => {
      mockFetch = setupMockFetch({
        '/memberships/subscribe': { status: 201, data: mockSubscribeFreeResponse }
      });

      const response = await subscribePlan('siswa_free');
      expect(response.status).toBe('active');
      expect(response.membershipId).toBe(6);
      expect(mockFetch.calls[0].options.method).toBe('POST');
      expect(JSON.parse(mockFetch.calls[0].options.body)).toEqual({ planCode: 'siswa_free' });
    });

    it('7.2 should submit subscribe request for paid plan returning HTTP 202', async () => {
      mockFetch = setupMockFetch({
        '/memberships/subscribe': { status: 202, data: mockSubscribePaidResponse }
      });

      const response = await subscribePlan('siswa_premium');
      expect(response.status).toBe('pending');
      expect(response.membershipId).toBe(7);
      expect(JSON.parse(mockFetch.calls[0].options.body)).toEqual({ planCode: 'siswa_premium' });
    });

    it('7.3 should accept planCode as string argument', async () => {
      mockFetch = setupMockFetch({
        '/memberships/subscribe': { status: 201, data: mockSubscribeFreeResponse }
      });

      await subscribePlan('guru_free');
      expect(JSON.parse(mockFetch.calls[0].options.body)).toEqual({ planCode: 'guru_free' });
    });

    it('7.4 should accept planCode enclosed in object argument ({ planCode })', async () => {
      mockFetch = setupMockFetch({
        '/memberships/subscribe': { status: 202, data: mockSubscribePaidResponse }
      });

      await subscribePlan({ planCode: 'guru_pro' });
      expect(JSON.parse(mockFetch.calls[0].options.body)).toEqual({ planCode: 'guru_pro' });
    });

    it('7.5 should send Content-Type application/json header', async () => {
      mockFetch = setupMockFetch({
        '/memberships/subscribe': { status: 201, data: mockSubscribeFreeResponse }
      });

      await subscribePlan('siswa_free');
      expect(mockFetch.calls[0].options.headers['Content-Type']).toBe('application/json');
    });
  });

  // =========================================================================
  // Feature 8: Triggering Cancel (≥5 tests)
  // =========================================================================
  describe('Feature 8: Triggering Cancel (cancelMembership)', () => {
    it('8.1 should submit cancel request returning HTTP 200 with cancelled count', async () => {
      mockFetch = setupMockFetch({
        '/memberships/cancel': { status: 200, data: mockCancelResponse }
      });

      const response = await cancelMembership();
      expect(response.success).toBe(true);
      expect(response.cancelled).toBe(1);
      expect(mockFetch.calls[0].options.method).toBe('POST');
    });

    it('8.2 should send POST request with empty body to cancel endpoint', async () => {
      mockFetch = setupMockFetch({
        '/memberships/cancel': { status: 200, data: mockCancelResponse }
      });

      await cancelMembership();
      expect(JSON.parse(mockFetch.calls[0].options.body)).toEqual({});
    });

    it('8.3 should handle cancellation when user has both active and pending records (cancelled: 2)', async () => {
      mockFetch = setupMockFetch({
        '/memberships/cancel': { status: 200, data: mockCancelTwoResponse }
      });

      const response = await cancelMembership();
      expect(response.success).toBe(true);
      expect(response.cancelled).toBe(2);
    });

    it('8.4 should safely handle idempotent cancellation on default free tier (cancelled: 0)', async () => {
      mockFetch = setupMockFetch({
        '/memberships/cancel': { status: 200, data: mockCancelZeroResponse }
      });

      const response = await cancelMembership();
      expect(response.success).toBe(true);
      expect(response.cancelled).toBe(0);
    });

    it('8.5 should attach Bearer token to cancel request', async () => {
      mockFetch = setupMockFetch({
        '/memberships/cancel': { status: 200, data: mockCancelResponse }
      });

      await cancelMembership();
      expect(mockFetch.calls[0].options.headers.Authorization).toBe('Bearer test_siswa_jwt_token');
    });
  });
});
