import { hello } from "./hello.js";
import { expect } from "chai";

describe(`example.test.ts`, () => {
    it(`example.test.ts`, () => {
        expect(hello()).to.deep.equal("ytslib_policy package 'fs_as_task_manager' started successfully!");
    });
});
