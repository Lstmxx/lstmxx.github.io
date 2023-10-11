const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "./");

const targetDir = ["二叉树", "动态规划", "算法实现", "链表", "面试经典150题"];

const baseURL = "/leetcode";
const run = () => {
  targetDir.forEach(async (dir) => {
    const dirPath = path.join(p, dir);
    const files = fs.readdirSync(dirPath);

    let content = `---\r\ntitle: ${dir}\r\n---\r\n`;
    const targetPath = path.join(dirPath, "index.md");
    files.forEach(async (file) => {
      if (file !== "index.md") {
        if (file.includes(" ")) {
          const oldPath = path.join(dirPath, file);
          file = file.replace(/\s/g, "");
          const newPath = path.join(dirPath, file);
          fs.rename(oldPath, newPath, (err) =>
            err ? console.log(err) : console.log("success")
          );
        }
        const last = file.lastIndexOf(".");
        file = file.slice(0, last);
        content += `[${file}](${baseURL}/${dir}/${file})\r\n`;
        console.log(`${baseURL}/${dir}/${file}`);
      }
    });
    fs.writeFile(targetPath, content, (err) =>
      err ? console.log(err) : console.log("success")
    );
  });
};

run();
