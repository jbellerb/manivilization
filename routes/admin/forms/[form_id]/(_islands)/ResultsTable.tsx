import { IS_BROWSER } from "$fresh/runtime.ts";
import { useComputed, useSignal } from "@preact/signals";

import UserCard from "./UserCard.tsx";
import AdminLinkButton from "../../../(_components)/AdminLinkButton.tsx";

type Props = {
  columns: string[];
  users: {
    id: string;
    name: string;
    responses: {
      date: number;
      response: string[];
      rolesSet: boolean;
    }[];
  }[];
};

function exportCsv(props: Props) {
  if (!IS_BROWSER) return;
  const encoder = new TextEncoder();
  const needsEscaping = /[\n\r",]/;

  const header = ["discord_id", "discord_name", "date", ...props.columns]
    .join(",");
  const body = props.users.flatMap((user) =>
    user.responses.map((response) =>
      [
        user.id,
        user.name,
        new Date(response.date).toLocaleString(),
        ...response.response,
      ].map((item) =>
        needsEscaping.test(item) ? `"${item.replaceAll('"', '""')}"` : item
      ).join(",") + "\r\n"
    )
  ).join("");

  const csv = encoder.encode(header + "\r\n" + body);
  const blob = new Blob([csv.buffer], { type: "text/csv" });

  const link = document.createElement("a");
  link.download = "results.csv";
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function UserRow({ user }: { user: Props["users"][number] }) {
  const expanded = useSignal(false);

  return (
    <>
      <tr>
        <th scope="row" class="px-1 py-1 shadow-cell border border-white">
          <UserCard
            id={user.id}
            name={user.name}
            rolesSet={user.responses[0].rolesSet}
            expanded={user.responses.length > 1 ? expanded.value : undefined}
            onExpandedClick={() => expanded.value = !expanded.value}
          />
        </th>
        <td class="px-2 py-1 shadow-cell border border-white">
          {new Date(user.responses[0].date).toLocaleString()}
        </td>
        {user.responses[0].response.map((data) => (
          <td class="px-2 py-1 shadow-cell border border-white">{data}</td>
        ))}
      </tr>
      {expanded.value &&
        user.responses.slice(1).map((response) => (
          <tr class="bg-neutral-200">
            <th scope="row" class="px-2 py-1 shadow-cell border border-white" />
            <td class="px-2 py-1 shadow-cell border border-white">
              {new Date(response.date).toLocaleString()}
            </td>
            {response.response.map((data) => (
              <td class="px-2 py-1 shadow-cell border border-white">{data}</td>
            ))}
          </tr>
        ))}
    </>
  );
}

export default function ResultsTable(props: Props) {
  const sortBy = useSignal(-1);
  const sortAsc = useSignal(false);
  const cmp = Intl.Collator();

  const table = useComputed(() =>
    props.users.toSorted((a, b) => {
      const col = sortBy.value === -2
        ? cmp.compare(a.name, b.name)
        : sortBy.value === -1
        ? b.responses[0].date - a.responses[0].date
        : cmp.compare(
          a.responses[0].response[sortBy.value],
          b.responses[0].response[sortBy.value],
        );
      return col === 0
        ? b.responses[0].date - a.responses[0].date
        : col * (sortAsc.value ? -1 : 1);
    })
  );

  return (
    <>
      <AdminLinkButton
        name="Download CSV"
        class="ml-4 mb-2"
        onClick={() => exportCsv(props)}
      />
      <table class="w-full px-4 pb-4 text-left overflow-y-hidden border-separate border-spacing-0 p-0.5">
        <thead class="sticky top-0.5 text-sm z-10 after:content-empty after:block after:h-2">
          <tr class="outline outline-white outline-1 relative after:content-empty after:absolute after:-z-10 after:-inset-px after:shadow-table">
            {["User", "Date", ...props.columns].map((column, idx) => (
              <th scope="col" class="bg-white shadow-cell border border-white">
                <button
                  class="p-2 w-full h-full text-left group"
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
                  <span class="ml-4 group-focus-visible:outline-1 group-focus-visible:outline-dotted group-focus-visible:outline-offset-2 group-focus-visible:outline-black">
                    {sortBy.value + 2 === idx ? sortAsc.value ? "↓" : "↑" : "↕"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody class="relative after:content-empty after:absolute after:-z-10 after:-inset-px after:shadow-table">
          {table.value.map((user) => <UserRow key={user.id} user={user} />)}
        </tbody>
      </table>
    </>
  );
}
