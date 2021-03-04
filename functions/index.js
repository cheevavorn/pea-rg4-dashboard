// firebase import
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// express import
const express = require('express');
const app = express();
const cors = require('cors');
var bodyParser = require('body-parser');

// custom libs and constants
const { createClient, login, getEmployeeInfoByUserId } = require('./libs/peaService');
const { idmServicePath, idmServiceToken, employeeServicePath, employeeServiceToken } = require('./constants');

// firebae config
admin.initializeApp({ credential: admin.credential.applicationDefault() })
var db = admin.firestore()

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// allow express extract data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 

// middleware
app.use((req, res, next)=>{
  res.header('Cache-Control', 'private');
  res.header('Access-Control-Allow-Credential', true);
  res.header('Access-Control-Allow-Origin', "*");
  next();
})

app.post('/login', async ({ body: { Username, Password } }, res) => {
    try {
        let client = await createClient(idmServicePath);
        let { Login_SIResult: { ResponseCode, ResultObject: { Result, UserId } } } = await login(client, {
            WSAuthenKey: idmServiceToken,
            Username,
            Password
        });

        if(ResponseCode !== "WSV0000"){
          res.status(200).send({ error:true, desc: 'รหัสพนักงาน หรือรหัสเข้าเครื่องคอมพิวเตอร์ของท่านไม่ถูกต้อง' });
          return;
        }

        let employeeClient = await createClient(employeeServicePath)
        let { GetEmployeeInfoByUserId_SIResult } = await getEmployeeInfoByUserId(employeeClient, {
            WSAuthenKey: employeeServiceToken,
            UserId
        });

        // extract basic employee data
        let { ResultObject: { TitleFullName, FirstName, LastName, DepartmentShort, Department, Position, LevelDesc, CostCenterCode } } = GetEmployeeInfoByUserId_SIResult
        if(GetEmployeeInfoByUserId_SIResult.ResponseCode !== "WSV0000"){
          res.status(200).send({error:true, desc: 'เว็บเซอร์วิสในการดึงข้อมูลเบื้องต้นพนักงานมีปัญหา กรุณา Refresh และกรอกข้อมูลของท่านอีกครั้ง'});
          return;
        }

        let employeeObj = {
          Username, 
          TitleFullName, 
          FirstName, 
          LastName, 
          DepartmentShort, 
          Department, 
          Position, 
          LevelDesc, 
          CostCenterCode,
        };

        // log a visitors 
        db.collection('visitors')
                .doc()
                .set({
                  ...employeeObj, 
                  visitedAt: new Date()
                });

        let permission = '';
        // check Username in grantors permission ?
        const grantorRef = db.collection('grantors').doc(Username);
        const grantorDoc = await grantorRef.get();
        if(grantorDoc.exists) {
          permission = 'GRANTOR';
        } else {
          permission = 'REQUESTOR';
        }

        // check Username in requestors permission ?
        const requestorsRef = db.collection('requestors').doc(Username);
        const requestorDoc = await requestorsRef.get();
        if(!requestorDoc.exists && permission === 'REQUESTOR'){
          let grantedByDistrict = [
            { district: 'J', isGranted: false },
            { district: 'K', isGranted: false },
            { district: 'L', isGranted: false },
            { district: 'Z', isGranted: false }
          ];
          await requestorsRef.set({ 
            ...employeeObj, 
            completedStep: 1,
            isGmailAuth: false, 
            gmailName: '', 
            gmailAvatarPath: '',
            gmailAccount: '',
            gmailAuthAt: '',
            requestedAt: new Date(),
            isApprovedPermission: false,
            grantAffiliation: 
              employeeObj.CostCenterCode.charAt(0) === 'J' ? 
              [...grantedByDistrict, {district: 'J', isGranted: true}]:
                employeeObj.CostCenterCode.charAt(0) === 'K' ? 
                [...grantedByDistrict, {district: 'K', isGranted: true}]:
                  employeeObj.CostCenterCode.charAt(0) === 'L' ? 
                  [...grantedByDistrict, {district: 'L', isGranted: true}]:
                  [
                    { district: 'J', isGranted: true },
                    { district: 'K', isGranted: true },
                    { district: 'L', isGranted: true },
                    { district: 'Z', isGranted: true }
                  ]
            // grantAffiliation: employeeObj.CostCenterCode.charAt(0) === 'Z' ? 
            //   [...grantedByDistrict, {district: 'Z', isGranted: true}] : 
            //   [...grantedByDistrict, {district: 'Z', isGranted: false}]
          });
        }

        let requestorUser = { ...employeeObj, permission };
        res.status(200).send(requestorUser);

        // Merge logic
        // const res = await cityRef.set({
        //   capital: true
        // }, { merge: true });

    } catch(error) {
        res.status(404).send(error);
        console.error(error)
    }

});

// Expose Express API as a single Cloud Function:
exports.api = functions.region('asia-northeast2').https.onRequest(app);