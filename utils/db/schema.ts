import { column, Entity, table } from "./decorators.ts";

@table("auth_sessions")
export class AuthSession extends Entity {
  @column("id")
  id: string;
  @column("expires")
  expires: Date;
  @column("state")
  state: string;
  @column("verifier")
  verifier: string;
  @column("redirect")
  redirect: string;

  constructor(
    state: string,
    expires: Date,
    verifier: string,
    redirect: string,
  ) {
    super();
    this.id = crypto.randomUUID();
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
  @column("expires")
  expires: Date;
  @column("access_token")
  accessToken: string;
  @column("access_expires")
  accessExpires?: Date;
  @column("refresh_token")
  refreshToken?: string;

  constructor(
    expires: Date,
    accessToken: string,
    accessExpires?: Date,
    refreshToken?: string,
  ) {
    super();
    this.id = crypto.randomUUID();
    this.expires = expires;
    this.accessToken = accessToken;
    this.accessExpires = accessExpires;
    this.refreshToken = refreshToken;
  }
}

@table("forms")
export class Form<T = Record<string, unknown>> extends Entity {
  @column("id")
  id: string;
  @column("name")
  name: string;
  @column("slug")
  slug: string;
  @column("active")
  active: boolean;
  @column("description")
  description?: string;
  @column("questions")
  questions?: T;
  @column("success_message")
  successMessage?: string;
  @column("submitter_role")
  submitterRole?: string;

  constructor(
    name: string,
    slug: string,
    active: boolean,
    description?: string,
    questions?: T,
    successMessage?: string,
    submitterRole?: string,
  ) {
    super();
    this.id = crypto.randomUUID();
    this.name = name;
    this.slug = slug;
    this.active = active;
    this.description = description;
    this.questions = questions;
    this.successMessage = successMessage;
    this.submitterRole = submitterRole;
  }
}

@table("responses")
export class FormResponse extends Entity {
  @column("id")
  id: string;
  @column("form")
  form: string;
  @column("discord_id")
  discordId: string;
  @column("discord_name")
  discordName: string;
  @column("response")
  response?: Record<string, string>;
  @column("date")
  date?: Date;

  constructor(
    form: string,
    discordId: string,
    discordName: string,
    response?: Record<string, string>,
    date?: Date,
  ) {
    super();
    this.id = crypto.randomUUID();
    this.form = form;
    this.discordId = discordId;
    this.discordName = discordName;
    this.response = response;
    this.date = date;
  }
}
