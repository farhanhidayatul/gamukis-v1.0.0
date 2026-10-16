import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { mockSiswaPlans } from './fixtures/mockData';
import { loadComponent, renderIntoDom, setupMockFetch, setupMockStorage } from './helpers/testHarness';

const MembershipPlans = loadComponent('../../../pages/membershipPlans');

describe('Tier 5: Adversarial membership state handling', () => {
  let mockFetch;

  afterEach(() => {
    if (mockFetch) mockFetch.restore();
    jest.clearAllMocks();
  });

  it('blocks plan selection when the current membership status cannot be verified', async () => {
    setupMockStorage({ gamukis_manual_token: 'test_token' });
    mockFetch = setupMockFetch({
      '/memberships/plans': { status: 200, data: { plans: mockSiswaPlans } },
      '/memberships/me': { status: 503, data: { message: 'Status sementara tidak tersedia.' } },
      '/memberships/subscribe': { status: 201, data: { status: 'active' } }
    });

    const screen = await renderIntoDom(
      <MemoryRouter>
        <MembershipPlans />
      </MemoryRouter>
    );

    const selectButtons = screen.container.querySelectorAll('.membership-plan-card button');
    expect(screen.queryByText('Status sementara tidak tersedia.', { exact: false })).toBeTruthy();
    expect(selectButtons.length).toBe(mockSiswaPlans.length);
    selectButtons.forEach((button) => expect(button.disabled).toBe(true));
    expect(mockFetch.calls.some(({ url }) => url.includes('/memberships/subscribe'))).toBe(false);

    await screen.unmount();
  });
});
