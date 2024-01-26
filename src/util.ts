import spawn from "cross-spawn";
export async function getGitUserName(): Promise<string> {
  const child = spawn("git", ["config", "user.name"]);
  let output = "";
  child.stdout!.on("data", (data) => {
    output += data.toString();
  });
  return new Promise((res) => {
    child.on("exit", (code, signal) => {
      if (code === 0) {
        output = output.trim();
        res(output);
      } else {
        throw new Error(`git执行失败 code:${code}, signal:${signal}`);
      }
    });
  });
}
export const Regexp = {
  ASCII: /^[ -~]+$/,
  WhiteSpace: /\s/,
  WindowsInvalid: /[\\/:*?"<>|]/,
  Semver:
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
};

export interface Mainfest {
  mainfest_version: 4;
  type: "extension" | "theme" | "framework";
  name: string;
  slug: string;
  description: string;
  version: string;
  icon?: string | null;
  authors: Author[];
  dependencies?: string[];
  platfrom: ("win32" | "linux" | "darwin")[];
  injects?: {
    renderer?: string;
    main?: string;
    preload?: string;
  };
  repository?: {
    repo: string;
    branch: string;
    release: {
      tag: string;
      file?: string;
    };
  };
}
export interface Author {
  name: string;
  link: string;
}
declare global {
  interface Function {
    $$(err_message: string, ...args: any[]): any;
  }
}
export function init() {
  Object.defineProperty(Function.prototype, "$$", {
    value: function(err_message: string, ...args: any[]) {
      try {
        this(...args);
      } catch (err) {
        console.error(err);
        throw new Error(err_message);
      }
    },
    writable: false,
  });
}
