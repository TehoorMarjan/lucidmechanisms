import { mkdirSync, readFile, writeFile } from "fs";
import slugify from "slugify";
import { join } from "path";
import { exec } from "child_process";

// Get the title from the command line arguments
const title = process.argv[2];
if (!title) {
  console.error("Please provide a title for the new article.");
  process.exit(1);
}

// Get the current date in YYYY-MM-DD format
const date = new Date().toISOString().split("T")[0];

// Create the folder name by combining the date and slugified title
const slugName = `${slugify(title, { lower: true })}`;
const folderName = `${date}-${slugName}`;

// Define the paths
const assetsPath = join(process.cwd(), `./assets/images/posts/${folderName}`);
const enContentPath = join(process.cwd(), `./content/en/posts/${folderName}`);
const frContentPath = join(process.cwd(), `./content/fr/posts/${folderName}`);
const indexPath = join(enContentPath, "index.md");

// Create the necessary folders
mkdirSync(assetsPath, { recursive: true });
mkdirSync(enContentPath, { recursive: true });
mkdirSync(frContentPath, { recursive: true });

// Call hugo to create the new content
exec(
  `hugo new content content/en/posts/${folderName}/index.md`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating new content: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }

    console.log(stdout);

    // Replace the title in the index.md file
    readFile(indexPath, "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading index.md: ${err.message}`);
        return;
      }

      const result = data
        .replace(/title = '.*'/, `title = '${title}'`)
        .replace(/slug = '.*'/, `slug = '${slugName}'`);

      writeFile(indexPath, result, "utf8", (err) => {
        if (err) {
          console.error(`Error writing index.md: ${err.message}`);
          return;
        }

        console.log("Title updated successfully.");
      });
    });
  },
);
