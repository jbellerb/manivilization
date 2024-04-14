import IconButton from "../../../../../components/IconButton.tsx";
import TextInput from "../../../../../components/TextInput.tsx";
import { toSnowflake } from "../../../../../utils/discord/snowflake.ts";

type Props = {
  name: string;
  options: string[];
  roles: string[];
  onChange?: (options: string[], roles: string[]) => void;
};

function validateRole(role: string): boolean {
  try {
    toSnowflake(role);
    return true;
  } catch {
    return false;
  }
}

export default function OptionsEditor(props: Props) {
  const addOption = (option: string, role: string) =>
    props.onChange &&
    props.onChange([...props.options, option], [...props.roles, role]);
  const deleteOption = (idx: number) =>
    props.options.length > 1 && props.onChange &&
    props.onChange(
      props.options.toSpliced(idx, 1),
      props.roles.toSpliced(idx, 1),
    );
  const updateOption = (idx: number, option: string, role: string) =>
    props.onChange && props.onChange(
      props.options.toSpliced(idx, 1, option),
      props.roles.toSpliced(idx, 1, role),
    );

  return (
    <div class="flex">
      <IconButton
        label="Add an option"
        class="mt-auto after:i-mdi-plus"
        onClick={() => addOption("New Option", "0")}
      />
      <div class="grid grid-cols-[repeat(3,auto)] w-full ml-2">
        <label
          id={`${props.name}-options`}
          class="text-sm font-semibold text-gray-400"
        >
          Options<span class="ml-1">*</span>
        </label>
        <label
          id={`${props.name}-roles`}
          class="text-sm font-semibold text-gray-400"
        >
          Roles<span class="ml-1">*</span>
        </label>
        <ul class="-mt-1 grid col-span-full grid-cols-subgrid">
          {props.options.map((option, idx) => (
            <li class="grid col-span-full grid-cols-subgrid">
              <TextInput
                name={`${props.name}-labels-${idx}`}
                class="mr-2"
                value={option}
                error={!option}
                onChange={(e) =>
                  updateOption(idx, e.currentTarget.value, props.roles[idx])}
                aria-labelledby={`${props.name}-options`}
                required
              />
              <TextInput
                name={`${props.name}-roles-${idx}`}
                value={props.roles[idx]}
                error={!props.roles[idx] && !validateRole(props.roles[idx])}
                onChange={(e) =>
                  updateOption(idx, option, e.currentTarget.value)}
                onInput={(e) =>
                  e.currentTarget.setCustomValidity(
                    validateRole(e.currentTarget.value)
                      ? ""
                      : "Please enter a valid Discord role ID.",
                  )}
                aria-labelledby={`${props.name}-roles`}
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
