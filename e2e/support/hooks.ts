import { BeforeSuite, AfterSuite } from 'gauge-ts';
import { ab } from './ab';

export default class Hooks {
  @BeforeSuite()
  async beforeSuite() {
    ab('open about:blank');
  }

  @AfterSuite()
  async afterSuite() {
    ab('close');
  }
}
