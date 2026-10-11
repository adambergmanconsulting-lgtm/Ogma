import { describe, expect, it } from 'vitest';
import {
  installHowForMode,
  installOfferMode,
  isFirefoxLike,
  isIosLike,
  isStandaloneDisplay,
  shouldOfferWelcome,
  shouldShowSettingsSetup,
} from './pwaInstall';

describe('isStandaloneDisplay', () => {
  it('true when display-mode standalone matches', () => {
    expect(
      isStandaloneDisplay(() => ({ matches: true }), {}),
    ).toBe(true);
  });

  it('true when iOS navigator.standalone', () => {
    expect(
      isStandaloneDisplay(() => ({ matches: false }), { standalone: true }),
    ).toBe(true);
  });

  it('false in ordinary browser tab', () => {
    expect(
      isStandaloneDisplay(() => ({ matches: false }), {}),
    ).toBe(false);
  });
});

describe('isIosLike', () => {
  it('detects iPhone', () => {
    expect(isIosLike('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
  });

  it('false for desktop Chrome', () => {
    expect(isIosLike('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0')).toBe(false);
  });
});

describe('isFirefoxLike', () => {
  it('detects Firefox', () => {
    expect(
      isFirefoxLike('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'),
    ).toBe(true);
  });

  it('false for Chrome', () => {
    expect(
      isFirefoxLike('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'),
    ).toBe(false);
  });
});

describe('installOfferMode', () => {
  it('none when already installed', () => {
    expect(
      installOfferMode({ standalone: true, canPrompt: true, ios: false, firefox: false }),
    ).toBe('none');
  });

  it('prefers native prompt when available', () => {
    expect(
      installOfferMode({ standalone: false, canPrompt: true, ios: true, firefox: true }),
    ).toBe('prompt');
  });

  it('ios when no prompt', () => {
    expect(
      installOfferMode({ standalone: false, canPrompt: false, ios: true, firefox: false }),
    ).toBe('ios');
  });

  it('firefox recommends Chrome when no prompt', () => {
    expect(
      installOfferMode({ standalone: false, canPrompt: false, ios: false, firefox: true }),
    ).toBe('firefox');
    expect(installHowForMode('firefox')).toMatch(/Chrome/i);
  });

  it('manual otherwise', () => {
    expect(
      installOfferMode({ standalone: false, canPrompt: false, ios: false, firefox: false }),
    ).toBe('manual');
  });
});

describe('welcome nudge', () => {
  it('offers when chats exist and install or vault remains', () => {
    expect(
      shouldOfferWelcome({
        installMode: 'prompt',
        dismissed: false,
        hasLocalChats: true,
        hasVaultKey: false,
      }),
    ).toBe(true);
    expect(
      shouldOfferWelcome({
        installMode: 'manual',
        dismissed: false,
        hasLocalChats: true,
        hasVaultKey: true,
      }),
    ).toBe(true);
    expect(
      shouldOfferWelcome({
        installMode: 'none',
        dismissed: false,
        hasLocalChats: true,
        hasVaultKey: false,
      }),
    ).toBe(true);
  });

  it('hidden when dismissed, empty, or nothing left', () => {
    expect(
      shouldOfferWelcome({
        installMode: 'prompt',
        dismissed: true,
        hasLocalChats: true,
        hasVaultKey: false,
      }),
    ).toBe(false);
    expect(
      shouldOfferWelcome({
        installMode: 'prompt',
        dismissed: false,
        hasLocalChats: false,
        hasVaultKey: false,
      }),
    ).toBe(false);
    expect(
      shouldOfferWelcome({
        installMode: 'none',
        dismissed: false,
        hasLocalChats: true,
        hasVaultKey: true,
      }),
    ).toBe(false);
  });
});

describe('settings setup splash', () => {
  it('shows while install or vault remains', () => {
    expect(shouldShowSettingsSetup({ installMode: 'manual', hasVaultKey: false })).toBe(true);
    expect(shouldShowSettingsSetup({ installMode: 'none', hasVaultKey: false })).toBe(true);
    expect(shouldShowSettingsSetup({ installMode: 'prompt', hasVaultKey: true })).toBe(true);
  });

  it('hides when installed with a vault key', () => {
    expect(shouldShowSettingsSetup({ installMode: 'none', hasVaultKey: true })).toBe(false);
  });
});
