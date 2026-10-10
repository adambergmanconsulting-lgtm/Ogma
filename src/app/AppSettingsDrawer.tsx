import { VaultSettings } from '../components/VaultSettings';
import type { InstallOfferMode } from '../domain/shell/pwaInstall';
import { useTurnSettings } from './useTurnSettings';

type SettingsLoom = {
  displayName: string;
  hasVaultKey: boolean;
  busy: boolean;
  error: string | null;
  onRenameVault: (name: string) => void;
  onEnableVault: () => void | Promise<void>;
  onExport: () => void | Promise<void>;
  onImportFile: (file: File) => void | Promise<void>;
  onLogout: () => void;
  onSwitchVault: () => void;
};

type SettingsPwa = {
  mode: InstallOfferMode;
  howOpen: boolean;
  runInstall: () => void | Promise<void>;
};

type SettingsCall = {
  inCall: boolean;
  onLeave: () => void;
};

type AppSettingsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loom: SettingsLoom;
  pwa: SettingsPwa;
  call: SettingsCall;
  onAfterLeaveShell: () => void;
};

/** Settings drawer + optional TURN — keeps App.tsx under size warn. */
export function AppSettingsDrawer(props: AppSettingsDrawerProps) {
  const turn = useTurnSettings();
  const { loom, pwa, call } = props;

  const close = () => {
    turn.clearTurnError();
    props.onOpenChange(false);
  };

  const leaveThen = (fn: () => void) => {
    close();
    if (call.inCall) call.onLeave();
    props.onAfterLeaveShell();
    fn();
  };

  return (
    <VaultSettings
      open={props.open}
      displayName={loom.displayName}
      hasVaultKey={loom.hasVaultKey}
      installMode={pwa.mode}
      installHowOpen={pwa.howOpen}
      turnUri={turn.turnUri}
      turnError={turn.turnError}
      busy={loom.busy}
      error={loom.error}
      onClose={close}
      onRename={(name) => {
        loom.onRenameVault(name);
        props.onOpenChange(false);
      }}
      onEnableVault={() => {
        props.onOpenChange(false);
        void loom.onEnableVault();
      }}
      onInstall={() => void pwa.runInstall()}
      onSaveTurnUri={turn.saveTurnUri}
      onExport={() => void loom.onExport()}
      onImportFile={(f) => void loom.onImportFile(f)}
      onLogout={() => leaveThen(() => loom.onLogout())}
      onSwitchVault={() => leaveThen(() => loom.onSwitchVault())}
    />
  );
}
