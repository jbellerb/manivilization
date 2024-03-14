import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  onClick?: (event: JSX.TargetedEvent<HTMLButtonElement, Event>) => void;
  class?: string;
};

export default function Button(props: Props) {
  return (
    <button
      type={props.onClick ? "button" : "submit"}
      class={classnames(
        "px-4 py-1 font-semibold tracking-wide border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-full transition-border-color",
        props.class ?? "",
      )}
      onClick={props.onClick}
    >
      {props.name}
    </button>
  );
}
