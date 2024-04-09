import classnames from "../../../utils/classnames.ts";

type Props = {
  href: string;
  text: string;
  highlight?: boolean;
};

export default function NavItem(props: Props) {
  return (
    <a
      href={props.href}
      class={classnames(
        "inline border-b border-transparent hover:border-current italic",
        props.highlight ? "text-browser-purple" : "text-browser-blue",
      )}
    >
      {props.text}
    </a>
  );
}
