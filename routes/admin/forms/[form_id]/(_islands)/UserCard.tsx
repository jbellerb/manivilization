import { useSignal } from "@preact/signals";

type Props = {
  id: string;
  name: string;
  rolesSet: boolean;
  expanded?: boolean;
  onExpandedClick?: () => void;
};

export default function UserCard({ id, name, rolesSet, ...props }: Props) {
  const active = useSignal(false);

  const mention = `<@${id}>`;

  if (active.value) {
    return (
      <input
        type="text"
        // I think this is a valid use of ref? Need to delay calling
        // .focus() until after the <input> is committed to the DOM.
        // useSignalEffect fires before commit so that won't work.
        // See: https://github.com/preactjs/signals/issues/228
        ref={(refNode) => refNode?.focus()}
        onBlur={() => active.value = false}
        onFocus={(e) => e.currentTarget.select()}
        onInput={(e) => e.currentTarget.value = mention}
        value={mention}
      />
    );
  } else {
    return (
      <div class="flex">
        <button
          type="button"
          class="px-1 focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-black"
          title="Copy user @mention"
          onClick={() => active.value = true}
        >
          {name}
        </button>
        {!rolesSet && (
          <span class="ml-2" title="Failed to set Discord roles">*</span>
        )}
        {props.expanded !== undefined && props.onExpandedClick && (
          <button
            type="button"
            class="ml-auto px-1 focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-black"
            title={props.expanded
              ? "Collapse previous responses"
              : "Expand previous responses"}
            onClick={props.onExpandedClick}
          >
            {props.expanded ? "−" : "+"}
          </button>
        )}
        <form
          class={props.expanded !== undefined && props.onExpandedClick
            ? undefined
            : "ml-auto"}
          method="post"
          action="refresh"
        >
          <input type="text" name="user" class="hidden" value={id} />
          <button
            title="Refresh user"
            class="block px-1 focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-black"
          >
            ↻
          </button>
        </form>
      </div>
    );
  }
}
