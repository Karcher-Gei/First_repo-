import * as migration_20261027_191758_initial from './20261027_191758_initial';
import * as migration_20261027_194320_homepage_blocks from './20261027_194320_homepage_blocks';

export const migrations = [
  {
    up: migration_20261027_191758_initial.up,
    down: migration_20261027_191758_initial.down,
    name: '20261027_191758_initial',
  },
  {
    up: migration_20261027_194320_homepage_blocks.up,
    down: migration_20261027_194320_homepage_blocks.down,
    name: '20261027_194320_homepage_blocks'
  },
];
