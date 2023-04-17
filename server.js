const Datastore = require('nedb')
const express = require("express")
const bodyParser = require('body-parser')
const app = express()
const PORT = 3000;
app.use(express.urlencoded({
    extended: true
}));

const path = require("path")
const hbs = require('express-handlebars');
app.set('views', path.join(__dirname, 'views'));  
app.set('view cache', false);   
app.disable('view cache');   
app.engine('hbs', hbs({ defaultLayout: 'main.hbs', 
helpers: {
    formatBool: (val) => {
        return val ? "Tak" : "Nie"
    },
    formatSelect: (val) => {
        return val ? "selected" : ""
    },
    eq: (a, b) => {
        return a==b
    },
    insideValue: (a, b) => {
        return a[b]
    }
}})); 
    let currentEdit = ""
app.set('view engine', 'hbs');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const cardb = new Datastore({
    filename: 'car.db',
    autoload: true
});
const options = ['ubezpieczony', 'benzyna', 'uszkodzony', 'naped4x4']
const select = [true, false]

let context = {}
app.get("/", function (req, res) {
    res.render('index.hbs', context);
})

app.get("/add", function (req, res) {
    res.render('add.hbs');
})

app.get("/edit", (req, res) => {
    currentEdit = req.query.id
    cardb.find({}, (err, docs) => {
        res.render("edit.hbs", {docs: docs, options: options, select: select, id: req.query.id})
    })
})
app.get("/edit/confirm", (req, res) => {
    console.log(req.query)
    const carDoc = {
        ubezpieczony: null,
        benzyna: null,
        uszkodzony: null,
        naped4x4: null 
    }
    for (let option in carDoc) {
        if(req.query[option] == '') carDoc[option] = null
        else req.query[option] == 'true' ? carDoc[option]=true : carDoc[option]=false
    }
    cardb.update({_id: currentEdit}, {$set: carDoc})
    cardb.find({}, (err, docs) => {
        res.render("edit.hbs", {data: docs, options: options, select: select, id: req.query.id})
    })
})
app.get("/list", function (req, res) {
    cardb.find({ }, function (err, docs) {
        console.log("----- sformatowany z wcięciami obiekt JSON: \n")
        console.log(JSON.stringify({ "docsy": docs }, null, 5))
        context = {docs: docs}
        res.render('list.hbs', context);
    })
})

app.post("/addCar", function (req, res) {
    let obj = { 
            ubezpieczony: req.body.ubezpieczony ? true : false,
            benzyna: req.body.benzyna ? true : false,
            uszkodzony: req.body.uszkodzony ? true : false,
            naped: req.body.naped ? true : false,
    }
    cardb.insert(obj, function (err, newDoc) {
        console.log("dodano dokument (obiekt):")
        console.log(newDoc)
        console.log("losowe id dokumentu: " + newDoc._id)
        context = {"id": "succesfuly added car with" + newDoc._id}
        res.render('add.hbs', context);
    });
})
app.get("/handleDelete", function (req, res) {
    cardb.remove({_id: req.query.id }, {  }, function (err, numRemoved) {
        console.log("usunięto dokumentów: ",numRemoved)
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Expires", "0");
        res.redirect(req.get('referer'));
    });
})

app.use(express.static('static'))
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})

