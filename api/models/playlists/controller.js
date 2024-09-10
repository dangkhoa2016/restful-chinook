const ControllerBase = require('../../libs/controller-base');
const Helper = require('../../libs/db-helpers');
const tableName = 'playlists';
const controller = new ControllerBase(tableName);

controller.getTracks = async (req, res) => {
  const query = `
    SELECT tracks.* FROM tracks
    INNER JOIN playlists_tracks ON tracks.track_id = playlists_tracks.track_id
    WHERE playlists_tracks.playlist_id = ?
  `;
  const { status, result } = await Helper.getByRawQuery(query, [req.params.id]);

  res.status(status).json(result);
};
module.exports = controller;
