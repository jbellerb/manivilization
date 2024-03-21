import { ComponentChildren, JSX } from "preact";

type Props = {
  name: string;
  label: string;
  onChange?: (event: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  value?: string;
  children: ComponentChildren;
};

export default function Select(props: Props) {
  return (
    <div class="relative pt-4 text-lg z-0 group">
      <label
        for={`select-${props.name}`}
        class="absolute text-sm text-gray-400 group-has-[:focus-visible]:text-gray-600 font-semibold origin-[0] top-0 transition-color -z-10"
      >
        {props.label}
      </label>
      <div class="select-wrapper border-b-2 border-gray-600 has-[:hover]:border-gray-500 has-[:focus-visible]:border-white transition-border-color">
        <select
          name={props.name}
          id={`select-${props.name}`}
          class="py-1 !pr-6"
          onChange={props.onChange}
          value={props.value}
        >
          {props.children}
        </select>
      </div>
    </div>
  );
}
