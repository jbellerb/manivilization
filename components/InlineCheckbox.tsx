import { JSX } from "preact";

type Props = {
  name: string;
  label: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function InlineCheckbox(
  { name, label, ...props }: Props,
) {
  return (
    <div
      role="presentation"
      class="relative flex flex-col items-center group"
    >
      <label
        for={props.id ?? `checkbox-${name}`}
        class="text-sm h-4 text-gray-400 group-has-[:focus-visible]:text-gray-600 font-semibold origin-[0] top-0 transition-color"
      >
        {label}
      </label>
      <input
        type="checkbox"
        name={name}
        id={`checkbox-${name}`}
        class="w-6 h-6 mt-[calc(0.5rem+2px)] mb-1 bg-black border-2 checked:border-2 disabled:text-gray-600 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white disabled:border-gray-600 rounded transition-border-color"
        {...props}
      />
    </div>
  );
}
