'use strict';

// Every skill a Spiral Review test can use, keyed by id. A skill is (rng, params) -> cell.
module.exports = {
  ...require('./skillsNum').skills,
  ...require('./skillsFrac').skills,
  ...require('./skillsWord').skills,
  ...require('./skillsGeo').skills,
  ...require('./skillsVol').skills,
  ...require('./skills4').skills,
};
