const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const issuesRouter = express.Router({ mergeParams: true });

issuesRouter
  .param('issueId', (req, res, next, id) => {
    const sql = 'SELECT * FROM Issue WHERE id = $issueId';
    const values = {
      $issueId: id,
    };
    db.get(sql, values, (err, issue) => {
      if (err) {
        next(err);
      } else if (issue) {
        next();
      } else {
        res.sendStatus(404);
      }
    });
  })
  .get('/', (req, res, next) => {
    db.all('SELECT * FROM Issue WHERE series_id = $seriesId;', 
      {
        $seriesId: req.params.seriesId,
      },
      (err, issues) => {
        if (err) {
          next(err);
        } else {
          res.status(200).json({ issues });
        }
      });
  })
  .post('/', (req, res, next) => {
  const name = req.body.issue.name,
        issueNumber = req.body.issue.issueNumber,
        publicationDate = req.body.issue.publicationDate,
        artistId = req.body.issue.artistId;
  const artistSql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
  const artistValues = {$artistId: artistId};
  db.get(artistSql, artistValues, (error, artist) => {
    if (error) {
      next(error);
    } else {
      if (!name || !issueNumber || !publicationDate || !artist) {
        return res.sendStatus(400);
      }

      const sql = 'INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id)' +
          'VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)';
      const values = {
        $name: name,
        $issueNumber: issueNumber,
        $publicationDate: publicationDate,
        $artistId: artistId,
        $seriesId: req.params.seriesId
      };

      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`,
            (error, issue) => {
              res.status(201).json({issue: issue});
            });
        }
      });
    }
  });
})
  .put('/:issueId', (req, res, next) => {
    const { name } = req.body.issue;
    const { issueNumber } = req.body.issue;
    const { publicationDate } = req.body.issue;
    const { artistId } = req.body.issue;
    const artistSql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const artistValues = { $artistId: artistId };
    db.get(artistSql, artistValues, (err, artist) => {
      if (err) {
        next(err);
      } else {
        if (!name || !issueNumber || !publicationDate || !artist) {
          return res.sendStatus(400);
        }
        db.run('UPDATE Issue SET name = $name, issue_number = $issueNum, publication_date = $pubDate, artist_id = $artistId', {
          $name: name,
          $issueNum: issueNumber,
          $pubDate: publicationDate,
          $artistId: artistId,
        }, (err) => {
          if (err) {
            next(err);
          } else {
            db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId};`, (error, issue) => {
              console.log(req.params.issueId);
              res.status(200).json({ issue });
            });
          }
        });
      }
    });
  })
  .delete('/:issueId', (req, res, next) => {
    db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId};`,
      (err) => {
        if (err) {
          next(err);
        } else {
          res.sendStatus(204);
        }
      });
  });

module.exports = issuesRouter;
