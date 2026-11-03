import Api from '../api';
import { validateCode } from '../api/codes';
import { getScanWarningSeverity } from '../securityScanWarning';

jest.mock('../api', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../helpers', () => ({
  getErrorMessage: jest.fn(),
}));

const get = jest.fn();

beforeEach(() => {
  get.mockReset();
  (Api as jest.Mock).mockReturnValue({ get });
});

describe('gate code validation response', () => {
  it.each(['medium', 'high'] as const)(
    'selects the %s warning from an anomalous backend response',
    async (severity) => {
      get.mockResolvedValue({
        data: {
          is_valid: true,
          is_expired: false,
          is_anomalous: true,
          severity,
        },
      });

      const validation = await validateCode('ABC123');

      expect(Api).toHaveBeenCalledWith('code');
      expect(get).toHaveBeenCalledWith('/codeservice/ABC123');
      expect(getScanWarningSeverity(validation)).toBe(severity);
    }
  );

  it('continues without a warning when the backend reports a normal validation', async () => {
    get.mockResolvedValue({
      data: {
        is_valid: true,
        is_expired: false,
        is_anomalous: false,
        severity: 'low',
      },
    });

    const validation = await validateCode('ABC123');

    expect(getScanWarningSeverity(validation)).toBeNull();
  });
});
