import { STATUS_CODE } from "$std/http/status.ts";
import { defineRoute } from "$fresh/server.ts";

import type { Handlers } from "$fresh/server.ts";

import AdminInput from "./(_components)/AdminInput.tsx";
import NavItem from "./(_components)/NavItem.tsx";
import FormResetter from "../../islands/FormResetter.tsx";
import db from "../../utils/db/mod.ts";
import { fromSnowflake, toSnowflake } from "../../utils/discord/snowflake.ts";

import type { AdminState as State } from "./_middleware.ts";

function getString(name: string, data: FormData): string {
  const value = data.get(name);
  if (typeof value === "string") return value;
  throw new Error(`${name} is not a string`);
}

export const handler: Handlers<void, State> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const instance = await db.instances.findOne({}, {
      where: (instance, { eq }) => eq(instance.id, ctx.state.instance.id),
    });
    if (!instance) throw new Error("Failed to load current instance");

    try {
      // lazy form data parsing
      instance.name = getString("name", formData);
      instance.host = getString("host", formData);
      instance.guildId = toSnowflake(getString("guild", formData));
      instance.adminRole = toSnowflake(getString("role", formData));
      await db.instances.update(instance);

      const headers = new Headers({ Location: "/admin" });
      return new Response(null, { status: STATUS_CODE.Found, headers });
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        return new Response("Bad Request", { status: STATUS_CODE.BadRequest });
      }
      throw e;
    }
  },
};

async function instanceEditor(id: string) {
  const instance = await db.instances.findOne({}, {
    where: (instance, { eq }) => eq(instance.id, id),
  });
  if (!instance) throw new Error("Failed to load current instance");

  return (
    <>
      <h1 class="text-xl font-bold mx-auto mb-6">Instance settings</h1>
      <form
        method="post"
        class="mx-auto grid grid-cols-form gap-y-4 gap-x-2 auto-rows-min justify-items-end"
        name="instance"
      >
        <label for="input-name">Name:</label>
        <AdminInput name="name" value={instance.name} required />
        <div aria-hidden />
        <label for="input-name">Host:</label>
        <AdminInput name="host" value={instance.host} required />
        <div aria-hidden />
        <div
          class="col-span-3 grid grid-cols-subgrid gap-2 justify-items-end"
          id="input-group-guild"
          aria-label="Guild settings"
        >
          <label for="input-guild">Id:</label>
          <AdminInput
            name="guild"
            value={fromSnowflake(instance.guildId)}
            required
          />
          <div class="row-span-2 flex items-center py-1" aria-hidden>
            <div class="h-full border-y border-r border-black w-2 mr-2">
            </div>
            <span title="Guild settings">Guild</span>
          </div>
          <label for="input-role">Admin role:</label>
          <AdminInput
            name="role"
            value={fromSnowflake(instance.adminRole)}
            required
          />
        </div>
        <div class="col-span-2" role="presentation">
          <button class="px-4 py-1 text-sm bg-[#bdbdbd] shadow-embossed active:shadow-debossed focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-offset-[-5px] focus-visible:outline-black group">
            <span class="relative group-active:top-[1px] group-active:left-[1px]">
              Save
            </span>
          </button>
        </div>
      </form>
      <FormResetter form="instance" />
    </>
  );
}

export default defineRoute<State>(async (_req, { state }) => {
  const component = state.superAdmin
    ? await instanceEditor(state.instance.id)
    : <h1 class="m-auto text-3xl font-semibold">:3</h1>;

  return (
    <>
      <nav class="flex py-4 px-5 justify-between">
        Welcome, {state.user.name}
        <div role="presentation">
          <NavItem
            href="/oauth/logout"
            text="Sign out"
          />
        </div>
      </nav>
      <main class="flex flex-col px-8 py-16">
        {component}
      </main>
    </>
  );
});
