import { existsSync, readFileSync, writeFileSync } from "fs";

const clearModules = (filePath) => {
  if (existsSync(filePath)) {
    let fileContent = readFileSync(filePath, "utf8");
    fileContent = fileContent.replace(/require\s*\([\s\S]*?\)/, "");
    writeFileSync(filePath, fileContent, "utf8");
  } else {
    console.log("File does not exist.");
  }
};

clearModules("go.mod");
