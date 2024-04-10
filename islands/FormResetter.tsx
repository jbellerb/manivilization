import { IS_BROWSER } from "$fresh/runtime.ts";

type Props = {
  form: string;
};

export default function FormResetter({ form }: Props) {
  if (IS_BROWSER) {
    // @ts-ignore this is fine in the browser context
    document[form].reset();
  }

  return <></>;
}
