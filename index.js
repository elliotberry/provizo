#!/usr/bin/env node

const argv = require("yargs").argv;
const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;

//Walk dir and find js files
async function findInDir(dir = __dirname, filter, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(filePath);

        if (fileStat.isDirectory() && filePath !== "node_modules") {
            findInDir(filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

async function findEm(dir) {
    let filez = await findInDir(dir, /\.js$/);
                let data = await Promise.all(filez.map(item => readFile(item)));
                return data;
}

async function start() {
    var install = false;
    var directory = "./";
    if (argv._.length > 0) { //If we have arguments

        if (argv._.join(" ").indexOf("-h") > -1) { //If user asks for help.
            console.log("No directory or file specified, running in current directory. -i installs automatically with npm.");
        }
        else { //If these are arguments we need to process normally

        if (argv._.join(" ").indexOf("-i") > -1) {
            install = true;
        }
        
        if (fs.existsSync(argv._[0])) {
            if (argv._[0].indexOf(".js" > -1)) {
                let data = await readFile(argv._[0]);
            } else {
                directory = argv._[0];
            }
        } else {
            throw "Not a file or folder";
        }
    
    } else {
        console.log("No directory or file specified, running in current directory");
    }
    let data = await findEm(directory);
    let g = data.join("\n"); //make a big blob of js
    let u = await processFileContent(g); //Extract requirements from them
    if (install == true) {
    console.log("installing modules");
    exec(u[0], (e, stdout, stderr) => {
        if (e instanceof Error) {
            console.error(e);
            throw e;
        }
        console.log("stdout ", stdout);
        console.log("stderr ", stderr);
    });
    }
    else {
        console.log("modules needed: " + u[1]);
    }
}

const readFile = async function(file) {
    let contents = fs.readFileSync(file, "utf8");
    return contents;
};

const removeAll = string => {
    return string.replace(/[.*+?'"^${}()|[\]\\]/g, "");
};

function processFileContent(data) {
    let y = data.split("require(");
    y.shift();

    let newArr = [];
    y.forEach(function(item) {
        let r = item.split(")");
        let y = removeAll(r[0]);
        newArr.push(y);
    });
    let pkgs = newArr.join(" ");
    let cmdStr = "npm install " + pkgs;
    return [cmdStr, pkgs];
}
start();