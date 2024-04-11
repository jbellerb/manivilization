import { STATUS_CODE } from "$std/http/status.ts";
import { defineRoute } from "$fresh/server.ts";

import type { Handlers } from "$fresh/server.ts";

import AdminFileInput from "./(_components)/AdminFileInput.tsx";
import AdminInput from "./(_components)/AdminInput.tsx";
import NavItem from "./(_components)/NavItem.tsx";
import FormResetter from "../../islands/FormResetter.tsx";
import classnames from "../../utils/classnames.ts";
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
      instance.guildId = toSnowflake(getString("guild", formData));
      instance.adminRole = toSnowflake(getString("admin-role", formData));

      if (ctx.state.superAdmin) {
        instance.host = getString("host", formData);
        instance.owner = toSnowflake(getString("owner", formData));
        instance.privacyPolicy = getString("privacy-policy", formData);
      }

      const favicon16 = formData.get("favicon-16");
      const favicon32 = formData.get("favicon-32");
      const faviconIco = formData.get("favicon-ico");
      if (favicon16 && favicon16 instanceof File) {
        instance.favicon16 = await favicon16.arrayBuffer();
      }
      if (favicon32 && favicon32 instanceof File) {
        instance.favicon32 = await favicon32.arrayBuffer();
      }
      if (faviconIco && faviconIco instanceof File) {
        instance.faviconIco = await faviconIco.arrayBuffer();
      }
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

function GroupLabel(props: { label: string; title: string }) {
  return (
    <div
      class="row-span-full col-start-2 flex items-center py-1"
      aria-hidden
    >
      <div class="h-full border-y border-r border-black w-2 mr-2">
      </div>
      <span title={props.title}>{props.label}</span>
    </div>
  );
}

async function instanceEditor(id: string, sudo: boolean) {
  const instance = await db.instances.findOne({}, {
    where: (instance, { eq }) => eq(instance.id, id),
  });
  if (!instance) throw new Error("Failed to load current instance");

  return (
    <>
      <h1 class="text-xl font-bold mx-auto mb-6">Instance settings</h1>
      <form
        method="post"
        class="mx-auto grid grid-cols-form gap-y-4 gap-x-2 auto-rows-min justify-items-start"
        enctype="multipart/form-data"
        name="instance"
      >
        <label for="input-name" class="justify-self-end">Name:</label>
        <AdminInput name="name" value={instance.name} required />
        {sudo && (
          <>
            <label for="input-host" class="justify-self-end">Host:</label>
            <AdminInput name="host" value={instance.host} required />
            <label for="input-owner" class="justify-self-end">Owner:</label>
            <AdminInput name="owner" value={fromSnowflake(instance.owner)} />
          </>
        )}
        <div
          class="col-span-full grid grid-cols-subgrid gap-2 justify-items-start"
          id="input-group-guild"
          aria-label="Guild settings"
        >
          <label for="input-guild" class="justify-self-end">
            Id:
          </label>
          <label for="input-admin-role" class="justify-self-end">
            Admin role:
          </label>
          <div
            role="presentation"
            class="row-span-2 row-start-1 col-start-2 grid grid-cols-form grid-rows-subgrid gap-2"
          >
            <GroupLabel label="Guild" title="Guild settings" />
            <AdminInput
              name="guild"
              value={fromSnowflake(instance.guildId)}
              required
            />
            <AdminInput
              name="admin-role"
              value={fromSnowflake(instance.adminRole)}
              required
            />
          </div>
        </div>
        <div
          class="col-span-full grid grid-cols-subgrid gap-2 justify-items-start"
          id="input-group-favicon"
          aria-label="Favicon settings"
        >
          <label for="input-favicon-16" class="justify-self-end row-start-1">
            16x16:
          </label>
          <label for="input-favicon-32" class="justify-self-end">
            32x32:
          </label>
          <label for="input-favicon-ico" class="justify-self-end">
            .ico:
          </label>
          <div
            role="presentation"
            class="row-span-3 row-start-1 col-start-2 grid grid-cols-form grid-rows-subgrid gap-2"
          >
            <GroupLabel label="Favicon" title="Favicon settings" />
            <AdminFileInput name="favicon-16" accept=".png" />
            <AdminFileInput name="favicon-32" accept=".png" />
            <AdminFileInput name="favicon-ico" accept=".ico" />
          </div>
        </div>
        {sudo && (
          <label for="textarea-privacy-policy" class="justify-self-end">
            Privacy policy:
          </label>
        )}
        <div
          role="presentation"
          class={classnames("grid gap-y-4", sudo ? "w-64" : "w-50 col-start-2")}
        >
          {sudo && (
            <div
              role="presentation"
              class="flex p-[2px] shadow-debossed border border-windows-gray"
            >
              <textarea
                name="privacy-policy"
                id="textarea-privacy-policy"
                class="px-[2px] w-full"
                rows={4}
              >
                {instance.privacyPolicy}
              </textarea>
            </div>
          )}
          <div class="justify-self-end" role="presentation">
            <button class="px-4 py-1 text-sm bg-windows-gray shadow-embossed active:shadow-debossed focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-offset-[-5px] focus-visible:outline-black group">
              <span class="relative group-active:top-[1px] group-active:left-[1px]">
                Save
              </span>
            </button>
          </div>
        </div>
      </form>
      <FormResetter form="instance" />
    </>
  );
}

export default defineRoute<State>(async (_req, { state }) => {
  const component = state.superAdmin || state.owner
    ? await instanceEditor(state.instance.id, state.superAdmin)
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
