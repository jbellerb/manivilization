import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  class?: string;
};

export default function TextInput(props: Props) {
  return (
    <div
      class={classnames("grow relative pt-4 text-lg z-0", props.class ?? "")}
    >
      <input
        type="text"
        name={props.name}
        id={`input-${props.name}`}
        class="block w-full py-1 bg-transparent border-b-2 border-gray-600 hover:border-gray-500 focus-visible:border-white transition-border-color peer"
        value={props.value}
        placeholder={props.placeholder}
        required={props.required ?? false}
      />
      <label
        for={`input-${props.name}`}
        class="absolute text-sm text-gray-400 peer-focus-visible:text-gray-600 font-semibold origin-[0] top-0 transition-color -z-10"
      >
        {props.label}
      </label>
    </div>
  );
}
