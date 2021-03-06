const fs   = require('fs');
const os   = require('os');
const path = require('path');
const log  = require('electron-log');

/*
** returns nix config folder
*/
function findCookiePath() {

  var homeDir = os.homedir ? os.homedir() : process.env['HOME'];

  var dir,
      appName = 'nix';

  switch (process.platform) {
    case 'linux': {
      dir = prepareDir(homeDir, '.' + appName.toLowerCase()).result;
      break;
    }

    case 'darwin': {
      dir = prepareDir(homeDir, 'Library', 'Application Support', appName).result;
      break;
    }

    case 'win32': {
      dir = prepareDir(process.env['APPDATA'], appName)
           .or(homeDir, 'AppData', 'Roaming', appName).result;
      break;
    }
  }

  if (dir) {
    return dir;
  } else {
    return false;
  }
}

/*
** directory resolver
*/
function prepareDir(dirPath) {
  // jshint -W040
  if (!this || this.or !== prepareDir || !this.result) {
    // if dirPath couldn't be resolved
    if (!dirPath) {
      // return this function to be chained with .or()
      return { or: prepareDir };
    }

    //noinspection JSCheckFunctionSignatures
    dirPath = path.join.apply(path, arguments);
    mkDir(dirPath);

    try {
      fs.accessSync(dirPath, fs.W_OK);
    } catch (e) {
      // return this function to be chained with .or()
      return { or: prepareDir };
    }
  }

  return {
    or: prepareDir,
    result: (this ? this.result : false) || dirPath
  };
}

/*
** create a directory
*/
function mkDir(dirPath, root) {
  var dirs = dirPath.split(path.sep);
  var dir = dirs.shift();
  root = (root || '') + dir + path.sep;

  try {
    fs.mkdirSync(root);
  } catch (e) {
    if (!fs.statSync(root).isDirectory()) {
      throw new Error(e);
    }
  }

  return !dirs.length || mkDir(dirs.join(path.sep), root);
}

/*
** returns the current RPC cookie
** RPC cookie is regenerated at every nixd startup
*/
function getAuth(options) {

  if (options.rpcuser && options.rpcpassword) {
    return options.rpcuser + ':' + options.rpcpassword;
  }

  let auth;
  var dataDir = options.datadir ? options.datadir : findCookiePath();
  const COOKIE_FILE = dataDir
                    + (options.testnet ? '/testnet3' : '')
                    + '/.cookie';

  if (fs.existsSync(COOKIE_FILE)) {
    auth = fs.readFileSync(COOKIE_FILE, 'utf8').trim();
  } else {
    auth = undefined;
    log.debug('could not find cookie file! path:', COOKIE_FILE);
  }

  return (auth)
}

exports.getAuth = getAuth;
exports.findCookiePath = findCookiePath;
