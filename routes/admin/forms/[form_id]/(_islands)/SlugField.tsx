import { useSignal } from "@preact/signals";

import classnames from "../../../../../utils/classnames.ts";

import Checkbox from "../../../../../components/Checkbox.tsx";
import TextInput from "../../../../../components/TextInput.tsx";

type Props = { class?: string; active?: boolean; value?: string };

export default function SlugField(props: Props) {
  const active = useSignal(props.active ?? false);
  const href = useSignal(props.value ?? "");

  return (
    <div class={classnames("flex pt-[0.875rem] items-center", props.class)}>
      <Checkbox
        name="active"
        checked={active.value}
        onChange={(e) =>
          active.value = e.currentTarget.checked}
      />
      <span class="ml-3 mr-1 text-gray-400 tracking-wide">
        http://../
      </span>
      <TextInput
        name="slug"
        label="Slug *"
        value={href.value}
        class="mr-3 max-w-60 -mt-[0.875rem]"
        onChange={(e) => href.value = e.currentTarget.value}
        required
      />
      <a
        href={`/${href.value}`}
        target="_blank"
        title="Open form in new tab"
        class={classnames(
          "block flex w-6 h-6 transition-color focus:outline-none",
          active.value
            ? "text-gray-600 hover:text-gray-500 focus-visible:text-white"
            : "text-gray-700 pointer-events-none",
        )}
      >
        {/* Icon from Google Material Design Icons */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -960 960 960"
        >
          <path
            fill="currentColor"
            d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"
          />
        </svg>
      </a>
    </div>
  );
}
