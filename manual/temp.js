var dbHelpers = require('./api/libs/db-helpers');

var result = await dbHelpers.create('albums', { 
  title: 'The Colors',
  artist_id: 1
});

console.log(result);
