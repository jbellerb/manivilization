import type { User } from "../../../utils/discord/user.ts";

type Props = { path: string; user?: User };

export function LoginButton(props: { path: Props["path"] }) {
  return (
    <section class="flex flex-col items-center mt-4">
      <span class="text-lg">
        Connect with Discord to fill out the form
      </span>
      <a
        href={`/oauth/login?redirect=${props.path}`}
        class="mt-4 px-4 py-2 flex items-center border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-lg transition-border-color"
      >
        {/* svg from https://discord.com/branding */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-9.02 -24.41 145.18 145.18"
          class="w-10 h-10"
        >
          <path
            fill="currentColor"
            d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
          />
        </svg>
        <div class="ml-4">
          Sign in with
          <br />
          <span class="text-xl font-semibold">Discord</span>
        </div>
      </a>
    </section>
  );
}

export default function UserBanner(props: Props) {
  if (!props.user) {
    return <LoginButton path={props.path} />;
  }

  return (
    <section class="flex justify-between items-center">
      <article
        aria-label={`Filling out form as ${props.user.username}`}
        class="flex items-center"
      >
        <img
          src={props.user.avatar}
          width="48"
          height="48"
          alt={`Discord avatar of ${props.user.name}`}
          class="rounded-full"
        />
        <div class="ml-2">
          <span class="block text-lg">{props.user.name}</span>
          <span class="block text-sm text-gray-400">
            {props.user.username}
          </span>
        </div>
      </article>
      <a
        href={`/oauth/logout?redirect=${props.path}`}
        class="px-4 py-1 font-semibold tracking-wide outline-none border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-full transition-border-color"
      >
        Sign out
      </a>
    </section>
  );
}
