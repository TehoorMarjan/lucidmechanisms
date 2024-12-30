const fs = require("fs");
const slugify = require("slugify");
const path = require("path");
const exec = require("child_process").exec;

// Get the title from the command line arguments
const title = process.argv[2];
if (!title) {
  console.error("Please provide a title for the new article.");
  process.exit(1);
}

// Get the current date in YYYY-MM-DD format
const date = new Date().toISOString().split("T")[0];

// Create the folder name by combining the date and slugified title
const folderName = `${date}-${slugify(title, { lower: true })}`;

// Define the paths
const assetsPath = path.join(
  process.cwd(),
  `./assets/images/posts/${folderName}`,
);
const enContentPath = path.join(
  process.cwd(),
  `./content/en/posts/${folderName}`,
);
const frContentPath = path.join(
  process.cwd(),
  `./content/fr/posts/${folderName}`,
);
const indexPath = path.join(enContentPath, "index.md");

// Create the necessary folders
fs.mkdirSync(assetsPath, { recursive: true });
fs.mkdirSync(enContentPath, { recursive: true });
fs.mkdirSync(frContentPath, { recursive: true });

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
    fs.readFile(indexPath, "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading index.md: ${err.message}`);
        return;
      }

      const result = data.replace(/title = '.*'/, `title = '${title}'`);

      fs.writeFile(indexPath, result, "utf8", (err) => {
        if (err) {
          console.error(`Error writing index.md: ${err.message}`);
          return;
        }

        console.log("Title updated successfully.");
      });
    });
  },
);
