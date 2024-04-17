import { IS_BROWSER } from "$fresh/runtime.ts";
import { useSignal } from "@preact/signals";

import UserCard from "./UserCard.tsx";
import AdminButton from "../../../(_components)/AdminButton.tsx";

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
  const sortAsc = useSignal(false);
  const cmp = Intl.Collator();

  const responses = props.responses.toSorted((a, b) => {
    const col = sortBy.value === -2
      ? cmp.compare(a.userName, b.userName)
      : sortBy.value === -1
      ? b.date - a.date
      : cmp.compare(a.response[sortBy.value], b.response[sortBy.value]);
    return col === 0 ? b.date - a.date : col * (sortAsc.value ? -1 : 1);
  });

  return (
    <>
      <AdminButton
        name="Download CSV"
        class="ml-2 mb-2"
        onClick={() => exportCsv({ columns: props.columns, responses })}
      />
      <table class="w-full text-left overflow-y-hidden border-separate border-spacing-0 p-0.5">
        <thead class="sticky top-0.5 text-sm z-10 after:content-empty after:block after:h-2">
          <tr class="outline outline-white outline-1 relative after:content-empty after:absolute after:-z-10 after:-inset-px after:shadow-table">
            {["User", "Date", ...props.columns].map((column, idx) => (
              <th scope="col" class="bg-white shadow-cell border border-white">
                <button
                  class="p-2 w-full h-full text-left"
                  onClick={() => {
                    if (sortBy.value === idx - 2) {
                      sortAsc.value = !sortAsc.value;
                    } else {
                      sortAsc.value = false;
                      sortBy.value = idx - 2;
                    }
                  }}
                >
                  {column}
                  <span class="ml-4">
                    {sortBy.value + 2 === idx ? sortAsc.value ? "↓" : "↑" : "↕"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody class="relative after:content-empty after:absolute after:-z-10 after:-inset-px after:shadow-table">
          {responses.map((response) => (
            <tr>
              <th scope="row" class="p-2 shadow-cell border border-white">
                <UserCard id={response.userId} name={response.userName} />
              </th>
              <td class="p-2 shadow-cell border border-white">
                {new Date(response.date).toLocaleString()}
              </td>
              {response.response.map((data) => (
                <td class="p-2 shadow-cell border border-white">
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
