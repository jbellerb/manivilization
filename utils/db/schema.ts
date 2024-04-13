import { column, Entity, table } from "./decorators.ts";

import type { Question } from "../form/types.ts";

@table("instances")
export class Instance extends Entity {
  @column("id")
  id: string;
  @column("host")
  host: string;
  @column("name")
  name: string;
  @column("owner")
  owner: bigint;
  @column("guild_id")
  guildId: bigint;
  @column("admin_role")
  adminRole: bigint;
  @column("privacy_policy")
  privacyPolicy: string;
  @column("favicon_16")
  favicon16?: ArrayBuffer | null;
  @column("favicon_32")
  favicon32?: ArrayBuffer | null;
  @column("favicon_ico")
  faviconIco?: ArrayBuffer | null;

  constructor(
    host: string,
    name: string,
    owner: bigint,
    guildId: bigint,
    adminRole: bigint,
    privacyPolicy: string,
    favicon16?: ArrayBuffer,
    favicon32?: ArrayBuffer,
    faviconIco?: ArrayBuffer,
  ) {
    super();
    this.id = crypto.randomUUID();
    this.host = host;
    this.name = name;
    this.owner = owner;
    this.guildId = guildId;
    this.adminRole = adminRole;
    this.privacyPolicy = privacyPolicy;
    this.favicon16 = favicon16;
    this.favicon32 = favicon32;
    this.faviconIco = faviconIco;
  }
}

@table("auth_sessions")
export class AuthSession extends Entity {
  @column("id")
  id: string;
  @column("instance")
  instance: string;
  @column("expires")
  expires: Date;
  @column("state")
  state: string;
  @column("verifier")
  verifier: string;
  @column("redirect")
  redirect: string;

  constructor(
    instance: string,
    state: string,
    expires: Date,
    verifier: string,
    redirect: string,
  ) {
    super();
    this.id = crypto.randomUUID();
    this.instance = instance;
    this.state = state;
    this.expires = expires;
    this.verifier = verifier;
    this.redirect = redirect;
  }
}

@table("sessions")
export class Session extends Entity {
  @column("id")
  id: string;
  @column("instance")
  instance: string;
  @column("expires")
  expires: Date;
  @column("access_token")
  accessToken: string;
  @column("access_expires")
  accessExpires?: Date | null;
  @column("refresh_token")
  refreshToken?: string | null;

  constructor(
    instance: string,
    expires: Date,
    accessToken: string,
    accessExpires?: Date,
    refreshToken?: string,
  ) {
    super();
    this.id = crypto.randomUUID();
    this.instance = instance;
    this.expires = expires;
    this.accessToken = accessToken;
    this.accessExpires = accessExpires;
    this.refreshToken = refreshToken;
  }
}

@table("forms")
export class Form extends Entity {
  @column("id")
  id: string;
  @column("instance")
  instance: string;
  @column("name")
  name: string;
  @column("slug")
  slug: string;
  @column("active")
  active: boolean;
  @column("description")
  description?: string | null;
  @column("questions")
  questions?: { _: Question[] } | null;
  @column("success_message")
  successMessage?: string | null;
  @column("submitter_role")
  submitterRole?: bigint | null;

  constructor(
    instance: string,
    name: string,
    slug: string,
    active: boolean,
    description?: string,
    questions?: Question[],
    successMessage?: string,
    submitterRole?: bigint,
  ) {
    super();
    this.id = crypto.randomUUID();
    this.instance = instance;
    this.name = name;
    this.slug = slug;
    this.active = active;
    this.description = description;
    this.questions = questions && { _: questions };
    this.successMessage = successMessage;
    this.submitterRole = submitterRole;
  }
}

@table("responses")
export class FormResponse extends Entity {
  @column("id")
  id: string;
  @column("instance")
  instance: string;
  @column("date")
  date: Date;
  @column("form")
  form: string;
  @column("discord_id")
  discordId: bigint;
  @column("discord_name")
  discordName: string;
  @column("response")
  response?: Record<string, string> | null;

  constructor(
    instance: string,
    form: string,
    discordId: bigint,
    discordName: string,
    response?: Record<string, string>,
  ) {
    super();
    this.id = crypto.randomUUID();
    this.instance = instance;
    this.date = new Date();
    this.form = form;
    this.discordId = discordId;
    this.discordName = discordName;
    this.response = response;
  }
}
