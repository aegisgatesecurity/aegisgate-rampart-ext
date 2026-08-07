import * as path from "path";
import * as glob from "glob";

export function run(testsRoot: string, cb: (error: Error | undefined, failures: number | undefined) => void): void {
  // Dynamic import of Mocha (ESM default export)
  import("mocha").then((mochaModule) => {
    const Mocha = mochaModule.default ?? mochaModule;
    const mocha = new Mocha({ ui: "bdd", timeout: 10000 });

    glob.glob("**/*.test.js", { cwd: testsRoot }).then((files: string[]) => {
      files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));
      mocha.run((failures: number) => {
        cb(undefined, failures === 0 ? undefined : failures);
      });
    }).catch((err: Error) => cb(err, undefined));
  }).catch((err: Error) => cb(err, undefined));
}