import {
  getColyseusClient,
  formatColyseusPlayer,
  formatColyseusBot
} from '../../database/colyseusGame';

jest.mock('../../database/firebaseDatabase', () => ({
  getEffectiveToken: jest.fn().mockResolvedValue('mock-colyseus-jwt-token')
}));

describe('Colyseus Client & Data Adapter Synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getColyseusClient creates and returns a singleton Client instance', () => {
    const client1 = getColyseusClient();
    const client2 = getColyseusClient();
    expect(client1).toBeDefined();
    expect(client1).toBe(client2);
  });

  test('formatColyseusPlayer safely unpacks appearanceJson into object for React DOM renderer', () => {
    const rawSchemaPlayer = {
      id: 'google-uid-777',
      name: 'Raden Wijaya',
      x: 18,
      y: 20,
      direction: 'right',
      coins: 15,
      health: 3,
      maxHealth: 3,
      isGuest: false,
      color: '#e11d48',
      appearanceJson: JSON.stringify({
        gender: 'male',
        skinColor: '#fcd34d',
        hairStyle: 'short',
        outfit: { shirt: 'samurai' }
      }),
      skillActive: false,
      skillIndex: 1,
      gameStartedAt: 1700000000000
    };

    const formatted = formatColyseusPlayer(rawSchemaPlayer);
    expect(formatted.id).toBe('google-uid-777');
    expect(formatted.name).toBe('Raden Wijaya');
    expect(formatted.x).toBe(18);
    expect(formatted.y).toBe(20);
    expect(formatted.coins).toBe(15);
    expect(formatted.appearance).toEqual({
      gender: 'male',
      skinColor: '#fcd34d',
      hairStyle: 'short',
      outfit: { shirt: 'samurai' }
    });
  });

  test('formatColyseusPlayer handles empty or malformed appearanceJson gracefully', () => {
    const rawSchemaPlayer = {
      id: 'guest_123',
      name: 'Tamu',
      x: 12,
      y: 12,
      appearanceJson: '{invalid-json'
    };

    const formatted = formatColyseusPlayer(rawSchemaPlayer);
    expect(formatted.id).toBe('guest_123');
    expect(formatted.appearance).toBeNull();
  });

  test('formatColyseusBot formats enemy bot entity for React EnemyBot component', () => {
    const rawSchemaBot = {
      id: 'bot-room-1-1',
      name: 'Blood Monster',
      variant: 'blood',
      category: 'Monster',
      scaleMultiplier: 1.0,
      x: 25,
      y: 30,
      direction: 'left',
      health: 2,
      maxHealth: 3,
      state: 'chasing',
      targetPlayerId: 'google-uid-777'
    };

    const formatted = formatColyseusBot(rawSchemaBot);
    expect(formatted.id).toBe('bot-room-1-1');
    expect(formatted.variant).toBe('blood');
    expect(formatted.x).toBe(25);
    expect(formatted.y).toBe(30);
    expect(formatted.state).toBe('chasing');
    expect(formatted.targetPlayerId).toBe('google-uid-777');
  });
});
