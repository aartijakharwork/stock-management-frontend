import { useState, useCallback, useMemo } from 'react';

const KEY = 'shopmanager.costprice.security';

interface CostPriceConfig {
  enabled: boolean;
  pin: string;
  codedInputEnabled: boolean;
  codeMap: string; // 10-char string: index = digit (0-9), char = letter
}

const DEFAULT_CONFIG: CostPriceConfig = {
  enabled: false,
  pin: '',
  codedInputEnabled: false,
  codeMap: 'ABCDEFGHIJ',
};

function readConfig(): CostPriceConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { return DEFAULT_CONFIG; }
}

function writeConfig(cfg: CostPriceConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

export function useCostPriceSecurity() {
  const [config, setConfig] = useState<CostPriceConfig>(readConfig);
  const [revealed, setRevealed] = useState(false);

  const save = useCallback((patch: Partial<CostPriceConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      writeConfig(next);
      return next;
    });
  }, []);

  const verifyPin = useCallback((input: string): boolean => {
    return input === config.pin;
  }, [config.pin]);

  const reveal = useCallback(() => setRevealed(true), []);
  const hide = useCallback(() => setRevealed(false), []);

  const digitToChar = useMemo(() => {
    const map = config.codeMap.toUpperCase();
    const m: Record<string, string> = {};
    for (let i = 0; i < 10 && i < map.length; i++) {
      m[String(i)] = map[i];
    }
    return m;
  }, [config.codeMap]);

  const charToDigit = useMemo(() => {
    const map = config.codeMap.toUpperCase();
    const m: Record<string, string> = {};
    for (let i = 0; i < 10 && i < map.length; i++) {
      m[map[i]] = String(i);
    }
    return m;
  }, [config.codeMap]);

  const decodePrice = useCallback((coded: string): number | null => {
    const upper = coded.toUpperCase().trim();
    if (!upper) return null;
    let digits = '';
    for (const ch of upper) {
      const d = charToDigit[ch];
      if (d == null) return null;
      digits += d;
    }
    const n = parseInt(digits, 10);
    return isNaN(n) ? null : n;
  }, [charToDigit]);

  const encodePrice = useCallback((price: number): string => {
    const str = String(Math.round(Math.abs(price)));
    let coded = '';
    for (const ch of str) {
      coded += digitToChar[ch] ?? '?';
    }
    return coded;
  }, [digitToChar]);

  const isCostHidden = config.enabled && !revealed;

  return {
    enabled: config.enabled,
    pin: config.pin,
    codedInputEnabled: config.codedInputEnabled,
    codeMap: config.codeMap,
    revealed,
    isCostHidden,

    setEnabled: (v: boolean) => save({ enabled: v }),
    setPin: (pin: string) => save({ pin }),
    setCodedInput: (v: boolean) => save({ codedInputEnabled: v }),
    setCodeMap: (map: string) => save({ codeMap: map }),

    verifyPin,
    reveal,
    hide,

    decodePrice,
    encodePrice,
  };
}
