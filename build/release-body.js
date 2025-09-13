const fs = require("fs");

const CHANGELOG = fs.readFileSync("CHANGELOG.md").toString();

let result = "";
let start = false;
for (const line of CHANGELOG.split("\n")) {
    if (line.startsWith("## [v")) {
        if (!start) start = true;
        else break;
        continue;
    }
    if (start) result += line + "\n";
}

fs.writeFileSync("RELEASE.md", result.trim());