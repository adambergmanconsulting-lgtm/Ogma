import { MessageSquare } from 'lucide-react';

/** Create a new chat space. Call lives on the video pane for the open space. */
export function StartNew(props: {
  busy?: boolean;
  /** Already in an unused solo chat — New would only stack empties. */
  disabled?: boolean;
  onNewChat: () => void;
}) {
  const disabled = Boolean(props.busy || props.disabled);
  return (
    <button
      type="button"
      data-testid="home-new-chat"
      disabled={disabled}
      onClick={props.onNewChat}
      className="link-action shrink-0"
      aria-label="New chat"
      title={props.disabled ? 'Finish or share this chat first' : undefined}
    >
      <MessageSquare className="h-3.5 w-3.5" aria-hidden />
      New
    </button>
  );
}
