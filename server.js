var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
const sql = require('mssql');
var config = require('./config');

//bmw recall api call
app.get('/scrape/bmw/:id', function (req, res) {
    var url = `https://apps.www1.bmw.com.au/RecallDlForm/GetRecallInfoByVIN/?id=${req.params.id}&brandId=3`;
    request({ url: url, json: true }, function (error, response, data) {
        if (error) {
            res.status(500).send(error);
        }
        else {
            if (data) {
                //get the json data fore vehicle as an example
                var vehicle = data.VehicleDesc;

                //construct the temp table before insertion
                const table = new sql.Table('recalls');
                table.create = true;
                table.columns.add('name', sql.VarChar(500), { nullable: true });
                table.columns.add('model', sql.VarChar(500), { nullable: true });
                table.columns.add('year', sql.VarChar(500), { nullable: true });
                table.rows.add(vehicle.Brand, vehicle.Model, vehicle.Year);
                
                //commit records in bulk
                sql.connect(config.sql).then(pool => {
                    return pool.request().bulk(table, (dbErr, result) => {
                        if (!dbErr) {
                            res.status(200).send('added');
                        }
                        else {
                            res.status(500).send(dbErr);
                            console.log(dbErr);
                        }
                    });
                });
                sql.on('error', err => {
                    res.status(500).send(err);
                })
            }
            else {
                res.status(500).send(data);
            }
        }
    })
})

app.get('/scrape/nissan/:id', function (req, res) {
    var url = `http://www.nissan.com.au/owners/owner-information/takata-airbag-recall`;
    var postData = '';
    request({
        url: url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, function (error, response, html) {
        var $ = cheerio.load(html);

        var title, release, rating;
        var json = { title: "", release: "", rating: "" };

        $('body').filter(function () {
            // Let's store the data we filter into a variable so we can easily see what's going on.
            var data = $(this);
            res.send(data.text());
        })
    })
})

app.listen('9001')
console.log('Magic happens on port 9001');
exports = module.exports = app;