import prompts from "prompts";
import { getGitUserName, init, initGit, Manifest, Regexp } from "./util";
import { snakeCase, upperFirst, words } from "lodash";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import js_beautify from "js-beautify";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const FileName = {
  Manifest: "manifest.json",
  RendererJs: "renderer.js",
  MainJs: "main.js",
  PreloadJs: "preload.js",
};
const template_dir = resolve(__dirname, "../template");
(async () => {
  init();
  console.info(
    "请务必确保已经安装git，并设置了user.name。\n如放弃创建项目可以使用Ctrl+C退出进程。",
  );
  const response = await prompts([{
    type: "text",
    name: "project-name",
    message: "项目名称",
    validate: (value: string) => {
      if (value.trim() == "") return "请不要空白名称";
      if (!Regexp.ASCII.test(value)) {
        return "请使用英文名称";
      }
      if (Regexp.WhiteSpace.test(value)) return "名称中请不要包含空格";
      if (Regexp.WindowsInvalid.test(value)) {
        return '名称中请不要包含^\\/:*?"<>|';
      }
      return true;
    },
  }, {
    type: "text",
    name: "plugin-slug",
    message: "插件标识",
    initial: (prev: string) => snakeCase(prev),
  }, {
    type: "text",
    name: "plugin-name",
    message: "插件名称",
    initial: (prev: string) => words(prev).map(upperFirst).join(" "),
  }, {
    type: "select",
    name: "plugin-type",
    message: "插件类型",
    choices: [
      { title: "扩展", description: "最常规的插件", value: "extension" },
      { title: "主题", description: "一个主题插件", value: "theme" },
      { title: "依赖", description: "为其他插件提供API", value: "framework" },
    ],
    initial: 0,
    hint: "- 上下选择，回车选定",
  }, {
    type: "text",
    name: "plugin-description",
    message: "插件介绍",
    initial: (perv: string) => `一个用于LiteLoaderQQNT的${perv}`,
  }, {
    type: "multiselect",
    name: "plugin-platform",
    message: "插件所支持的平台",
    choices: [
      { title: "Windows", value: "win32", selected: true },
      { title: "Linux", value: "linux", selected: true },
      { title: "MacOS", value: "darwin", selected: true },
    ],
    hint: "- 空格切换选定，回车确认",
    instructions: false,
  }, {
    type: "text",
    name: "plugin-version",
    message: "版本号",
    initial: "1.0.0",
    validate: (value: string) =>
      Regexp.Semver.test(value) ? true : "请保证语义化版本规范",
  }, {
    type: "toggle",
    name: "plugin-package-npm",
    message: "使用npm作为包管理器",
    active: "不使用",
    inactive: "不需要",
    initial: false,
  }, {
    type: "toggle",
    name: "plugin-git",
    message: "初始化git用于版本管理",
    active: "好",
    inactive: "不好",
    initial: true,
  }], {
    onCancel: () => {
      process.exit(0);
    },
  });
  
  let user_name = await getGitUserName();
  let dir_name = `LiteLoaderQQNT-${words(response["project-name"]).map(upperFirst).join("-")
    }`;
  const injects_dir = "src";
  let manifest: Manifest = {
    manifest_version: 4,
    type: response["plugin-type"],
    name: response["project-name"],
    slug: response["plugin-slug"],
    description: response["plugin-description"],
    version: "0.1.0",
    authors: [
      {
        name: user_name,
        link: `https://github.com/${user_name}`,
      },
    ],
    platfrom: response["plugin-platform"],
  };
  manifest.injects = {
    renderer: `./${injects_dir}/${FileName.RendererJs}`,
    main: `./${injects_dir}/${FileName.MainJs}`,
    preload: `./${injects_dir}/${FileName.PreloadJs}`,
  };
  let manifest_string = JSON.stringify(manifest);
  if (existsSync(dir_name)) throw new Error(`文件夹${dir_name}已存在`);
  mkdirSync.$$(`创建文件夹${dir_name}失败`, dir_name);
  writeFileSync.$$(
    `创建${FileName.Manifest}文件失败`,
    `${dir_name}/${FileName.Manifest}`,
    js_beautify.js(manifest_string),
  );
  const src_dir = `${dir_name}/${injects_dir}`;
  mkdirSync.$$(`创建文件夹${dir_name}失败`, src_dir);
  copyFileSync.$$(
    `创建文件${FileName.MainJs}失败`,
    `${template_dir}/main.template`,
    `${src_dir}/${FileName.MainJs}`,
  );
  /*copyFileSync.$$(
    `创建文件${FileName.PreloadJs}失败`,
    "template/preload.template",
    `${src_dir}/${FileName.PreloadJs}`,
  );*/
  writeFileSync(
    `${src_dir}/${FileName.PreloadJs}`,
    readFileSync(`${template_dir}/preload.template`, { encoding: "utf8" })
      .replaceAll(
        "{{plugin-slug}}",
        response["plugin-slug"],
      ),
  );
  copyFileSync.$$(
    `创建文件${FileName.RendererJs}失败`,
    `${template_dir}/renderer.template`,
    `${src_dir}/${FileName.RendererJs}`,
  );
  if (response["plugin-git"]) initGit(dir_name);
})();
