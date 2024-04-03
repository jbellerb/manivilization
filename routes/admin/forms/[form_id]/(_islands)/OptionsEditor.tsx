import classnames from "../../../../../utils/classnames.ts";

type Props = {
  name: string;
  options: string[];
  onChange?: (options: string[]) => void;
};

export default function OptionsEditor(props: Props) {
  const addOption = (option: string) =>
    props.onChange && props.onChange([...props.options, option]);
  const deleteOption = (idx: number) =>
    props.options.length > 1 && props.onChange &&
    props.onChange(props.options.toSpliced(idx, 1));
  const updateOption = (option: string, idx: number) =>
    props.onChange && props.onChange(props.options.toSpliced(idx, 1, option));

  return (
    <div class="flex">
      <IconButton
        label="Add an option"
        class="mt-auto after:i-mdi-plus"
        onClick={() => addOption("New Option")}
      />
      <div class="flex flex-col w-full ml-2">
        <label class="text-sm font-semibold text-gray-400">
          Options<span class="ml-1">*</span>
        </label>
        <ul class="-mt-1">
          {props.options.map((option, idx) => (
            <li class="flex">
              <TextInput
                name={`${props.name}-options-${idx}`}
                value={option}
                onChange={(e) => updateOption(e.currentTarget.value, idx)}
                required
              />
              <IconButton
                label="Delete option"
                class="after:i-mdi-close"
                onClick={() => deleteOption(idx)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
