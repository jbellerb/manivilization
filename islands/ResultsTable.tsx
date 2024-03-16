import { useSignal } from "@preact/signals";

type Props = {
  columns: string[];
  responses: { user: string; date: number; response: string[] }[];
};

export default function ResultsTable(props: Props) {
  const sortBy = useSignal(-2);
  const sortOrder = useSignal(false);
  const cmp = Intl.Collator();

  const responses = props.responses.toSorted((a, b) => {
    const col = sortBy.value === -2
      ? cmp.compare(a.user, b.user)
      : sortBy.value === -1
      ? b.date - a.date
      : cmp.compare(a.response[sortBy.value], b.response[sortBy.value]);
    return col === 0 ? b.date - a.date : col * (sortOrder.value ? -1 : 1);
  });

  return (
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
                  {sortBy.value + 2 === idx ? sortOrder.value ? "↓" : "↑" : "↕"}
                </span>
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {responses.map((response) => (
          <tr class="border-b border-black">
            <th scope="row" class="px-4 py-2 border-b border-black">
              {response.user}
            </th>
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
  );
}
