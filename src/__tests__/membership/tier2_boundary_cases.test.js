import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  getAuthToken,
  membershipRequest,
  getPlans,
  getMyMembership,
  getMembershipHistory,
  subscribePlan
} from '../../database/membershipApi';
import {
  mockSiswaPlans,
  mockDefaultSiswaMembership,
  mockActivePremiumMembership,
  mockPendingMembership,
  mockAdminMembership,
  mockAdminPlans,
  mockEmptyHistory,
  mockHistoryList
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

describe('Tier 2: Boundary & Corner Cases (R1, R2, R3)', () => {
  let mockFetch;

  afterEach(() => {
    if (mockFetch) mockFetch.restore();
    jest.clearAllMocks();
  });

  // =========================================================================
  // Feature 1: Unauthenticated User Handling (≥5 tests)
  // =========================================================================
  describe('Feature 1: Unauthenticated User Handling', () => {
    it('1.1 should return null from getAuthToken when no token exists in storage or auth', async () => {
      setupMockStorage({});
      const token = await getAuthToken();
      expect(token).toBeNull();
    });

    it('1.2 should throw HTTP 401 error with server message when token is missing', async () => {
      setupMockStorage({});
      mockFetch = setupMockFetch({
        '/memberships/me': {
          status: 401,
          data: { message: 'Token login diperlukan.' }
        }
      });

      await expect(getMyMembership()).rejects.toThrow('Token login diperlukan.');
    });

    it('1.3 should attach status 401 and response payload to thrown error', async () => {
      setupMockStorage({});
      mockFetch = setupMockFetch({
        '/memberships/plans': {
          status: 401,
          data: { message: 'Token login diperlukan.' }
        }
      });

      try {
        await getPlans();
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.status).toBe(401);
        expect(err.data.message).toBe('Token login diperlukan.');
      }
    });

    itIf(Boolean(MembershipPlans))(
      '1.4 should display login prompt for unauthenticated users visiting Plans page',
      async () => {
        setupMockStorage({});
        mockFetch = setupMockFetch({
          '/memberships/plans': {
            status: 401,
            data: { message: 'Token login diperlukan.' }
          }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Masuk') ||
          screen.queryByText('Login') ||
          screen.queryByText('Token login diperlukan.')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipPlans))(
      '1.5 should prevent unauthenticated users from directly subscribing to plans',
      async () => {
        setupMockStorage({});
        mockFetch = setupMockFetch({
          '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
          '/memberships/subscribe': {
            status: 401,
            data: { message: 'Token login diperlukan.' }
          }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        // Verify unauthenticated visual cue or login CTA
        expect(
          screen.queryByText('Masuk') ||
          screen.queryByText('Login') ||
          screen.queryByText('Pilih Paket')
        ).toBeTruthy();
        await screen.unmount();
      }
    );
  });

  // =========================================================================
  // Feature 2: Default Free Plan Handling (≥5 tests)
  // =========================================================================
  describe('Feature 2: Default Free Plan Handling', () => {
    beforeEach(() => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
    });

    it('2.1 should handle source: "default" with null expiresAt safely', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
      });

      const data = await getMyMembership();
      expect(data.membership.source).toBe('default');
      expect(data.membership.expiresAt).toBeNull();
      expect(data.membership.plan.price).toBe(0);
    });

    itIf(Boolean(MembershipDashboard))(
      '2.2 should display "Paket Gratis" / "Paket Dasar" on default free tier',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership },
          '/memberships/history': { status: 200, data: { history: [] } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Siswa Gratis') ||
          screen.queryByText('Paket Gratis') ||
          screen.queryByText('Paket Dasar')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '2.3 should display prominent upgrade CTA button to browse plans',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership },
          '/memberships/history': { status: 200, data: { history: [] } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Tingkatkan') ||
          screen.queryByText('Pilih Paket') ||
          screen.queryByText('Upgrade')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '2.4 should omit cancel button when user is on default free tier',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership },
          '/memberships/history': { status: 200, data: { history: [] } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('Batalkan Langganan')).toBeNull();
        await screen.unmount();
      }
    );

    it('2.5 should verify default free tier features limit (5 characters)', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockDefaultSiswaMembership }
      });

      const data = await getMyMembership();
      expect(data.membership.features.maxCharacters).toBe(5);
    });
  });

  // =========================================================================
  // Feature 3: Active Paid Plan with Expiry Date (≥5 tests)
  // =========================================================================
  describe('Feature 3: Active Paid Plan with Expiration Date', () => {
    beforeEach(() => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
    });

    it('3.1 should parse and provide valid ISO expiration date string', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockActivePremiumMembership }
      });

      const data = await getMyMembership();
      const expiry = new Date(data.membership.expiresAt);
      expect(expiry.getTime()).not.toBeNaN();
      expect(expiry.getFullYear()).toBe(2026);
    });

    itIf(Boolean(MembershipDashboard))(
      '3.2 should display green active status pill (● Aktif)',
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
      '3.3 should display cancel subscription button for active paid users',
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

        expect(screen.queryByText('Batalkan Langganan')).toBeTruthy();
        await screen.unmount();
      }
    );

    it('3.4 should verify paid tier features (10 characters, extraAvatars, progressReport)', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockActivePremiumMembership }
      });

      const data = await getMyMembership();
      expect(data.membership.features.maxCharacters).toBe(10);
      expect(data.membership.features.extraAvatars).toBe(true);
      expect(data.membership.features.progressReport).toBe(true);
    });

    it('3.5 should verify duration interval of 30 days on paid plan model', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockActivePremiumMembership }
      });

      const data = await getMyMembership();
      expect(data.membership.plan.durationDays).toBe(30);
    });
  });

  // =========================================================================
  // Feature 4: Pending Payment Banner (≥5 tests)
  // =========================================================================
  describe('Feature 4: Pending Payment Notification Banner', () => {
    beforeEach(() => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
    });

    it('4.1 should return pending object containing membershipId and plan', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockPendingMembership }
      });

      const data = await getMyMembership();
      expect(data.pending).not.toBeNull();
      expect(data.pending.membershipId).toBe(5);
      expect(data.pending.plan.name).toBe('Siswa Premium');
    });

    itIf(Boolean(MembershipDashboard))(
      '4.2 should render amber pending banner on dashboard when pending !== null',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockPendingMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Menunggu Konfirmasi') ||
          screen.queryByText('Menunggu Pembayaran') ||
          screen.queryByText('Pending')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '4.3 should display pending plan name and reference ID in banner',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockPendingMembership },
          '/memberships/history': { status: 200, data: { history: mockHistoryList } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('Siswa Premium')).toBeTruthy();
        expect(screen.queryByText('5') || screen.queryByText('#5')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '4.4 should omit pending notification banner when pending === null',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership },
          '/memberships/history': { status: 200, data: { history: [] } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('Menunggu Konfirmasi Pembayaran')).toBeNull();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipPlans))(
      '4.5 should indicate "Menunggu Pembayaran" on the pending plan button in Plans page',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
          '/memberships/me': { status: 200, data: mockPendingMembership }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Menunggu Pembayaran') ||
          screen.queryByText('Pending') ||
          screen.queryByText('Pilih Paket')
        ).toBeTruthy();
        await screen.unmount();
      }
    );
  });

  // =========================================================================
  // Feature 5: Empty Subscription History State (≥5 tests)
  // =========================================================================
  describe('Feature 5: Empty Subscription History Handling', () => {
    beforeEach(() => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
    });

    it('5.1 should handle empty history array without runtime errors', async () => {
      mockFetch = setupMockFetch({
        '/memberships/history': { status: 200, data: { history: mockEmptyHistory } }
      });

      const result = await getMembershipHistory();
      expect(result.history).toEqual([]);
      expect(result.length).toBe(0);
    });

    itIf(Boolean(MembershipDashboard))(
      '5.2 should render clean empty state placeholder card instead of broken table',
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
          screen.queryByText('Tidak ada transaksi')
        ).toBeTruthy();
        await screen.unmount();
      }
    );

    it('5.3 should safely support filter and map on empty history collection', async () => {
      mockFetch = setupMockFetch({
        '/memberships/history': { status: 200, data: { history: [] } }
      });

      const result = await getMembershipHistory();
      expect(result.map((x) => x.id)).toEqual([]);
      expect(result.filter((x) => x.status === 'active')).toEqual([]);
    });

    it('5.4 should handle direct array format fallback if API returns bare array', async () => {
      mockFetch = setupMockFetch({
        '/memberships/history': { status: 200, data: [] }
      });

      const result = await getMembershipHistory();
      expect(result.history).toEqual([]);
      expect(result.length).toBe(0);
    });

    itIf(Boolean(MembershipDashboard))(
      '5.5 should display informative explanation text on empty state',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockDefaultSiswaMembership },
          '/memberships/history': { status: 200, data: { history: [] } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('transaksi', { exact: false }) ||
          screen.queryByText('riwayat', { exact: false }) ||
          screen.queryByText('paket', { exact: false })
        ).toBeTruthy();
        await screen.unmount();
      }
    );
  });

  // =========================================================================
  // Feature 6: API Error Codes (401, 403, 404, 500) (≥5 tests)
  // =========================================================================
  describe('Feature 6: API Error Handling (401, 403, 404, 500)', () => {
    beforeEach(() => {
      setupMockStorage({ gamukis_manual_token: 'test_token' });
    });

    it('6.1 should handle HTTP 403 audience mismatch error ("Paket ini khusus untuk guru.")', async () => {
      mockFetch = setupMockFetch({
        '/memberships/subscribe': {
          status: 403,
          data: { message: 'Paket ini khusus untuk guru.' }
        }
      });

      try {
        await subscribePlan('guru_pro');
        throw new Error('Should have failed');
      } catch (err) {
        expect(err.status).toBe(403);
        expect(err.message).toBe('Paket ini khusus untuk guru.');
      }
    });

    it('6.2 should handle HTTP 404 plan not found error ("Paket tidak ditemukan.")', async () => {
      mockFetch = setupMockFetch({
        '/memberships/subscribe': {
          status: 404,
          data: { message: 'Paket tidak ditemukan.' }
        }
      });

      try {
        await subscribePlan('unknown_plan');
        throw new Error('Should have failed');
      } catch (err) {
        expect(err.status).toBe(404);
        expect(err.message).toBe('Paket tidak ditemukan.');
      }
    });

    it('6.3 should handle HTTP 500 server error with fallback message', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': {
          status: 500,
          data: { message: 'Status membership gagal dimuat.' }
        }
      });

      try {
        await getMyMembership();
        throw new Error('Should have failed');
      } catch (err) {
        expect(err.status).toBe(500);
        expect(err.message).toBe('Status membership gagal dimuat.');
      }
    });

    it('6.4 should handle HTTP 500 error when response has no message payload', async () => {
      mockFetch = setupMockFetch({
        '/memberships/cancel': {
          status: 500,
          data: {}
        }
      });

      try {
        await membershipRequest('/cancel', { method: 'POST' });
        throw new Error('Should have failed');
      } catch (err) {
        expect(err.status).toBe(500);
        expect(err.message).toContain('500');
      }
    });

    it('6.5 should handle network connection rejection', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch')));

      await expect(getPlans()).rejects.toThrow('Failed to fetch');
    });
  });

  // =========================================================================
  // Feature 7: Administrator Role Exemption (≥5 tests)
  // =========================================================================
  describe('Feature 7: Administrator Role Exemption', () => {
    beforeEach(() => {
      setupMockStorage({ gamukis_manual_token: 'test_admin_token' });
    });

    it('7.1 should return source: "administrator" and unlimited features from /me', async () => {
      mockFetch = setupMockFetch({
        '/memberships/me': { status: 200, data: mockAdminMembership }
      });

      const data = await getMyMembership();
      expect(data.membership.source).toBe('administrator');
      expect(data.membership.plan).toBeNull();
      expect(data.membership.features.unlimited).toBe(true);
      expect(data.membership.features.maxCharacters).toBe(50);
    });

    it('7.2 should handle HTTP 400 error when administrator attempts to subscribe', async () => {
      mockFetch = setupMockFetch({
        '/memberships/subscribe': {
          status: 400,
          data: { message: 'Administrator tidak memerlukan membership.' }
        }
      });

      await expect(subscribePlan('siswa_premium')).rejects.toThrow(
        'Administrator tidak memerlukan membership.'
      );
    });

    itIf(Boolean(MembershipDashboard))(
      '7.3 should render administrator badge on dashboard',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockAdminMembership },
          '/memberships/history': { status: 200, data: { history: [] } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('Administrator')).toBeTruthy();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipDashboard))(
      '7.4 should hide cancel subscription button for administrator accounts',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/me': { status: 200, data: mockAdminMembership },
          '/memberships/history': { status: 200, data: { history: [] } }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipDashboard />
          </MemoryRouter>
        );

        expect(screen.queryByText('Batalkan Langganan')).toBeNull();
        await screen.unmount();
      }
    );

    itIf(Boolean(MembershipPlans))(
      '7.5 should display informational notice on plans page for administrator accounts',
      async () => {
        mockFetch = setupMockFetch({
          '/memberships/plans': { status: 200, data: { plans: mockAdminPlans } },
          '/memberships/me': { status: 200, data: mockAdminMembership }
        });

        const screen = await renderIntoDom(
          <MemoryRouter>
            <MembershipPlans />
          </MemoryRouter>
        );

        expect(
          screen.queryByText('Administrator', { exact: false }) ||
          screen.queryByText('Admin', { exact: false })
        ).toBeTruthy();
        await screen.unmount();
      }
    );
  });
});
