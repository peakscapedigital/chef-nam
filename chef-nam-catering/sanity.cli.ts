import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'yojbqnd7',
    dataset: 'production'
  },
  /**
   * Deployment configuration for Sanity Studio.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  deployment: {
    appId: 'trzzw31ianj1x74wbakzgl1r',
    autoUpdates: true,
  },
})
