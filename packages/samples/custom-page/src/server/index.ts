import { InstallOptions, Plugin } from '@nocobase/server';

export class CustomPagePlugin extends Plugin {
  async afterAdd() { }

  async beforeLoad() { }

  async load() {}

  async install(options: InstallOptions) {
    // TODO
  }
}

export default CustomPagePlugin;
