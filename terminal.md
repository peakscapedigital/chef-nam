(base) ➜  Workspace cd nam-website
(base) ➜  nam-website git:(main) ✗ cd chef-nam-catering
(base) ➜  chef-nam-catering git:(main) ✗ node -v

v23.4.0
(base) ➜  chef-nam-catering git:(main) ✗ command -v nvm || echo "nvm not found"
nvm not found
(base) ➜  chef-nam-catering git:(main) ✗ npx sanity deploy
✓ Checking project info
? Select existing studio hostname chef-nam-catering
ℹ Building with auto-updates enabled
✓ Clean output folder (6ms)
⠦ Build Sanity Studio
(base) ➜  chef-nam-catering git:(main) ✗ node -v
v23.4.0
(base) ➜  chef-nam-catering git:(main) ✗ nvm install 20
zsh: command not found: nvm
(base) ➜  chef-nam-catering git:(main) ✗ brew install nvs
==> Downloading https://formulae.brew.sh/api/formula.jws.json
==> Downloading https://formulae.brew.sh/api/cask.jws.json
==> Caveats
NVS installs all Node.js versions to ~/.nvs by default.
To change this behavior, remove ~/.nvs and make the
following modification to your shell profile:
  export $NVS_HOME=/your/preferred/location

==> Downloading https://github.com/jasongin/nvs/archive/refs/tags/v1.7.1.tar.gz
==> Downloading from https://codeload.github.com/jasongin/nvs/tar.gz/refs/tags/v
##=O#- #                                                                        
==> Installing Cask nvs
==> Running installer script 'nvs-1.7.1/homebrew/install.sh'
Downloading bootstrap node from https://nodejs.org/dist/v16.20.2/node-v16.20.2-darwin-arm64.tar.xz
######################################################################### 100.0%

~/.zshrc += nvs.sh
🍺  nvs was successfully installed!
==> No outdated dependents to upgrade!
(base) ➜  chef-nam-catering git:(main) ✗ export NVS_HOME="$HOME/.nvs"
. "$(brew --prefix nvs)/nvs.sh"
Error: No available formula with the name "nvs". Did you mean nvm, nvi, nvc, nss, ngs or cvs?
.: no such file or directory: /nvs.sh
(base) ➜  chef-nam-catering git:(main) ✗ brew install node@20
Warning: node@20 20.19.4 is already installed and up-to-date.
To reinstall 20.19.4, run:
  brew reinstall node@20
(base) ➜  chef-nam-catering git:(main) ✗ node -v
which node
v23.4.0
/opt/homebrew/bin/node
(base) ➜  chef-nam-catering git:(main) ✗ brew unlink node
brew link node@20 --force --overwrite
Unlinking /opt/homebrew/Cellar/node/23.4.0... 62 symlinks removed.
Linking /opt/homebrew/Cellar/node@20/20.19.4... 1957 symlinks created.

If you need to have this software first in your PATH instead consider running:
  echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
(base) ➜  chef-nam-catering git:(main) ✗ export PATH="/opt/homebrew/opt/node@20/bin:$PATH"   # Apple Silicon
# or for Intel Macs:
# export PATH="/usr/local/opt/node@20/bin:$PATH"
(base) ➜  chef-nam-catering git:(main) ✗ source ~/.zshrc
node -v
v20.19.4
(base) ➜  chef-nam-catering git:(main) ✗ rm -rf node_modules .sanity build
npm install
npx sanity@latest build

added 1311 packages, and audited 1312 packages in 8s

264 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
ℹ Building with auto-updates enabled
✓ Clean output folder (11ms)
✓ Build Sanity Studio (1523ms)
(base) ➜  chef-nam-catering git:(main) ✗ npx sanity@latest -v
npx sanity@latest whoami
@sanity/cli version 4.5.0
usage: npx sanity [--default] [-v|--version] [-d|--debug] [-h|--help] <command> [<args>]

Commands:
   backup      Manage backups.
   blueprints  Deploy and manage Sanity Blueprints and Stacks (IaC)
   build       Builds the Sanity Studio configuration into a static bundle
   codemod     Updates Sanity Studio codebase with a code modification script
   cors        Configures CORS settings for Sanity projects
   dataset     Manages datasets, like create or delete, within projects
   debug       Provides diagnostic info for Sanity Studio troubleshooting
   deploy      Builds and deploys Sanity Studio or application to Sanity hosting
   dev         Starts a local dev server for Sanity Studio with live reloading
   docs        Search, read, and browse Sanity documentation
   documents   Manages documents in your Sanity Content Lake datasets
   exec        Executes a script within the Sanity Studio context
   functions   Manage, test, and observe Sanity Functions
   graphql     Deploys changes to your project's GraphQL API(s)
   help        Displays help information about Sanity CLI commands
   hook        Sets up and manages webhooks within your Sanity project
   init        Initializes a new Sanity Studio and/or project
   install     Installs dependencies for Sanity Studio project
   learn       Opens Sanity Learn in your web browser
   login       Authenticates the CLI for access to Sanity projects
   logout      Logs out the CLI from the current user session
   manage      Opens project management interface in your web browser
   manifest    Interacts with the studio configuration.
   migration   Manages content migrations for Content Lake datasets
   openapi     List, browse, and retrieve Sanity OpenAPI specifications
   preview     Starts a server to preview a production build of Sanity Studio
   projects    Manage Sanity projects - list, create
   schema      Interacts with Sanity Studio schema configurations
   start       Alias for `sanity preview`
   telemetry   Manages telemetry settings, opting in or out of data collection
   tokens      Manages API tokens for Sanity projects
   typegen     Beta: Generate TypeScript types for schema and GROQ
   undeploy    Removes the deployed Sanity Studio from Sanity hosting
   users       Manages users of your Sanity project
   versions    Shows installed versions of Sanity Studio and components

See 'npx sanity help <command>' for specific information on a subcommand.

