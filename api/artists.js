/* eslint-disable func-names */
const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const artistsRouter = express.Router();

artistsRouter
  .param('artistId', (req, res, next, artistId) => {
    const sql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const values = { $artistId: artistId };
    db.get(sql, values, (err, artist) => {
      if (err) {
        next(err);
      } else if (artist) {
        req.artist = artist;
        next();
      } else {
        res.sendStatus(404);
      }
    });
  })
  .get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE is_currently_employed = 1;',
      (err, rows) => {
        if (err) {
          next(err);
        } else {
          res.status(200).send({ artists: rows });
        }
      });
  })
  .get('/:artistId', (req, res) => {
    res.status(200).json({ artist: req.artist });
  })
  .post('/', (req, res, next) => {
    const { name } = req.body.artist;
    const dob = req.body.artist.dateOfBirth;
    const bio = req.body.artist.biography;
    if (!name || !dob || !bio) {
      return res.status(400).send();
    }
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
    const sql = 'INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dob, $bio, $employed);';
    const values = {
      $name: name,
      $dob: dob,
      $bio: bio,
      $employed: isCurrentlyEmployed,
    };
    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Artist WHERE Artist.id = ${this.lastID};`,
          function (_err, artist) {
            res.status(201).json({ artist });
          });
      }
    });
  })
  .put('/:artistId', (req, res, next) => {
  //   const name = req.body.artist.name,
  //       dateOfBirth = req.body.artist.dateOfBirth,
  //       biography = req.body.artist.biography,
  //       isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  // if (!name || !dateOfBirth || !biography) {
  //   console.log(req.body);
  //   return res.sendStatus(400);
  // }

  // const sql = 'UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, ' +
  //     'biography = $biography, is_currently_employed = $isCurrentlyEmployed ' +
  //     'WHERE Artist.id = $artistId';
  // const values = {
  //   $name: name,
  //   $dateOfBirth: dateOfBirth,
  //   $biography: biography,
  //   $isCurrentlyEmployed: isCurrentlyEmployed,
  //   $artistId: req.params.artistId
  // };

  // db.run(sql, values, (error) => {
  //   if (error) {
  //     next(error);
  //   } else {
  //     db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
  //       (error, artist) => {
  //         res.status(200).json({artist: artist});
  //       });
  //   }
  // });
  const { name } = req.body.artist;
  const dob = req.body.artist.dateOfBirth;
  const bio = req.body.artist.biography;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
    if (!name || !dob || !bio) {
      res.sendStatus(400);
    } else {
      db.run(`UPDATE Artist SET name = $name, date_of_birth = $dob, biography = $bio, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = ${req.artist.id};`,
        {
          $name: name,
          $dob: dob,
          $bio: bio,
          $isCurrentlyEmployed: isCurrentlyEmployed,
        },
        (err) => {
          if (err) {
            next(err);
          }
          db.get(`SELECT * FROM Artist WHERE id = ${req.artist.id};`,
            (error, artist) => {
              if (error) {
                next(error);
              }
              res.status(200).json({ artist });
            });
        });
    }
  })
  .delete('/:artistId', (req, res, next) => {
    db.run(`UPDATE Artist SET is_currently_employed = 0 WHERE Artist.id = ${req.artist.id};`,
      (err) => {
        if (err) {
          next(err);
        }
        db.get(`SELECT * FROM Artist WHERE id =${req.artist.id};;`, 
          (error, artist) => {
            if (error) {
              next(error);
            }
            res.status(200).send({ artist });
          });
      });
  });

module.exports = artistsRouter;
