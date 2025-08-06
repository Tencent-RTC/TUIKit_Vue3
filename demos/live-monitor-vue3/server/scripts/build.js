const fs = require('fs-extra');
const childProcess = require('child_process');

/**
 * Start
 */
(async () => {
  try {
    // Remove current build
    await remove('./dist/');

    // Copy necessary files for deployment
    await copy('./package.json', './dist/src/package.json');
    await copy('./config/', './dist/src/config/');
    await copy('./src/', './dist/src/src/');
    await copy('./package.prod.json', './dist/src/package.json');
    await copy('./scf_bootstrap', './dist/src/scf_bootstrap');

    console.log('Build completed successfully!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

/**
 * Remove file
 */
function remove(loc) {
  return new Promise((res, rej) => {
    return fs.remove(loc, err => {
      return !!err ? rej(err) : res();
    });
  });
}

/**
 * Copy file.
 */
function copy(src, dest) {
  return new Promise((res, rej) => {
    return fs.copy(src, dest, err => {
      return !!err ? rej(err) : res();
    });
  });
}

/**
 * Do command line command.
 */
function exec(cmd, loc) {
  return new Promise((res, rej) => {
    return childProcess.exec(cmd, { cwd: loc }, (err, stdout, stderr) => {
      if (!!stdout) {
        console.log(stdout);
      }
      if (!!stderr) {
        console.warn(stderr);
      }
      return !!err ? rej(err) : res();
    });
  });
}
