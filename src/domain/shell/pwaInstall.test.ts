import { describe, expect, it } from 'vitest';
import {
  installHowForMode,
  installOfferMode,
  isFirefoxLike,
  isIosLike,
  isStandaloneDisplay,
  pickHomeAnchor,
  shouldOfferInstallMoment,
  shouldOfferVaultNudge,
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

describe('home anchor moments', () => {
  it('offers install when chats exist and not dismissed', () => {
    expect(
      shouldOfferInstallMoment({
        standalone: false,
        dismissed: false,
        hasLocalChats: true,
      }),
    ).toBe(true);
  });

  it('skips install when standalone or empty', () => {
    expect(
      shouldOfferInstallMoment({
        standalone: true,
        dismissed: false,
        hasLocalChats: true,
      }),
    ).toBe(false);
    expect(
      shouldOfferInstallMoment({
        standalone: false,
        dismissed: false,
        hasLocalChats: false,
      }),
    ).toBe(false);
  });

  it('vault nudge waits until install moment is gone', () => {
    expect(
      shouldOfferVaultNudge({
        hasLocalChats: true,
        hasVaultKey: false,
        dismissed: false,
        installMomentActive: true,
      }),
    ).toBe(false);
    expect(
      shouldOfferVaultNudge({
        hasLocalChats: true,
        hasVaultKey: false,
        dismissed: false,
        installMomentActive: false,
      }),
    ).toBe(true);
  });

  it('pickHomeAnchor prefers install over vault', () => {
    expect(
      pickHomeAnchor({
        standalone: false,
        installDismissed: false,
        vaultNudgeDismissed: false,
        hasLocalChats: true,
        hasVaultKey: false,
      }),
    ).toBe('install');
    expect(
      pickHomeAnchor({
        standalone: true,
        installDismissed: false,
        vaultNudgeDismissed: false,
        hasLocalChats: true,
        hasVaultKey: false,
      }),
    ).toBe('vault');
    expect(
      pickHomeAnchor({
        standalone: true,
        installDismissed: true,
        vaultNudgeDismissed: true,
        hasLocalChats: true,
        hasVaultKey: false,
      }),
    ).toBe(null);
  });
});
