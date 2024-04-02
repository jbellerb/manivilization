import { IS_BROWSER } from "$fresh/runtime.ts";
import { useSignal } from "@preact/signals";

type UserCardProps = {
  id: string;
  name: string;
};

function UserCard(props: UserCardProps) {
  const active = useSignal(false);

  const mention = `<@${props.id}>`;

  return (
    <th
      scope="row"
      class="px-4 py-2 border-b border-black"
    >
      {active.value
        ? (
          <input
            type="text"
            // I think this is a valid use of ref? Need to delay calling
            // .focus() until after the <input> is committed to the DOM.
            // useSignalEffect fires before commit so that won't work.
            // See: https://github.com/preactjs/signals/issues/228
            ref={(refNode) => refNode?.focus()}
            onBlur={() => active.value = false}
            onFocus={(e) => e.currentTarget.select()}
            onInput={(e) => e.currentTarget.value = mention}
            value={mention}
          />
        )
        : <span onClick={() => active.value = true}>{props.name}</span>}
    </th>
  );
}

type Props = {
  columns: string[];
  responses: {
    userId: string;
    userName: string;
    date: number;
    response: string[];
  }[];
};

function exportCsv(props: Props) {
  if (!IS_BROWSER) return;
  const encoder = new TextEncoder();
  const needsEscaping = /[\n\r",]/;

  const header = ["discord_id", "discord_name", "date", ...props.columns]
    .join(",");
  const body = props.responses.map((response) =>
    [
      response.userId,
      response.userName,
      new Date(response.date).toLocaleString(),
      ...response.response,
    ].map((item) =>
      needsEscaping.test(item) ? `"${item.replaceAll('"', '""')}"` : item
    ).join(",") + "\r\n"
  ).join("");

  const csv = encoder.encode(header + "\r\n" + body);
  const blob = new Blob([csv.buffer], { type: "text/csv" });

  const link = document.createElement("a");
  link.download = "results.csv";
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ResultsTable(props: Props) {
  const sortBy = useSignal(-2);
  const sortOrder = useSignal(false);
  const cmp = Intl.Collator();

  const responses = props.responses.toSorted((a, b) => {
    const col = sortBy.value === -2
      ? cmp.compare(a.userName, b.userName)
      : sortBy.value === -1
      ? b.date - a.date
      : cmp.compare(a.response[sortBy.value], b.response[sortBy.value]);
    return col === 0 ? b.date - a.date : col * (sortOrder.value ? -1 : 1);
  });

  return (
    <>
      <button
        type="button"
        class="block px-4 text-browser-blue active:text-browser-purple"
        onClick={() => exportCsv({ columns: props.columns, responses })}
      >
        Download CSV
      </button>
      <table class="w-full text-left border-separate border-spacing-0">
        <thead class="text-sm">
          <tr class="sticky top-0 bg-white">
            {["User", "Date", ...props.columns].map((column, idx) => (
              <th scope="col" class="border-b border-black">
                <button
                  class="px-4 py-2 w-full h-full text-left"
                  onClick={() => {
                    if (sortBy.value === idx - 2) {
                      sortOrder.value = !sortOrder.value;
                    } else {
                      sortOrder.value = false;
                      sortBy.value = idx - 2;
                    }
                  }}
                >
                  {column}
                  <span class="ml-4">
                    {sortBy.value + 2 === idx
                      ? sortOrder.value ? "↓" : "↑"
                      : "↕"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((response) => (
            <tr class="border-b border-black">
              <UserCard id={response.userId} name={response.userName} />
              <td class="px-4 py-2 border-b border-black">
                {new Date(response.date).toLocaleString()}
              </td>
              {response.response.map((data) => (
                <td class="px-4 py-2 border-b border-black">
                  {data}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
