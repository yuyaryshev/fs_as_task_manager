import inquirer from "inquirer";
import fs from "fs-extra";
import { strReplaceAll } from "ystd";
import axios from "axios";
import { parse, stringify } from "json5";

const obsidianVaultDir = `D:/b/InfoVault`;
const obsidianSubVaultDir = `Tasks`;
const taskDirRoot = `${obsidianVaultDir}/${obsidianSubVaultDir}`;
const mdDirRoot = `${obsidianVaultDir}/${obsidianSubVaultDir}`;
const globalsPath = `${obsidianVaultDir}/globals.json5`;

const codeStr = (n: number): string => {
    const m = 100000000;
    if (m < n) {
        throw new Error(`CODE00000001 Error in codeStr - n=${n} is too big!`);
    }
    return (m + n + "").substring(1);
};

async function main() {
    let globalsContent: any = {};
    try {
        globalsContent = parse(fs.readFileSync(globalsPath, "utf-8"));
    } catch (e: any) {
        if (e?.code !== "ENOENT") {
            console.error(`CODE00000002 Error ${e.message} while reading ${globalsPath}`);
        }
    }
    if (!globalsContent.uid) {
        globalsContent.uid = 10000000;
    }

    globalsContent.uid++;
    const uidN = globalsContent.uid;
    const uid = `TSK${codeStr(uidN)}`;
    const newGlobalsContent = stringify(globalsContent);
    fs.writeFileSync(globalsPath, newGlobalsContent, "utf-8");

    const { execa } = await import("execa");
    const dbgTaskName = process.env.dbgTaskName;
    const tsStr = new Date().toISOString();

    const { unescapedNameOnly } = dbgTaskName
        ? { unescapedNameOnly: dbgTaskName }
        : await inquirer.prompt([
              {
                  name: "unescapedNameOnly",
                  message: `Name for ${uid}?`,
              },
          ]);
    console.log({ unescapedNameOnly });
    const unescapedName = `${uid} ${unescapedNameOnly}`;
    const ref = `[[${unescapedName}]]`;

    const taskDir = `${taskDirRoot}/${unescapedName}`;
    const taskDirUrl = encodeURI(`file://${taskDirRoot}/${unescapedName}`);
    try {
        fs.mkdirpSync(taskDir);
        console.log(taskDir);
    } catch (e: any) {
        console.warn(e);
    }

    const tags = ['current_task','task'].join(' ');
    const taskMdAbsolutePath = `${taskDir}/${unescapedName}.md`;
    const taskMdRelativePath = `${obsidianSubVaultDir}/${unescapedName}/${unescapedName}.md`;
    const allVars = {
        uid,
        unescapedNameOnly,
        unescapedName,
        ref,
        tags,
        taskDir,
        taskDirUrl,
        taskMdAbsolutePath,
        taskMdRelativePath,
        tsStr,
    };

    let taskMdTemplate = `# ${unescapedName}\nTBD`;
    try {
        taskMdTemplate = fs.readFileSync(`./src/taskTemplate.md`, "utf-8");
    } catch (e: any) {
        console.warn(e);
    }
    const taskMdContent = strReplaceAll(taskMdTemplate, allVars, "$$", "$$");

    fs.writeFileSync(taskMdAbsolutePath, taskMdContent, "utf-8");
    console.log(taskMdAbsolutePath);

    try {
        await execa(`${taskDir.substr(0, 2)} && cd ${taskDir} && explorer .`, [], { shell: true }).then();
    } catch (e: any) {
        //console.warn(e);
    }
    //taskMdPath
    const nonEncodedUri = `obsidian://open?vault=InfoVault&file=${taskMdRelativePath}`;
    const encodedUri = encodeURI(nonEncodedUri);
    const startUriCmd = `start "" "${encodedUri}"`;
    try {
        await execa(startUriCmd, [], { shell: true }).then();
    } catch (e: any) {
        console.warn(e);
    }

    // const taskLinkToMdPath = `${taskDir}/!md.lnk`;
    //
    // try {
    //     const cmd = `d:/ProgsReady/shortcut.exe /f:"${taskLinkToMdPath}" /a:c /t:"${encodedUri}"`;
    //     await execa(cmd, [], { shell: true }).then();
    // } catch (e: any) {
    //     console.warn(e);
    // }
}

main();
