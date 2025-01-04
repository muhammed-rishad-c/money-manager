import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "*****",
    password: "*******",
    port: 5432,
});


db.connect();


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public/uploads');
        //console.log(`Uploading to: ${uploadPath}`);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + path.extname(file.originalname);
        //console.log(`Generated filename: ${filename}`);
        cb(null, filename);
    }
});


const upload = multer({ storage: storage });


async function housePeople(){
    let member=[{
        name:"",
        photo:"",
        id:""
    }]
    const people=await db.query("select * from userdetail ")
    const detail=people.rows;
    //console.log(detail);
    
    detail.forEach(element => {
    member.push({name:element.name,photo:element.photo,id:element.id})
    });
    member.shift();
    //console.log(member);
    return member;
}


async function namesDetail() {
    let names=[];
    const people=await db.query("select name from userdetail")
    const detail=people.rows;
    detail.forEach(element=>{
        names.push(element);
    })
    //console.log(names);
    return names;
}


async function money(id) {
    let user=[{
        name:"",
        photo:'',
        id:""
    }]
    const people=await db.query("select * from userdetail where id=$1",[id])
    const detail=people.rows;
    user.push({name:detail[0].name,photo:detail[0].photo,id:detail[0].id});
    //console.log(detail[0]);
    user.shift();
    //console.log(user);
    return user;
}


async function getMoney(name) {
    let getmoney=[];
    let sum=0;
    
    const amount = await db.query("SELECT amount FROM borrow WHERE paisakaran=$1", [name]);
    const amountget=amount.rows;
    //console.log(amountget);
    
    if(amountget.length>0){
        amountget.forEach(x=>{
            getmoney.push(x.amount);
        }) 
        //console.log(getmoney);
        getmoney.forEach(x=>{
            sum=sum+x;
        })
        //console.log(sum);
        return sum;
        
               
    }else{
        return 0;
    }
}


async function toMoney(name) {
    let getmoney=[];
    let sum=0;
    
    const amount = await db.query("SELECT amount FROM borrow WHERE kadakaran=$1", [name]);
    const amountget=amount.rows;
    //console.log(amountget);
    
    if(amountget.length>0){
        amountget.forEach(x=>{
            getmoney.push(x.amount);
        }) 
        //console.log(getmoney);
        getmoney.forEach(x=>{
            sum=sum+x;
        })
        //console.log(sum);
        return sum;
    }else{
        return 0;
    }
}


async function givemoney(params) {
    const detail =await db.query("SELECT * FROM borrow WHERE paisakaran = $1 ",[params])
    const detailgive=detail.rows;
    //console.log(detailgive);
    return detailgive;
}


async function tomoney(params) {
    const detail =await db.query("SELECT * FROM borrow WHERE kadakaran = $1 ",[params])
    const detailgive=detail.rows;
    //console.log(detailgive);
    return detailgive;
}


async function deleteList(id){
    const detail=await db.query("delete from borrow where id=$1",[id]);
    if(detail){
        return true
    }
}


app.get('/', async(req, res) => {
    const people=await housePeople();
    //console.log(people);
    
    res.render("index.ejs",{detail:people});
});


app.get("/new",(req,res)=>{
    res.render("member.ejs")
})


app.post('/member', upload.single('photo'), async (req, res) => {
    const { name } = req.body;
    const photo = req.file ? req.file.filename : null;
    try {
        if (!photo) {
            throw new Error('File upload failed. Photo field is null.');
        }
        const query = 'INSERT INTO userdetail (name, photo) VALUES ($1, $2)';
        const values = [name, photo];
        await db.query(query, values);
        
       res.redirect('/');
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send(`Error saving data: ${err.message}`);
    }
});


app.get("/cash-deal",async(req,res)=>{
    const detail=await namesDetail();
    //console.log(detail);
    res.render("cash-deal.ejs",{name:detail})
})


app.post("/cash-deal",async(req,res)=>{
    //console.log(req.body);
    const {money}=req.body;
    const {date}=req.body;
    console.log(money,date);
    const paisakaran=req.body.dropdown1;
    const kadakaran=req.body.dropdown2;
    console.log(paisakaran,kadakaran);
    console.log(req.body);
    
    const query = 'INSERT INTO borrow (paisakaran, kadakaran,date,amount) VALUES ($1, $2,$3,$4)';
    const values = [paisakaran, kadakaran,date,money];
    await db.query(query, values);
    res.redirect('/')
})


app.get('/edit/:id',async(req,res)=>{
    const id=req.params.id;
    const user=await money(id);
    //console.log(user);
    const name=user[0].name;
    const get=await getMoney(name);
    const to=await toMoney(name);
    res.render("money-detail.ejs",{user:user[0],toget:get,togive:to})
})


app.get('/moredetailget/:name',async(req,res)=>{
    //console.log(req.params.name);
    const name=req.params.name;
    const detail=await givemoney(name);
    res.render("moneytable.ejs",{data:detail})
})


app.get('/moredetailgive/:name',async(req,res)=>{
    //console.log(req.params.name);
    const name=req.params.name;
    const detail=await tomoney(name);
    res.render("moneytable.ejs",{data:detail})
})


app.get("/action/:id/:name",async(req,res)=>{
    const id=req.params.id;
    const name=req.params.name;
    const result=await deleteList(id);

    res.redirect(`/moredetailget/${name}`)
})


app.listen(port, () => {
    console.log("Server running successfully on port", port);
});
