#!./node_modules/.bin/nscript
/* To run this script, nscript is needed: [sudo] npm install -g nscript
/* Publish.js, publish a new version of the npm package as found in the current directory */
module.exports = function (shell, npm, git) {
    var pkg = JSON.parse(shell.read('package.json'));

    npm("run", "build");

    // Bump version number
    var currentVersion = pkg.version;
    var nextVersion = getNextVersion(currentVersion);

    var version = pkg.version = shell.prompt("Please specify the new package version of '" + pkg.name + "' (Ctrl^C to abort)", nextVersion);
    if (!version.match(/^\d+\.\d+\.\d+$/))
        shell.exit(1, "Invalid semantic version: " + version);

    //Check registery data
    if (npm.silent().test("info", pkg.name)) {
        //package is registered in npm?
        var publishedPackageInfo = JSON.parse(npm.get("info", pkg.name, "--json"));
        if (publishedPackageInfo.versions == version || publishedPackageInfo.versions.indexOf(version) != -1)
            shell.exit(2, "Version " + pkg.version + " is already published to npm");

        shell.write('package.json', JSON.stringify(pkg, null, 2));

        npm("publish");
        console.log("Published version " + version);
        git("commit", "-am", "Published version " + version);
        git("push", "origin", version);
        git("checkout", "master");
        git("merge", version);
        git("tag", "v" + version);
        git("push", "origin", "master");
        git("push", "--tags");
        var _nextVersion = getNextVersion(version);
        git("checkout", "-b", _nextVersion);
        console.log("git over!");
    }
    else
        shell.exit(1, pkg.name + " is not an existing npm package");
};


function getNextVersion(currentVersion) {
    var versionNumber = currentVersion.replace(/\./g, '');
    versionNumber = parseInt(versionNumber);
    var nextVersionNum = versionNumber + 1;
    if (nextVersionNum < 100) {
        nextVersionNum = "0" + nextVersionNum
    } else {
        nextVersionNum = "" + nextVersionNum
    }

    var nextVersionArr = nextVersionNum.split('');

    return nextVersionArr.join(".")
}