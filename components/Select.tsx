import { JSX } from "preact";

type Props = {
  name: string;
  label: string;
} & JSX.HTMLAttributes<HTMLSelectElement>;

export default function Select({ name, label, ...props }: Props) {
  return (
    <div class="relative pt-4 text-lg z-0 group">
      <label
        for={props.id ?? `select-${name}`}
        class="absolute text-sm text-gray-400 group-has-[:focus-visible]:text-gray-600 font-semibold origin-[0] top-0 transition-color -z-10"
        title={props.required ? "Required" : undefined}
      >
        {label}
        {props.required && <span class="ml-1">*</span>}
      </label>
      <div class="select-wrapper border-b-2 border-gray-600 has-[:hover]:border-gray-500 has-[:focus-visible]:border-white transition-border-color">
        <select
          name={name}
          id={`select-${name}`}
          class="py-1 !pr-6"
          {...props}
        />
      </div>
    </div>
  );
}
