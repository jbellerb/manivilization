import { useSignal } from "@preact/signals";

type Props = {
  id: string;
  name: string;
};

export default function UserCard({ id, name }: Props) {
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
    return <span onClick={() => active.value = true}>{name}</span>;
  }
}
