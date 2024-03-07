import { FreshContext } from "$fresh/server.ts";

import { State } from "./_middleware.ts";
import { listForms } from "../../utils/form.ts";

export default async function AdminLayout(
  _req: Request,
  ctx: FreshContext<State>,
) {
  const forms = await listForms(ctx.state.ctx.client);

  return (
    <div>
      <aside>
        <ul>
          {forms.map(({ id, name }) => (
            <li key={id}>
              <a href={`admin/forms/${id}`}>{name}</a>
            </li>
          ))}
          <li>
            <a href="/admin/forms/new">Create new form</a>
          </li>
        </ul>
      </aside>
      <div>
        <ctx.Component />
      </div>
    </div>
  );
}
