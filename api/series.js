const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const seriesRouter = express.Router();
const issuesRouter = require('./issues');

seriesRouter
  .param('seriesId', (req, res, next, id) => {
    const sql = 'SELECT * FROM Series WHERE id = $seriesId';
    const values = { $seriesId: id };
    db.get(sql, values, (err, series) => {
      if (err) {
        next(err);
      } else if (series) {
        req.series = series;
        next();
      } else {
        res.sendStatus(404);
      }
    });
  })
  .use('/:seriesId/issues', issuesRouter)
  .get('/', (req, res, next) => {
    db.all('SELECT * FROM Series;',
      (error, series) => {
        if (error) {
          next(error);
        }
        res.status(200).json({ series });
      });
  })
  .get('/:seriesId', (req, res) => {
    res.status(200).json({ series: req.series });
  })
  .post('/', (req, res, next) => {
    const { name } = req.body.series;
    const { description } = req.body.series;
    if (!name || !description) {
      return res.sendStatus(400);
    }
    const sql = 'INSERT INTO Series (name, description) VALUES ($name, $description)';
    const values = {
      $name: name,
      $description: description,
    };
    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${this.lastID};`, 
          (_err, series) => {
            res.status(201).json({ series });
          });
      }
    });
  })
  .put('/:seriesId', (req, res, next) => {
    const { name } = req.body.series;
    const { description } = req.body.series;
    if (!name || !description) {
      return res.sendStatus(400);
    }
    const sql = 'UPDATE Series SET name = $name, description = $description';
    const values = {
      $name: name,
      $description: description,
    };
    db.run(sql, values, (err) => {
      if (err) {
        next(err);
      }
      db.get(`SELECT * FROM Series WHERE id = ${req.series.id};`, 
        (error, series) => {
          if (error) {
            next(error);
          }
          res.status(200).json({ series });
        });
    });
  })
  .delete('/:seriesId', (req, res, next) => {
    db.all(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`,
      (err, issues) => {
        if (err) {
          next(err);
        } else if (issues.length === 0) {
          db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId};`,
            (err) => {
              if (err) {
                next(err);
              } else {
                  res.sendStatus(204);
              }
            });
        } else {
          res.sendStatus(400);
        }
      });
  });

module.exports = seriesRouter;
