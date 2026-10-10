import type { ReactNode } from 'react';
import {
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelTopClose,
  PanelTopOpen,
} from 'lucide-react';

export type PaneEdge = 'start' | 'end';

const iconClass = 'h-4 w-4';

/** Fold control: panel-close toward this pane’s edge (stack on mobile, split on md+). */
export function FoldButton(props: {
  testId: string;
  label: string;
  edge: PaneEdge;
  disabled?: boolean;
  onClick: () => void;
}) {
  const MobileClose = props.edge === 'start' ? PanelTopClose : PanelBottomClose;
  const DesktopClose = props.edge === 'start' ? PanelLeftClose : PanelRightClose;

  return (
    <button
      type="button"
      data-testid={props.testId}
      aria-label={props.label}
      title={props.disabled ? 'Keep at least one pane open' : props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-panel-2)] hover:text-[color:var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-35"
    >
      <MobileClose className={`${iconClass} md:hidden`} aria-hidden />
      <DesktopClose className={`hidden ${iconClass} md:block`} aria-hidden />
    </button>
  );
}

function ExpandIcons(props: { edge: PaneEdge }) {
  const MobileOpen = props.edge === 'start' ? PanelTopOpen : PanelBottomOpen;
  const DesktopOpen = props.edge === 'start' ? PanelLeftOpen : PanelRightOpen;
  return (
    <>
      <MobileOpen className={`${iconClass} md:hidden`} aria-hidden />
      <DesktopOpen className={`hidden ${iconClass} md:block`} aria-hidden />
    </>
  );
}

export function CollapsedRail(props: {
  testId: string;
  expandTestId: string;
  label: string;
  onExpand: () => void;
  trailing?: ReactNode;
  edge?: PaneEdge;
}) {
  const edge = props.edge ?? 'start';
  const border = edge === 'end' ? 'md:border-l' : 'md:border-r';
  return (
    <div
      data-testid={props.testId}
      className={[
        'flex shrink-0 items-center gap-2 border-b border-[color:var(--color-line)]/60 bg-[color:var(--color-panel)]/40 px-2 py-2 md:h-full md:w-12 md:flex-col md:justify-start md:gap-2 md:border-b-0 md:px-1.5 md:py-3',
        border,
      ].join(' ')}
    >
      <button
        type="button"
        data-testid={props.expandTestId}
        onClick={props.onExpand}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-panel-2)] md:flex-none md:px-1"
        aria-label={`Show ${props.label.toLowerCase()}`}
        title={`Show ${props.label.toLowerCase()}`}
      >
        <ExpandIcons edge={edge} />
        <span className="md:sr-only">{props.label}</span>
      </button>
      {props.trailing ? (
        <div className="flex min-w-0 items-center md:mt-auto md:w-full md:flex-col md:gap-1">
          {props.trailing}
        </div>
      ) : null}
    </div>
  );
}
