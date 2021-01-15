

// A45Server

"use strict";

var sql = require("msnodesqlv8");   
 
s("environment variables are being checked..."); 
 
 var p = {};
 p.server = process.env.A45Server;
 p.user = process.env.A45User;
 p.pass = process.env.A45Pass;
 p.driver = process.env.A45Driver;
 p.base = process.env.A45Database;
 p.mode = process.env.A45Mode;   
 p.display = process.env.A45Display; 
 // in production: set variable to 'p'.
 if (process.env.A45Port === 'p') {
 
    p.port = process.env.port || 1337; // ms docs
    console.log('using production port: ' + p.port); 

 } else { 
    
    p.port = process.env.A45Port;
    console.log('using test port: ' + p.port); 

 }
 p.private = process.env.A45Private; 
 p.eId = process.env.A45AdminId;
 p.ePw = process.env.A45AdminPassword;
 p.promo = process.env.A45PromotionCode;
 p.emailList = process.env.A45EmailList;
 p.bypassToken = process.env.A45BypassToken;
 p.mode = process.env.A45Mode; 
 
 var haveToStop = false;
for(var a in p) {
    if(p[a] === undefined) {
        console.log("A45server1: Environment variable for " + a +  " is undefined.");
        haveToStop = true;
    }
}
if(haveToStop === true ) {
    console.log("A45server1: Stopping...");
    return;
}
 
if(p.mode === 'Test' || p.mode === 'Prod' ) { 
    // ok
} else {
    console.log("A45server1: Stopping...mode incorrect." + p.mode + '.');
    return;
}


if(p.bypassToken === 'Yes' || p.bypassToken === 'No' ) { 
    // ok
} else {
    console.log("A45server1: Stopping..bypassToken incorrect.");
    return;
}
 

if (p.mode === "Test") {
    for(var a in p) {
        console.log("variable " + a + " is " + p[a] + ".");
    }
}
 
// activate oprational displays in test mode.
var debug = (p.display === 'y' || p.display === 'Y');

function s(value) {

    // show only in test mode.

    if(debug) {

       var theTime = getTime();
       console.log(theTime + value);
    }
}

function getTime() {

    var d = new Date();
    var v = (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear();
    var u = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    var t = ' ' + v + ' ' + u + ' ';
    return t;
}
 
s("variables present...connecting"); 
s("A45 Server(1) started on port " + p.port + "using database: " + p.base );
console.log(p.mode + ' ' + ' is operating mode.');  
s("=================================");


var connectionString = "not set";
var mode = p.mode;

switch(mode) {
    case "Prod":  

        var semi = ";";

        connectionString = 
        "Driver={ODBC Driver 13 for SQL Server}" + semi + 
        "Authentication=SqlPassword" + semi +
        "Server=" + p.server + semi +
        "Database=" +  p.base + semi +
        "Uid=" + p.user + semi +
        "Pwd={" + p.pass + "}" + semi +
        "Encrypt=yes" + semi + 
        "TrustServerCertificate=no" + semi +
        "Connection Timeout=30" + semi;
        
        break;

    case "Test":

            
        connectionString = 
        "Driver=" + p.driver + ";Database=" + p.base  + ";Connect Timeout=30;"; 
        connectionString = connectionString +  "User=" + p.user +  ";Password=" + p.pass + ";";
        connectionString = connectionString +  "Server={" + p.server + "};";
        connectionString = connectionString +  "Trusted_Connection=yes";

        break;

    default:

        connectionString = "Mode not set";
        break;

}


  

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');  
var jwt = require('jsonwebtoken');
var e = require("express"); 
 

var helmet = require('helmet');  
app.use(helmet())

app.use(cors());
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());  
 
var query = "not used"; 

// middleware - check return token.  Only use on path listed which change state. 
var routeList = [ '/add', 
                  '/addClaim' , 
                  '/update',  
                  '/stampAdjustedClaim', 
                  '/setClaimStatus',
                  '/resetPassword', 
                  '/resetCustomerId',
                  '/updatePlan']; 

app.use( routeList , function(req, res, next) {  


    // is it bypassed ?
    if(process.env.A45BypassToken === "Yes") {
        s("A45 - token check is bypassed at request.");
        next();
    }

    // verify a token symmetric
    s('A45 - checking underway');  
    var token = req.body["_csrf"];  

    // is it there?
    if(token === null || token === undefined) {
        s("A45 Token null/undef");
        s("A45: Test Mode passthru.");
        //next();
         res.sendStatus(403);  
    } 

    // Is it valid?
    s("A45 token:" + token);
    // sync call
    try {

        // will check against secret.
        var payload = jwt.verify(token, process.env.A45Private); 
        s('OK TOKEN');
        //s("A45 successful verify:")
        //s("A45 payload:" + payload);

    } catch(Err) {

        s("A45: ****** verify fails **** for token.");
        s("A45: message is: " + Err.message);  
        return;
        // produces a 403 without explicit coding.
        //next();

    }   
    
    next();
 
 }); 

 // start up
s("A45server listening on port:" + p.port);
app.listen(p.port); 
 
// straight test
app.get('/', function(req,res) {

        s('ack test message.')
        res.status(200);
        var html = '<h2 style="color:blue;"> This is a test. </h2>';
        res.send(html);

});


// show error
function showError(message, resMessage, arrMessages,res,err) {

    s('a40 - server - error issued');
    s(message);
    res.status(500);
    res.send(resMessage); 
    for(var i = 0; i < err.length; i++) {
        var m = err[i];
        s(m);
    }
    return;
}
 

app.get('/readPlans', function(req,res) { 


    
console.log('debug only ' + connectionString);
   
    var plans = []; 

    var message = null;  
    s('reading plans.') 
    
    sql.open(connectionString, function(err,con) {  

        if(err) { 

            console.log('dumpping err....');
            for(var a in err) {
                console.log('error object: property ' + a + " = " + err[a]);
            }
            
            showError("a40 - server - failed to connect. "
        , "server error",[connectionString],res,err);return; }; 

        /* output - output parms */
        /* results - result set from procedure */

        var pm = con.procedureMgr();
        pm.callproc('[dbo].[ReadPlans]', 
                     [], 
                     function(err,results, output) {

            if(err) {  
                s('read plan error: ' + err.message)
                showError('a40 - server - plan read fails: ' + err.message,
                'server error',['read plan'],res,err);
                return;
            }  
            var data = results[0];  
            var code = output[0]; 
            s('read plan :procedure return code:' + code);
            if(data == null || code !== 0) {  
                res.status(code);
                res.send(null);   
                return;
            }
            var plans = [];  
            for(var i = 0; i < results.length; i++) {
                var planRow = results[i]; 
                plans.push(planRow); 
            }
 
            s(plans.length + ' plans found.');  
            res.status(200);
            res.send(plans);   
            return;

        });

    });
    
});
  


app.get('/readServices', function(req,res) { 

var services = [];
 
 
var plans = []; 

var message = null; 
var id = req.query.id;
s('reading services.') 

sql.open(connectionString, function(err,con) { 
  

    if(err) { showError("a40 - server - failed to connect: " + err.message  
    , "server error",[connectionString],res,err);return; }; 

    var pm = con.procedureMgr();
    pm.callproc('[dbo].[ReadServices]', 
                 [], 
                 function(err,results, output) {

        if(err) {  
            s('read service error: ' + err.message)
            showError('a40 - server - service read fails: ' + err.message,
            'server error',['read service'],res,err);
            return;
        }  
       
        var data = results[0];  
        var code = output[0]; 
        s('read service :procedure return code:' + code);
        if(data == null || code !== 0) {  
            res.status(code);
            res.send(null);   
            return;
        }

        var services = []; 
        // skip header row start at 1.
        for(var i = 0; i < results.length; i++) {
            var serviceRow = results[i]; 
            services.push(serviceRow); 
        }

        s(services.length + ' services found.');  
        res.status(200);
        res.send(services);   
        return;

    });

   });

});
 

// read environment
app.get('/readenvironment', function(req,res) { 

    //TODO: handle not found condition 
    s('reading environment.'); 

    var c = process.env.A45PromotionCode;
    var i = process.env.A45AdminId;
    var p = process.env.A45AdminPassword;
    var Environment = {AdmId: i, AdmPassword: p, PromotionCode: c}; 
 
    s("read environment: ");
    s(Environment.PromotionCode);
    
    res.status(200);
    res.send(Environment);  
    
});
 

function collectToken() {
 
    s('function get token'); 
    //
    var payload = "A45 payload"; 
    // signed token sync 
    var signedToken = jwt.sign(payload, process.env.A45Private).toString();
    var send = { A45Object : {id: 'A45', token: signedToken } };
    var json = JSON.stringify(send);
    return json; // return string json token.

}

// signin admin and get token once authenticated. 
app.get('/adminSignin', function(req,res) {

    // edit adm and pw
    var id = req.query.id;
    var pw = req.query.pw;

    // check administration id 
    if(id === null || id === undefined || id.length === 0 || id !== process.env.A45AdminId) { 
        res.status(200);
        var regObject = {Status: 'Unsuccessful', Message: 'Invalid Adminstration Id.', Token: null, Customer: null };
        var json = JSON.stringify(regObject);
        res.send(json);  
        return;
    }

    // check password
    if(pw === null || pw === undefined || pw.length === 0 || pw !== process.env.A45AdminPassword) { 
        res.status(200);
        var regObject = {Status: 'Unsuccessful', Message: 'Invalid Password.', Token: null, Customer: null };
        var json = JSON.stringify(regObject);
        res.send(json);  
        return;
    }

    // valid administration signin.
    res.status(200);
    var token = collectToken();  
    var regObject = {Status: 'Successful', Message: 'OK', Token: token, Customer: null};
    var json = JSON.stringify(regObject);
    res.send(json);  
    return;

}); 
 
 
app.get('/cust', function(req,res) { 

    // used for cust lookup only
     
    var message = null; 
    var id = req.query.id;
    s('reading cust.') 
    
    sql.open(connectionString, function(err,con) {

      

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; }; 

        var pm = con.procedureMgr();
        pm.callproc('[dbo].[ReadCustomer]', 
                     [id], 
                     function(err,results, output) {

            if(err) {  
                s('read cust error: ' + err.message)
                showError('a40 - server - cust read fails: ' + err.message,
                'server error',['read customer'],res,err);
                return;
            }  
            var cust = results[0];
            if(cust  == null) {
                s('customer: null  result returned'); 
                var regObject = {Status: 'Unsuccessful', Message: 'Customer not found.', Token: null, Customer: null };
                var json = JSON.stringify(regObject);
                res.status(200);
                res.send(json);   
                return;
            }
            
            // check edit failure for dup or non-existing from custId. 
            var returnCode = output[0];
            // OK , Duplicate, Missing will be output.
            var result = { code: 0, message: '' };
            s('read customer:procedure return code:' + output[0]);
            result.code = returnCode;
            if(result.code !== 0) { 

                s('customer: result code not zero. it:' + result.code); 
                var regObject = {Status: 'Unsuccessful', Message: 'Customer not found.' + result.code, Token: null, Customer: null };
                var json = JSON.stringify(regObject);
                res.status(200);
                res.send(json);   
                return;
            }
 
            s('customer found :' + result.code); 
            var regObject = {Status: 'Successful', Message: 'OK' , Token: null, Customer: cust };
            var json = JSON.stringify(regObject);
            res.status(200);
            res.send(json);   
            return;

        });
  
    });

  

}); 



app.get('/signin', function(req,res) { 

    // used for cust lookup  - send token back if cust is found 
    s("/register action checking auth.");
     
    var message = null; 
    var id = req.query.id;
    var pw  = req.query.pw;
    s('reading customer /signin.')

      
    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; }; 

        var pm = con.procedureMgr();
        pm.callproc('[dbo].[ReadCustomer]', 
                     [id], 
                     function(err,results, output) {

            if(err) {  
                s('signin read customer error: ' + err.message)
                showError('a40 - server - cust read fails: ' + err.message,
                'server error',['read customer'],res,err);
                return;
            }  
            if(output  == null) {
                s('signin: read customer serious error');
                return;
            }
            // check edit failure for dup or non-existing from custId. 
            var returnCode = output[0];
            // OK , Duplicate, Missing will be output.
            var result = { code: 0, message: '' };
            s('signin customer:procedure return code:' + output[0]);
            result.code = returnCode;
            if(result.code !== 0) { 

                 res.status(500);
                 res.send(null); 
            }

             // the customer object.
             // stored procedure returns code in row 0. 
             var cust = results[0]; // so, use row 1 for customer.
             s('res ' + results);
             s('out ' + output);

             // customer not found
             if(cust === undefined)
             {
                 s('customer not found');
                 res.status(200);
                 var regObject = {Status: 'Unsuccessful', Message: 'Customer not found.', Token: null, Customer: null };
                 var json = JSON.stringify(regObject);
                 res.send(json); 
                 return;
             }

              // password incorrect
              var custPass = cust['custPassword'].toString().trim();

              if(custPass !== pw) { 
                 res.status(200);
                 var regObject = {Status: 'Unsuccessful', Message: 'Invalid Password.', Token: null, Customer: null};
                 var json = JSON.stringify(regObject);
                 res.send(json);  
                 return; 
              } 
  
              // authenticated , continue.
             var token = collectToken();
             var regObject = {Status: 'Successful', Message: 'OK', Token: token, Customer: cust };
             var json = JSON.stringify(regObject);
             res.send(json);  
             return;
 

        });
  
    });

     
}); 


app.get('/claim', function(req,res) { 

    //TODO: handle not found condition
    var message = null; 
    var id = req.query.id;
    s('reading claim.')

    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; };
        var query = "SELECT * FROM Claim WHERE ClaimIdNumber='" + id + "'";
        s(query);
        con.query(query, function(err,rows) {  
            if(err) {  
                showError('a40 - server - query fail: ' + err.message,
                'server error',[query],res,err);
                return;
             }; 
            // send matching customer object back 
            s('a40 - server claim read successful');
            res.status(200);
            res.send(rows);   
        }); 
    }); 
}); 



app.post('/register', function(req,res) { 

     try { 

     if (!req.body) {
         
        res.status(400);
        s('bad body'); 
        return res('bad body');
     }

     debugger; 

     s('Register in progress:');
     for(var a in req.body) {

         s("Register:  " +  a + " = " + req.body[a]);
     }
    

     var promotionCode = req.body.PromotionCode;
     var eMail = req.body.custEmail;

    // check promotion code
    if(promotionCode !== process.env.A45PromotionCode) { 
        res.status(200);
        var regObject = {Status: 'Unsuccessful', Message: 'Invalid Promotion Code.', Token: null, Customer:null };
        var json = JSON.stringify(regObject);
        res.send(json);  
        return; 
    } 

    // check email
    if(!process.env.A45EmailList.includes(eMail)) {
        s('-> invalid e-mail.');
        res.status(200);
        var regObject = {Status: 'Unsuccessful', Message: 'Invalid E-mail used.', Token: null, Customer: null };
        var json = JSON.stringify(regObject);
        res.send(json);  
        return; 
    }  

    
    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; }; 

        var pm = con.procedureMgr();
        pm.callproc('[dbo].[AddNewCustomer]',

                     [req.body.custId,
                      req.body.custPass,
                      req.body.custFirst,
                      req.body.custMiddle,
                      req.body.custLast,
                      req.body.custEmail,
                      req.body.custBirthDate,
                      req.body.custGender,
                      req.body.custPhone,
                      req.body.custAddr1,
                      req.body.custAddr2,
                      req.body.custCity,
                      req.body.custState,
                      req.body.custZip,
                      req.body.custPlan,
                      req.body.appId 
                    ],
                     function(err,results, output) {

            if(err) {  
                s('reset cust error: ' + err.message)
                showError('a40 - server - cust reset fails: ' + err.message,
                'server error',[query],res,err);
                return;
            }  
            if(output  == null) {
                s('add new customer serious error');
                return;
            }
            // check edit failure for dup or non-existing from custId. 
            var returnCode = output[0];
            // OK , Duplicate, Missing will be output.
            var result = { code: 0, message: '' };
            s('add:procedure return code:' + output[0]);
            result.code = returnCode;
            if(result.code !== 0) { 

                s('->error on add - code:' + result.code);
                res.status(200);
                var regObject = {Status: 'Unsuccessful', Message: result.message, Token: null, Customer: null };
                var json = JSON.stringify(regObject);
                res.send(json);  
                return; 

            }

            // send matching customeromer object back 
            s('successful addition');  
            s('collecting token');
            var token = collectToken();
            s('setting status');
            res.status(200); 
            s('sending');
            var regObject = {Status: 'Successful', Message: 'OK', Token: token, Customer: req.body };
            var json = JSON.stringify(regObject);
            res.send(json);    

        });
  
    }); 


    } catch (err) {

        s('/add encountered an error:' + err.message);
        var msg = err.msg;
        var regObject = {Status: 'UnSuccessful', Message: msg , Token: null };
    }
    
});

function show(o) {
    for(var a in o) {
        s("Show: " + a + " " +  o[a]  );
    }
}

app.put('/update', function(req,res) { 

    s('..updating..')

    try { 

    if (!req.body) {
        
       res.status(400);
       s('bad body'); 
       return res('bad body');
    }

    show(req.body);
    show('parm 3');
    show('.' + req.body.custFirst + '.');
    
    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; };  
        
        var pm = con.procedureMgr();  
        pm.callproc('[dbo].[UpdateExistingCustomer]',

                     [req.body.custId,
                      req.body.custPassword,
                      req.body.custFirst,
                      req.body.custMiddle,
                      req.body.custLast,
                      req.body.custEmail,
                      req.body.custBirthDate,
                      req.body.custGender,
                      req.body.custPhone,
                      req.body.custAddr1,
                      req.body.custAddr2,
                      req.body.custCity,
                      req.body.custState,
                      req.body.custZip,
                      req.body.custPlan,
                      req.body.appId 
                    ],
                     function(err,results, output) {

            if(err) {  

               
                s('update customer error: ' + err.message)
                showError('a40 - server - cust update fails: ' + err.message,
                'server error',[''],res,err);
                return;
            }  
            if(output  == null) {
                s('update existing customer serious error');
                return;
            }
            // check edit failure for dup or non-existing from custId. 
            var returnCode = output[0];
            // OK , Duplicate, Missing will be output.
            var result = { code: 0, message: '' };
            s('add:procedure return code:' + output[0]);
            result.code = returnCode; 

            s('successful update of customer');
            res.status(200) 
            res.send(res.body) 
        });
  
    });
 

} catch (err) {

    s('/update encountered an error:' + err.message);
}


});
 

app.post('/addClaim', function(req,res) { 

    try { 

    if (!req.body) {
        
       res.status(400);
       s('bad body'); 
       return res('bad body');
    }

    debugger; 
    s("adding claim");
    s('req.body:' + req.body);

    for (var a in req.body) {
        s('server recieved body ' +  a + ' = ' + req.body[a] );
    }

    // for debugging
    var claimAddParmsInOrder =  ['ClaimIdNumber',
        'ClaimDescription',
        'CustomerId',
        'PlanId',
        'PatientFirst',
        'PatientLast',
        'Diagnosis1',
        'Diagnosis2',
        'Procedure1',
        'Procedure2',
        'Physician',
        'Clinic',
        'DateService',
        'Service',
        'TotalCharge',
        'PaymentAmount',
        'CoveredAmount',
        'BalanceOwed',
        'PaymentDate',
        'DateAdded',
        'AdjustedClaimId',
        'AdjustingClaimId',
        'AdjustedDate',
        'AppAdjusting',
        'ClaimStatus',
        'ClaimType',
        'DateConfine',
        'DateRelease',
        'ToothNumber',
        'Eyeware',
        'DrugName' 
      ]; 

       
    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; }; 

        var pm = con.procedureMgr();
        pm.callproc('[dbo].[AddNewClaim]',

                     [req.body.ClaimIdNumber,
                      req.body.ClaimDescription,
                      req.body.CustomerId,
                      req.body.PlanId,
                      req.body.PatientFirst,
                      req.body.PatientLast,
                      req.body.Diagnosis1,
                      req.body.Diagnosis2,
                      req.body.Procedure1,
                      req.body.Procedure2,
                      req.body.Physician,
                      req.body.Clinic,
                      req.body.DateService,
                      req.body.Service,
                      req.body.TotalCharge,
                      req.body.PaymentAmount,
                      req.body.CoveredAmount,
                      req.body.BalanceOwed,
                      req.body.PaymentDate,
                      req.body.DateAdded,
                      req.body.AdjustedClaimId,
                      req.body.AdjustingClaimId,
                      req.body.AdjustedDate,
                      req.body.AppAdjusting,
                      req.body.ClaimStatus,
                      req.body.ClaimType,
                      req.body.DateConfine,
                      req.body.DateRelease,
                      req.body.ToothNumber,
                      req.body.Eyeware,
                      req.body.DrugName 
                    ],
                     function(err,results, output) {

            if(err) {  
                s('add claim error error: ' + err.message)  
                //
                showError('a40 - server - claim add  fails: ' + err.message,
                'server error',[query],res,err);
                return;
            }  
            if(output  == null) {
                s('add new claim serious error');
                return;
            }
            // check edit failure for dup or non-existing from custId. 
            var returnCode = output[0];
            // OK , Duplicate, Missing will be output.
            var result = { code: 0, message: '' };
            s('Claim Add:procedure return code:' + output[0]);
            result.code = returnCode;
            if(result.code !== 0) { 

                res.status(500);
                res.send(null); 
            }

              // send matching customeromer object back 
           s('successful claim addition');
           res.status(200) 
           res.send(res.body)

           
        });
  
    }); 

    
   } catch (err) {

       s('/Claim Add encountered an error:' + err.message);
   }
   
});

app.get('/history', function(req,res) { 

    //TODO: handle not found condition
    var message = null; 
    var id = req.query.id;

       
    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; }; 

        var pm = con.procedureMgr();
        pm.callproc('[dbo].[ReadClaimHistory]', 
                     [id], 
                     function(err,results, output) {

            if(err) {  
                s('read cust error: ' + err.message)
                showError('a40 - server - claim history  read fails: ' + err.message,
                'server error',['read history'],res,err);
                return;
            }  
            if(output  == null) {
                s('read claim history serious error');
                return;
            }
            // check edit failure for dup or non-existing from custId. 
            var returnCode = output[0];
            // OK , Duplicate, Missing will be output.
            var result = { code: 0, message: '' };
            s('read claim history:procedure return code:' + output[0]);
            result.code = returnCode;
            if(result.code !== 0) { 

                 res.status(500);
                 res.send(null); 
            }

            var historyRows = []; 

            for (var i = 0; i < results.length; i++) {
                historyRows[i] = results[i]; 
            }

            s(i + " claims returned.");
            var cust = output[1];  
            res.status(200);
            res.send(historyRows);
 

        });
  
    });
 
}); 


app.get('/custList', function(req,res) { 

    //TODO: handle not found condition
    var message = null;  

      
    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; }; 

        var pm = con.procedureMgr();
        pm.callproc('[dbo].[ListCustomers]', 
                     [], 
                     function(err,results, output) {

            if(err) {  
                s('list cust error: ' + err.message)
                showError('a40 - server - cust read fails: ' + err.message,
                'server error',['read customer'],res,err);
                return;
            }  
            if(output  == null) {
                s('list customer serious error');
                return;
            }
            // check edit failure for dup or non-existing from custId. 
            var returnCode = output[0];
            // OK , Duplicate, Missing will be output.
            var result = { code: 0, message: '' };
            s('list customers: procedure return code:' + output[0]);
            result.code = returnCode;
            if(result.code !== 0) { 

                 res.status(500);
                 res.send(null); 
            }

            var customerRows = []; 

            for (var i = 0; i < results.length; i++) {
                customerRows[i] = results[i]; 
            }

            s(i + " claims returned."); 
            res.status(200);
            res.send(customerRows);

        });
  
    });
    
    


}); 


app.put('/resetPassword', function(req,res) { 

    //TODO: handle not found condition
    var message = null;  
    if (!req.body) {
        
        res.status(400);
        s('bad body'); 
        return res('bad body');
     }
 
     debugger; 
     s("resetting password request.");
     s('req.body:' + req.body);
 

     for (var a in req.body) {
         s('server recieved body ' +  a + ' = ' + req.body[a] );
     } 

      
    
    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[''],res,err);return; }; 

        var pm = con.procedureMgr();
        /* --------------- reset password ------------------ */
        /* custId, newPassword */

        pm.callproc('[dbo].[ResetPassword]',  
                      [req.body.custId,
                      req.body.newPassword], 
        function(err,results, output) {   
                     
            if(err) {  

                s('admin reset password error: ' + err.message); 
                s('result: ' + results);
                s('output: ' + output);
                showError('a40 - server - admin password reset  fails: ' + err.message,'server error',[''],res,err); 
                return;
            }    

            var returnCode = output[0]; 
            var result = { code: 0, message: '' }; 
            result.code = returnCode;
            if(result.code !== 0) {

                s("admin password reset: result code : " + result.code);
                s('results[0]: ' + results[0]);
                s('output[0]: ' + output[0]);
                res.status(500);
                res.send(null);
                return; /* do not forget this */ 
            }

            s('a40 - admin password reset');
            res.status(200);
            res.send(null); 
        });
  
    });
   
    
}); 


app.put('/resetCustomerId', function(req,res) { 
  
    try {  
    
    //TODO: handle not found condition
    var message = null;  
    if (!req.body) {
        
        res.status(400);
        s('bad body'); 
        return res('bad body');
     }
 
     debugger; 
     s("reset customer id");
     s('req.body:' + req.body);
 
     for (var a in req.body) {
         s('server recieved body ' +  a + ' = ' + req.body[a] );
     }

     var query = 'not used';

     sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[connectionString],res,err);return; }; 

        var pm = con.procedureMgr();
        pm.callproc('[dbo].[ResetCustomerId]',
                     [req.body.custId,req.body.newCustId],
                     function(err,results, output) {

            if(err) {  
                s('reset cust error: ' + err.message)
                showError('a40 - server - cust reset fails: ' + err.message,
                'server error',[query],res,err);
                return;
            }  
            if(output  == null) {
                s('reset customer serious error');
                return;
            }
            // check edit failure for dup or non-existing from custId. 
            var returnCode = output[0];
            // OK , Duplicate, Missing will be output.
            var result = { code: 0, message: '' };
            result.code = returnCode;
            switch(result.code) {

                case 0 : result.message = 'Customer Successfully Reset'; break;
                case 4 : result.message = 'New Customer Exists'; break;
                case 8 : result.message = 'Customer Not Found'; break;
            }
            s('A45 - customer reset result :' + result);
            res.status(200);
            res.send(result); 

        });
  
    });

} catch(err) {

    s("fatal error in reset customer id.");
    return;

}
});
 
  
      
 
 
app.put('/stampAdjustedClaim', function(req,res) { 

    s('..stamping adjusted claim..')

    try { 

    if (!req.body) {
        
       res.status(400);
       s('bad body'); 
       return res('bad body');
    }  

     
    
    sql.open(connectionString, function(err,con) {

        if(err) { showError("a40 - server - failed to connect: " + err.message  
        , "server error",[''],res,err);return; }; 

        var pm = con.procedureMgr();
        /* ---- stamp adjusted claim ------------ */
        /* adjusting, adjusted, date, app */

        pm.callproc('[dbo].[StampAdjustedClaim]', 
                     [req.body.AdjustmentIdNumber,
                      req.body.ClaimIdNumber,
                      req.body.AdjustedDate,
                      req.body.AppAdjusting], 
        function(err,results, output) {   
                     
            if(err) {  

                s('claim adjustment  error: ' + err.message);  
                showError('a40 - server - claim stamp  fails: ' + err.message,'server error',[''],res,err); 
                res.status(500);
                res.send("Error Occurred");
                return;
            }    

            var returnCode = output[0]; 
            s('return code from claim stamp: ' + returnCode) 
            if(returnCode !== 0) {

                s("Bad code: claim stamp code : " + returnCode); 
                res.status(500);
                res.send(returnCode.toString());
                return; /* do not forget this */ 
            }

            s('a40 - claim stamp successful');
            res.status(200);
            res.send("OK"); 
            return;
        });
  
    });
   
    

} catch (err) {

    s('/stamp adjusting id number encountered an error:' + err.message);
} 

});


app.put('/setClaimStatus', function(req,res) { 

    s('..claim status update..'); 

    if (!req.body) {
        
       res.status(400);
       s('bad body'); 
       return res('bad body');
    } 

    // not valid: ie11: var { claimIdNumber, action, amount, date, plan } = req.body;

    s("A45 - claim status update");

    if(req.body.action !== 'pay') {
        res.status(500);
        s('a45 pay request is not valid (pay1,pay2) (' + req.body.action + ')');
        res.send("invalid-request");
        return;
    }
  
    var query = "";
 


    if(req.body.action === 'pay') {

        s('pay status operation');

        sql.open(connectionString, function(err,con) {

            if(err) { showError("a40 - server - failed to connect: " + err.message  
            , "server error",[''],res,err);return; }; 
            /* ------------ reset claim status ------------ */
            var pm = con.procedureMgr();
            pm.callproc('[dbo].[SetClaimStatus]', 
                         [req.body.claimIdNumber,
                          req.body.amount,
                          req.body.date], 
            function(err,results, output) {   
                         
                if(err) {  

                    s('set claim status error: ' + err.message); 
                    s('result: ' + results);
                    s('output: ' + output);
                    showError('a40 - server - status reset  fails: ' + err.message,'server error',[''],res,err); 
                    return;
                }    

                var returnCode = output[0];
                if(returnCode !== 0) {
    
                    s("reset claim status: result code : " + returnCode);
                    s('results[0]: ' + results[0]);
                    s('output[0]: ' + output[0]);
                    res.status(500);
                    res.send(null);
                    return; /* do not forget this */ 
                }
    
                s('a40 - reset claim status successful');
                res.status(200);
                res.send("OK"); 
            });
      
        });
       
     

    }

});


app.put('/updatePlan', function(req,res) { 

    s('..plan  update..'); 

    if (!req.body) {
        
       res.status(400);
       s('bad body'); 
       return res('bad body');
    } 

    // not valid: ie11: var { claimIdNumber, action, amount, date, plan } = req.body;

    s("A45 - plan update");

    
  
    var query = "";
 
    for (var a in req.body) {
        s('server recieved body ' +  a + ' = ' + req.body[a] + '.' );
    }

        s('update plan ');

        sql.open(connectionString, function(err,con) {

            if(err) { showError("a40 - server - failed to connect: " + err.message  
            , "server error",[''],res,err);return; }; 
            /* ------------ update plan ------------ */
            var pm = con.procedureMgr();
            pm.callproc('[dbo].[UpdatePlan]', 
                         [req.body.CustId,
                          req.body.CustPlan], 
            function(err,results, output) {   
                         
                if(err) {  

                    s('set plan update  status error: ' + err.message); 
                    s('result: ' + results);
                    s('output: ' + output);
                    showError('a40 - server - plan update   fails: ' + err.message,'server error',[''],res,err); 
                    return;
                }    

                var returnCode = output[0].toString();
                if(returnCode !== "0") {
    
                    s("reset plan update : result code : " + returnCode);
                    s('results[0]: ' + results[0]);
                    s('output[0]: ' + output[0]);
                    res.status(500);
                    res.send(null);
                    return; /* do not forget this */ 
                }
    
                s('a40 - plan update status successful');

                if(req.body.signal === "parmBack") {
                    s('angular parm return.');
                    res.status(200); 
                    res.send(req.body); // compat angular 2+
                    return;
                }

                res.status(200); 
                res.send("OK"); 
                return;
            });
      
        });
        
      

});
